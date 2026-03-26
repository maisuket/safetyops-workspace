import {
  Calendar,
  Clock,
  Download,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";

// --- Dashboard Component ---
interface DashboardProps {
  employeesLength: number;
  totalCredits: number;
  totalBalance: number;
  employeeStats: any[];
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Colaboradores</p>
          <p className="text-2xl font-bold text-slate-800">{employeesLength}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Créditos</p>
          <p className="text-2xl font-bold text-slate-800">{totalCredits}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Saldo Pendente</p>
          <p className="text-2xl font-bold text-slate-800">{totalBalance}</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800">Ranking de Saldos</h2>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={!libsLoaded}
            className="flex-1 sm:flex-none p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50"
          >
            <Calendar size={18} /> Folgas
          </button>
          <button
            onClick={exportToExcel}
            disabled={!libsLoaded}
            className="flex-1 sm:flex-none p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50"
          >
            <Download size={18} /> Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={!libsLoaded}
            className="flex-1 sm:flex-none p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50"
          >
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">Matrícula</th>
              <th className="px-6 py-4 text-center">Trabalhados</th>
              <th className="px-6 py-4 text-center">Folgas</th>
              <th className="px-6 py-4 text-center">Saldo</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employeeStats.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td
                  className="px-6 py-4 font-bold text-emerald-600 cursor-pointer hover:underline flex items-center gap-2"
                  onClick={() => setSelectedEmployeeId(emp.id)}
                >
                  {emp.name}
                </td>
                <td className="px-6 py-4 text-center text-slate-600">
                  {emp?.enrollment ?? "-"}
                </td>
                <td className="px-6 py-4 text-center text-slate-600">
                  {emp.earned}
                </td>
                <td className="px-6 py-4 text-center text-slate-600">
                  {emp.taken}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`font-bold ${emp.balance > 2 ? "text-amber-600" : emp.balance > 0 ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {emp.balance}
                  </span>
                </td>
                <td className="px-6 py-4">
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
                </td>
              </tr>
            ))}
            {employeeStats.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  Nenhum colaborador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
