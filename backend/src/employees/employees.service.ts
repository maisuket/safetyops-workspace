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
  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Employee[]; total: number }> {
    const skip = (page - 1) * limit;

    try {
      const [employees, total] = await this.prisma.$transaction([
        this.prisma.employee.findMany({
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.employee.count(),
      ]);

      return { data: employees, total };
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
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Esta matrícula já está em uso por outro colaborador.',
        );
      }

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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Colaborador com ID ${id} não encontrado.`);
      }

      this.logger.error(
        `Erro ao atualizar colaborador: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível atualizar o colaborador.',
      );
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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Colaborador com ID ${id} não encontrado.`);
      }
      // P2003: violação de chave estrangeira — o colaborador tem folgas, saídas
      // ou documentos vinculados (não há cascade de exclusão de propósito).
      // Isso é uma regra de negócio esperada, não uma falha do servidor.
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Não é possível excluir este colaborador porque existem lançamentos ' +
            '(folgas, saídas ou documentos) vinculados a ele. Desative-o em vez de excluir.',
        );
      }

      this.logger.error(
        `Erro ao remover colaborador ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível remover o colaborador.',
      );
    }
  }

  /**
   * Calcula e retorna as estatísticas de folgas para todos os colaboradores.
   * Esta operação é mais eficiente no backend do que no frontend com grandes volumes de dados.
   */
  async getStats(): Promise<any[]> {
    try {
      const [employees, aggregations, workAndLeaveRecords] = await Promise.all([
        this.prisma.employee.findMany({
          where: { active: true },
          orderBy: { name: 'asc' },
        }),
        this.prisma.record.groupBy({
          by: ['employeeId', 'type'],
          _count: {
            id: true,
          },
        }),
        // O saldo pendente precisa refletir exatamente os mesmos domingos marcados como
        // "Disponível" na tela de detalhes do colaborador: um domingo trabalhado só é
        // considerado compensado se alguma folga referenciar a sua data explicitamente.
        // Uma subtração simples (total de trabalhos - total de folgas) diverge sempre que
        // existir uma folga genérica sem domingo vinculado (ex: "baixar banco de horas"),
        // pois ela reduziria o saldo sem corresponder a nenhum domingo específico.
        this.prisma.record.findMany({
          where: { type: { in: ['trabalho', 'folga'] } },
          select: { employeeId: true, type: true, date: true, refDate: true },
        }),
      ]);

      const statsMap = new Map<
        string,
        {
          earned: number;
          taken: number;
          absences: number;
          externalService: number;
          scheduleAdjustments: number;
        }
      >();
      aggregations.forEach((agg) => {
        const stat =
          statsMap.get(agg.employeeId) ||
          { earned: 0, taken: 0, absences: 0, externalService: 0, scheduleAdjustments: 0 };
        if (agg.type === 'trabalho') {
          stat.earned = agg._count.id;
        } else if (agg.type === 'folga') {
          stat.taken = agg._count.id;
        } else if (agg.type === 'falta') {
          stat.absences = agg._count.id;
        } else if (agg.type === 'servico_externo') {
          stat.externalService = agg._count.id;
        } else if (agg.type === 'ajuste_horario') {
          stat.scheduleAdjustments = agg._count.id;
        }
        statsMap.set(agg.employeeId, stat);
      });

      const worksByEmployee = new Map<string, Date[]>();
      const leaveRefsByEmployee = new Map<string, string[]>();
      workAndLeaveRecords.forEach((r) => {
        if (r.type === 'trabalho') {
          const list = worksByEmployee.get(r.employeeId) || [];
          list.push(r.date);
          worksByEmployee.set(r.employeeId, list);
        } else if (r.refDate) {
          const list = leaveRefsByEmployee.get(r.employeeId) || [];
          list.push(r.refDate);
          leaveRefsByEmployee.set(r.employeeId, list);
        }
      });

      const toDateString = (d: Date) => {
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };

      const employeeStats = employees.map((emp) => {
        const empStats =
          statsMap.get(emp.id) ||
          { earned: 0, taken: 0, absences: 0, externalService: 0, scheduleAdjustments: 0 };

        const works = worksByEmployee.get(emp.id) || [];
        const leaveRefs = leaveRefsByEmployee.get(emp.id) || [];
        const pendingBalance = works.filter((workDate) => {
          const dateString = toDateString(workDate);
          return !leaveRefs.some((ref) => ref.includes(dateString));
        }).length;

        return {
          ...emp,
          earned: empStats.earned,
          taken: empStats.taken,
          absences: empStats.absences,
          externalService: empStats.externalService,
          scheduleAdjustments: empStats.scheduleAdjustments,
          balance: pendingBalance,
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
