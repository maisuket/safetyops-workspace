import { api } from "./api";
import { Employee } from "./employees.service";

// Tipos baseados nos DTOs do nosso NestJS
export type RecordType = "trabalho" | "folga";

export interface Record {
  id: string;
  type: RecordType;
  date: string;
  description?: string;
  refDate?: string;
  employeeId: string;
  employee?: Partial<Employee>; // O backend pode popular isso num JOIN (include no Prisma)
}

export interface CreateBulkRecordDto {
  employeeIds: string[];
  type: RecordType;
  date: string;
  description?: string;
  refDate?: string;
}

export const RecordsService = {
  /**
   * Busca todo o histórico de lançamentos.
   * Rota NestJS: GET /api/records
   */
  async findAll(): Promise<Record[]> {
    return api.get<Record[]>("/records");
  },

  /**
   * Realiza a inserção em lote (Bulk Insert) que criamos no backend.
   * Rota NestJS: POST /api/records/bulk
   */
  async createBulk(
    data: CreateBulkRecordDto,
  ): Promise<{ count: number; message: string }> {
    return api.post<{ count: number; message: string }>("/records/bulk", data);
  },

  /**
   * Realiza o estorno/exclusão de um lançamento.
   * Rota NestJS: DELETE /api/records/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/records/${id}`);
  },
};
