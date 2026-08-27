import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, SaidaRecord } from '@prisma/client';

import { PrismaService } from 'src/database/prisma.service';
import { CreateBulkSaidaDto } from './dto/create-bulk-saida.dto';

export interface SaidaSearchParams {
  employeeId?: string;
  tipo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class SaidasService {
  private readonly logger = new Logger(SaidasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Grava, num único lote (mesmo batchId), todos os formulários de saída/uber
   * emitidos juntos num mesmo PDF ou Excel gerado pela tela de Gestão de Saídas.
   */
  async createBulk(
    dto: CreateBulkSaidaDto,
  ): Promise<{ count: number; batchId: string }> {
    try {
      // Valida que todos os colaboradores existem antes de inserir — sem isso,
      // um único employeeId inválido faz o lote inteiro falhar por violação de
      // chave estrangeira, sem indicar qual item é o problema.
      const uniqueIds = [...new Set(dto.items.map((item) => item.employeeId))];
      const existing = await this.prisma.employee.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((e) => e.id));
      const missingIds = uniqueIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        throw new NotFoundException(
          `Colaborador(es) não encontrado(s): ${missingIds.join(', ')}`,
        );
      }

      const batchId = randomUUID();

      const data = dto.items.map((item) => ({
        employeeId: item.employeeId,
        tipo: item.tipo,
        tipoData: item.tipoData,
        destino: item.destino,
        motivo: item.motivo,
        dataOcorrencia: item.dataOcorrencia ? new Date(item.dataOcorrencia) : null,
        batchId,
      }));

      const result = await this.prisma.saidaRecord.createMany({ data });

      this.logger.log(
        `Lote de saídas ${batchId} gravado com ${result.count} registo(s).`,
      );

      return { count: result.count, batchId };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Erro ao gravar lote de saídas: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível gravar os registos de saída.',
      );
    }
  }

  /**
   * Busca de rastreio: por colaborador, por tipo, por texto livre (nome, motivo,
   * destino) e/ou por período. Quando a saída foi emitida com "data em branco",
   * o período passa a considerar a data de emissão (createdAt) no lugar.
   */
  async search(params: SaidaSearchParams): Promise<SaidaRecord[]> {
    const andConditions: Prisma.SaidaRecordWhereInput[] = [];

    if (params.employeeId) andConditions.push({ employeeId: params.employeeId });
    if (params.tipo) andConditions.push({ tipo: params.tipo });

    if (params.search) {
      andConditions.push({
        OR: [
          { employee: { name: { contains: params.search } } },
          { motivo: { contains: params.search } },
          { destino: { contains: params.search } },
        ],
      });
    }

    if (params.startDate && params.endDate) {
      const start = new Date(`${params.startDate}T00:00:00.000Z`);
      const end = new Date(`${params.endDate}T23:59:59.999Z`);
      andConditions.push({
        OR: [
          { dataOcorrencia: { gte: start, lte: end } },
          { AND: [{ dataOcorrencia: null }, { createdAt: { gte: start, lte: end } }] },
        ],
      });
    }

    try {
      return await this.prisma.saidaRecord.findMany({
        where: andConditions.length ? { AND: andConditions } : {},
        include: {
          employee: { select: { name: true, enrollment: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar saídas: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Não foi possível buscar os registos de saída.',
      );
    }
  }

  /**
   * Histórico completo de um colaborador específico.
   */
  async findByEmployee(employeeId: string): Promise<SaidaRecord[]> {
    return this.search({ employeeId });
  }

  /**
   * Remove um registo de saída (correção de lançamento).
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.saidaRecord.delete({ where: { id } });
      return { message: 'Registo de saída removido com sucesso.' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Registo de saída com ID ${id} não encontrado para remoção.`,
        );
      }

      this.logger.error(
        `Erro ao remover registo de saída ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível remover o registo de saída.',
      );
    }
  }
}
