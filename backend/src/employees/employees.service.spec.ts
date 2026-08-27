import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from 'src/database/prisma.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: {
    employee: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
    record: { groupBy: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      employee: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      record: { groupBy: jest.fn(), findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  describe('create', () => {
    it('cria um colaborador com sucesso', async () => {
      prisma.employee.create.mockResolvedValue({
        id: '1',
        name: 'JOAO',
        enrollment: '123',
        active: true,
      });

      const result = await service.create({
        name: 'joao',
        enrollment: '123',
      } as any);

      expect(result.id).toBe('1');
    });

    it('lança ConflictException quando a matrícula já existe (P2002)', async () => {
      prisma.employee.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({ name: 'joao', enrollment: '123' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando o id não existe (P2025)', async () => {
      prisma.employee.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('id-invalido', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException para matrícula duplicada (P2002)', async () => {
      prisma.employee.update.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.update('id', { enrollment: '999' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('remove com sucesso quando não há vínculos', async () => {
      prisma.employee.delete.mockResolvedValue({});

      const result = await service.remove('id');

      expect(result.message).toContain('sucesso');
    });

    it('lança NotFoundException quando o id não existe (P2025)', async () => {
      prisma.employee.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException quando há registos vinculados (P2003 — FK constraint)', async () => {
      prisma.employee.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.remove('id-com-historico')).rejects.toThrow(
        ConflictException,
      );
    });

    it('lança InternalServerErrorException para erros inesperados', async () => {
      prisma.employee.delete.mockRejectedValue(new Error('falha de conexão'));

      await expect(service.remove('id')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getStats (saldo pendente)', () => {
    it('conta como saldo apenas os domingos trabalhados sem folga vinculada', async () => {
      const employeeId = 'emp-1';
      prisma.employee.findMany.mockResolvedValue([
        { id: employeeId, name: 'CESAR', active: true },
      ]);

      prisma.record.groupBy.mockResolvedValue([
        { employeeId, type: 'trabalho', _count: { id: 2 } },
        { employeeId, type: 'folga', _count: { id: 1 } },
      ]);

      prisma.record.findMany.mockResolvedValue([
        {
          employeeId,
          type: 'trabalho',
          date: new Date('2026-06-14T00:00:00.000Z'),
          refDate: null,
        },
        {
          employeeId,
          type: 'trabalho',
          date: new Date('2026-06-21T00:00:00.000Z'),
          refDate: null,
        },
        {
          employeeId,
          type: 'folga',
          date: new Date('2026-06-28T00:00:00.000Z'),
          refDate: 'Compensação - baixar banco de horas',
        },
      ]);

      const stats = await service.getStats();

      // Nenhuma folga referencia especificamente 14/06 ou 21/06, então os
      // dois domingos continuam pendentes — igual ao bug real corrigido
      // com o Cesar Augusto (folga genérica não deve "consumir" um domingo
      // sem referência explícita).
      expect(stats[0].balance).toBe(2);
    });
  });
});
