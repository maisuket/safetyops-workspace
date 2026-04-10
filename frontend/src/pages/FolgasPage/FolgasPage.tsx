import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Users,
  Calendar,
  FileText,
  Download,
  Trash2,
  TrendingUp,
  Clock,
  X,
  Search,
  CheckSquare,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { EmployeesService } from "../../services/employees.service";
import { RecordsService } from "../../services/records.service";
import { INITIAL_EMPLOYEES } from "../../services/data-initial";
import { EmployeeDetails } from "./components/EmployeeDetails";
import { Dashboard } from "./components/Dashboard";
import { HistoryComponent } from "./components/History";
import { LaunchModal } from "./modal/LaunchModal";
import { ReportModal } from "./modal/ReportsModal";

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

export interface FolgaRecord {
  id: string;
  employeeId: string;
  type: "trabalho" | "folga";
  date: string;
  local?: string;
  description?: string;
  refDate?: string;
}

export interface EmployeeStat extends Employee {
  earned: number;
  taken: number;
  balance: number;
}

export const FolgasPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<FolgaRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [libsLoaded, setLibsLoaded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const isFetchingOrSeeding = useRef<boolean>(false);

  const [newRecord, setNewRecord] = useState({
    employeeIds: [] as string[],
    type: "trabalho" as "trabalho" | "folga",
    date: new Date().toISOString().split("T")[0],
    local: "",
    description: "",
    refDate: "",
  });

  const [reportPeriod, setReportPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    };

    const initLibs = async () => {
      const xlsx = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      );
      const jspdf = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      );
      const autotable = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js",
      );
      if (xlsx && jspdf && autotable) setLibsLoaded(true);
    };

    initLibs();
  }, []);

  const loadApiData = async () => {
    if (isFetchingOrSeeding.current) return;
    isFetchingOrSeeding.current = true;

    try {
      setIsLoading(true);
      let [empsData, recsData] = await Promise.all([
        EmployeesService.findAll(),
        RecordsService.findAll(),
      ]);

      if (empsData.length === 0 && INITIAL_EMPLOYEES?.length > 0) {
        console.log("A semear base de dados com técnicos iniciais...");
        for (let i = 0; i < INITIAL_EMPLOYEES.length; i++) {
          await EmployeesService.create(INITIAL_EMPLOYEES[i]);
        }
        empsData = await EmployeesService.findAll();
      }

      setEmployees(empsData);
      setRecords(recsData);
    } catch (error) {
      console.error("Erro ao conectar com a API NestJS:", error);
      setEmployees(
        INITIAL_EMPLOYEES.map((name, i) => ({
          id: String(i + 1),
          enrollment: `ITAM${100 + i}`,
          name,
          active: true,
        })),
      );
      if (
        window.confirm(
          "Aviso: Falha na ligação ao servidor NestJS. Deseja usar o modo local (Dados não serão guardados no backend)?",
        )
      ) {
        const savedRecords = localStorage.getItem("itam_records_mock");
        if (savedRecords) setRecords(JSON.parse(savedRecords));
      }
    } finally {
      setIsLoading(false);
      isFetchingOrSeeding.current = false;
    }
  };

  useEffect(() => {
    loadApiData();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem("itam_records_mock", JSON.stringify(records));
    }
  }, [records]);

  // =========================================================================================
  // LÓGICA INTELIGENTE DE CÁLCULO DE TRABALHOS PENDENTES (Não requer alterações na DB!)
  // =========================================================================================
  const pastWorksOptions = useMemo(() => {
    if (newRecord.employeeIds.length === 0) return [];

    const works = records.filter(
      (r) =>
        r.type === "trabalho" && newRecord.employeeIds.includes(r.employeeId),
    );

    const folgas = records.filter(
      (r) => r.type === "folga" && newRecord.employeeIds.includes(r.employeeId),
    );

    const unique = new Map();

    works.forEach((w) => {
      const dateString = new Date(w.date).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
      const refString = `${w.local || "Sem local"} - Folga remunerada referente ao dia ${dateString}`;

      // COMPATIBILIDADE COM DADOS ANTIGOS: Verifica a string exata ou se inclui apenas a data
      const isUsedByThisEmployee = folgas.some((f) => {
        if (!f.refDate) return false;
        return f.refDate === refString || f.refDate.includes(dateString);
      });

      if (!isUsedByThisEmployee) {
        if (!unique.has(refString)) {
          unique.set(refString, {
            date: w.date,
            local: w.local,
            description: w.description,
            refString,
            availableFor: [w.employeeId], // Guarda quem tem este dia pendente
          });
        } else {
          unique.get(refString).availableFor.push(w.employeeId);
        }
      }
    });

    // Filtra para garantir que a opção só aparece se TODOS os selecionados tiverem esse dia pendente
    const validOptions = Array.from(unique.values()).filter((opt) =>
      newRecord.employeeIds.every((id) => opt.availableFor.includes(id)),
    );

    return validOptions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [records, newRecord.employeeIds]);

  const employeeStats = useMemo<EmployeeStat[]>(() => {
    return employees
      .map((emp) => {
        const empRecords = records.filter((r) => r.employeeId === emp.id);
        const earned = empRecords.filter((r) => r.type === "trabalho").length;
        const taken = empRecords.filter((r) => r.type === "folga").length;
        return { ...emp, earned, taken, balance: earned - taken };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [employees, records]);

  const totalBalance = employeeStats.reduce(
    (acc, curr) => acc + curr.balance,
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
      alert("Por favor, selecione pelo menos um colaborador.");
      return;
    }
    if (!newRecord.date) return;

    try {
      setIsLoading(true);
      await RecordsService.createBulk({
        employeeIds: newRecord.employeeIds,
        type: newRecord.type as "trabalho" | "folga",
        date: newRecord.date,
        local: newRecord.type === "trabalho" ? newRecord.local : undefined,
        description:
          newRecord.type === "trabalho" ? newRecord.description : undefined,
        refDate: newRecord.type === "folga" ? newRecord.refDate : undefined,
      });
      await loadApiData();
      closeModal();
    } catch (error) {
      console.warn("API indisponível, a usar fallback de memória.");
      const recordsToInsert = newRecord.employeeIds.map((empId) => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        employeeId: empId,
        type: newRecord.type,
        date: newRecord.date,
        local: newRecord.type === "trabalho" ? newRecord.local : undefined,
        description:
          newRecord.type === "trabalho" ? newRecord.description : undefined,
        refDate: newRecord.type === "folga" ? newRecord.refDate : undefined,
      }));
      setRecords([...records, ...recordsToInsert]);
      closeModal();
      setIsLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (
      window.confirm(
        "Excluir este lançamento permanentemente da base de dados?",
      )
    ) {
      try {
        await RecordsService.remove(id);
        setRecords(records.filter((r) => r.id !== id));
      } catch (error) {
        console.warn("API indisponível, a usar fallback de memória.");
        setRecords(records.filter((r) => r.id !== id));
      }
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
      date: new Date().toISOString().split("T")[0],
      local: "",
      description: "",
      refDate: "",
    });
    setSearchTerm("");
  };

  const exportToExcel = () => {
    // @ts-ignore
    if (!window.XLSX) return;
    const data = employeeStats.map((emp) => ({
      Matrícula: emp.enrollment || "N/A",
      Nome: emp.name,
      "Domingos Trabalhados": emp.earned,
      Folgas: emp.taken,
      "Saldo Atual": emp.balance,
    }));
    // @ts-ignore
    const ws = window.XLSX.utils.json_to_sheet(data);
    // @ts-ignore
    const wb = window.XLSX.utils.book_new();
    // @ts-ignore
    window.XLSX.utils.book_append_sheet(wb, ws, "Controlo de Folgas");
    // @ts-ignore
    window.XLSX.writeFile(
      wb,
      `ITAM_Controle_Folgas_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`,
    );
  };

  const exportToPDF = () => {
    // @ts-ignore
    if (!window.jspdf) return;
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("ITAM - Assistência Técnica - Controle de Folgas", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
    const tableColumn = [
      "Matrícula",
      "Colaborador",
      "Trabalhados",
      "Folgas",
      "Saldo",
    ];
    const tableRows = employeeStats.map((emp) => [
      emp.enrollment || "N/A",
      emp.name,
      emp.earned,
      emp.taken,
      emp.balance,
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.save(
      `ITAM_Relatorio_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
    );
  };

  const generateFolgasReport = (e: React.FormEvent) => {
    e.preventDefault();
    // @ts-ignore
    if (!window.jspdf) return;
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("ITAM - Assistência Técnica - Relatório de Folgas", 14, 15);
    doc.setFontSize(10);

    const startDateStr = new Date(reportPeriod.start).toLocaleDateString(
      "pt-BR",
      { timeZone: "UTC" },
    );
    const endDateStr = new Date(reportPeriod.end).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });

    doc.text(`Periodo: ${startDateStr} a ${endDateStr}`, 14, 22);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 27);

    const start = new Date(reportPeriod.start);
    const end = new Date(reportPeriod.end);

    // 🔥 Ajusta para pegar o dia inteiro
    end.setHours(23, 59, 59, 999);

    const filteredFolgas = records
      .filter((r) => {
        if (r.type !== "folga") return false;

        const recordDate = new Date(r.date);

        return recordDate >= start && recordDate <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filteredFolgas.length === 0) {
      alert("Nenhuma folga encontrada para o período selecionado.");
      return;
    }

    const tableColumn = [
      "Matrícula",
      "Colaborador",
      "Data da Folga",
      "Referente ao Serviço/Domingo",
    ];
    const tableRows = filteredFolgas.map((f) => {
      const emp = employees.find((e) => e.id === f.employeeId);
      return [
        emp ? emp.enrollment || "N/A" : "N/A",
        emp ? emp.name : "Desconhecido",
        new Date(f.date).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
        f.refDate || "Não informado",
      ];
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] },
    });

    const safeStart = startDateStr.replace(/\//g, "-");
    const safeEnd = endDateStr.replace(/\//g, "-");
    doc.save(`ITAM_Folgas_${safeStart}_ate_${safeEnd}.pdf`);
    setIsReportModalOpen(false);
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
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            Controlo de Folgas
          </h2>
          <p className="text-slate-500 font-medium">
            Gestão de compensação da equipa
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl shadow-slate-200"
        >
          <Plus size={20} /> Lançamento em Lote
        </button>
      </header>

      {!selectedEmployeeId && (
        <nav className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "dashboard" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Resumo
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Histórico
          </button>
        </nav>
      )}

      <div className="flex-1">
        {selectedEmployeeId ? (
          <EmployeeDetails
            selectedEmployeeId={selectedEmployeeId}
            employeeStats={employeeStats}
            records={records}
            setSelectedEmployeeId={setSelectedEmployeeId}
            deleteRecord={deleteRecord}
          />
        ) : activeTab === "dashboard" ? (
          <Dashboard
            employeesLength={employees.length}
            totalCredits={records.filter((r) => r.type === "trabalho").length}
            totalBalance={totalBalance}
            employeeStats={employeeStats}
            isLoading={isLoading}
            libsLoaded={libsLoaded}
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
          />
        )}
      </div>

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
          reportPeriod={reportPeriod}
          setReportPeriod={setReportPeriod}
        />
      )}
    </div>
  );
};
