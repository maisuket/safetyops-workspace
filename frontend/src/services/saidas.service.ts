import { api } from "./api";

export type SaidaTipo = "saida" | "uber";
export type SaidaTipoData = "saida" | "entrada";

export interface SaidaRecord {
  id: string;
  tipo: SaidaTipo;
  tipoData?: SaidaTipoData | null;
  destino?: string | null;
  motivo: string;
  dataOcorrencia?: string | null;
  batchId: string;
  employeeId: string;
  employee?: { name: string; enrollment?: string | null };
  createdAt: string;
}

export interface CreateSaidaItem {
  employeeId: string;
  tipo: SaidaTipo;
  tipoData?: SaidaTipoData;
  destino?: string;
  motivo: string;
  dataOcorrencia?: string;
}

export interface SaidaSearchParams {
  employeeId?: string;
  tipo?: SaidaTipo;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedSaidasResponse {
  data: SaidaRecord[];
  total: number;
}

export const SaidasService = {
  /**
   * Grava, num único lote, todas as saídas/ubers emitidos juntos.
   * Rota NestJS: POST /api/saidas/bulk
   */
  async createBulk(
    items: CreateSaidaItem[],
  ): Promise<{ count: number; batchId: string }> {
    return api.post<{ count: number; batchId: string }>("/saidas/bulk", {
      items,
    });
  },

  /**
   * Rastreio: busca por colaborador, tipo, texto livre e/ou por período.
   * Paginado (mesmo padrão de RecordsService.findAll).
   * Rota NestJS: GET /api/saidas
   */
  async search(
    params: SaidaSearchParams = {},
    page = 1,
    limit = 20,
  ): Promise<PaginatedSaidasResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.tipo) query.append("tipo", params.tipo);
    if (params.search) query.append("search", params.search);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    return api.get<PaginatedSaidasResponse>(`/saidas?${query.toString()}`);
  },

  /**
   * Histórico completo de um colaborador.
   * Rota NestJS: GET /api/saidas/employee/:employeeId
   */
  async findByEmployee(employeeId: string): Promise<SaidaRecord[]> {
    return api.get<SaidaRecord[]>(`/saidas/employee/${employeeId}`);
  },

  /**
   * Remove um registo de saída (correção de lançamento).
   * Rota NestJS: DELETE /api/saidas/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/saidas/${id}`);
  },

  /**
   * Remove vários registos de saída de uma vez (exclusão em lote, quando o
   * utilizador seleciona várias linhas no Rastreio de Saídas).
   * Rota NestJS: DELETE /api/saidas/bulk
   */
  async removeBulk(ids: string[]): Promise<{ count: number }> {
    return api.delete<{ count: number }>("/saidas/bulk", { data: { ids } });
  },
};
