import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateBulkDocumentDto } from './dto/create-bulk-document.dto';
import { Document } from '@prisma/client';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Envia o documento para a API Gemini e extrai os dados de SST via OCR.
   */
  async analyzeWithAI(file: Express.Multer.File): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY não configurada no servidor.',
      );
    }

    const base64 = file.buffer.toString('base64');

    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Extraia do documento SST: employeeName, docType, issueDate, expiryDate (YYYY-MM-DD). Retorne APENAS um JSON plano.',
            },
            {
              inlineData: {
                mimeType: file.mimetype || 'image/png',
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      this.logger.error(`Gemini API error: ${response.status}`);
      throw new InternalServerErrorException(
        'Falha ao comunicar com a API Gemini.',
      );
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new InternalServerErrorException(
        'Gemini não retornou dados legíveis.',
      );
    }

    // Apesar de pedirmos responseMimeType: application/json, o modelo às
    // vezes ainda envolve a resposta em blocos de código markdown
    // (```json ... ```) — removemos isso antes de fazer o parse.
    const cleanText = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '');

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      this.logger.error(
        `Gemini retornou um JSON inválido: ${error.message}`,
        text,
      );
      throw new InternalServerErrorException(
        'Não foi possível interpretar a resposta da IA. Tente novamente ou preencha manualmente.',
      );
    }
  }

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
   * Arquiva vários documentos de uma vez (usado pela importação de planilha
   * de SST) — evita uma requisição HTTP por linha da planilha.
   */
  async createBulk(dto: CreateBulkDocumentDto): Promise<{ count: number }> {
    try {
      // Valida que todos os colaboradores existem antes de inserir — sem isso,
      // um único employeeId inválido faz o lote inteiro falhar por violação de
      // chave estrangeira, sem indicar qual item é o problema.
      const uniqueIds = [...new Set(dto.items.map((item) => item.employeeId))];
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

      const data = dto.items.map((item) => ({
        docType: item.docType,
        issueDate: item.issueDate ? new Date(item.issueDate) : null,
        expiryDate: new Date(item.expiryDate),
        employeeId: item.employeeId,
      }));

      const result = await this.prisma.document.createMany({ data });

      this.logger.log(`Importados ${result.count} documento(s) em lote.`);

      return { count: result.count };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Erro ao importar documentos em lote: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Não foi possível importar os documentos.',
      );
    }
  }

  /**
   * Retorna todos os documentos. O nome/matrícula do colaborador não é
   * incluído via JOIN — o frontend já resolve isso a partir do
   * EmployeesContext, que carrega a lista completa de colaboradores.
   */
  async findAll(): Promise<Document[]> {
    try {
      return await this.prisma.document.findMany({
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
