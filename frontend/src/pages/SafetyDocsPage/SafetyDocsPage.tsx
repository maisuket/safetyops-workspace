import { useEffect, useMemo, useRef, useState } from "react";
import { EmployeesService } from "../../services/employees.service";
import { INITIAL_EMPLOYEES } from "../../services/data-initial";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  Edit3,
  FileSearch,
  FileSpreadsheet,
  FolderOpen,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Download,
  FileText,
} from "lucide-react";
import { DocumentsService } from "../../services/documents.service";
import { ImportSSTModal } from "./modal/ImportSstModal";

interface Employee {
  id: string;
  name: string;
  enrollment?: string;
  role?: string;
}

interface SafetyDocument {
  id: string;
  employeeId: string;
  docType: string;
  issueDate?: string | null;
  expiryDate: string;
}

export const SafetyDocsPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<SafetyDocument[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [toast, setToast] = useState<any>(null);
  const isFetching = useRef(false);

  // Carregar dependências de exportação
  const [libsLoaded, setLibsLoaded] = useState(false);

  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        // Evita injetar o mesmo script múltiplas vezes
        if (document.querySelector(`script[src="${src}"]`)) {
          return resolve(true);
        }
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

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setIsLoading(true);
      const [empData, docData] = await Promise.all([
        EmployeesService.findAll().catch(() => []),
        DocumentsService.findAll().catch(() => []),
      ]);
      setEmployees(
        empData.length > 0
          ? empData
          : INITIAL_EMPLOYEES.map((name, i) => ({
              id: String(i),
              name,
              role: "Geral",
            })),
      );
      setDocuments(
        docData.length > 0
          ? docData
          : JSON.parse(localStorage.getItem("itam_docs_mock") || "[]"),
      );
    } catch (error) {
      console.error("Erro", error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (documents.length > 0)
      localStorage.setItem("itam_docs_mock", JSON.stringify(documents));
  }, [documents]);

  const addDocument = async (docData: any) => {
    try {
      setIsLoading(true);
      await DocumentsService.create(docData);
      await loadData();
      setIsModalOpen(false);
      setAnalysisResult(null);
      showToast("Documento arquivado com sucesso!");
    } catch (e) {
      console.error(e);
      // Fallback Local
      const newDoc = { ...docData, id: Date.now().toString() };
      setDocuments([...documents, newDoc]);
      setIsModalOpen(false);
      setAnalysisResult(null);
      setEditingDocId(null);
      showToast("Documento arquivado (Modo Local)!");
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = async (id: string) => {
    if (window.confirm("Tem a certeza que deseja excluir este documento?")) {
      try {
        setIsLoading(true);
        await DocumentsService.remove(id);
        await loadData();
        showToast("Documento removido!");
      } catch (error) {
        // Fallback
        setDocuments(documents.filter((d) => d.id !== id));
        showToast("Documento removido (Modo Local)!");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditDocument = (doc: SafetyDocument) => {
    setEditingDocId(doc.id);
    setAnalysisResult({
      employeeId: doc.employeeId,
      docType: doc.docType,
      issueDate: doc.issueDate
        ? new Date(doc.issueDate).toISOString().split("T")[0]
        : "",
      expiryDate: doc.expiryDate
        ? new Date(doc.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setIsModalOpen(true);
  };

  const updateDocument = async (id: string, docData: any) => {
    try {
      setIsLoading(true);
      await DocumentsService.update(id, docData);
      await loadData();
      setIsModalOpen(false);
      setAnalysisResult(null);
      setEditingDocId(null);
      showToast("Documento atualizado com sucesso!");
    } catch (e) {
      console.error(e);
      // Fallback Local
      setDocuments(
        documents.map((d) => (d.id === id ? { ...d, ...docData } : d)),
      );
      setIsModalOpen(false);
      setAnalysisResult(null);
      setEditingDocId(null);
      showToast("Documento atualizado (Modo Local)!");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (expiryDate: string) => {
    const diffDays = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0)
      return {
        status: "expired",
        label: "Vencido",
        bg: "bg-rose-500",
        text: "text-rose-600",
        percent: 0,
      };
    if (diffDays <= 30)
      return {
        status: "critical",
        label: "Crítico",
        bg: "bg-amber-500",
        text: "text-amber-600",
        percent: (diffDays / 30) * 100,
      };
    if (diffDays <= 90)
      return {
        status: "warning",
        label: "Atenção",
        bg: "bg-yellow-400",
        text: "text-yellow-700",
        percent: (diffDays / 90) * 100,
      };
    return {
      status: "ok",
      label: "Regular",
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      percent: 100,
    };
  };

  // INTELIGÊNCIA ARTIFICIAL (Mantida do seu código)
  const analyzeDocument = async (file: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const cleanBase64 = await base64Promise;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) throw new Error("Sem API Key");

      const payload = {
        contents: [
          {
            parts: [
              {
                text: "Extraia do documento SST: employeeName, docType, issueDate, expiryDate (YYYY-MM-DD). Retorne APENAS um JSON plano.",
              },
              {
                inlineData: {
                  mimeType: file.type || "image/png",
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        const parsed = JSON.parse(text);
        const matchedEmp = employees.find((e) =>
          e.name
            .toLowerCase()
            .includes(parsed.employeeName?.toLowerCase() || ""),
        );
        setAnalysisResult({
          ...parsed,
          employeeId: matchedEmp?.id || "",
          issueDate: parsed.issueDate || "",
        });
      }
    } catch (error) {
      showToast("IA indisponível. Preencha os dados manualmente.", "error");
      setAnalysisResult({
        employeeName: "",
        docType: "",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        )
          .toISOString()
          .split("T")[0],
        employeeId: "",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Melhoria de Performance: Evita recalcular em cada render
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const emp = employees.find((e) => e.id === doc.employeeId);
      return (
        (emp?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.docType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [documents, employees, searchQuery]);

  const stats = useMemo(() => {
    const counts = { expired: 0, critical: 0, warning: 0, ok: 0 };
    documents.forEach((doc) => {
      counts[getStatusInfo(doc.expiryDate).status as keyof typeof counts]++;
    });
    return counts;
  }, [documents]);

  // MELHORIA 1: Descobrir o pior status de um funcionário para a capa da pasta
  const getEmployeeFolderStatus = (empId: string) => {
    const empDocs = documents.filter((d) => d.employeeId === empId);
    if (empDocs.length === 0)
      return { bg: "bg-slate-200", text: "text-slate-500", label: "Sem Docs" };

    let hasExpired = false;
    let hasCritical = false;
    let hasWarning = false;

    empDocs.forEach((doc) => {
      const status = getStatusInfo(doc.expiryDate).status;
      if (status === "expired") hasExpired = true;
      if (status === "critical") hasCritical = true;
      if (status === "warning") hasWarning = true;
    });

    if (hasExpired)
      return {
        bg: "bg-rose-500",
        text: "text-rose-600",
        label: "Vencido",
        icon: AlertTriangle,
      };
    if (hasCritical)
      return {
        bg: "bg-amber-500",
        text: "text-amber-600",
        label: "Crítico",
        icon: AlertTriangle,
      };
    if (hasWarning)
      return {
        bg: "bg-yellow-400",
        text: "text-yellow-600",
        label: "Atenção",
        icon: Info,
      };
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      label: "Regular",
      icon: CheckCircle2,
    };
  };

  // MELHORIA 2: Exportação
  const exportToExcel = () => {
    // @ts-ignore
    if (!window.XLSX) return;

    const data = filteredDocuments.map((doc) => {
      const emp = employees.find((e) => e.id === doc.employeeId);
      const info = getStatusInfo(doc.expiryDate);
      return {
        Matrícula: emp?.enrollment || "N/A",
        Funcionário: emp?.name || "Desconhecido",
        "Documento/Norma": doc.docType,
        "Data Emissão": doc.issueDate
          ? new Date(doc.issueDate).toLocaleDateString("pt-BR")
          : "N/A",
        "Data Vencimento": new Date(doc.expiryDate).toLocaleDateString("pt-BR"),
        Status: info.label,
      };
    });

    // @ts-ignore
    const ws = window.XLSX.utils.json_to_sheet(data);
    // @ts-ignore
    const wb = window.XLSX.utils.book_new();
    // @ts-ignore
    window.XLSX.utils.book_append_sheet(wb, ws, "Controlo SST");
    // @ts-ignore
    window.XLSX.writeFile(
      wb,
      `ITAM_SST_Status_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`,
    );
  };

  const exportToPDF = () => {
    // @ts-ignore
    if (!window.jspdf) return;
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape"); // Landscape para caber mais colunas

    doc.text(
      "ITAM - Assistência Técnica - Controlo de SST (NRs e ASOs)",
      14,
      15,
    );
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = [
      "Matrícula",
      "Colaborador",
      "Documento",
      "Vencimento",
      "Status",
    ];
    const tableRows = filteredDocuments.map((doc) => {
      const emp = employees.find((e) => e.id === doc.employeeId);
      const info = getStatusInfo(doc.expiryDate);
      return [
        emp?.enrollment || "N/A",
        emp?.name || "Desconhecido",
        doc.docType,
        new Date(doc.expiryDate).toLocaleDateString("pt-BR"),
        info.label,
      ];
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(
      `ITAM_SST_Relatorio_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
    );
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto relative h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <Loader2 size={40} className="text-emerald-500 animate-spin" />
        </div>
      )}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 no-print">
        <div className="flex items-center gap-4">
          {activeTab === "folder" && (
            <button
              onClick={() => setActiveTab("employees")}
              className="p-3 hover:bg-white shadow-sm border border-slate-200 rounded-2xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" size={32} />
              {activeTab === "dashboard"
                ? "Dashboard SST"
                : activeTab === "employees"
                  ? "Prontuários"
                  : `Pasta: ${selectedEmployee?.name}`}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar documento..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-sm font-bold transition-all whitespace-nowrap"
          >
            <FileSpreadsheet size={20} className="text-emerald-600" /> Importar
            CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-200 font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            <Upload size={20} /> Arquivar Doc
          </button>
        </div>
      </header>

      <nav className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "dashboard" ? "bg-emerald-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "employees" ? "bg-emerald-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Prontuários (Pastas)
        </button>
      </nav>

      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-bl-full"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                Ação Requerida
              </p>
              <h4 className="text-4xl font-black text-slate-800">
                {stats.expired + stats.critical}
              </h4>
              <AlertTriangle
                className="absolute bottom-6 right-6 text-rose-500 opacity-20"
                size={48}
              />
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                Documentos Regulares
              </p>
              <h4 className="text-4xl font-black text-slate-800">{stats.ok}</h4>
              <CheckCircle2
                className="absolute bottom-6 right-6 text-emerald-500 opacity-20"
                size={48}
              />
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                Vencem em 90 dias
              </p>
              <h4 className="text-4xl font-black text-slate-800">
                {stats.warning}
              </h4>
              <Info
                className="absolute bottom-6 right-6 text-yellow-500 opacity-20"
                size={48}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Database size={20} className="text-slate-400" /> Relatório de
              Documentos
            </h3>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={!libsLoaded}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-bold disabled:opacity-50"
              >
                <Download size={16} /> Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={!libsLoaded}
                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-2 text-sm font-bold disabled:opacity-50"
              >
                <FileText size={16} /> PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const emp = employees.find((e) => e.id === doc.employeeId);
              const info = getStatusInfo(doc.expiryDate);
              return (
                <div
                  key={doc.id}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group"
                >
                  <div
                    className={`absolute top-0 left-0 w-2 h-full ${info.bg} rounded-l-3xl`}
                  ></div>
                  <div className="flex justify-between items-start mb-4 ml-4">
                    <div
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${info.bg} text-white`}
                    >
                      {doc.docType}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDocument(doc)}
                        className="text-slate-300 hover:text-blue-500 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-4 ml-4">
                    <h4 className="font-black text-slate-800 text-lg truncate">
                      {emp?.name || "Desconhecido"}
                    </h4>
                  </div>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">VENCIMENTO</span>
                      <span className={info.text}>
                        {new Date(doc.expiryDate).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${info.bg}`}
                        style={{ width: `${info.percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredDocuments.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl">
                Nenhum documento encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
          {employees
            .filter((emp) =>
              emp.name.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((e) => {
              // MELHORIA 1 APLICADA AQUI: Avaliar o status da pasta do funcionário
              const folderStatus = getEmployeeFolderStatus(e.id);
              const StatusIcon = folderStatus.icon || FolderOpen;

              return (
                <div
                  key={e.id}
                  className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 hover:border-emerald-200 transition-all shadow-sm cursor-pointer relative overflow-hidden"
                  onClick={() => {
                    setSelectedEmployee(e);
                    setActiveTab("folder");
                  }}
                >
                  {/* Linha indicadora de status no topo do card */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1.5 ${folderStatus.bg}`}
                  ></div>

                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xl shrink-0">
                    {e.name.charAt(0)}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <p
                      className="font-black text-slate-800 truncate"
                      title={e.name}
                    >
                      {e.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                      Mat: {e.enrollment || "Geral"}
                    </p>
                  </div>

                  {/* Badge de Status Inteligente */}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${folderStatus.bg} text-white shrink-0`}
                  >
                    <StatusIcon size={12} /> {folderStatus.label}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === "folder" && selectedEmployee && (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {documents
              .filter((d) => d.employeeId === selectedEmployee.id)
              .map((doc) => {
                const info = getStatusInfo(doc.expiryDate);
                return (
                  <div
                    key={doc.id}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group"
                  >
                    <div
                      className={`absolute top-0 left-0 w-full h-2 ${info.bg} rounded-t-3xl`}
                    ></div>
                    <div className="flex justify-between items-start mb-6 mt-2">
                      <div
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${info.bg} text-white`}
                      >
                        {doc.docType}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditDocument(doc)}
                          className="p-1.5 text-slate-300 hover:text-blue-500 bg-slate-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 bg-slate-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black mb-1">
                        Vencimento
                      </p>
                      <p className={`font-black text-2xl ${info.text}`}>
                        {new Date(doc.expiryDate).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            {documents.filter((d) => d.employeeId === selectedEmployee.id)
              .length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl">
                Nenhum documento arquivado para este colaborador.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE UPLOAD/IA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {editingDocId ? <Edit3 size={20} /> : <Upload size={20} />}
                {editingDocId ? "Editar Documento" : "Arquivar Documento"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setAnalysisResult(null);
                  setEditingDocId(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {!analysisResult ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-emerald-200 rounded-3xl p-10 text-center relative hover:bg-emerald-50 transition-all cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => analyzeDocument(e.target.files![0])}
                      disabled={isAnalyzing}
                    />
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center">
                        <Loader2
                          className="animate-spin text-emerald-500 mb-2"
                          size={32}
                        />
                        <p className="font-bold text-slate-600">
                          A Ler com IA...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileSearch
                          className="text-emerald-500 mb-2"
                          size={32}
                        />
                        <p className="font-bold text-slate-600">
                          Upload para Leitura Automática (IA)
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          ASOs, Certificados NR
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-center text-xs text-slate-400 font-bold uppercase">
                    Ou
                  </div>
                  <button
                    onClick={() =>
                      setAnalysisResult({
                        docType: "",
                        issueDate: "",
                        expiryDate: "",
                        employeeId: selectedEmployee?.id || "",
                      })
                    }
                    className="w-full py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Preenchimento Manual
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Colaborador
                    </label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      value={analysisResult.employeeId}
                      onChange={(e) =>
                        setAnalysisResult({
                          ...analysisResult,
                          employeeId: e.target.value,
                        })
                      }
                    >
                      <option value="">Selecione...</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Tipo de Documento (Ex: NR 35)
                    </label>
                    <input
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      value={analysisResult.docType}
                      onChange={(e) =>
                        setAnalysisResult({
                          ...analysisResult,
                          docType: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Emissão (Opcional)
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                        value={analysisResult.issueDate}
                        onChange={(e) =>
                          setAnalysisResult({
                            ...analysisResult,
                            issueDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                        value={analysisResult.expiryDate}
                        onChange={(e) =>
                          setAnalysisResult({
                            ...analysisResult,
                            expiryDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      editingDocId
                        ? updateDocument(editingDocId, analysisResult)
                        : addDocument(analysisResult)
                    }
                    disabled={
                      !analysisResult.employeeId ||
                      !analysisResult.docType ||
                      !analysisResult.expiryDate
                    }
                    className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 mt-4 shadow-lg"
                  >
                    {editingDocId
                      ? "Guardar Alterações"
                      : "Confirmar Arquivamento"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <ImportSSTModal
          closeModal={() => setIsImportModalOpen(false)}
          employees={employees}
          onImportSuccess={() => loadData()}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 bg-slate-900 text-white animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="text-emerald-400" size={18} />{" "}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
