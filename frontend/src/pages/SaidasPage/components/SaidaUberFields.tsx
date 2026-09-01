import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SaidaUberFieldsProps {
  tipoFormulario: "saida" | "uber";
  dataSelecionada: string;
  onDataSelecionadaChange: (v: string) => void;
  dataEmBranco: boolean;
  onDataEmBrancoChange: (v: boolean) => void;
  tipoData: string;
  onTipoDataChange: (v: string) => void;
  destino: string;
  onDestinoChange: (v: string) => void;
  comAssinatura: boolean;
  onComAssinaturaChange: (v: boolean) => void;
  motivo: string;
  onMotivoChange: (v: string) => void;
  onAddRegistro: () => void;
}

export const SaidaUberFields = ({
  tipoFormulario,
  dataSelecionada,
  onDataSelecionadaChange,
  dataEmBranco,
  onDataEmBrancoChange,
  tipoData,
  onTipoDataChange,
  destino,
  onDestinoChange,
  comAssinatura,
  onComAssinaturaChange,
  motivo,
  onMotivoChange,
  onAddRegistro,
}: SaidaUberFieldsProps) => {
  return (
    <>
      {/* Data e Opções Condicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Data da Ocorrência
          </label>
          <Input
            type="date"
            className={`w-full border-slate-200 rounded-xl h-12 px-4 transition-all ${dataEmBranco ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60" : "bg-slate-50"}`}
            value={dataEmBranco ? "" : dataSelecionada}
            onChange={(e) => onDataSelecionadaChange(e.target.value)}
            disabled={dataEmBranco}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
            <div
              className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-all ${dataEmBranco ? "bg-slate-700 border-slate-700" : "border-slate-300 bg-white"}`}
              onClick={() => onDataEmBrancoChange(!dataEmBranco)}
            >
              {dataEmBranco && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span
              className="text-xs font-medium text-slate-500"
              onClick={() => onDataEmBrancoChange(!dataEmBranco)}
            >
              Emitir com data em branco
            </span>
            <input
              type="checkbox"
              className="hidden"
              checked={dataEmBranco}
              onChange={(e) => onDataEmBrancoChange(e.target.checked)}
            />
          </label>
        </div>

        {tipoFormulario === "saida" && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Preencher data em:
            </label>
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-12">
              <label
                className={`flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-bold transition-all ${tipoData === "saida" ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
              >
                <input
                  type="radio"
                  className="hidden"
                  value="saida"
                  checked={tipoData === "saida"}
                  onChange={(e) => onTipoDataChange(e.target.value)}
                />
                Saída
              </label>
              <label
                className={`flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-bold transition-all ${tipoData === "entrada" ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
              >
                <input
                  type="radio"
                  className="hidden"
                  value="entrada"
                  checked={tipoData === "entrada"}
                  onChange={(e) => onTipoDataChange(e.target.value)}
                />
                Entrada
              </label>
            </div>
          </div>
        )}
        {tipoFormulario === "uber" && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Destino (Geral)
            </label>
            <Select value={destino} onValueChange={onDestinoChange}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">VAZIO</SelectItem>
                <SelectItem value="ITAM X CASA">ITAM X CASA</SelectItem>
                <SelectItem value="CASA X ITAM">CASA X ITAM</SelectItem>
                <SelectItem value="CASA X AEGEA RNA">
                  CASA X AEGEA RNA
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <div
            className={`flex items-center justify-center w-5 h-5 rounded border ${comAssinatura ? "bg-slate-800 border-slate-800 text-white" : "border-slate-300 bg-slate-50"}`}
          >
            {comAssinatura && <CheckSquare size={14} className="text-white" />}
          </div>
          <span className="text-sm font-medium text-slate-600">
            Incluir assinatura do responsável no PDF gerado
          </span>
          <input
            type="checkbox"
            className="hidden"
            checked={comAssinatura}
            onChange={(e) => onComAssinaturaChange(e.target.checked)}
          />
        </label>
      </div>

      <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <label className="block text-sm font-bold text-slate-700 mb-1">
          Motivo (Aplicado a todos os selecionados)
        </label>
        <Input
          type="text"
          className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4 uppercase"
          value={motivo}
          onChange={(e) => onMotivoChange(e.target.value.toLocaleUpperCase())}
          placeholder="Ex: Consulta médica / Serviço Externo"
        />
      </div>

      <Button
        onClick={onAddRegistro}
        className={`w-full h-14 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 ${tipoFormulario === "saida" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
      >
        <Plus size={20} /> Adicionar à Lista de Impressão
      </Button>
    </>
  );
};
