import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SaidasService } from './saidas.service';
import { PrismaService } from 'src/database/prisma.service';

describe('SaidasService', () => {
  let service: SaidasService;
  let prisma: {
    employee: { findMany: jest.Mock };
    saidaRecord: {
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
      saidaRecord: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      // Simula o comportamento real do $transaction([...]) do Prisma:
      // apenas resolve todas as promises passadas, na ordem.
      $transaction: jest.fn((ops: Promise<any>[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SaidasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SaidasService>(SaidasService);
  });

  describe('createBulk', () => {
    it('lança NotFoundException quando algum employeeId do lote não existe', async () => {
      prisma.employee.findMany.mockResolvedValue([{ id: 'emp-1' }]);

      await expect(
        service.createBulk({
          items: [
            { employeeId: 'emp-1', tipo: 'saida', motivo: 'x' } as any,
            { employeeId: 'nao-existe', tipo: 'uber', motivo: 'y' } as any,
          ],
        } as any),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.saidaRecord.createMany).not.toHaveBeenCalled();
    });

    it('grava todos os itens do lote com o mesmo batchId', async () => {
      prisma.employee.findMany.mockResolvedValue([
        { id: 'emp-1' },
        { id: 'emp-2' },
      ]);
      prisma.saidaRecord.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBulk({
        items: [
          { employeeId: 'emp-1', tipo: 'saida', motivo: 'x' } as any,
          { employeeId: 'emp-2', tipo: 'uber', motivo: 'y', destino: 'ITAM' } as any,
        ],
      } as any);

      expect(result.count).toBe(2);
      const dataInserida = prisma.saidaRecord.createMany.mock.calls[0][0].data;
      expect(dataInserida[0].batchId).toBe(dataInserida[1].batchId);
      expect(result.batchId).toBe(dataInserida[0].batchId);
    });

    it('grava dataOcorrencia como null quando o formulário é emitido com data em branco', async () => {
      prisma.employee.findMany.mockResolvedValue([{ id: 'emp-1' }]);
      prisma.saidaRecord.createMany.mockResolvedValue({ count: 1 });

      await service.createBulk({
        items: [{ employeeId: 'emp-1', tipo: 'saida', motivo: 'x' } as any],
      } as any);

      const dataInserida = prisma.saidaRecord.createMany.mock.calls[0][0].data;
      expect(dataInserida[0].dataOcorrencia).toBeNull();
    });
  });

  describe('removeBulk', () => {
    it('remove todos os ids passados numa única chamada e sem duplicar ids repetidos', async () => {
      prisma.saidaRecord.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.removeBulk(['id-1', 'id-2', 'id-1']);

      expect(result.count).toBe(2);
      expect(prisma.saidaRecord.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['id-1', 'id-2'] } },
      });
    });
  });

  describe('search (rastreio por data)', () => {
    it('inclui saídas sem data (dataOcorrencia null) cujo createdAt caia no período buscado', async () => {
      prisma.saidaRecord.findMany.mockResolvedValue([]);
      prisma.saidaRecord.count.mockResolvedValue(0);

      await service.search({ startDate: '2026-06-01', endDate: '2026-06-30' });

      const where = prisma.saidaRecord.findMany.mock.calls[0][0].where;
      const condicaoDePeriodo = where.AND[0].OR;

      // Uma das condições precisa cobrir explicitamente o caso de data em
      // branco (dataOcorrencia null) usando o createdAt como substituto —
      // sem isso, saídas emitidas sem data nunca apareceriam numa busca por dia.
      expect(condicaoDePeriodo).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AND: expect.arrayContaining([{ dataOcorrencia: null }]),
          }),
        ]),
      );
    });

    it('pagina os resultados calculando skip/take a partir de page/limit', async () => {
      prisma.saidaRecord.findMany.mockResolvedValue([{ id: 'saida-1' }]);
      prisma.saidaRecord.count.mockResolvedValue(45);

      const result = await service.search({}, 3, 20);

      expect(prisma.saidaRecord.findMany.mock.calls[0][0]).toMatchObject({
        skip: 40,
        take: 20,
      });
      expect(result).toEqual({ data: [{ id: 'saida-1' }], total: 45 });
    });
  });
});
