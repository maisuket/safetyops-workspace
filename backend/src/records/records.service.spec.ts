import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecordsService } from './records.service';
import { PrismaService } from 'src/database/prisma.service';

describe('RecordsService', () => {
  let service: RecordsService;
  let prisma: {
    employee: { findMany: jest.Mock };
    record: {
      createMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      employee: { findMany: jest.fn() },
      record: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      // Simula o comportamento real do $transaction([...]) do Prisma:
      // resolve cada operação (já uma Promise mockada) em paralelo.
      $transaction: jest.fn((ops: Promise<any>[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  describe('createBulk', () => {
    it('lança NotFoundException quando algum employeeId não existe', async () => {
      prisma.employee.findMany.mockResolvedValue([{ id: 'existe-1' }]);

      await expect(
        service.createBulk({
          employeeIds: ['existe-1', 'nao-existe'],
          type: 'trabalho' as any,
          date: '2026-06-14T00:00:00.000Z',
        } as any),
      ).rejects.toThrow(NotFoundException);

      // Não deve tentar inserir nada se a validação falhou
      expect(prisma.record.createMany).not.toHaveBeenCalled();
    });

    it('insere com sucesso quando todos os colaboradores existem', async () => {
      prisma.employee.findMany.mockResolvedValue([
        { id: 'emp-1' },
        { id: 'emp-2' },
      ]);
      prisma.record.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBulk({
        employeeIds: ['emp-1', 'emp-2'],
        type: 'trabalho' as any,
        date: '2026-06-14T00:00:00.000Z',
      } as any);

      expect(result.count).toBe(2);
      expect(prisma.record.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll (busca do histórico)', () => {
    it('aplica o filtro de busca e tipo no where usado na consulta', async () => {
      prisma.record.findMany.mockResolvedValue([]);
      prisma.record.count.mockResolvedValue(0);

      await service.findAll(1, 20, 'cesar', 'falta');

      const whereUsado = prisma.record.findMany.mock.calls[0][0].where;
      expect(whereUsado.type).toBe('falta');
      expect(whereUsado.OR).toEqual(
        expect.arrayContaining([
          { employee: { name: { contains: 'cesar' } } },
        ]),
      );
      // O mesmo where deve ser usado no count, para o total bater com a busca
      expect(prisma.record.count).toHaveBeenCalledWith({ where: whereUsado });
    });

    it('sem filtros, não restringe a busca por tipo ou texto', async () => {
      prisma.record.findMany.mockResolvedValue([]);
      prisma.record.count.mockResolvedValue(0);

      await service.findAll(1, 20);

      const whereUsado = prisma.record.findMany.mock.calls[0][0].where;
      expect(whereUsado.type).toBeUndefined();
      expect(whereUsado.OR).toBeUndefined();
    });
  });
});
