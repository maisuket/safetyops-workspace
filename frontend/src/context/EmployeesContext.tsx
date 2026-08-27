import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { EmployeesService, Employee } from "../services/employees.service";

interface EmployeesContextValue {
  employees: Employee[];
  isLoadingEmployees: boolean;
  refreshEmployees: () => Promise<void>;
}

const EmployeesContext = createContext<EmployeesContextValue>({
  employees: [],
  isLoadingEmployees: true,
  refreshEmployees: async () => {},
});

export const EmployeesProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const refreshEmployees = useCallback(async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await EmployeesService.findAll(1, 1000);
      // Uma lista vazia é um resultado válido do backend (ex: todos os
      // colaboradores foram excluídos) — não deve ser substituída por dados
      // fictícios, ou uma exclusão real pareceria "não ter funcionado".
      setEmployees(response.data || []);
    } catch (error) {
      // Mantém a última lista já carregada em memória em vez de mostrar uma
      // tela vazia por uma falha transitória de rede.
      console.error("Erro ao buscar colaboradores:", error);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  return (
    <EmployeesContext.Provider value={{ employees, isLoadingEmployees, refreshEmployees }}>
      {children}
    </EmployeesContext.Provider>
  );
};

export const useEmployees = () => useContext(EmployeesContext);
