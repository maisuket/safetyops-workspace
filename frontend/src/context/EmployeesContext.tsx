import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { EmployeesService, Employee } from "../services/employees.service";
import { INITIAL_EMPLOYEES } from "../services/data-initial";

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
      const data = response.data || [];

      if (data.length > 0) {
        setEmployees(data);
      } else {
        const mock = localStorage.getItem("itam_employees_mock");
        if (mock) {
          setEmployees(JSON.parse(mock));
        } else {
          setEmployees(
            INITIAL_EMPLOYEES.map((name, i) => ({
              id: `mock-${i}`,
              name,
              enrollment: `ITAM${100 + i}`,
              active: true,
              createdAt: new Date().toISOString(),
            })),
          );
        }
      }
    } catch {
      const mock = localStorage.getItem("itam_employees_mock");
      if (mock) setEmployees(JSON.parse(mock));
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
