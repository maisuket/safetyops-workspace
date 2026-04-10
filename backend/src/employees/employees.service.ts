import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { Employee } from '@prisma/client';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna todos os colaboradores ordenados por nome
   */
  async findAll(): Promise<Employee[]> {
    try {
      return await this.prisma.employee.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao buscar colaboradores: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível carregar a lista de colaboradores.',
      );
    }
  }

  /**
   * Cria um novo colaborador
   */
  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    try {
      return await this.prisma.employee.create({
        data: {
          name: createEmployeeDto.name.toUpperCase(), // Padronizamos sempre em Maiúsculas
          enrollment: createEmployeeDto.enrollment,
          active: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao criar colaborador: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível cadastrar o colaborador.',
      );
    }
  }

  /**
   * Atualiza o status de um colaborador (Soft Delete / Desativação)
   */
  async toggleStatus(
    id: string,
    updateStatusDto: UpdateEmployeeStatusDto,
  ): Promise<Employee> {
    try {
      const employeeExists = await this.prisma.employee.findUnique({
        where: { id },
      });

      if (!employeeExists) {
        throw new NotFoundException(`Colaborador com ID ${id} não encontrado.`);
      }

      return await this.prisma.employee.update({
        where: { id },
        data: { active: updateStatusDto.active },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Erro ao atualizar status do colaborador ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível atualizar o status do colaborador.',
      );
    }
  }

  /**
   * Atualiza os dados cadastrais de um colaborador
   */
  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    try {
      return await this.prisma.employee.update({
        where: { id },
        data: {
          name: updateEmployeeDto.name
            ? updateEmployeeDto.name.toUpperCase()
            : undefined,
          enrollment: updateEmployeeDto.enrollment,
        },
      });
    } catch (error) {
      // P2002 é o código do Prisma para "Violação de constraint única (Unique constraint failed)"
      // Isso garante que não haverá condições de corrida.
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Esta matrícula já está em uso por outro colaborador.',
        );
      }

      this.logger.error(
        `Erro ao atualizar colaborador: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Remove permanentemente um colaborador
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.employee.delete({ where: { id } });
      return { message: 'Colaborador removido com sucesso.' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao remover colaborador. Verifique se existem registos vinculados.',
      );
    }
  }

  /**
   * Calcula e retorna as estatísticas de folgas para todos os colaboradores.
   * Esta operação é mais eficiente no backend do que no frontend com grandes volumes de dados.
   */
  async getStats(): Promise<any[]> {
    try {
      const employees = await this.prisma.employee.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });

      const aggregations = await this.prisma.record.groupBy({
        by: ['employeeId', 'type'],
        _count: {
          id: true,
        },
      });

      const statsMap = new Map<string, { earned: number; taken: number }>();
      aggregations.forEach((agg) => {
        const stat = statsMap.get(agg.employeeId) || { earned: 0, taken: 0 };
        if (agg.type === 'trabalho') {
          stat.earned = agg._count.id;
        } else {
          stat.taken = agg._count.id;
        }
        statsMap.set(agg.employeeId, stat);
      });

      const employeeStats = employees.map((emp) => {
        const empStats = statsMap.get(emp.id) || { earned: 0, taken: 0 };
        return {
          ...emp,
          earned: empStats.earned,
          taken: empStats.taken,
          balance: empStats.earned - empStats.taken,
        };
      });

      return employeeStats.sort((a, b) => b.balance - a.balance);
    } catch (error) {
      this.logger.error(
        `Erro ao calcular stats: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível gerar as estatísticas.',
      );
    }
  }
}
