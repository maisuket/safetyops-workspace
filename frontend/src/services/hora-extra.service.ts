import { api } from "./api";

export interface HoraExtraRecord {
  id: string;
  batchId: string;
  dataServico: string;
  local: string;
  descricaoServico?: string | null;
  enderecoServico?: string | null;
  numeroOS?: string | null;
  observacao?: string | null;
  employeeId: string;
  employee?: { name: string; enrollment?: string | null };
  createdAt: string;
}

export interface CreateBulkHoraExtraPayload {
  dataServico: string;
  local: string;
  descricaoServico?: string;
  enderecoServico?: string;
  numeroOS?: string;
  observacao?: string;
  employeeIds: string[];
}

export interface HoraExtraSearchParams {
  employeeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedHoraExtraResponse {
  data: HoraExtraRecord[];
  total: number;
}

export const HoraExtraService = {
  /**
   * Grava, num único lote, todos os colaboradores da mesma folha de Relação
   * Hora Extra/Compensação emitida junto (mesmo PDF/Excel).
   * Rota NestJS: POST /api/hora-extra/bulk
   */
  async createBulk(
    payload: CreateBulkHoraExtraPayload,
  ): Promise<{ count: number; batchId: string }> {
    return api.post<{ count: number; batchId: string }>(
      "/hora-extra/bulk",
      payload,
    );
  },

  /**
   * Rastreio: busca por colaborador, texto livre e/ou por período.
   * Paginado (mesmo padrão de SaidasService.search).
   * Rota NestJS: GET /api/hora-extra
   */
  async search(
    params: HoraExtraSearchParams = {},
    page = 1,
    limit = 20,
  ): Promise<PaginatedHoraExtraResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.search) query.append("search", params.search);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    return api.get<PaginatedHoraExtraResponse>(
      `/hora-extra?${query.toString()}`,
    );
  },

  /**
   * Remove um registo de hora extra (correção de lançamento).
   * Rota NestJS: DELETE /api/hora-extra/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/hora-extra/${id}`);
  },

  /**
   * Remove vários registos de hora extra de uma vez (exclusão em lote,
   * quando o utilizador seleciona várias linhas no Rastreio).
   * Rota NestJS: DELETE /api/hora-extra/bulk
   */
  async removeBulk(ids: string[]): Promise<{ count: number }> {
    return api.delete<{ count: number }>("/hora-extra/bulk", { data: { ids } });
  },
};
