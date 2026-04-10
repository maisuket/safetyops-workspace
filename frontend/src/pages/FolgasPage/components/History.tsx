import React, { useState, useMemo } from "react";
import { Clock, Trash2, TrendingUp, Search, Filter } from "lucide-react";
import { Employee, FolgaRecord } from "../FolgasPage";

// --- History Component ---
interface HistoryComponentProps {
  records: FolgaRecord[];
  employees: Employee[];
  isLoading: boolean;
  deleteRecord: (id: string) => void;
}

export const HistoryComponent: React.FC<HistoryComponentProps> = ({
  records,
  employees,
  isLoading,
  deleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "trabalho" | "folga">(
    "all",
  );

  // Filtro inteligente e memoizado para performance
  const filteredRecords = useMemo(() => {
    return [...records].reverse().filter((record) => {
      const emp = employees.find((e) => e.id === record.employeeId);

      // Busca por nome do colaborador, descrição ou referência
      const matchesSearch =
        (emp?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.refDate || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por tipo (todos, trabalho, folga)
      const matchesType = filterType === "all" || record.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [records, employees, searchTerm, filterType]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      {/* Header com Filtros */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800">
          Histórico de Lançamentos
        </h2>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar colaborador ou desc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <Filter size={16} className="text-slate-400 ml-2" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-sm font-medium text-slate-600 border-none outline-none py-1.5 pr-4 cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="trabalho">Apenas Créditos</option>
              <option value="folga">Apenas Folgas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left relative">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">Descrição/Referência</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRecords.map((record) => {
              const emp = employees.find((e) => e.id === record.employeeId);
              return (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {new Date(record.date).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {record.type === "trabalho" ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <TrendingUp size={14} /> Crédito
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                        <Clock size={14} /> Folga
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-700">
                    {emp?.name || "Desconhecido"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">
                    {record.description ||
                      (record.refDate ? `Ref: ${record.refDate}` : "N/A")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir Lançamento"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredRecords.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  Nenhum registo encontrado com estes filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
