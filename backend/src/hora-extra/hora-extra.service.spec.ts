import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HoraExtraService } from './hora-extra.service';
import { PrismaService } from 'src/database/prisma.service';

describe('HoraExtraService', () => {
  let service: HoraExtraService;
  let prisma: {
    employee: { findMany: jest.Mock };
    horaExtraRecord: {
      createMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      employee: { findMany: jest.fn() },
      horaExtraRecord: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<any>[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HoraExtraService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<HoraExtraService>(HoraExtraService);
  });

  describe('createBulk', () => {
    it('lança NotFoundException quando algum employeeId do lote não existe', async () => {
      prisma.employee.findMany.mockResolvedValue([{ id: 'emp-1' }]);

      await expect(
        service.createBulk({
          dataServico: '2026-08-25T00:00:00.000Z',
          local: 'AMBAR ENERGIA - RORAIMA',
          employeeIds: ['emp-1', 'nao-existe'],
        } as any),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.horaExtraRecord.createMany).not.toHaveBeenCalled();
    });

    it('grava todos os colaboradores da folha com o mesmo batchId', async () => {
      prisma.employee.findMany.mockResolvedValue([
        { id: 'emp-1' },
        { id: 'emp-2' },
      ]);
      prisma.horaExtraRecord.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBulk({
        dataServico: '2026-08-25T00:00:00.000Z',
        local: 'AMBAR ENERGIA - RORAIMA',
        descricaoServico: 'Parametrização e testes em relé',
        employeeIds: ['emp-1', 'emp-2'],
      } as any);

      expect(result.count).toBe(2);
      const dataInserida = prisma.horaExtraRecord.createMany.mock.calls[0][0].data;
      expect(dataInserida[0].batchId).toBe(dataInserida[1].batchId);
      expect(result.batchId).toBe(dataInserida[0].batchId);
      expect(dataInserida[0].local).toBe('AMBAR ENERGIA - RORAIMA');
    });
  });

  describe('removeBulk', () => {
    it('remove todos os ids passados numa única chamada e sem duplicar ids repetidos', async () => {
      prisma.horaExtraRecord.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.removeBulk(['id-1', 'id-2', 'id-1']);

      expect(result.count).toBe(2);
      expect(prisma.horaExtraRecord.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['id-1', 'id-2'] } },
      });
    });
  });

  describe('search', () => {
    it('pagina os resultados calculando skip/take a partir de page/limit', async () => {
      prisma.horaExtraRecord.findMany.mockResolvedValue([{ id: 'he-1' }]);
      prisma.horaExtraRecord.count.mockResolvedValue(45);

      const result = await service.search({}, 3, 20);

      expect(prisma.horaExtraRecord.findMany.mock.calls[0][0]).toMatchObject({
        skip: 40,
        take: 20,
      });
      expect(result).toEqual({ data: [{ id: 'he-1' }], total: 45 });
    });
  });
});
