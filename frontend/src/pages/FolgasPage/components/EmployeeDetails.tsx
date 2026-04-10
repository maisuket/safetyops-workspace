import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  Clock,
  TrendingUp,
  FileText,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { EmployeeStat, FolgaRecord } from "../FolgasPage";
import { RecordsService } from "../../../services/records.service";

// --- Employee Details Component ---
interface EmployeeDetailsProps {
  selectedEmployeeId: string;
  employeeStats: EmployeeStat[];
  setSelectedEmployeeId: (id: string | null) => void;
  deleteRecord: (id: string) => Promise<void>;
}

export const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  selectedEmployeeId,
  employeeStats,
  setSelectedEmployeeId,
  deleteRecord,
}) => {
  const emp = employeeStats.find((e) => e.id === selectedEmployeeId);
  const [empRecords, setEmpRecords] = useState<FolgaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployeeRecords = async () => {
    if (!selectedEmployeeId) return;
    try {
      setIsLoading(true);
      // @ts-ignore
      const data = await RecordsService.findByEmployee(selectedEmployeeId);
      setEmpRecords(data as FolgaRecord[]);
    } catch (error) {
      console.error("Erro ao carregar histórico do colaborador:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeRecords();
  }, [selectedEmployeeId]);

  if (!emp) return null;

  const trabalhos = empRecords.filter((r) => r.type === "trabalho");
  const folgas = empRecords.filter((r) => r.type === "folga");

  // Arrays de referências já utilizadas por este colaborador
  const folgasDoFuncionario = folgas.map((f) => f.refDate);

  // Lógica de Exportação do Extrato Individual
  const generateExtractPDF = () => {
    // @ts-ignore
    if (!window.jspdf) {
      alert("A biblioteca de PDF ainda não foi carregada. Tente novamente.");
      return;
    }

    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Extrato de Folgas e Banco de Horas", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Colaborador: ${emp.name}`, 14, 30);
    doc.text(`Matrícula: ${emp.enrollment || "N/A"}`, 14, 36);
    doc.text(
      `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
      14,
      42,
    );

    // Resumo de Saldo
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 50, 182, 20, "FD");

    doc.setFont("helvetica", "bold");
    doc.text(`Total Trabalhados: ${trabalhos.length}`, 20, 62);
    doc.text(`Total Folgas: ${folgas.length}`, 80, 62);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Saldo Atual Pendente: ${emp.balance}`, 140, 62);
    doc.setTextColor(0, 0, 0);

    // Tabela de Histórico Unificada
    const tableColumn = ["Data", "Tipo", "Descrição / Referência", "Status"];
    const tableRows = empRecords.map((r) => {
      const dataFormatada = new Date(r.date).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
      const tipo = r.type === "trabalho" ? "Crédito (+)" : "Folga (-)";

      let status = "Concluído";
      if (r.type === "trabalho") {
        const refString = `${dataFormatada} - ${r.local || "Sem local"}`;
        const isUsed = folgasDoFuncionario.some(
          (ref) => ref && (ref === refString || ref.includes(dataFormatada)),
        );
        status = isUsed ? "Compensado" : "Disponível";
      }

      return [dataFormatada, tipo, r.description || r.refDate || "N/A", status];
    });

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59] }, // Slate 900
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.line(40, finalY, 170, finalY);
    doc.text("Assinatura do Colaborador", 105, finalY + 6, { align: "center" });

    doc.save(`Extrato_Folgas_${emp.name.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    await fetchEmployeeRecords(); // Atualiza a visão de detalhes após remover na DB
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-right-8 duration-500">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedEmployeeId(null)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300"
            title="Voltar ao Resumo"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black">{emp.name}</h2>
            <div className="flex gap-4 mt-1 text-sm">
              <span className="text-slate-400 font-mono">
                Mat: {emp.enrollment || "N/A"}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400 font-medium">
                Saldo: {emp.balance} pendentes
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={generateExtractPDF}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg"
        >
          <FileText size={18} /> Extrato PDF
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50">
        {isLoading && (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
            <p className="text-slate-500 font-medium">
              A carregar registos completos do colaborador...
            </p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Lado Esquerdo: Créditos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-700 border-b border-slate-100 pb-3">
                <TrendingUp size={20} /> Domingos Trabalhados
                <span className="ml-auto bg-emerald-100 text-emerald-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                  {trabalhos.length}
                </span>
              </h3>
              {trabalhos.length === 0 ? (
                <p className="text-slate-400 text-sm italic text-center py-6">
                  Nenhum domingo trabalhado.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {trabalhos.map((t) => {
                    const dateString = new Date(t.date).toLocaleDateString(
                      "pt-BR",
                      { timeZone: "UTC" },
                    );
                    const refString = `${dateString} - ${t.local || "Sem local"}`;

                    const isUsed = folgasDoFuncionario.some(
                      (ref) =>
                        ref && (ref === refString || ref.includes(dateString)),
                    );

                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl flex flex-col gap-1 border ${isUsed ? "bg-slate-50 border-slate-200" : "bg-emerald-50/50 border-emerald-100"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${isUsed ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-emerald-600"}`}
                            >
                              {dateString}
                            </span>
                            {t.local && (
                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {t.local}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isUsed ? "bg-slate-200 text-slate-400" : "bg-emerald-500 text-white shadow-sm"}`}
                            >
                              {isUsed ? "Compensado" : "Disponível"}
                            </span>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                              title="Reverter / Excluir Lançamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <span
                          className={`font-medium text-sm mt-2 ${isUsed ? "text-slate-400 line-through" : "text-slate-700"}`}
                        >
                          {t.description || "Sem descrição"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lado Direito: Débitos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-600 border-b border-slate-100 pb-3">
                <Clock size={20} /> Folgas Gozadas
                <span className="ml-auto bg-amber-100 text-amber-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                  {folgas.length}
                </span>
              </h3>
              {folgas.length === 0 ? (
                <p className="text-slate-400 text-sm italic text-center py-6">
                  Nenhuma folga registada.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {folgas.map((f) => (
                    <div
                      key={f.id}
                      className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col gap-1 relative overflow-hidden group"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                      <div className="flex justify-between items-start ml-2 pr-2">
                        <span className="text-xs font-bold text-amber-600 bg-white border border-amber-100 w-fit px-2 py-0.5 rounded-md">
                          {new Date(f.date).toLocaleDateString("pt-BR", {
                            timeZone: "UTC",
                          })}
                        </span>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Reverter Folga"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className="text-slate-700 font-medium text-sm mt-2 ml-2">
                        <span className="text-slate-400 font-normal mr-1">
                          Ref:
                        </span>{" "}
                        {f.refDate || "Sem referência"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
