import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, HoraExtraRecord } from '@prisma/client';

import { PrismaService } from 'src/database/prisma.service';
import { CreateBulkHoraExtraDto } from './dto/create-bulk-hora-extra.dto';

export interface HoraExtraSearchParams {
  employeeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class HoraExtraService {
  private readonly logger = new Logger(HoraExtraService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Grava, num único lote (mesmo batchId), todos os colaboradores da mesma
   * folha de Relação Hora Extra/Compensação gerada junto (mesmo PDF/Excel).
   */
  async createBulk(
    dto: CreateBulkHoraExtraDto,
  ): Promise<{ count: number; batchId: string }> {
    try {
      // Valida que todos os colaboradores existem antes de inserir — sem isso,
      // um único employeeId inválido faz o lote inteiro falhar por violação de
      // chave estrangeira, sem indicar qual item é o problema.
      const uniqueIds = [...new Set(dto.employeeIds)];
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
      const dataServico = new Date(dto.dataServico);

      const data = dto.employeeIds.map((employeeId) => ({
        employeeId,
        dataServico,
        local: dto.local,
        descricaoServico: dto.descricaoServico,
        enderecoServico: dto.enderecoServico,
        numeroOS: dto.numeroOS,
        observacao: dto.observacao,
        batchId,
      }));

      const result = await this.prisma.horaExtraRecord.createMany({ data });

      this.logger.log(
        `Folha de hora extra ${batchId} gravada com ${result.count} colaborador(es).`,
      );

      return { count: result.count, batchId };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Erro ao gravar folha de hora extra: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível gravar a folha de hora extra.',
      );
    }
  }

  /**
   * Busca de rastreio: por colaborador, texto livre (nome, local, descrição,
   * nº OS) e/ou por período (sobre a data do serviço). Paginado no mesmo
   * padrão de SaidasService.search/RecordsService.findAll.
   */
  async search(
    params: HoraExtraSearchParams,
    page = 1,
    limit = 20,
  ): Promise<{ data: HoraExtraRecord[]; total: number }> {
    const andConditions: Prisma.HoraExtraRecordWhereInput[] = [];

    if (params.employeeId) andConditions.push({ employeeId: params.employeeId });

    if (params.search) {
      andConditions.push({
        OR: [
          { employee: { name: { contains: params.search } } },
          { local: { contains: params.search } },
          { descricaoServico: { contains: params.search } },
          { numeroOS: { contains: params.search } },
        ],
      });
    }

    if (params.startDate && params.endDate) {
      andConditions.push({
        dataServico: {
          gte: new Date(`${params.startDate}T00:00:00.000Z`),
          lte: new Date(`${params.endDate}T23:59:59.999Z`),
        },
      });
    }

    const where: Prisma.HoraExtraRecordWhereInput = andConditions.length
      ? { AND: andConditions }
      : {};
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await this.prisma.$transaction([
        this.prisma.horaExtraRecord.findMany({
          where,
          include: {
            employee: { select: { name: true, enrollment: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.horaExtraRecord.count({ where }),
      ]);
      return { data, total };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar folhas de hora extra: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível buscar as folhas de hora extra.',
      );
    }
  }

  /**
   * Remove um registo de hora extra (correção de lançamento).
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.horaExtraRecord.delete({ where: { id } });
      return { message: 'Registo de hora extra removido com sucesso.' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Registo de hora extra com ID ${id} não encontrado para remoção.`,
        );
      }

      this.logger.error(
        `Erro ao remover registo de hora extra ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível remover o registo de hora extra.',
      );
    }
  }

  /**
   * Remove vários registos de hora extra de uma vez (exclusão em lote pela
   * tela de Rastreio, quando o utilizador seleciona várias linhas).
   */
  async removeBulk(ids: string[]): Promise<{ count: number }> {
    try {
      const uniqueIds = [...new Set(ids)];
      const result = await this.prisma.horaExtraRecord.deleteMany({
        where: { id: { in: uniqueIds } },
      });

      this.logger.log(
        `Removidos ${result.count} registo(s) de hora extra em lote.`,
      );

      return { count: result.count };
    } catch (error) {
      this.logger.error(
        `Erro ao remover registos de hora extra em lote: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível remover os registos de hora extra selecionados.',
      );
    }
  }
}
