import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Trash2,
  Car,
  Search,
  CheckSquare,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  Briefcase,
  X,
} from "lucide-react";
import { EmployeesService } from "../../services/employees.service";

/**
 * ============================================================================
 * 📂 src/pages/Saidas/SaidasPage.tsx
 * ============================================================================
 */

// Funções Auxiliares
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const getISODate = (date = new Date()) => {
  return date.toISOString().split("T")[0];
};

const formatarData = (isoDate: string) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

export const SaidasPage = () => {
  // === ESTADOS ===
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [tipoFormulario, setTipoFormulario] = useState<"saida" | "uber">(
    "saida",
  );
  const [registros, setRegistros] = useState<any[]>([]);
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<
    string[]
  >([]);

  // Campos de formulário
  const [motivo, setMotivo] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(getISODate());
  const [feedback, setFeedback] = useState("");

  // Campos específicos
  const [tipoData, setTipoData] = useState("saida");
  const [destino, setDestino] = useState("");
  const [comAssinatura, setComAssinatura] = useState(true);

  // === INICIALIZAÇÃO ===
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
      // Carrega jsPDF e ExcelJS via CDN para manter compatibilidade com o seu código anterior
      const jspdf = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      );
      const exceljs = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js",
      );

      if (jspdf && exceljs) setLibsLoaded(true);
    };

    const fetchEmployees = async () => {
      try {
        const data = await EmployeesService.findAll();
        // Filtramos apenas os ativos para o formulário
        setEmployees(data.filter((e: any) => e.active !== false));
      } catch (error) {
        console.error("Erro ao buscar colaboradores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initLibs();
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [employees, searchTerm]);

  // === LÓGICA DE DADOS ===
  const handleColaboradorChange = (id: string) => {
    setColaboradoresSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      return [...prev, id];
    });
  };

  const handleAddRegistro = () => {
    if (colaboradoresSelecionados.length === 0 || !motivo.trim()) {
      showFeedback(
        "Erro: Selecione pelo menos um colaborador e preencha o motivo.",
        true,
      );
      return;
    }

    if (tipoFormulario === "uber" && !destino.trim()) {
      showFeedback(
        "Erro: Preencha o destino para a solicitação de Uber.",
        true,
      );
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
        dataHora: dataSelecionada,
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
    showFeedback(
      `${novosRegistros.length} colaborador(es) adicionado(s) à lista!`,
      false,
    );
  };

  const handleRemoverRegistro = (id: string) => {
    setRegistros(registros.filter((r) => r.id !== id));
  };

  const handleLimparRegistros = () => {
    if (window.confirm("Tem a certeza que deseja limpar toda a lista?")) {
      setRegistros([]);
      showFeedback("Lista de registros limpa.", false);
    }
  };

  const showFeedback = (msg: string, isError: boolean) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 5000);
  };

  // === LÓGICA DE GERAÇÃO DE PDF (Mantida a sua lógica de VFS) ===
  const loadAssets = async (incluirAssinatura: boolean) => {
    const loadAsset = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        return response.arrayBuffer();
      } catch (error) {
        console.warn(
          `Aviso: Não foi possível carregar ${url}. Verifique se a pasta public/ contém os assets do seu projeto antigo.`,
        );
        return new ArrayBuffer(0); // Retorna buffer vazio para não quebrar a aplicação
      }
    };

    const assets: any = {};
    const [logoBuffer, fontNormalBuffer, fontBoldBuffer] = await Promise.all([
      loadAsset("../../assets/itam-logo.jpeg"),
      loadAsset("../../fonts/calibri-regular.ttf"),
      loadAsset("../../fonts/calibri-bold.ttf"),
    ]);

    assets.logoBase64 =
      logoBuffer.byteLength > 0 ? arrayBufferToBase64(logoBuffer) : "";
    assets.fontNormalBase64 =
      fontNormalBuffer.byteLength > 0
        ? arrayBufferToBase64(fontNormalBuffer)
        : "";
    assets.fontBoldBase64 =
      fontBoldBuffer.byteLength > 0 ? arrayBufferToBase64(fontBoldBuffer) : "";

    if (incluirAssinatura) {
      const assinaturaBuffer = await loadAsset("../../assets/assinatura-2.png");
      assets.assinaturaBase64 =
        assinaturaBuffer.byteLength > 0
          ? arrayBufferToBase64(assinaturaBuffer)
          : "";
    } else {
      assets.assinaturaBase64 = "";
    }

    return assets;
  };

  const setupDocFonts = (doc: any, assets: any) => {
    if (assets.fontNormalBase64 && assets.fontBoldBase64) {
      doc.addFileToVFS("Calibri-Regular.ttf", assets.fontNormalBase64);
      doc.addFont("Calibri-Regular.ttf", "Calibri", "normal");
      doc.addFileToVFS("Calibri-Bold.ttf", assets.fontBoldBase64);
      doc.addFont("Calibri-Bold.ttf", "Calibri", "bold");
    }
  };

  const gerarPDFSaida = async (registrosSaida: any[], assets: any) => {
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    if (assets.fontNormalBase64) setupDocFonts(doc, assets);

    const marginX = 15,
      marginY = 15,
      cardSpacingY = 10;
    const cardWidth = 210 - marginX * 2;
    const cardHeight = (297 - marginY * 2 - 3 * cardSpacingY) / 4;

    const drawCardSaida = (registro: any, x: number, y: number) => {
      doc.setDrawColor(0);
      doc.rect(x, y, cardWidth, cardHeight);

      if (assets.logoBase64) {
        doc.addImage(
          `data:image/jpeg;base64,${assets.logoBase64}`,
          "JPEG",
          x + 5,
          y + 5,
          15,
          10,
        );
      }

      const fontName = "helvetica";
      doc.setFont(fontName, "bold");
      doc.setFontSize(10);
      doc.text(
        "AUTORIZAÇÃO DE SAÍDA, ENTRADA OU ATRASO",
        x + cardWidth / 2,
        y + 12,
        { align: "center" },
      );

      doc.setFont(fontName, "normal");
      doc.setFontSize(7);
      doc.text("ITM 229", x + cardWidth - 5, y + 7, { align: "right" });
      doc.text("Rev: 0", x + cardWidth - 5, y + 11, { align: "right" });
      doc.text(`Data: 17/09/2024`, x + cardWidth - 5, y + 15, {
        align: "right",
      });

      const innerX = x + 5,
        innerY = y + 17,
        innerWidth = cardWidth - 10;
      const rowHeight = 4.5,
        textPaddingY = 3,
        textPaddingX = 2;

      doc.rect(innerX, innerY, innerWidth, rowHeight);
      const divider1X = innerX + innerWidth * 0.3;
      doc.line(divider1X, innerY, divider1X, innerY + rowHeight);

      doc.setFontSize(9);
      doc.setFont(fontName, "bold");
      doc.text("MATRÍCULA:", innerX + textPaddingX, innerY + textPaddingY);
      doc.setFont(fontName, "normal");
      doc.text(registro.enrollment, innerX + 23, innerY + textPaddingY);

      doc.setFont(fontName, "bold");
      doc.text("NOME:", divider1X + textPaddingX, innerY + textPaddingY);
      doc.setFont(fontName, "normal");
      doc.text(registro.nome, divider1X + 14, innerY + textPaddingY, {
        maxWidth: innerWidth * 0.7 - 14,
      });

      const row2Y = innerY + rowHeight + 2.5;
      doc.rect(innerX, row2Y, innerWidth, rowHeight);
      const divider2_1 = innerX + innerWidth * 0.23;
      const divider2_2 = innerX + innerWidth * 0.5;
      const divider2_3 = innerX + innerWidth * 0.75;
      doc.line(divider2_1, row2Y, divider2_1, row2Y + rowHeight);
      doc.line(divider2_2, row2Y, divider2_2, row2Y + rowHeight);
      doc.line(divider2_3, row2Y, divider2_3, row2Y + rowHeight);

      const dataFormatada = formatarData(registro.dataHora);

      doc.setFont(fontName, "bold");
      doc.text("SAÍDA:", innerX + textPaddingX, row2Y + textPaddingY);
      const saidaLabelWidth = doc.getTextWidth("SAÍDA:");
      doc.setFont(fontName, "normal");
      doc.text(
        ` ${registro.tipoData === "saida" ? dataFormatada : ""}`,
        innerX + textPaddingX + saidaLabelWidth,
        row2Y + textPaddingY,
      );

      doc.setFont(fontName, "bold");
      doc.text(
        "HORÁRIO SAÍDA:",
        divider2_1 + textPaddingX,
        row2Y + textPaddingY,
      );
      const horarioSaidaLabelWidth = doc.getTextWidth("HORÁRIO SAÍDA:");
      doc.setFont(fontName, "normal");
      doc.text(
        "____:____",
        divider2_1 + textPaddingX + horarioSaidaLabelWidth,
        row2Y + textPaddingY,
      );

      doc.setFont(fontName, "bold");
      doc.text("RETORNO:", divider2_2 + textPaddingX, row2Y + textPaddingY);
      const retornoLabelWidth = doc.getTextWidth("RETORNO:");
      doc.setFont(fontName, "normal");
      doc.text(
        "  ____:____",
        divider2_2 + textPaddingX + retornoLabelWidth,
        row2Y + textPaddingY,
      );

      doc.setFont(fontName, "bold");
      doc.text("ENTRADA:", divider2_3 + textPaddingX, row2Y + textPaddingY);
      const entradaLabelWidth = doc.getTextWidth("ENTRADA:");
      doc.setFont(fontName, "normal");
      doc.text(
        ` ${registro.tipoData === "entrada" ? dataFormatada : ""}`,
        divider2_3 + textPaddingX + entradaLabelWidth,
        row2Y + textPaddingY,
      );

      const row3Y = row2Y + rowHeight + 2.5;
      doc.rect(innerX, row3Y, innerWidth, rowHeight);
      doc.setFont(fontName, "bold");
      doc.text("MOTIVO:", innerX + textPaddingX, row3Y + textPaddingY);
      doc.setFont(fontName, "normal");
      doc.text(registro.motivo, innerX + innerWidth / 2, row3Y + textPaddingY, {
        align: "center",
        maxWidth: innerWidth - 20,
      });

      const assY = y + cardHeight - 12 + 2.5;
      if (assets.assinaturaBase64) {
        doc.addImage(
          `data:image/png;base64,${assets.assinaturaBase64}`,
          "PNG",
          x + 35,
          assY - 17,
          25,
          35,
        );
      }
      doc.line(x + 15, assY, x + 80, assY);
      doc.line(x + 100, assY, x + 165, assY);
      doc.setFontSize(8);
      doc.text("ASSINATURA DO RESPONSÁVEL", x + 47.5, assY + 4, {
        align: "center",
      });
      doc.text("COLABORADOR (A)", x + 132.5, assY + 4, { align: "center" });
    };

    registrosSaida.forEach((registro, i) => {
      if (i > 0 && i % 4 === 0) doc.addPage();
      const cardIndexOnPage = i % 4;
      const x = marginX;
      const y = marginY + cardIndexOnPage * (cardHeight + cardSpacingY);
      drawCardSaida(registro, x, y);
    });

    doc.save(`Autorizacoes_Saida_${dataSelecionada}.pdf`);
  };

  const gerarPDFUber = async (registrosUber: any[], assets: any) => {
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const marginX = 10,
      marginY = 10,
      cardSpacingY = 8,
      cardWidth = 210 - marginX * 2;
    const headerHeight = 10,
      rowHeight = 5,
      signatureHeight = 16,
      footerHeight = 4;
    const totalCardHeight =
      headerHeight + rowHeight * 5 + signatureHeight + footerHeight;

    const dataGeracao = new Date().toLocaleDateString("pt-BR");

    const drawCardUber = (registro: any, x: number, y: number) => {
      let currentY = y;

      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.rect(x, currentY, cardWidth, headerHeight);

      const titleBoxStart = x + 30,
        dataBoxStart = x + cardWidth - 30;
      doc.line(titleBoxStart, currentY, titleBoxStart, currentY + headerHeight);
      doc.line(dataBoxStart, currentY, dataBoxStart, currentY + headerHeight);

      if (assets.logoBase64) {
        doc.addImage(
          `data:image/jpeg;base64,${assets.logoBase64}`,
          "JPEG",
          x + 2,
          currentY + 1,
          25,
          7,
        );
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        "SOLICITAÇÃO DE LIBERAÇÃO DE UBER",
        x + cardWidth / 2,
        currentY + 5.5,
        { align: "center" },
      );

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text("ITM 192/0", x + cardWidth - 16, currentY + 3, {
        align: "center",
      });
      doc.line(dataBoxStart, currentY + 5, x + cardWidth, currentY + 5);
      doc.text(`DATA: 31/10/2023`, x + cardWidth - 16, currentY + 8.5, {
        align: "center",
      });

      currentY += headerHeight;
      const paddingX = 2,
        textYOffset = 3.5;

      doc.rect(x, currentY, cardWidth, rowHeight);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("NOME:", x + paddingX, currentY + textYOffset);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        (registro.nome || "").toUpperCase(),
        x + 15,
        currentY + textYOffset,
      );
      currentY += rowHeight;

      doc.rect(x, currentY, cardWidth, rowHeight);
      const xData = x + 50,
        xHora = x + 120;
      doc.line(xData, currentY, xData, currentY + rowHeight);
      doc.line(xHora, currentY, xHora, currentY + rowHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("MATRÍCULA:", x + paddingX, currentY + textYOffset);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(registro.enrollment || "", x + 22, currentY + textYOffset);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(
        "DATA DE SOLICITAÇÃO:",
        xData + paddingX,
        currentY + textYOffset,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        formatarData(registro.dataHora),
        xData + 38,
        currentY + textYOffset,
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("HORA:", xHora + paddingX, currentY + textYOffset);
      currentY += rowHeight;

      doc.rect(x, currentY, cardWidth, rowHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("MOTIVO:", x + paddingX, currentY + textYOffset);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        (registro.motivo || "").toUpperCase(),
        x + 18,
        currentY + textYOffset,
      );
      currentY += rowHeight;

      doc.rect(x, currentY, cardWidth, rowHeight);
      doc.setFontSize(7);
      const drawCheckbox = (
        label: string,
        bx: number,
        by: number,
        checked = false,
      ) => {
        doc.setFont("helvetica", "normal");
        doc.text(checked ? "( X )" : "(   )", bx, by);
        doc.text(label, bx + 5, by);
      };
      drawCheckbox("Trabalho", x + paddingX, currentY + textYOffset, true);
      drawCheckbox("Saúde", x + 20, currentY + textYOffset, false);
      drawCheckbox("Emergência", x + 35, currentY + textYOffset, false);
      drawCheckbox(
        "Outros: _________________",
        x + 60,
        currentY + textYOffset,
        false,
      );
      currentY += rowHeight;

      doc.rect(x, currentY, cardWidth, rowHeight);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("DESTINO:", x + paddingX, currentY + textYOffset);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        (registro.destino || "").toUpperCase(),
        x + 18,
        currentY + textYOffset,
      );
      currentY += rowHeight;

      doc.rect(x, currentY, cardWidth, signatureHeight);
      doc.line(
        x + cardWidth,
        currentY,
        x + cardWidth,
        currentY + signatureHeight,
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("ASS. DO EMPREGADO (A):", x + paddingX, currentY + 3);
      doc.line(
        x + 10,
        currentY + signatureHeight - 3,
        x + cardWidth / 2 - 10,
        currentY + signatureHeight - 3,
      );

      if (assets.assinaturaBase64) {
        doc.addImage(
          `data:image/png;base64,${assets.assinaturaBase64}`,
          "PNG",
          x + cardWidth - 25 - 30,
          currentY + signatureHeight - 30 + 7,
          25,
          30,
        );
      }

      doc.text(
        "ASS. DO RESPONSÁVEL:",
        x + cardWidth / 2 + paddingX,
        currentY + 3,
      );
      doc.line(
        x + cardWidth / 2 + 10,
        currentY + signatureHeight - 3,
        x + cardWidth - 10,
        currentY + signatureHeight - 3,
      );
      currentY += signatureHeight;

      doc.rect(x, currentY, cardWidth, footerHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text(
        "ENCAMINHAR ESSE DOCUMENTO AO DEPARTAMENTO DE TRANSPORTE",
        x + cardWidth / 2,
        currentY + 3,
        { align: "center" },
      );
    };

    registrosUber.forEach((registro, i) => {
      if (i > 0 && i % 4 === 0) doc.addPage();
      drawCardUber(
        registro,
        marginX,
        marginY + (i % 4) * (totalCardHeight + cardSpacingY),
      );
    });

    doc.save(`Solicitacoes_Uber_${dataGeracao.replace(/\//g, "-")}.pdf`);
  };

  const handleGerarPDF = async () => {
    const registrosParaGerar = registros.filter(
      (r) => r.tipoFormulario === tipoFormulario,
    );
    if (registrosParaGerar.length === 0) return;

    try {
      setIsLoading(true);
      const assets = await loadAssets(comAssinatura);
      if (tipoFormulario === "saida")
        await gerarPDFSaida(registrosParaGerar, assets);
      else await gerarPDFUber(registrosParaGerar, assets);
      showFeedback("PDF gerado com sucesso!", false);
    } catch (error) {
      showFeedback("Erro ao gerar PDF.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const gerarExcel = async () => {
    const registrosParaGerar = registros.filter(
      (r) => r.tipoFormulario === tipoFormulario,
    );
    if (registrosParaGerar.length === 0 || !window.ExcelJS) return;

    try {
      // @ts-ignore
      const workbook = new window.ExcelJS.Workbook();
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
      showFeedback("Ficheiro Excel gerado com sucesso!", false);
    } catch (error) {
      showFeedback("Erro ao gerar Excel.", true);
    }
  };

  const registrosFiltrados = registros.filter(
    (r) => r.tipoFormulario === tipoFormulario,
  );

  // === RENDERIZAÇÃO DA UI ===
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto relative h-full flex flex-col">
      {isLoading && (
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
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            Gestão de Saídas
          </h2>
          <p className="text-slate-500 font-medium">
            Controlo de autorizações e deslocações
          </p>
        </div>
        {feedback && (
          <div
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${feedback.includes("Erro") ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            <AlertCircle size={16} /> {feedback}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-slate-400" />
              1. Selecione o Tipo de Formulário
            </h3>

            {/* Type Selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tipoFormulario === "saida" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setTipoFormulario("saida")}
              >
                Autorização de Saída
              </button>
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tipoFormulario === "uber" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setTipoFormulario("uber")}
              >
                Solicitação de Uber
              </button>
            </div>

            {/* Colaboradores Checklist */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Colaboradores ({colaboradoresSelecionados.length})
                </label>
              </div>
              <div className="relative mb-2">
                <Search
                  className="absolute left-3 top-3 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
                {filteredEmployees.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${colaboradoresSelecionados.includes(e.id) ? "bg-emerald-50 border border-emerald-200" : "hover:bg-white border border-transparent"}`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded border ${colaboradoresSelecionados.includes(e.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {colaboradoresSelecionados.includes(e.id) && (
                        <CheckSquare
                          size={14}
                          className="text-white bg-emerald-500 rounded"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 select-none">
                      {e.name}{" "}
                      <span className="text-slate-400 text-xs ml-1 font-mono">
                        ({e.enrollment || "S/M"})
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={colaboradoresSelecionados.includes(e.id)}
                      onChange={() => handleColaboradorChange(e.id)}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Data e Opções Condicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Data da Ocorrência
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-[46px]"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                />
              </div>

              {tipoFormulario === "saida" && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Preencher data em:
                  </label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[46px]">
                    <label
                      className={`flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-bold transition-all ${tipoData === "saida" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        value="saida"
                        checked={tipoData === "saida"}
                        onChange={(e) => setTipoData(e.target.value)}
                      />
                      Saída
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-bold transition-all ${tipoData === "entrada" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        value="entrada"
                        checked={tipoData === "entrada"}
                        onChange={(e) => setTipoData(e.target.value)}
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
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-[46px]"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="_">VAZIO</option>
                    <option value="ITAM X CASA">ITAM X CASA</option>
                    <option value="CASA X ITAM">CASA X ITAM</option>
                    <option value="CASA X AEGEA RNA">CASA X AEGEA RNA</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded border ${comAssinatura ? "bg-slate-800 border-slate-800 text-white" : "border-slate-300 bg-slate-50"}`}
                >
                  {comAssinatura && (
                    <CheckSquare size={14} className="text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-600">
                  Incluir assinatura do responsável no PDF gerado
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={comAssinatura}
                  onChange={(e) => setComAssinatura(e.target.checked)}
                />
              </label>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Motivo (Aplicado a todos os selecionados)
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.toLocaleUpperCase())}
                placeholder="Ex: Consulta médica / Serviço Externo"
              />
            </div>

            <button
              onClick={handleAddRegistro}
              className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${tipoFormulario === "saida" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
            >
              Adicionar à Lista de Impressão
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: LISTA E ACÇÕES */}
        <div className="lg:col-span-5 space-y-6">
          {/* Caixa de Ações de Exportação */}
          <div className="bg-slate-900 text-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 relative z-10">
              <Download size={20} className="text-emerald-400" />
              3. Gerar Documentos
            </h3>
            <p className="text-slate-400 text-sm mb-6 relative z-10">
              Gere os ficheiros com base na lista de{" "}
              {tipoFormulario === "saida" ? "Saída" : "Uber"} configurada
              abaixo.
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={handleGerarPDF}
                disabled={registrosFiltrados.length === 0 || !libsLoaded}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <FileText size={20} /> Baixar PDF Prontos
              </button>
              <button
                onClick={gerarExcel}
                disabled={registrosFiltrados.length === 0 || !libsLoaded}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} /> Exportar Planilha Excel
              </button>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={20} className="text-slate-400" />
                2. Fila de Impressão
              </h3>
              {registros.length > 0 && (
                <button
                  onClick={handleLimparRegistros}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                  title="Limpar Lista"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {registros.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">
                    Nenhum registo pendente.
                  </p>
                </div>
              ) : (
                registros.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative group"
                  >
                    <button
                      onClick={() => handleRemoverRegistro(r.id)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    <div className="flex items-start gap-2 mb-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${r.tipoFormulario === "saida" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {r.tipoFormulario}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {formatarData(r.dataHora)}
                      </span>
                    </div>
                    <p className="font-bold text-slate-700 text-sm mb-1 pr-6">
                      {r.nome}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-600">
                        Motivo:
                      </span>{" "}
                      {r.motivo}
                    </p>
                    {r.tipoFormulario === "uber" && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        <span className="font-semibold text-slate-600">
                          Dest:
                        </span>{" "}
                        {r.destino}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
