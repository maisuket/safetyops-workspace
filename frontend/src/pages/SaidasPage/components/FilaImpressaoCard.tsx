import { FileText, Trash2, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatarData } from "../utils";

interface FilaImpressaoCardProps {
  registros: any[];
  onRemover: (id: string) => void;
  onLimpar: () => void;
}

export const FilaImpressaoCard = ({
  registros,
  onRemover,
  onLimpar,
}: FilaImpressaoCardProps) => {
  return (
    <Card className="rounded-3xl shadow-sm border-slate-100 p-6 md:p-8 flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <Briefcase size={20} className="text-slate-400" />
          2. Fila de Impressão
        </h3>
        {registros.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLimpar}
            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg h-10 w-10"
            title="Limpar Lista"
            aria-label="Limpar Lista"
          >
            <Trash2 size={18} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
        {registros.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <FileText size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">Fila Vazia</p>
            <p className="text-xs text-slate-400 mt-1 text-center max-w-[200px]">
              Adicione colaboradores ao lado para gerar documentos.
            </p>
          </div>
        ) : (
          registros.map((r) => (
            <div
              key={r.id}
              className="p-4 pl-5 bg-white border border-slate-200 rounded-2xl relative group shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${r.tipoFormulario === "saida" ? "bg-emerald-400" : "bg-blue-400"}`}
              ></div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemover(r.id)}
                className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                title="Remover da Lista"
                aria-label="Remover da Lista"
              >
                <X size={16} />
              </Button>
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${r.tipoFormulario === "saida" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                >
                  {r.tipoFormulario}
                </span>
                <span className={`text-xs font-bold ${r.dataHora ? "text-slate-400" : "text-amber-500 italic"}`}>
                  {r.dataHora ? formatarData(r.dataHora) : "Sem data"}
                </span>
              </div>
              <p className="font-bold text-slate-700 text-sm mb-1 pr-6">
                {r.nome}
              </p>
              <p className="text-xs text-slate-500 truncate">
                <span className="font-semibold text-slate-600">Motivo:</span>{" "}
                {r.motivo}
              </p>
              {r.tipoFormulario === "uber" && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  <span className="font-semibold text-slate-600">Dest:</span>{" "}
                  {r.destino}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
