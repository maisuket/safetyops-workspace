import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { CreateBulkRecordDto } from './dto/create-bulk-record.dto';
import { Record } from '@prisma/client';

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um único registo (crédito de trabalho ou débito de folga)
   */
  async create(createRecordDto: CreateRecordDto): Promise<Record> {
    try {
      // 1. Verificar se o colaborador existe antes de inserir
      const employeeExists = await this.prisma.employee.findUnique({
        where: { id: createRecordDto.employeeId },
      });

      if (!employeeExists) {
        throw new NotFoundException(
          `Colaborador com ID ${createRecordDto.employeeId} não encontrado.`,
        );
      }

      // 2. Criar o registo
      return await this.prisma.record.create({
        data: {
          type: createRecordDto.type,
          date: new Date(createRecordDto.date),
          description: createRecordDto.description,
          refDate: createRecordDto.refDate,
          employeeId: createRecordDto.employeeId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Erro ao criar registo único: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível criar o registo.',
      );
    }
  }

  /**
   * Cria múltiplos registos numa única transação no banco de dados (Bulk Insert)
   * Ideal para quando vários técnicos trabalham no mesmo domingo.
   */
  async createBulk(
    createBulkRecordDto: CreateBulkRecordDto,
  ): Promise<{ count: number; message: string }> {
    try {
      // Mapear os dados para o formato esperado pelo Prisma
      const recordsData = createBulkRecordDto.employeeIds.map((employeeId) => ({
        employeeId,
        type: createBulkRecordDto.type,
        date: new Date(createBulkRecordDto.date),
        local: createBulkRecordDto.local,
        description: createBulkRecordDto.description,
        refDate: createBulkRecordDto.refDate,
      }));

      // Utilizar createMany para uma inserção massiva e otimizada
      const result = await this.prisma.record.createMany({
        data: recordsData,
      });

      this.logger.log(`Foram inseridos ${result.count} registos em lote.`);

      return {
        message: 'Registos inseridos com sucesso.',
        count: result.count,
      };
    } catch (error) {
      this.logger.error(
        `Erro na inserção em lote: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível processar a inserção em lote.',
      );
    }
  }

  /**
   * Retorna todos os registos, incluindo os dados básicos do colaborador associado
   */
  async findAll(): Promise<Record[]> {
    return this.prisma.record.findMany({
      include: {
        employee: {
          select: {
            name: true,
            active: true,
          },
        },
      },
      orderBy: {
        date: 'desc', // Ordenar do mais recente para o mais antigo
      },
    });
  }

  /**
   * Remove um registo pelo ID (útil para estornos ou correções)
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      // O Prisma lança um erro automaticamente se o registo não existir (RecordNotFound)
      await this.prisma.record.delete({
        where: { id },
      });

      return { message: 'Registo removido com sucesso.' };
    } catch (error) {
      // Tratamento específico para quando o ID não é encontrado no Prisma
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Registo com ID ${id} não encontrado para remoção.`,
        );
      }

      this.logger.error(
        `Erro ao remover registo ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível remover o registo.',
      );
    }
  }
}
