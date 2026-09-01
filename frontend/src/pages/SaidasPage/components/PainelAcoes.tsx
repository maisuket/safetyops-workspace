import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TipoFormulario } from "../types";

interface PainelAcoesProps {
  tipoFormulario: TipoFormulario;
  colaboradoresCount: number;
  ssUberCount: number;
  registrosFiltradosCount: number;
  heLocal: string;
  ssLocal: string;
  ssDescricao: string;
  onGerarHoraExtraPDF: () => void;
  onGerarHoraExtraExcel: () => void;
  onGerarPDF: () => void;
  onGerarExcel: () => void;
  onGerarServicoSemanal: () => void;
}

export const PainelAcoes = ({
  tipoFormulario,
  colaboradoresCount,
  ssUberCount,
  registrosFiltradosCount,
  heLocal,
  ssLocal,
  ssDescricao,
  onGerarHoraExtraPDF,
  onGerarHoraExtraExcel,
  onGerarPDF,
  onGerarExcel,
  onGerarServicoSemanal,
}: PainelAcoesProps) => {
  return (
    <div className="bg-slate-900 text-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-center">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

      <h3 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10">
        <Download size={20} className="text-emerald-400" />
        3. Gerar Documentos
      </h3>
      <p className="text-slate-400 font-medium text-sm mb-8 relative z-10">
        {tipoFormulario === "hora_extra" ? (
          `Gere a folha de Relação Hora Extra/Compensação com os ${colaboradoresCount} colaborador(es) selecionado(s).`
        ) : tipoFormulario === "servico_semanal" ? (
          `Gere Saída, Hora Extra (para os ${colaboradoresCount} colaborador(es) selecionado(s)) e Uber (para os ${ssUberCount} marcados) num único PDF cada.`
        ) : (
          <>Gere os ficheiros finalizados em PDF ou Excel com base na lista de{" "}
              {tipoFormulario === "saida" ? "Saída" : "Uber"} configurada
              abaixo.</>
        )}
      </p>

      <div className="flex flex-col gap-3 relative z-10">
        {tipoFormulario === "servico_semanal" ? (
          <Button
            onClick={onGerarServicoSemanal}
            disabled={colaboradoresCount === 0 || !ssLocal.trim() || !ssDescricao.trim()}
            className="w-full h-14 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <FileText size={20} /> Gerar Tudo (Saída + Uber + Hora Extra)
          </Button>
        ) : (
          <>
            <Button
              onClick={tipoFormulario === "hora_extra" ? onGerarHoraExtraPDF : onGerarPDF}
              disabled={
                tipoFormulario === "hora_extra"
                  ? colaboradoresCount === 0 || !heLocal.trim()
                  : registrosFiltradosCount === 0
              }
              className="w-full h-14 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <FileText size={20} /> {tipoFormulario === "hora_extra" ? "Gerar PDF" : "Baixar PDF Prontos"}
            </Button>
            <Button
              onClick={tipoFormulario === "hora_extra" ? onGerarHoraExtraExcel : onGerarExcel}
              disabled={
                tipoFormulario === "hora_extra"
                  ? colaboradoresCount === 0 || !heLocal.trim()
                  : registrosFiltradosCount === 0
              }
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <Download size={20} /> {tipoFormulario === "hora_extra" ? "Gerar Excel" : "Exportar Planilha Excel"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
