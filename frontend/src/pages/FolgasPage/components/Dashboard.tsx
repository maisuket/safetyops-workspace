import {
  Calendar,
  Clock,
  Download,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { EmployeeStat } from "../FolgasPage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Dashboard Component ---
interface DashboardProps {
  employeesLength: number;
  totalCredits: number;
  totalBalance: number;
  employeeStats: EmployeeStat[];
  isLoading: boolean;
  libsLoaded: boolean;
  setSelectedEmployeeId: (id: string) => void;
  setIsReportModalOpen: (isOpen: boolean) => void;
  exportToExcel: () => void;
  exportToPDF: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employeesLength,
  totalCredits,
  totalBalance,
  employeeStats,
  isLoading,
  libsLoaded,
  setSelectedEmployeeId,
  setIsReportModalOpen,
  exportToExcel,
  exportToPDF,
}) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Colaboradores</p>
            <p className="text-2xl font-bold text-slate-800">
              {employeesLength}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Créditos</p>
            <p className="text-2xl font-bold text-slate-800">{totalCredits}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Saldo Pendente</p>
            <p className="text-2xl font-bold text-slate-800">{totalBalance}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800">Ranking de Saldos</h2>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
          <Button
            variant="outline"
            onClick={() => setIsReportModalOpen(true)}
            disabled={!libsLoaded}
            className="flex-1 sm:flex-none text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
          >
            <Calendar size={18} /> Folgas
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!libsLoaded}
            className="flex-1 sm:flex-none text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
          >
            <Download size={18} /> Excel
          </Button>
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={!libsLoaded}
            className="flex-1 sm:flex-none text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <FileText size={18} /> PDF
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold">Colaborador</TableHead>
              <TableHead className="font-semibold">Matrícula</TableHead>
              <TableHead className="font-semibold text-center">
                Trabalhados
              </TableHead>
              <TableHead className="font-semibold text-center">
                Folgas
              </TableHead>
              <TableHead className="font-semibold text-center">Saldo</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeStats.map((emp) => (
              <TableRow
                key={emp.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <TableCell
                  className="font-bold text-emerald-600 cursor-pointer hover:underline flex items-center gap-2 py-4"
                  onClick={() => setSelectedEmployeeId(emp.id)}
                >
                  {emp.name}
                </TableCell>
                <TableCell className="text-center text-slate-600">
                  {emp?.enrollment ?? "-"}
                </TableCell>
                <TableCell className="text-center text-slate-600">
                  {emp.earned}
                </TableCell>
                <TableCell className="text-center text-slate-600">
                  {emp.taken}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`font-bold ${emp.balance > 2 ? "text-amber-600" : emp.balance > 0 ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {emp.balance}
                  </span>
                </TableCell>
                <TableCell>
                  {emp.balance > 3 ? (
                    <span className="px-2 py-1 bg-rose-50 text-rose-600 text-xs rounded-full font-medium">
                      Crítico
                    </span>
                  ) : emp.balance > 0 ? (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full font-medium">
                      Disponível
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-400 text-xs rounded-full font-medium">
                      Zerado
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {employeeStats.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-slate-400"
                >
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
);
