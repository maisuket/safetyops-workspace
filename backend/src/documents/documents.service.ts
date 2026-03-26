import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from '@prisma/client';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Realiza o arquivamento de um novo documento de SST.
   */
  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    try {
      // 1. Verifica se o funcionário existe
      const employeeExists = await this.prisma.employee.findUnique({
        where: { id: createDocumentDto.employeeId },
      });

      if (!employeeExists) {
        throw new NotFoundException(
          `Colaborador com ID ${createDocumentDto.employeeId} não encontrado.`,
        );
      }

      // 2. Insere o documento
      return await this.prisma.document.create({
        data: {
          docType: createDocumentDto.docType,
          issueDate: createDocumentDto.issueDate
            ? new Date(createDocumentDto.issueDate)
            : null,
          expiryDate: new Date(createDocumentDto.expiryDate),
          employeeId: createDocumentDto.employeeId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Erro ao criar documento: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível arquivar o documento.',
      );
    }
  }

  /**
   * Retorna todos os documentos, incluindo os dados básicos do colaborador associado.
   */
  async findAll(): Promise<Document[]> {
    try {
      return await this.prisma.document.findMany({
        include: {
          employee: {
            select: {
              name: true,
              enrollment: true,
            },
          },
        },
        orderBy: {
          expiryDate: 'asc', // Ordena exibindo os que vão vencer primeiro
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar documentos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível carregar os documentos.',
      );
    }
  }

  /**
   * Atualiza os dados de um documento de SST existente.
   */
  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    try {
      // Verifica se o employeeId foi enviado na edição e se ele existe
      if (updateDocumentDto.employeeId) {
        const employeeExists = await this.prisma.employee.findUnique({
          where: { id: updateDocumentDto.employeeId },
        });

        if (!employeeExists) {
          throw new NotFoundException(
            `Colaborador com ID ${updateDocumentDto.employeeId} não encontrado.`,
          );
        }
      }

      // Realiza o UPDATE no Prisma
      return await this.prisma.document.update({
        where: { id },
        data: {
          docType: updateDocumentDto.docType,
          issueDate: updateDocumentDto.issueDate
            ? new Date(updateDocumentDto.issueDate)
            : undefined,
          expiryDate: updateDocumentDto.expiryDate
            ? new Date(updateDocumentDto.expiryDate)
            : undefined,
          employeeId: updateDocumentDto.employeeId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      // P2025 é o código de erro do Prisma para "Registro não encontrado"
      if (error.code === 'P2025') {
        throw new NotFoundException(`Documento com ID ${id} não encontrado.`);
      }

      this.logger.error(
        `Erro ao atualizar documento ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível atualizar o documento.',
      );
    }
  }

  /**
   * Remove um documento do sistema.
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.document.delete({
        where: { id },
      });

      return { message: 'Documento removido com sucesso.' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Documento com ID ${id} não encontrado.`);
      }

      this.logger.error(
        `Erro ao remover documento ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível remover o documento.',
      );
    }
  }
}
