import { api } from "./api";

// Tipagem estrita baseada no que temos no NestJS Prisma Schema
export interface Employee {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface PaginatedEmployeesResponse {
  data: Employee[];
  total: number;
}

interface Data {
  name: string;
  enrollment?: string;
}

export const EmployeesService = {
  /**
   * Busca todos os colaboradores cadastrados.
   * Rota NestJS: GET /api/employees
   */
  async findAll(page = 1, limit = 1000): Promise<PaginatedEmployeesResponse> {
    return api.get<PaginatedEmployeesResponse>(`/employees?page=${page}&limit=${limit}`);
  },

  /**
   * Cadastra um novo colaborador.
   * Rota NestJS: POST /api/employees
   */
  async create(data: Data): Promise<Employee> {
    return api.post<Employee>("/employees", data);
  },

  /**
   * Desativa/Ativa um colaborador (Soft Delete).
   * Rota NestJS: PUT /api/employees/:id/status
   */
  async toggleStatus(id: string, active: boolean): Promise<Employee> {
    return api.put<Employee>(`/employees/${id}/status`, { active });
  },

  /**
   * Atualiza dados de um colaborador.
   * Rota NestJS: PUT /api/employees/:id
   */
  async update(id: string, data: Data): Promise<Employee> {
    return api.put<Employee>(`/employees/${id}`, data);
  },

  /**
   * Remove um colaborador.
   * Rota NestJS: DELETE /api/employees/:id
   */
  async remove(id: string): Promise<Employee> {
    return api.delete<Employee>(`/employees/${id}`);
  },

  /**
   * Busca as estatísticas de saldo e folgas dos colaboradores.
   * Rota NestJS: GET /api/employees/stats
   */
  async getStats(): Promise<any[]> {
    return api.get<any[]>("/employees/stats");
  },
};
