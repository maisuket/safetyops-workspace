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
  Calendar,
  Briefcase,
  FileX,
} from "lucide-react";
import { DocumentsService } from "../../services/documents.service";
import { ImportSSTModal } from "./modal/ImportSstModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const loadData = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setIsLoading(true);
      const [empResponse, docData] = await Promise.all([
        EmployeesService.findAll(1, 1000).catch(() => ({ data: [], total: 0 })),
        DocumentsService.findAll().catch(() => []),
      ]);
      const empData = empResponse.data || [];
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
      toast.success("Documento arquivado com sucesso!");
    } catch (e) {
      console.error(e);
      // Fallback Local
      const newDoc = { ...docData, id: Date.now().toString() };
      setDocuments([...documents, newDoc]);
      setIsModalOpen(false);
      setAnalysisResult(null);
      setEditingDocId(null);
      toast.success("Documento arquivado (Modo Local)!");
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
        toast.success("Documento removido com sucesso!");
      } catch (error) {
        // Fallback
        setDocuments(documents.filter((d) => d.id !== id));
        toast.success("Documento removido (Modo Local)!");
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
      toast.success("Documento atualizado com sucesso!");
    } catch (e) {
      console.error(e);
      // Fallback Local
      setDocuments(
        documents.map((d) => (d.id === id ? { ...d, ...docData } : d)),
      );
      setIsModalOpen(false);
      setAnalysisResult(null);
      setEditingDocId(null);
      toast.success("Documento atualizado (Modo Local)!");
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
      toast.error("IA indisponível. Preencha os dados manualmente.");
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveTab("employees")}
              className="h-12 w-12 rounded-2xl shadow-sm"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 hidden sm:flex">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                {activeTab === "dashboard"
                  ? "Dashboard SST"
                  : activeTab === "employees"
                    ? "Prontuários da Equipa"
                    : `Pasta: ${selectedEmployee?.name}`}
              </h2>
              <p className="text-slate-500 font-medium mt-1 text-sm">Gestão de ASOs, NRs e Documentação de Segurança</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Buscar documento..."
              className="pl-10 h-12 rounded-2xl font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="h-12 rounded-2xl gap-2 font-bold whitespace-nowrap shadow-sm"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" /> Importar
            CSV
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-12 rounded-2xl gap-2 font-bold whitespace-nowrap shadow-xl shadow-slate-200"
          >
            <Upload size={18} /> Arquivar Doc
          </Button>
        </div>
      </header>

      <nav className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all h-auto ${activeTab === "dashboard" ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 hover:text-white" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Visão Geral
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all h-auto ${activeTab === "employees" ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 hover:text-white" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Prontuários (Pastas)
        </Button>
      </nav>

      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden rounded-3xl border-rose-100 bg-rose-50/50 shadow-sm hover:shadow-md transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-rose-600/80 font-bold text-xs uppercase tracking-widest">
                      Ação Requerida
                    </p>
                    <h4 className="text-4xl font-black text-rose-700">
                      {stats.expired + stats.critical}
                    </h4>
                  </div>
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-3xl border-emerald-100 bg-emerald-50/50 shadow-sm hover:shadow-md transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-emerald-600/80 font-bold text-xs uppercase tracking-widest">
                      Regulares
                    </p>
                    <h4 className="text-4xl font-black text-emerald-700">{stats.ok}</h4>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-3xl border-amber-100 bg-amber-50/50 shadow-sm hover:shadow-md transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-amber-600/80 font-bold text-xs uppercase tracking-widest">
                      Vencem em 90 dias
                    </p>
                    <h4 className="text-4xl font-black text-amber-700">{stats.warning}</h4>
                  </div>
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Info size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Database size={20} className="text-slate-400" /> Relatório de
              Documentos
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={!libsLoaded}
                className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-700"
              >
                <Download size={16} className="mr-2" /> Excel
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={!libsLoaded}
                className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:text-rose-700"
              >
                <FileText size={16} className="mr-2" /> PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const emp = employees.find((e) => e.id === doc.employeeId);
              const info = getStatusInfo(doc.expiryDate);
              return (
                <Card
                  key={doc.id}
                  className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group flex flex-col overflow-hidden"
                >
                  <div className={`h-1.5 w-full ${info.bg}`}></div>
                  <CardHeader className="p-5 pb-0 flex flex-row items-start justify-between space-y-0">
                    <div
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${info.bg} text-white`}
                    >
                      {doc.docType}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDocument(doc)}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 rounded-lg"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDocument(doc.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-between">
                    <div className="mb-5">
                      <h4 className="font-bold text-slate-800 text-lg line-clamp-1" title={emp?.name}>
                      {emp?.name || "Desconhecido"}
                    </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">Mat: {emp?.enrollment || "N/A"}</p>
                    </div>
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={14}/> VENCIMENTO</span>
                        <span className={`px-2 py-0.5 rounded-md ${info.bg} text-white text-[10px] uppercase tracking-wider`}>
                        {new Date(doc.expiryDate).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </span>
                    </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full ${info.bg}`}
                        style={{ width: `${info.percent}%` }}
                      ></div>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredDocuments.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <FileX size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum documento encontrado</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                  Não existem documentos que correspondam aos filtros atuais.
                </p>
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
                <Card
                  key={e.id}
                  className="p-5 rounded-3xl border-slate-200 flex items-center gap-4 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden group"
                  onClick={() => {
                    setSelectedEmployee(e);
                    setActiveTab("folder");
                  }}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${folderStatus.bg} transition-all group-hover:w-2`}></div>
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {e.name.charAt(0)}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <p
                      className="font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors"
                      title={e.name}
                    >
                      {e.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                      <Briefcase size={14}/> {e.enrollment || "Geral"}
                    </p>
                  </div>

                  <div
                    className={`flex flex-col items-center gap-1 shrink-0 px-2`}
                  >
                    <StatusIcon size={22} className={folderStatus.text} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${folderStatus.text}`}>{folderStatus.label}</span>
                  </div>
                </Card>
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
                  <Card
                    key={doc.id}
                    className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col overflow-hidden"
                  >
                    <div className={`h-1.5 w-full ${info.bg}`}></div>
                    <CardHeader className="p-5 pb-0 flex flex-row items-start justify-between space-y-0">
                      <div
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${info.bg} text-white`}
                      >
                        {doc.docType}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDocument(doc)}
                          className="text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 h-8 w-8 rounded-lg"
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(doc.id)}
                          className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 h-8 w-8 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-end">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-black mb-1 flex items-center justify-center gap-1.5">
                          <Calendar size={14}/> VENCIMENTO
                      </p>
                      <p className={`font-black text-2xl ${info.text}`}>
                        {new Date(doc.expiryDate).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {documents.filter((d) => d.employeeId === selectedEmployee.id)
              .length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <FolderOpen size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Pasta Vazia</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                  Nenhum documento arquivado para este colaborador no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE UPLOAD/IA */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setAnalysisResult(null);
            setEditingDocId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white border-none rounded-3xl gap-0 [&>button]:text-white">
          <DialogHeader className="p-6 bg-slate-900 text-white m-0">
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              {editingDocId ? <Edit3 size={20} /> : <Upload size={20} />}
              {editingDocId ? "Editar Documento" : "Arquivar Documento"}
            </DialogTitle>
          </DialogHeader>
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
                      <FileSearch className="text-emerald-500 mb-2" size={32} />
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
                <Button
                  variant="outline"
                  onClick={() =>
                    setAnalysisResult({
                      docType: "",
                      issueDate: "",
                      expiryDate: "",
                      employeeId: selectedEmployee?.id || "",
                    })
                  }
                  className="w-full h-12 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2"
                >
                  <Edit3 size={18} /> Preenchimento Manual
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Colaborador
                  </label>
                  <Select
                    value={analysisResult.employeeId}
                    onValueChange={(val) =>
                      setAnalysisResult({
                        ...analysisResult,
                        employeeId: val,
                      })
                    }
                  >
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 font-medium">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Tipo de Documento (Ex: NR 35)
                  </label>
                  <Input
                    className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 font-medium"
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
                    <Input
                      type="date"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 font-medium"
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
                    <Input
                      type="date"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 font-medium"
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

                <Button
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
                  className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 mt-4 shadow-lg"
                >
                  {editingDocId
                    ? "Guardar Alterações"
                    : "Confirmar Arquivamento"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isImportModalOpen && (
        <ImportSSTModal
          closeModal={() => setIsImportModalOpen(false)}
          employees={employees}
          onImportSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
