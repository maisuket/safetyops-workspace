import { api } from "./api";
import { Employee } from "./employees.service";

// Tipos baseados nos DTOs do nosso NestJS
export type RecordType =
  | "trabalho"
  | "folga"
  | "falta"
  | "servico_externo"
  | "ajuste_horario";

export interface Record {
  id: string;
  type: RecordType;
  date: string;
  description?: string;
  refDate?: string;
  justification?: string;
  employeeId: string;
  employee?: Partial<Employee>; // O backend pode popular isso num JOIN (include no Prisma)
}

export interface CreateBulkRecordDto {
  employeeIds: string[];
  type: RecordType;
  date: string;
  description?: string;
  refDate?: string;
  justification?: string;
}

export interface PaginatedRecordsResponse {
  data: Record[];
  total: number;
}

export const RecordsService = {
  /**
   * Busca todo o histórico de lançamentos.
   * Rota NestJS: GET /api/records
   */
  async findAll(page = 1, limit = 20): Promise<PaginatedRecordsResponse> {
    return api.get<PaginatedRecordsResponse>(
      `/records?page=${page}&limit=${limit}`,
    );
  },

  /**
   * Busca o histórico completo de um único colaborador.
   * Rota NestJS: GET /api/records/employee/:employeeId
   */
  async findByEmployee(employeeId: string): Promise<Record[]> {
    return api.get<Record[]>(`/records/employee/${employeeId}`);
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
   * Busca registos filtrados por período e tipo (para relatórios).
   * Rota NestJS: GET /api/records/report
   */
  async findByPeriod(
    startDate: string,
    endDate: string,
    type?: RecordType,
  ): Promise<Record[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (type) params.append("type", type);
    return api.get<Record[]>(`/records/report?${params.toString()}`);
  },

  /**
   * Realiza o estorno/exclusão de um lançamento.
   * Rota NestJS: DELETE /api/records/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/records/${id}`);
  },
};
