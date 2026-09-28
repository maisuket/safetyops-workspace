import { useState, useMemo } from "react";
import { Timer, FileText, Download, Loader2 } from "lucide-react";
import { useEmployees } from "../../context/EmployeesContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DadosServicoHoraExtra } from "../SaidasPage/types";
import { getISODate, loadAssets } from "../SaidasPage/utils";
import { gerarPDFHoraExtra } from "../SaidasPage/pdf/gerarPDFHoraExtra";
import { gerarExcelHoraExtra } from "../SaidasPage/pdf/gerarExcelHoraExtra";
import { ColaboradoresChecklist } from "../SaidasPage/components/ColaboradoresChecklist";
import { HoraExtraFields } from "../SaidasPage/components/HoraExtraFields";
import { HoraExtraService } from "../../services/hora-extra.service";

/**
 * ============================================================================
 * 📂 src/pages/HoraExtraPage/HoraExtraPage.tsx
 * ============================================================================
 * Página dedicada só à geração da folha de Relação Hora Extra/Compensação —
 * mesma lógica já usada na aba "Hora Extra" de Gestão de Saídas, mas com
 * acesso direto pelo menu lateral (sem precisar entrar em Saídas e trocar de
 * aba). Reaproveita os mesmos componentes/geradores de PDF/Excel.
 */
export const HoraExtraPage = () => {
  const { employees: allEmployees, isLoadingEmployees } = useEmployees();
  const employees = useMemo(
    () => allEmployees.filter((e: any) => e.active !== false),
    [allEmployees],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<
    string[]
  >([]);

  const [heDataServico, setHeDataServico] = useState(getISODate());
  const [heLocal, setHeLocal] = useState("");
  const [heDescricaoServico, setHeDescricaoServico] = useState("");
  const [heEnderecoServico, setHeEnderecoServico] = useState("");
  const [heNumeroOS, setHeNumeroOS] = useState("");
  const [heObservacao, setHeObservacao] = useState("");

  const handleColaboradorChange = (id: string) => {
    setColaboradoresSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      return [...prev, id];
    });
  };

  const persistHoraExtra = async (empsSelecionados: any[], dados: DadosServicoHoraExtra) => {
    await HoraExtraService.createBulk({
      dataServico: dados.dataServico,
      local: dados.local,
      descricaoServico: dados.descricaoServico || undefined,
      enderecoServico: dados.enderecoServico || undefined,
      numeroOS: dados.numeroOS || undefined,
      observacao: dados.observacao || undefined,
      employeeIds: empsSelecionados.map((e) => e.id),
    });
  };

  const validarHoraExtra = () => {
    if (colaboradoresSelecionados.length === 0) {
      toast.error("Erro: Selecione pelo menos um colaborador.");
      return false;
    }
    if (!heLocal.trim()) {
      toast.error("Erro: Preencha o local do serviço.");
      return false;
    }
    return true;
  };

  const handleGerarHoraExtraPDF = async () => {
    if (!validarHoraExtra()) return;
    const empsSelecionados = colaboradoresSelecionados
      .map((id) => employees.find((e) => e.id === id))
      .filter(Boolean);
    const dados: DadosServicoHoraExtra = {
      dataServico: heDataServico,
      local: heLocal,
      descricaoServico: heDescricaoServico,
      enderecoServico: heEnderecoServico,
      numeroOS: heNumeroOS,
      observacao: heObservacao,
    };

    try {
      setIsLoading(true);
      const [{ default: jsPDF }, { default: autoTable }, assets] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        loadAssets(false),
      ]);
      await gerarPDFHoraExtra(jsPDF, autoTable, empsSelecionados, dados, assets.logoBase64);
      await persistHoraExtra(empsSelecionados, dados);
      toast.success("Folha de Hora Extra gerada com sucesso!");
      setColaboradoresSelecionados([]);
    } catch (error) {
      console.error("Erro ao gerar folha de hora extra:", error);
      toast.error("Erro ao gerar a folha de Hora Extra.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGerarHoraExtraExcel = async () => {
    if (!validarHoraExtra()) return;
    const empsSelecionados = colaboradoresSelecionados
      .map((id) => employees.find((e) => e.id === id))
      .filter(Boolean);
    const dados: DadosServicoHoraExtra = {
      dataServico: heDataServico,
      local: heLocal,
      descricaoServico: heDescricaoServico,
      enderecoServico: heEnderecoServico,
      numeroOS: heNumeroOS,
      observacao: heObservacao,
    };

    try {
      setIsLoading(true);
      const ExcelJS = await import("exceljs");
      await gerarExcelHoraExtra(ExcelJS, empsSelecionados, dados);
      await persistHoraExtra(empsSelecionados, dados);
      toast.success("Folha de Hora Extra (Excel) gerada com sucesso!");
      setColaboradoresSelecionados([]);
    } catch (error) {
      console.error("Erro ao gerar folha de hora extra:", error);
      toast.error("Erro ao gerar a folha de Hora Extra.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto relative h-full flex flex-col">
      {(isLoadingEmployees || isLoading) && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-emerald-500 animate-spin" />
            <p className="text-slate-600 font-medium animate-pulse">
              A processar...
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100 hidden sm:flex">
            <Timer size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Hora Extra
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Geração da folha de Relação Hora Extra/Compensação
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl shadow-sm border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Timer size={22} className="text-slate-400" />
              1. Dados do Serviço
            </h3>

            <ColaboradoresChecklist
              employees={employees}
              selecionados={colaboradoresSelecionados}
              onToggle={handleColaboradorChange}
            />

            <HoraExtraFields
              heDataServico={heDataServico}
              onHeDataServicoChange={setHeDataServico}
              heNumeroOS={heNumeroOS}
              onHeNumeroOSChange={setHeNumeroOS}
              heLocal={heLocal}
              onHeLocalChange={setHeLocal}
              heDescricaoServico={heDescricaoServico}
              onHeDescricaoServicoChange={setHeDescricaoServico}
              heEnderecoServico={heEnderecoServico}
              onHeEnderecoServicoChange={setHeEnderecoServico}
              heObservacao={heObservacao}
              onHeObservacaoChange={setHeObservacao}
            />
          </Card>
        </div>

        {/* COLUNA DIREITA: AÇÕES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

            <h3 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10">
              <Download size={20} className="text-emerald-400" />
              2. Gerar Documentos
            </h3>
            <p className="text-slate-400 font-medium text-sm mb-8 relative z-10">
              {`Gere a folha de Relação Hora Extra/Compensação com os ${colaboradoresSelecionados.length} colaborador(es) selecionado(s).`}
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <Button
                onClick={handleGerarHoraExtraPDF}
                disabled={colaboradoresSelecionados.length === 0 || !heLocal.trim()}
                className="w-full h-14 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <FileText size={20} /> Gerar PDF
              </Button>
              <Button
                onClick={handleGerarHoraExtraExcel}
                disabled={colaboradoresSelecionados.length === 0 || !heLocal.trim()}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <Download size={20} /> Gerar Excel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
