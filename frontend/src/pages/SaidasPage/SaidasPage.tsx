import { useState, useEffect, useMemo } from "react";
import { FileText, Trash2, Car, Loader2 } from "lucide-react";
import { useEmployees } from "../../context/EmployeesContext";
import { SaidasService } from "../../services/saidas.service";
import { HoraExtraService } from "../../services/hora-extra.service";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { TipoFormulario, DadosServicoHoraExtra } from "./types";
import { SAIDAS_FILA_STORAGE_KEY, getISODate, loadAssets, formatarData } from "./utils";
import { gerarPDFSaida } from "./pdf/gerarPDFSaida";
import { gerarPDFUber } from "./pdf/gerarPDFUber";
import { gerarPDFHoraExtra } from "./pdf/gerarPDFHoraExtra";
import { gerarExcelHoraExtra } from "./pdf/gerarExcelHoraExtra";
import { TipoSelector } from "./components/TipoSelector";
import { ColaboradoresChecklist } from "./components/ColaboradoresChecklist";
import { SaidaUberFields } from "./components/SaidaUberFields";
import { HoraExtraFields } from "./components/HoraExtraFields";
import { ServicoSemanalFields } from "./components/ServicoSemanalFields";
import { PainelAcoes } from "./components/PainelAcoes";
import { FilaImpressaoCard } from "./components/FilaImpressaoCard";

/**
 * ============================================================================
 * 📂 src/pages/Saidas/SaidasPage.tsx
 * ============================================================================
 */

export const SaidasPage = () => {
  // === ESTADOS ===
  const { employees: allEmployees, isLoadingEmployees } = useEmployees();
  const employees = useMemo(
    () => allEmployees.filter((e: any) => e.active !== false),
    [allEmployees],
  );
  const [isLoading, setIsLoading] = useState(false);

  const [tipoFormulario, setTipoFormulario] = useState<TipoFormulario>("saida");
  // A fila de impressão é restaurada do localStorage: antes disso, trocar de
  // aba (ou recarregar a página) descartava silenciosamente tudo que ainda
  // não tinha sido gerado em PDF/Excel.
  const [registros, setRegistros] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(SAIDAS_FILA_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<
    string[]
  >([]);

  // Campos de formulário
  const [motivo, setMotivo] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(getISODate());
  const [dataEmBranco, setDataEmBranco] = useState(false);

  // Campos específicos
  const [tipoData, setTipoData] = useState("saida");
  const [destino, setDestino] = useState("");
  const [comAssinatura, setComAssinatura] = useState(true);

  // Campos da folha de Relação Hora Extra/Compensação — ao contrário de
  // Saída/Uber, não existe fila: os dados são preenchidos uma vez e a folha
  // é gerada na hora com os colaboradores selecionados no checklist acima.
  const [heDataServico, setHeDataServico] = useState(getISODate());
  const [heLocal, setHeLocal] = useState("");
  const [heDescricaoServico, setHeDescricaoServico] = useState("");
  const [heEnderecoServico, setHeEnderecoServico] = useState("");
  const [heNumeroOS, setHeNumeroOS] = useState("");
  const [heObservacao, setHeObservacao] = useState("");

  // Campos da aba "Serviço Semanal" — gera Saída, Uber e Hora Extra de uma vez
  // só para a equipe escalada num serviço (fluxo semanal de sexta-feira).
  const [ssData, setSsData] = useState(getISODate());
  const [ssLocal, setSsLocal] = useState("");
  const [ssDescricao, setSsDescricao] = useState("");
  const [ssUberSelecionados, setSsUberSelecionados] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(SAIDAS_FILA_STORAGE_KEY, JSON.stringify(registros));
    } catch {
      // Armazenamento indisponível (ex: modo privado) — a fila continua
      // funcionando normalmente em memória, só não sobrevive a um reload.
    }
  }, [registros]);

  // === LÓGICA DE DADOS ===
  const handleColaboradorChange = (id: string) => {
    setColaboradoresSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      return [...prev, id];
    });
    // Se a pessoa for removida do checklist, também sai da marcação de Uber
    // da aba Serviço Semanal — evita gerar Uber para alguém que não está
    // mais na equipe escalada.
    setSsUberSelecionados((prev) => prev.filter((m) => m !== id));
  };

  const handleSsUberChange = (id: string) => {
    setSsUberSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      return [...prev, id];
    });
  };

  const handleAddRegistro = () => {
    if (colaboradoresSelecionados.length === 0 || !motivo.trim()) {
      toast.error(
        "Erro: Selecione pelo menos um colaborador e preencha o motivo.",
      );
      return;
    }

    if (tipoFormulario === "uber" && !destino.trim()) {
      toast.error("Erro: Preencha o destino para a solicitação de Uber.");
      return;
    }

    const novosRegistros = colaboradoresSelecionados.map((id) => {
      const emp = employees.find((c) => c.id === id);

      const registroBase: any = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        employeeId: emp.id,
        nome: emp.name,
        enrollment: emp.enrollment || "N/A",
        motivo,
        dataHora: dataEmBranco ? "" : dataSelecionada,
        tipoFormulario: tipoFormulario,
      };

      if (tipoFormulario === "saida") {
        registroBase.tipoData = tipoData;
      } else if (tipoFormulario === "uber") {
        registroBase.destino = destino;
      }

      return registroBase;
    });

    setRegistros([...registros, ...novosRegistros]);

    // Limpa campos comuns
    setMotivo("");
    setDestino("");
    setColaboradoresSelecionados([]);
    toast.success(
      `${novosRegistros.length} colaborador(es) adicionado(s) à lista!`,
    );
  };

  const handleRemoverRegistro = (id: string) => {
    setRegistros(registros.filter((r) => r.id !== id));
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleLimparRegistros = () => {
    setShowClearConfirm(true);
  };

  const confirmLimparRegistros = () => {
    setRegistros([]);
    toast.success("Lista de registros limpa.");
    setShowClearConfirm(false);
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

  const validarServicoSemanal = () => {
    if (colaboradoresSelecionados.length === 0) {
      toast.error("Erro: Selecione pelo menos um colaborador.");
      return false;
    }
    if (!ssLocal.trim()) {
      toast.error("Erro: Preencha o local/destino do serviço.");
      return false;
    }
    if (!ssDescricao.trim()) {
      toast.error("Erro: Preencha a descrição do serviço.");
      return false;
    }
    return true;
  };

  // Gera, num único passo, os 3 documentos do fluxo semanal (Saída para
  // todos, Hora Extra para todos, Uber só para os marcados) reaproveitando os
  // mesmos geradores de PDF já usados pelas abas individuais — só em PDF
  // (sem Excel), já que o objetivo aqui é a emissão rápida da folha inteira.
  const handleGerarServicoSemanal = async () => {
    if (!validarServicoSemanal()) return;
    const empsSelecionados = colaboradoresSelecionados
      .map((id) => employees.find((e) => e.id === id))
      .filter(Boolean);

    const novoId = () =>
      Date.now().toString() + Math.random().toString(36).substr(2, 5);

    const registrosSaida = empsSelecionados.map((emp) => ({
      id: novoId(),
      employeeId: emp.id,
      nome: emp.name,
      enrollment: emp.enrollment || "N/A",
      motivo: ssDescricao,
      dataHora: ssData,
      tipoFormulario: "saida",
      tipoData: "saida",
    }));

    const registrosUber = empsSelecionados
      .filter((emp) => ssUberSelecionados.includes(emp.id))
      .map((emp) => ({
        id: novoId(),
        employeeId: emp.id,
        nome: emp.name,
        enrollment: emp.enrollment || "N/A",
        motivo: ssDescricao,
        dataHora: ssData,
        tipoFormulario: "uber",
        destino: ssLocal,
      }));

    const dadosHoraExtra: DadosServicoHoraExtra = {
      dataServico: ssData,
      local: ssLocal,
      descricaoServico: ssDescricao,
    };

    try {
      setIsLoading(true);
      const [{ default: jsPDF }, { default: autoTable }, assets] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        loadAssets(comAssinatura),
      ]);

      await gerarPDFSaida(jsPDF, registrosSaida, assets, ssData);
      if (registrosUber.length > 0) {
        await gerarPDFUber(jsPDF, registrosUber, assets);
      }
      await gerarPDFHoraExtra(
        jsPDF,
        autoTable,
        empsSelecionados,
        dadosHoraExtra,
        assets.logoBase64,
      );

      const itemsSaidaEUber = [...registrosSaida, ...registrosUber].map((r) => ({
        employeeId: r.employeeId,
        tipo: r.tipoFormulario,
        tipoData: r.tipoFormulario === "saida" ? r.tipoData : undefined,
        destino: r.tipoFormulario === "uber" ? r.destino : undefined,
        motivo: r.motivo,
        dataOcorrencia: r.dataHora || undefined,
      }));
      await SaidasService.createBulk(itemsSaidaEUber);
      await persistHoraExtra(empsSelecionados, dadosHoraExtra);

      toast.success("Saída, Uber e Hora Extra gerados com sucesso!");
      setColaboradoresSelecionados([]);
      setSsUberSelecionados([]);
    } catch (error) {
      console.error("Erro ao gerar documentos do serviço semanal:", error);
      toast.error("Erro ao gerar os documentos do serviço semanal.");
    } finally {
      setIsLoading(false);
    }
  };

  // Grava no backend, para fins de rastreio, os registros ainda não persistidos
  // deste lote. É chamado no momento em que o PDF/Excel é de facto gerado (a
  // emissão real), e não quando o item só é adicionado à lista de impressão.
  // O status "sincronizado" fica no próprio objeto do registro (persistido em
  // localStorage) em vez de um ref em memória, para não duplicar o lançamento
  // caso a página seja recarregada ou trocada antes de gerar de novo.
  const persistRegistros = async (regs: any[]) => {
    const novos = regs.filter((r) => !r._synced);
    if (novos.length === 0) return;

    try {
      const items = novos.map((r) => ({
        employeeId: r.employeeId,
        tipo: r.tipoFormulario,
        tipoData: r.tipoFormulario === "saida" ? r.tipoData : undefined,
        destino: r.tipoFormulario === "uber" ? r.destino : undefined,
        motivo: r.motivo,
        dataOcorrencia: r.dataHora || undefined,
      }));
      await SaidasService.createBulk(items);
      const novosIds = new Set(novos.map((r) => r.id));
      setRegistros((prev) =>
        prev.map((r) => (novosIds.has(r.id) ? { ...r, _synced: true } : r)),
      );
    } catch (error) {
      console.error("Erro ao gravar rastreio de saídas:", error);
      toast.error(
        "O arquivo foi gerado, mas não foi possível salvar o rastreio (verifique a conexão).",
      );
    }
  };

  const handleGerarPDF = async () => {
    const registrosParaGerar = registros.filter(
      (r) => r.tipoFormulario === tipoFormulario,
    );
    if (registrosParaGerar.length === 0) return;

    try {
      setIsLoading(true);
      const [{ default: jsPDF }, assets] = await Promise.all([
        import("jspdf"),
        loadAssets(comAssinatura),
      ]);
      if (tipoFormulario === "saida")
        await gerarPDFSaida(jsPDF, registrosParaGerar, assets, dataSelecionada);
      else await gerarPDFUber(jsPDF, registrosParaGerar, assets);
      toast.success("PDF gerado com sucesso!");
      await persistRegistros(registrosParaGerar);
    } catch (error) {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const gerarExcel = async () => {
    const registrosParaGerar = registros.filter(
      (r) => r.tipoFormulario === tipoFormulario,
    );
    if (registrosParaGerar.length === 0) return;

    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Dados");

      if (tipoFormulario === "saida") {
        worksheet.columns = [
          { header: "NOME", key: "nome", width: 40 },
          { header: "MATRICULA", key: "enrollment", width: 15 },
          { header: "TIPO", key: "tipo", width: 10 },
          { header: "DATA", key: "dataHora", width: 20 },
          { header: "MOTIVO", key: "motivo", width: 50 },
        ];
        registrosParaGerar.forEach((r) => {
          worksheet.addRow({
            ...r,
            tipo: r.tipoData.toUpperCase(),
            dataHora: formatarData(r.dataHora),
          });
        });
      } else {
        worksheet.columns = [
          { header: "NOME", key: "nome", width: 40 },
          { header: "MATRICULA", key: "enrollment", width: 15 },
          { header: "DATA SOLICITAÇÃO", key: "dataHora", width: 20 },
          { header: "MOTIVO", key: "motivo", width: 50 },
          { header: "DESTINO", key: "destino", width: 40 },
        ];
        registrosParaGerar.forEach((r) => {
          worksheet.addRow({ ...r, dataHora: formatarData(r.dataHora) });
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Relatorio_${tipoFormulario === "saida" ? "Saidas" : "Uber"}_${dataSelecionada}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Ficheiro Excel gerado com sucesso!");
      await persistRegistros(registrosParaGerar);
    } catch (error) {
      toast.error("Erro ao gerar Excel.");
    }
  };

  const registrosFiltrados = registros.filter(
    (r) => r.tipoFormulario === tipoFormulario,
  );

  // === RENDERIZAÇÃO DA UI ===
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
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100 hidden sm:flex">
            <Car size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Gestão de Saídas
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Controlo de autorizações e deslocações da equipa
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl shadow-sm border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={22} className="text-slate-400" />
              1. Tipo de Solicitação
            </h3>

            <TipoSelector tipoFormulario={tipoFormulario} onChange={setTipoFormulario} />

            <ColaboradoresChecklist
              employees={employees}
              selecionados={colaboradoresSelecionados}
              onToggle={handleColaboradorChange}
            />

            {tipoFormulario === "saida" || tipoFormulario === "uber" ? (
              <SaidaUberFields
                tipoFormulario={tipoFormulario}
                dataSelecionada={dataSelecionada}
                onDataSelecionadaChange={setDataSelecionada}
                dataEmBranco={dataEmBranco}
                onDataEmBrancoChange={setDataEmBranco}
                tipoData={tipoData}
                onTipoDataChange={setTipoData}
                destino={destino}
                onDestinoChange={setDestino}
                comAssinatura={comAssinatura}
                onComAssinaturaChange={setComAssinatura}
                motivo={motivo}
                onMotivoChange={setMotivo}
                onAddRegistro={handleAddRegistro}
              />
            ) : tipoFormulario === "hora_extra" ? (
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
            ) : (
              <ServicoSemanalFields
                ssData={ssData}
                onSsDataChange={setSsData}
                ssLocal={ssLocal}
                onSsLocalChange={setSsLocal}
                ssDescricao={ssDescricao}
                onSsDescricaoChange={setSsDescricao}
                colaboradoresSelecionados={colaboradoresSelecionados}
                employees={employees}
                ssUberSelecionados={ssUberSelecionados}
                onToggleUber={handleSsUberChange}
              />
            )}
          </Card>
        </div>

        {/* COLUNA DIREITA: LISTA E ACÇÕES */}
        <div className="lg:col-span-5 space-y-6">
          <PainelAcoes
            tipoFormulario={tipoFormulario}
            colaboradoresCount={colaboradoresSelecionados.length}
            ssUberCount={ssUberSelecionados.length}
            registrosFiltradosCount={registrosFiltrados.length}
            heLocal={heLocal}
            ssLocal={ssLocal}
            ssDescricao={ssDescricao}
            onGerarHoraExtraPDF={handleGerarHoraExtraPDF}
            onGerarHoraExtraExcel={handleGerarHoraExtraExcel}
            onGerarPDF={handleGerarPDF}
            onGerarExcel={gerarExcel}
            onGerarServicoSemanal={handleGerarServicoSemanal}
          />

          {/* Lista de Registros — não se aplica a Hora Extra nem a Serviço
              Semanal, que geram direto sem fila */}
          {tipoFormulario !== "hora_extra" && tipoFormulario !== "servico_semanal" && (
            <FilaImpressaoCard
              registros={registros}
              onRemover={handleRemoverRegistro}
              onLimpar={handleLimparRegistros}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={(open) => {
          if (!open) setShowClearConfirm(false);
        }}
        title="Limpar Lista de Impressão"
        icon={<Trash2 size={20} />}
        description="Tem a certeza que deseja limpar toda a lista? Os itens ainda não gerados em PDF/Excel serão perdidos."
        confirmLabel="Limpar"
        onConfirm={confirmLimparRegistros}
      />
    </div>
  );
};
