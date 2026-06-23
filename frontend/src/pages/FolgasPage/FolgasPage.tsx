import React, { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Loader2, Calendar, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmployeesService } from "../../services/employees.service";
import { RecordsService } from "../../services/records.service";
import { INITIAL_EMPLOYEES } from "../../services/data-initial";
import { EmployeeDetails } from "./components/EmployeeDetails";
import { Dashboard } from "./components/Dashboard";
import { HistoryComponent } from "./components/History";
import { LaunchModal } from "./modal/LaunchModal";
import { ReportModal } from "./modal/ReportsModal";
import { Button } from "@/components/ui/button";
import { PageTabs } from "@/components/ui/page-tabs";
import { toast } from "sonner";

/**
 * ============================================================================
 * 📂 src/pages/Folgas/FolgasPage.tsx
 * ============================================================================
 */

export interface Employee {
  id: string;
  name: string;
  enrollment?: string;
  active?: boolean;
}

export type RecordTypeUI =
  | "trabalho"
  | "folga"
  | "falta"
  | "servico_externo"
  | "ajuste_horario";

export interface FolgaRecord {
  id: string;
  employeeId: string;
  type: RecordTypeUI;
  date: string;
  local?: string;
  description?: string;
  refDate?: string;
  justification?: string;
}

export interface EmployeeStat extends Employee {
  earned: number;
  taken: number;
  absences: number;
  externalService: number;
  scheduleAdjustments: number;
  balance: number;
}

// Helper para obter a data local no formato YYYY-MM-DD com segurança
// (evita a falha de fuso horário causada pelo .toISOString() à noite)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const FolgasPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<FolgaRecord[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedEmployeesRecords, setSelectedEmployeesRecords] = useState<
    FolgaRecord[]
  >([]);

  // Ref para prevenir inserções duplicadas apenas durante a sementeira (seeding) inicial da BD
  const isSeeding = useRef<boolean>(false);

  const [newRecord, setNewRecord] = useState({
    employeeIds: [] as string[],
    type: "trabalho" as RecordTypeUI,
    date: getLocalDateString(),
    local: "",
    description: "",
    refDate: "",
    justification: "",
  });

  const [reportPeriod, setReportPeriod] = useState({
    start: getLocalDateString(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    end: getLocalDateString(),
  });

  // Recebemos uma função opcional isMounted para verificar se o estado ainda deve ser atualizado
  const loadApiData = async (isMounted?: () => boolean) => {
    try {
      setIsLoading(true);
      // Busca os stats e os colaboradores em paralelo
      let [statsData, empsResponse] = await Promise.all([
        EmployeesService.getStats(),
        EmployeesService.findAll(1, 1000),
      ]);

      let empsData = empsResponse.data;

      // Seeding inicial (lógica mantida)
      if (
        empsData.length === 0 &&
        INITIAL_EMPLOYEES?.length > 0 &&
        !isSeeding.current
      ) {
        isSeeding.current = true;
        console.log("A semear base de dados com técnicos iniciais...");
        for (let i = 0; i < INITIAL_EMPLOYEES.length; i++) {
          await EmployeesService.create(INITIAL_EMPLOYEES[i] as any);
        }
        const [newStats, newEmps] = await Promise.all([
          EmployeesService.getStats(),
          EmployeesService.findAll(1, 1000),
        ]);
        statsData = newStats;
        empsData = newEmps.data;
        isSeeding.current = false;
      }

      // Busca os registos paginados
      const { data: recsData, total } =
        await RecordsService.findAll(currentPage);

      // Se a página mudou ou o componente desmontou antes do fim da requisição, descarta os dados
      if (isMounted && !isMounted()) return;

      setEmployees(empsData);
      setEmployeeStats(statsData);
      setRecords(recsData);
      setTotalRecords(total);
      setTotalPages(Math.ceil(total / 20)); // Assumindo limit de 20
    } catch (error) {
      console.error("Erro ao conectar com a API NestJS:", error);
      toast.error("Falha na conexão com o servidor. Verifique se o backend está ativo.");
      setEmployeeStats([]);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadApiData(() => mounted);
    return () => {
      mounted = false;
    };
  }, [currentPage]); // Recarrega os dados quando a página muda

  // Busca o histórico detalhado dos colaboradores sempre que são selecionados no Modal
  useEffect(() => {
    let isMounted = true;

    const fetchSelectedRecords = async () => {
      if (newRecord.employeeIds.length === 0) {
        setSelectedEmployeesRecords([]);
        return;
      }
      try {
        const promises = newRecord.employeeIds.map((id) =>
          RecordsService.findByEmployee(id),
        );
        const results = await Promise.all(promises);
        if (isMounted) {
          // @ts-ignore
          setSelectedEmployeesRecords(results.flat());
        }
      } catch (error) {
        console.error("Erro ao buscar histórico pendente:", error);
      }
    };
    fetchSelectedRecords();

    return () => {
      isMounted = false;
    };
  }, [newRecord.employeeIds]);

  // =========================================================================================
  // LÓGICA INTELIGENTE DE CÁLCULO DE TRABALHOS PENDENTES (Não requer alterações na DB!)
  // =========================================================================================
  const pastWorksOptions = useMemo(() => {
    const selectedIds = newRecord.employeeIds;
    if (selectedIds.length === 0) return [];

    const selectedIdsSet = new Set(selectedIds);

    // 1. Agrupar referências de folgas por colaborador (O(N)) para evitar iterações repetidas
    const folgasByEmployee = new Map<string, string[]>();
    const relevantRecords = selectedEmployeesRecords.filter((r) =>
      selectedIdsSet.has(r.employeeId),
    );

    relevantRecords.forEach((r) => {
      if (r.type === "folga" && r.refDate) {
        if (!folgasByEmployee.has(r.employeeId))
          folgasByEmployee.set(r.employeeId, []);
        folgasByEmployee.get(r.employeeId)!.push(r.refDate);
      }
    });

    const uniqueWorks = new Map();

    relevantRecords.forEach((w) => {
      if (w.type !== "trabalho") return;

      // 2. Extração manual de datas UTC (muito mais rápido que toLocaleDateString no loop)
      const d = new Date(w.date);
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      const dateString = `${day}/${month}/${year}`;

      const refString = `${w.local || "Sem local"} - Folga remunerada referente ao dia ${dateString}`;

      // 3. 🚨 CORREÇÃO DE BUG: Buscar apenas nas folgas DESTE colaborador,
      // não nas de todos os selecionados simultaneamente.
      const employeeFolgasRefs = folgasByEmployee.get(w.employeeId) || [];
      const isUsedByThisEmployee = employeeFolgasRefs.some(
        (ref) => ref === refString || ref.includes(dateString),
      );

      if (!isUsedByThisEmployee) {
        if (!uniqueWorks.has(refString)) {
          uniqueWorks.set(refString, {
            date: w.date,
            local: w.local,
            description: w.description,
            refString,
            availableFor: new Set([w.employeeId]), // Usar Set para lookup em O(1) e prevenir duplicados
          });
        } else {
          uniqueWorks.get(refString).availableFor.add(w.employeeId);
        }
      }
    });

    // Filtra para garantir que a opção só aparece se TODOS os selecionados tiverem esse dia pendente
    const validOptions = Array.from(uniqueWorks.values()).filter(
      (opt) => opt.availableFor.size === selectedIds.length,
    );

    return validOptions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [selectedEmployeesRecords, newRecord.employeeIds]);

  const totalBalance = employeeStats.reduce(
    (acc, curr) => acc + curr.balance,
    0,
  );

  const totalCredits = employeeStats.reduce(
    (acc, curr) => acc + curr.earned,
    0,
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [employees, searchTerm]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecord.employeeIds.length === 0) {
      toast.error("Por favor, selecione pelo menos um colaborador.");
      return;
    }
    if (!newRecord.date) return;

    try {
      setIsLoading(true);
      await RecordsService.createBulk({
        employeeIds: newRecord.employeeIds,
        type: newRecord.type,
        date: newRecord.date,
        local: newRecord.type === "trabalho" ? newRecord.local : undefined,
        description:
          newRecord.type === "trabalho" || newRecord.type === "ajuste_horario"
            ? newRecord.description
            : undefined,
        refDate: newRecord.type === "folga" ? newRecord.refDate : undefined,
        justification:
          newRecord.type !== "trabalho"
            ? newRecord.justification || undefined
            : undefined,
      });
      await loadApiData();
      closeModal();
      toast.success("Lançamentos efetuados com sucesso!");
    } catch (error) {
      // O fallback local para adição é complexo com paginação,
      // idealmente, mostrar um erro ao utilizador.
      toast.error("Falha ao adicionar registo. Verifique a sua ligação.");
      closeModal();
      setIsLoading(false);
    }
  };

  const deleteRecord = (id: string) => {
    setDeleteRecordId(id);
  };

  const confirmDeleteRecord = async () => {
    if (!deleteRecordId) return;
    try {
      await RecordsService.remove(deleteRecordId);
      await loadApiData();
      toast.success("Lançamento excluído com sucesso.");
    } catch {
      toast.error("Falha ao excluir. Verifique a conexão.");
    } finally {
      setDeleteRecordId(null);
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setNewRecord((prev) => {
      const isSelected = prev.employeeIds.includes(empId);
      if (isSelected)
        return {
          ...prev,
          employeeIds: prev.employeeIds.filter((id) => id !== empId),
        };
      else return { ...prev, employeeIds: [...prev.employeeIds, empId] };
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewRecord({
      employeeIds: [],
      type: "trabalho",
      date: getLocalDateString(),
      local: "",
      description: "",
      refDate: "",
      justification: "",
    });
    setSearchTerm("");
  };

  const exportToExcel = () => {
    const data = employeeStats.map((emp) => ({
      Matrícula: emp.enrollment || "N/A",
      Nome: emp.name,
      "Domingos Trabalhados": emp.earned,
      Folgas: emp.taken,
      Faltas: emp.absences,
      "Serviço Externo": emp.externalService,
      "Ajuste de Horário": emp.scheduleAdjustments,
      "Saldo Atual": emp.balance,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Controle de Folgas");
    XLSX.writeFile(wb, `ITAM_Controle_Folgas_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("ITAM - Assistência Técnica - Controle de Folgas", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
    autoTable(doc, {
      head: [["Matrícula", "Colaborador", "Trabalhados", "Folgas", "Faltas", "Externo", "Ajuste", "Saldo"]],
      body: employeeStats.map((emp) => [emp.enrollment || "N/A", emp.name, emp.earned, emp.taken, emp.absences, emp.externalService, emp.scheduleAdjustments, emp.balance]),
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      rowPageBreak: "avoid",
    });
    doc.save(`ITAM_Relatorio_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`);
  };

  // Tipos com saldo neutro (não geram crédito) que entram no relatório de período:
  // folga e falta afetam o banco de horas, serviço externo e ajuste de horário são só informativos.
  const PERIOD_REPORT_TYPES = ["folga", "falta", "servico_externo", "ajuste_horario"];

  const tipoLabel = (type: string) =>
    type === "falta"
      ? "Falta"
      : type === "servico_externo"
        ? "Serviço Externo"
        : type === "ajuste_horario"
          ? "Ajuste de Horário"
          : "Folga";

  const referenciaLabel = (f: FolgaRecord) => {
    if (f.type === "falta" || f.type === "servico_externo") {
      return f.justification
        ? `Justificativa: ${f.justification}`
        : "Sem justificativa";
    }
    return (
      [
        f.type === "ajuste_horario" ? f.description : f.refDate ? `Ref: ${f.refDate}` : null,
        f.justification ? `Justificativa: ${f.justification}` : null,
      ]
        .filter(Boolean)
        .join(" | ") || "Não informado"
    );
  };

  const fetchPeriodReportRecords = async () => {
    const periodRecords = await RecordsService.findByPeriod(
      reportPeriod.start,
      reportPeriod.end,
    );
    return periodRecords.filter((r) => PERIOD_REPORT_TYPES.includes(r.type));
  };

  const generateFolgasReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = new jsPDF();

    const startDateStr = new Date(reportPeriod.start).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const endDateStr = new Date(reportPeriod.end).toLocaleDateString("pt-BR", { timeZone: "UTC" });

    doc.text("ITAM - Assistência Técnica - Relatório de Lançamentos", 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${startDateStr} a ${endDateStr}`, 14, 22);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 27);

    try {
      const filteredRecords = await fetchPeriodReportRecords();

      if (filteredRecords.length === 0) {
        toast.info("Nenhum lançamento encontrado para o período selecionado.");
        return;
      }

      autoTable(doc, {
        head: [["Matrícula", "Colaborador", "Tipo", "Data", "Referência / Justificativa"]],
        body: filteredRecords.map((f) => {
          const emp = employees.find((e) => e.id === f.employeeId);
          return [
            emp?.enrollment || "N/A",
            emp?.name || "Desconhecido",
            tipoLabel(f.type),
            new Date(f.date).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
            referenciaLabel(f),
          ];
        }),
        startY: 35,
        theme: "grid",
        headStyles: { fillColor: [245, 158, 11] },
        rowPageBreak: "avoid",
        didParseCell: (data) => {
          if (data.section !== "body" || data.column.index !== 2) return;
          const colors: Record<string, [number, number, number]> = {
            Falta: [220, 38, 38],
            "Serviço Externo": [2, 132, 199],
            "Ajuste de Horário": [124, 58, 237],
          };
          const color = colors[data.cell.raw as string];
          if (color) data.cell.styles.textColor = color;
        },
      });

      doc.save(`ITAM_Lancamentos_${startDateStr.replace(/\//g, "-")}_ate_${endDateStr.replace(/\//g, "-")}.pdf`);
      setIsReportModalOpen(false);
    } catch (error) {
      console.error("Erro ao gerar relatório de lançamentos:", error);
      toast.error("Ocorreu um erro ao buscar os dados da API para o relatório.");
    }
  };

  const generateFolgasReportExcel = async () => {
    const startDateStr = new Date(reportPeriod.start)
      .toLocaleDateString("pt-BR", { timeZone: "UTC" })
      .replace(/\//g, "-");
    const endDateStr = new Date(reportPeriod.end)
      .toLocaleDateString("pt-BR", { timeZone: "UTC" })
      .replace(/\//g, "-");

    try {
      const filteredRecords = await fetchPeriodReportRecords();

      if (filteredRecords.length === 0) {
        toast.info("Nenhum lançamento encontrado para o período selecionado.");
        return;
      }

      const data = filteredRecords.map((f) => {
        const emp = employees.find((e) => e.id === f.employeeId);
        return {
          Matrícula: emp?.enrollment || "N/A",
          Colaborador: emp?.name || "Desconhecido",
          Tipo: tipoLabel(f.type),
          Data: new Date(f.date).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
          "Referência / Justificativa": referenciaLabel(f),
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
      XLSX.writeFile(wb, `ITAM_Lancamentos_${startDateStr}_ate_${endDateStr}.xlsx`);
      setIsReportModalOpen(false);
    } catch (error) {
      console.error("Erro ao gerar relatório de lançamentos:", error);
      toast.error("Ocorreu um erro ao buscar os dados da API para o relatório.");
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto relative h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-emerald-500 animate-spin" />
            <p className="text-slate-600 font-medium animate-pulse">
              A sincronizar...
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100 hidden sm:flex">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800">
              Controle de Folgas
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Gestão de saldos e compensação da equipe
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto h-12 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl shadow-slate-200 bg-slate-900 text-white hover:bg-slate-800"
        >
          <Plus size={20} /> Lançamento em Lote
        </Button>
      </header>

      {!selectedEmployeeId && (
        <div className="mb-6">
          <PageTabs
            tabs={[
              { key: "dashboard", label: "Resumo" },
              { key: "history", label: "Histórico" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            accentColor="slate"
          />
        </div>
      )}

      <div className="flex-1">
        {selectedEmployeeId ? (
          <EmployeeDetails
            selectedEmployeeId={selectedEmployeeId}
            employeeStats={employeeStats}
            setSelectedEmployeeId={setSelectedEmployeeId}
            deleteRecord={deleteRecord}
          />
        ) : activeTab === "dashboard" ? (
          <Dashboard
            employeesLength={employeeStats.length}
            totalCredits={totalCredits}
            totalBalance={totalBalance}
            employeeStats={employeeStats}
            isLoading={isLoading}
            setSelectedEmployeeId={setSelectedEmployeeId}
            setIsReportModalOpen={setIsReportModalOpen}
            exportToExcel={exportToExcel}
            exportToPDF={exportToPDF}
          />
        ) : (
          <HistoryComponent
            records={records}
            employees={employees}
            isLoading={isLoading}
            deleteRecord={deleteRecord}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO DE LANÇAMENTO */}
      <Dialog open={!!deleteRecordId} onOpenChange={(open) => { if (!open) setDeleteRecordId(null); }}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-white border-none rounded-3xl gap-0">
          <DialogHeader className="p-6 bg-rose-600 text-white m-0">
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <Trash2 size={20} /> Excluir Lançamento
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">Excluir este lançamento permanentemente? O saldo do colaborador será recalculado.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteRecordId(null)} className="flex-1 rounded-2xl font-bold">
                Cancelar
              </Button>
              <Button onClick={confirmDeleteRecord} className="flex-1 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white">
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isModalOpen && (
        <LaunchModal
          closeModal={closeModal}
          handleAddRecord={handleAddRecord}
          newRecord={newRecord}
          setNewRecord={setNewRecord}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredEmployees={filteredEmployees}
          toggleEmployeeSelection={toggleEmployeeSelection}
          pastWorksOptions={pastWorksOptions}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          setIsReportModalOpen={setIsReportModalOpen}
          generateFolgasReport={generateFolgasReport}
          generateFolgasReportExcel={generateFolgasReportExcel}
          reportPeriod={reportPeriod}
          setReportPeriod={setReportPeriod}
        />
      )}
    </div>
  );
};
