import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ChevronLeft,
  Clock,
  TrendingUp,
  FileText,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  MapPin,
  Hourglass,
} from "lucide-react";
import { EmployeeStat, FolgaRecord } from "../FolgasPage";
import { RecordsService } from "../../../services/records.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Também refaz a busca quando employeeStats muda de referência (ou seja, sempre que
  // a página recarrega os dados após um lançamento/exclusão em qualquer parte da tela),
  // já que deleteRecord só abre o diálogo de confirmação — a exclusão real acontece
  // depois, em FolgasPage, e é isso que atualiza employeeStats.
  useEffect(() => {
    fetchEmployeeRecords();
  }, [selectedEmployeeId, employeeStats]);

  if (!emp) return null;

  const trabalhos = empRecords.filter((r) => r.type === "trabalho");
  const folgas = empRecords.filter((r) => r.type === "folga");
  const faltas = empRecords.filter((r) => r.type === "falta");
  const servicosExternos = empRecords.filter((r) => r.type === "servico_externo");
  const ajustesHorario = empRecords.filter((r) => r.type === "ajuste_horario");

  // Arrays de referências já utilizadas por este colaborador
  const folgasDoFuncionario = folgas.map((f) => f.refDate);

  // Lógica de Exportação do Extrato Individual
  const generateExtractPDF = () => {
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
    doc.rect(14, 50, 182, 24, "FD");

    doc.setFont("helvetica", "bold");
    doc.text(`Total Trabalhados: ${trabalhos.length}`, 20, 62);
    doc.text(`Total Folgas: ${folgas.length}`, 80, 62);
    doc.text(`Total Faltas: ${faltas.length}`, 140, 62);
    doc.text(`Total Serviço Externo: ${servicosExternos.length}`, 20, 68);
    doc.text(`Total Ajustes de Horário: ${ajustesHorario.length}`, 80, 68);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Saldo Atual Pendente: ${emp.balance}`, 140, 68);
    doc.setTextColor(0, 0, 0);

    // Tabela de Histórico Unificada
    const tableColumn = ["Data", "Tipo", "Descrição / Referência", "Status"];
    const tableRows = empRecords.map((r) => {
      const dataFormatada = new Date(r.date).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
      const tipo =
        r.type === "trabalho"
          ? "Crédito (+)"
          : r.type === "folga"
            ? "Folga (-)"
            : r.type === "falta"
              ? "Falta"
              : r.type === "servico_externo"
                ? "Serviço Externo"
                : "Ajuste de Horário";

      let status = "Concluído";
      if (r.type === "trabalho") {
        const refString = `${dataFormatada} - ${r.local || "Sem local"}`;
        const isUsed = folgasDoFuncionario.some(
          (ref) => ref && (ref === refString || ref.includes(dataFormatada)),
        );
        status = isUsed ? "Compensado" : "Disponível";
      }

      const descricao = [
        r.description,
        r.refDate ? `Ref: ${r.refDate}` : null,
        r.justification ? `Justificativa: ${r.justification}` : null,
      ]
        .filter(Boolean)
        .join(" | ") || "N/A";

      return [dataFormatada, tipo, descricao, status];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59] }, // Slate 900
      alternateRowStyles: { fillColor: [248, 250, 252] },
      rowPageBreak: "avoid",
    });

    // Garante que a linha de assinatura não seja cortada quando a tabela termina perto do fim da página
    const pageHeight = doc.internal.pageSize.getHeight();
    let signatureY = (doc as any).lastAutoTable.finalY + 30;
    if (signatureY + 10 > pageHeight) {
      doc.addPage();
      signatureY = 30;
    }
    doc.line(40, signatureY, 170, signatureY);
    doc.text("Assinatura do Colaborador", 105, signatureY + 6, { align: "center" });

    doc.save(`Extrato_Folgas_${emp.name.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDelete = async (id: string) => {
    // deleteRecord só abre o diálogo de confirmação (a exclusão real é assíncrona e
    // acontece em FolgasPage); a lista é recarregada automaticamente pelo efeito acima
    // quando employeeStats for atualizado após a confirmação.
    await deleteRecord(id);
  };

  return (
    <Card className="overflow-hidden animate-in slide-in-from-right-8 duration-500">
      <CardHeader className="p-6 flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white rounded-none border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedEmployeeId(null)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 h-11 w-11"
            title="Voltar ao Resumo"
          >
            <ChevronLeft size={24} />
          </Button>
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

        <Button
          onClick={generateExtractPDF}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 shadow-lg h-11"
        >
          <FileText size={18} className="mr-2" /> Extrato PDF
        </Button>
      </CardHeader>

      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 bg-slate-50/50">
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
            <Card>
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
                  <TrendingUp size={20} /> Domingos Trabalhados
                  <span className="ml-auto bg-emerald-100 text-emerald-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                    {trabalhos.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
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
                          ref &&
                          (ref === refString || ref.includes(dateString)),
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(t.id)}
                                className="text-slate-400 hover:text-rose-500 h-8 w-8"
                                title="Reverter / Excluir Lançamento"
                              >
                                <Trash2 size={16} />
                              </Button>
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
              </CardContent>
            </Card>

            {/* Lado Direito: Débitos */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-600">
                  <Clock size={20} /> Folgas Gozadas
                  <span className="ml-auto bg-amber-100 text-amber-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                    {folgas.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(f.id)}
                            className="text-slate-400 hover:text-rose-500 h-8 w-8 opacity-0 group-hover:opacity-100"
                            title="Reverter Folga"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <span className="text-slate-700 font-medium text-sm mt-2 ml-2">
                          <span className="text-slate-400 font-normal mr-1">
                            Ref:
                          </span>{" "}
                          {f.refDate || "Sem referência"}
                        </span>
                        {f.justification && (
                          <span className="text-slate-500 text-xs mt-1 ml-2">
                            <span className="text-slate-400 font-normal mr-1">
                              Justificativa:
                            </span>
                            {f.justification}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Faltas */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                  <AlertTriangle size={20} /> Faltas
                  <span className="ml-auto bg-rose-100 text-rose-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                    {faltas.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {faltas.length === 0 ? (
                  <p className="text-slate-400 text-sm italic text-center py-6">
                    Nenhuma falta registada.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {faltas.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col gap-1 relative overflow-hidden group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                        <div className="flex justify-between items-start ml-2 pr-2">
                          <span className="text-xs font-bold text-rose-600 bg-white border border-rose-100 w-fit px-2 py-0.5 rounded-md">
                            {new Date(f.date).toLocaleDateString("pt-BR", {
                              timeZone: "UTC",
                            })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(f.id)}
                            className="text-slate-400 hover:text-rose-500 h-8 w-8 opacity-0 group-hover:opacity-100"
                            title="Excluir Falta"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <span className="text-slate-700 text-sm mt-2 ml-2">
                          {f.justification ? (
                            <>
                              <span className="text-slate-400 font-normal mr-1">
                                Justificativa:
                              </span>
                              {f.justification}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">
                              Sem justificativa
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Serviço Externo */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-sky-600">
                  <MapPin size={20} /> Serviço Externo
                  <span className="ml-auto bg-sky-100 text-sky-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                    {servicosExternos.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {servicosExternos.length === 0 ? (
                  <p className="text-slate-400 text-sm italic text-center py-6">
                    Nenhum serviço externo registado.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {servicosExternos.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl flex flex-col gap-1 relative overflow-hidden group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400"></div>
                        <div className="flex justify-between items-start ml-2 pr-2">
                          <span className="text-xs font-bold text-sky-600 bg-white border border-sky-100 w-fit px-2 py-0.5 rounded-md">
                            {new Date(s.date).toLocaleDateString("pt-BR", {
                              timeZone: "UTC",
                            })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(s.id)}
                            className="text-slate-400 hover:text-rose-500 h-8 w-8 opacity-0 group-hover:opacity-100"
                            title="Excluir Serviço Externo"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <span className="text-slate-700 text-sm mt-2 ml-2">
                          {s.justification ? (
                            <>
                              <span className="text-slate-400 font-normal mr-1">
                                Justificativa:
                              </span>
                              {s.justification}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">
                              Sem justificativa
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ajuste de Horário */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-violet-600">
                  <Hourglass size={20} /> Ajuste de Horário
                  <span className="ml-auto bg-violet-100 text-violet-700 py-0.5 px-2.5 rounded-lg text-xs font-black">
                    {ajustesHorario.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {ajustesHorario.length === 0 ? (
                  <p className="text-slate-400 text-sm italic text-center py-6">
                    Nenhum ajuste de horário registado.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {ajustesHorario.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl flex flex-col gap-1 relative overflow-hidden group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-400"></div>
                        <div className="flex justify-between items-start ml-2 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-violet-600 bg-white border border-violet-100 w-fit px-2 py-0.5 rounded-md">
                              {new Date(a.date).toLocaleDateString("pt-BR", {
                                timeZone: "UTC",
                              })}
                            </span>
                            {a.description && (
                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {a.description}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(a.id)}
                            className="text-slate-400 hover:text-rose-500 h-8 w-8 opacity-0 group-hover:opacity-100"
                            title="Excluir Ajuste de Horário"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <span className="text-slate-700 text-sm mt-2 ml-2">
                          {a.justification ? (
                            <>
                              <span className="text-slate-400 font-normal mr-1">
                                Justificativa:
                              </span>
                              {a.justification}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">
                              Sem justificativa
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
};
