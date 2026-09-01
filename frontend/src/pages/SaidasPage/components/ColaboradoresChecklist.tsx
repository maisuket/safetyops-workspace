import { useMemo, useState } from "react";
import { Search, CheckSquare, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ColaboradoresChecklistProps {
  employees: any[];
  selecionados: string[];
  onToggle: (id: string) => void;
}

export const ColaboradoresChecklist = ({
  employees,
  selecionados,
  onToggle,
}: ColaboradoresChecklistProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [employees, searchTerm]);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-sm font-bold text-slate-700">
          Colaboradores ({selecionados.length})
        </label>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        <Input
          type="text"
          placeholder="Buscar pelo nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border-slate-200 rounded-xl pl-10 h-11 text-sm"
        />
      </div>
      <div className="h-56 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
        {filteredEmployees.map((e) => (
          <label
            key={e.id}
            className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${selecionados.includes(e.id) ? "bg-emerald-50 border-emerald-200 shadow-sm" : "hover:bg-slate-200/50 border-transparent"}`}
          >
            <div
              className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${selecionados.includes(e.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"}`}
            >
              {selecionados.includes(e.id) && (
                <CheckSquare size={14} className="text-white bg-emerald-500 rounded" />
              )}
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selecionados.includes(e.id) ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
            >
              {e.name.charAt(0)}
            </div>
            <div className="flex flex-col select-none">
              <span className="text-sm font-bold text-slate-700 leading-tight">
                {e.name}
              </span>
              <span className="text-xs text-slate-400 font-medium leading-tight mt-0.5 flex items-center gap-1">
                <Briefcase size={10} /> {e.enrollment || "S/M"}
              </span>
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={selecionados.includes(e.id)}
              onChange={() => onToggle(e.id)}
            />
          </label>
        ))}
      </div>
    </div>
  );
};
