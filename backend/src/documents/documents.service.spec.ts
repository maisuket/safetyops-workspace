import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from 'src/database/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: {
    employee: { findMany: jest.Mock };
    document: { createMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      employee: { findMany: jest.fn() },
      document: { createMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('createBulk', () => {
    it('lança NotFoundException quando algum employeeId do lote não existe', async () => {
      prisma.employee.findMany.mockResolvedValue([{ id: 'emp-1' }]);

      await expect(
        service.createBulk({
          items: [
            {
              employeeId: 'emp-1',
              docType: 'ASO',
              expiryDate: '2026-12-01',
            } as any,
            {
              employeeId: 'nao-existe',
              docType: 'NR 35',
              expiryDate: '2026-12-01',
            } as any,
          ],
        } as any),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.document.createMany).not.toHaveBeenCalled();
    });

    it('importa todos os documentos do lote numa única chamada', async () => {
      prisma.employee.findMany.mockResolvedValue([
        { id: 'emp-1' },
        { id: 'emp-2' },
      ]);
      prisma.document.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBulk({
        items: [
          { employeeId: 'emp-1', docType: 'ASO', expiryDate: '2026-12-01' } as any,
          { employeeId: 'emp-2', docType: 'NR 35', expiryDate: '2026-11-01' } as any,
        ],
      } as any);

      expect(result.count).toBe(2);
      expect(prisma.document.createMany).toHaveBeenCalledTimes(1);
    });
  });
});
