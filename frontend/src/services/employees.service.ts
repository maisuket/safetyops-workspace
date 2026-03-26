import { api } from "./api";

// Tipagem estrita baseada no que temos no NestJS Prisma Schema
export interface Employee {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

interface Data {
  name: string;
  enrolment: string;
}

export const EmployeesService = {
  /**
   * Busca todos os colaboradores cadastrados.
   * Rota NestJS: GET /api/employees
   */
  async findAll(): Promise<Employee[]> {
    return api.get<Employee[]>("/employees");
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
  async update(data: Data): Promise<Employee> {
    return api.put<Employee>("/employees", data);
  },

  /**
   * Remove um colaborador.
   * Rota NestJS: DELETE /api/employees/:id
   */
  async remove(id: string): Promise<Employee> {
    return api.delete<Employee>(`/employees/${id}`);
  },
};
