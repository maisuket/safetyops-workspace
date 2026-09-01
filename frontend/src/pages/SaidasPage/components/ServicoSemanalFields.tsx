import { Car, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ServicoSemanalFieldsProps {
  ssData: string;
  onSsDataChange: (v: string) => void;
  ssLocal: string;
  onSsLocalChange: (v: string) => void;
  ssDescricao: string;
  onSsDescricaoChange: (v: string) => void;
  colaboradoresSelecionados: string[];
  employees: any[];
  ssUberSelecionados: string[];
  onToggleUber: (id: string) => void;
}

export const ServicoSemanalFields = ({
  ssData,
  onSsDataChange,
  ssLocal,
  onSsLocalChange,
  ssDescricao,
  onSsDescricaoChange,
  colaboradoresSelecionados,
  employees,
  ssUberSelecionados,
  onToggleUber,
}: ServicoSemanalFieldsProps) => {
  return (
    <>
      {/* Serviço Semanal — Saída + Uber + Hora Extra num só passo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Data do Serviço
          </label>
          <Input
            type="date"
            className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
            value={ssData}
            onChange={(e) => onSsDataChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Local / Destino do Serviço
          </label>
          <Input
            type="text"
            className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
            value={ssLocal}
            onChange={(e) => onSsLocalChange(e.target.value.toLocaleUpperCase())}
            placeholder="Ex: AMBAR ENERGIA - RORAIMA"
          />
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-1">
          Descrição do Serviço
        </label>
        <Input
          type="text"
          className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
          value={ssDescricao}
          onChange={(e) => onSsDescricaoChange(e.target.value)}
          placeholder="Ex: Parametrização e testes em relé"
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Quem precisa de Uber?
        </label>
        {colaboradoresSelecionados.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            Selecione colaboradores acima para marcar quem precisa de Uber.
          </p>
        ) : (
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {colaboradoresSelecionados.map((id) => {
              const emp = employees.find((e) => e.id === id);
              if (!emp) return null;
              const precisaUber = ssUberSelecionados.includes(id);
              return (
                <label
                  key={id}
                  className={`flex items-center justify-between space-x-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${precisaUber ? "bg-violet-50 border-violet-200 shadow-sm" : "hover:bg-slate-200/50 border-transparent"}`}
                >
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {emp.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Car
                      size={16}
                      className={precisaUber ? "text-violet-600" : "text-slate-300"}
                    />
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${precisaUber ? "bg-violet-500 border-violet-500 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {precisaUber && (
                        <CheckSquare size={14} className="text-white bg-violet-500 rounded" />
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={precisaUber}
                    onChange={() => onToggleUber(id)}
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
