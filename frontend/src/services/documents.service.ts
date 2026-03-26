import { api } from "./api";
import { Employee } from "./employees.service";

export interface Document {
  id: string;
  docType: string;
  issueDate?: string | null;
  expiryDate: string;
  employeeId: string;
  employee?: Partial<Employee>; // O backend pode popular isto através de um JOIN (include no Prisma)
  createdAt?: string;
}

export interface CreateDocumentDto {
  docType: string;
  issueDate?: string | null;
  expiryDate: string;
  employeeId: string;
}

export const DocumentsService = {
  /**
   * Busca todo o histórico de documentos arquivados.
   * Rota NestJS: GET /api/documents
   */
  async findAll(): Promise<Document[]> {
    return api.get<Document[]>("/documents");
  },

  /**
   * Realiza o arquivamento de um novo documento (ASO, NR, etc).
   * Rota NestJS: POST /api/documents
   */
  async create(data: CreateDocumentDto): Promise<Document> {
    return api.post<Document>("/documents", data);
  },

  /**
   * Realiza a atualização de um documento.
   * Rota NestJS: PUT /api/documents/:id
   */
  async update(
    id: string,
    data: Partial<CreateDocumentDto>,
  ): Promise<Document> {
    return api.put<Document>(`/documents/${id}`, data);
  },

  /**
   * Realiza a exclusão de um documento.
   * Rota NestJS: DELETE /api/documents/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/documents/${id}`);
  },
};
