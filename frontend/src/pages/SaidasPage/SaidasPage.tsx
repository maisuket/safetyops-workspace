import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Trash2,
  Car,
  Search,
  CheckSquare,
  Loader2,
  MapPin,
  Clock,
  Timer,
  Briefcase,
  X,
  Plus,
  User,
} from "lucide-react";
import { useEmployees } from "../../context/EmployeesContext";
import { SaidasService } from "../../services/saidas.service";
import { HoraExtraService } from "../../services/hora-extra.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

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

const SAIDAS_FILA_STORAGE_KEY = "itam_saidas_fila_impressao";

const formatarData = (isoDate: string) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

export const SaidasPage = () => {
  // === ESTADOS ===
  const { employees: allEmployees, isLoadingEmployees } = useEmployees();
  const employees = useMemo(
    () => allEmployees.filter((e: any) => e.active !== false),
    [allEmployees],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [tipoFormulario, setTipoFormulario] = useState<
    "saida" | "uber" | "hora_extra"
  >("saida");
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

  useEffect(() => {
    try {
      localStorage.setItem(SAIDAS_FILA_STORAGE_KEY, JSON.stringify(registros));
    } catch {
      // Armazenamento indisponível (ex: modo privado) — a fila continua
      // funcionando normalmente em memória, só não sobrevive a um reload.
    }
  }, [registros]);

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

  const gerarPDFSaida = async (jsPDF: any, registrosSaida: any[], assets: any) => {
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

  const gerarPDFUber = async (jsPDF: any, registrosUber: any[], assets: any) => {
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

  // === RELAÇÃO HORA EXTRA/COMPENSAÇÃO (ITM 031) ===
  // Diferente de Saída/Uber, é um único documento com uma tabela de até 32
  // colaboradores (paginada em blocos de 32 quando a seleção é maior), dados
  // do serviço partilhados e um bloco de aprovação com 4 assinaturas.
  const HORA_EXTRA_ROWS_PER_PAGE = 32;

  const desenharCabecalhoHoraExtra = (doc: any, pageWidth: number, logoBase64?: string) => {
    const marginX = 8;
    const topY = 8;
    const boxH = 12;

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(marginX, topY, pageWidth - marginX * 2, boxH);

    // Largura alinhada com a grade vertical da tabela abaixo: logo =
    // ITEM+LOCAL (10+20); caixa de Código/DATA = N+HORÁRIO SAÍDA (6+18=24),
    // ficando exatamente no meio de PRECISA DE ROTA (S e N têm a mesma
    // largura, então o meio de S+N cai bem na divisória entre eles) —
    // título ocupa todo o espaço restante (sem borda entre logo e título,
    // para não fragmentar visualmente essa área).
    const logoBoxW = 30;
    const infoBoxW = 24;
    const infoBoxX = pageWidth - marginX - infoBoxW;
    doc.line(infoBoxX, topY, infoBoxX, topY + boxH);

    if (logoBase64) {
      const logoW = 18;
      const logoH = 8;
      doc.addImage(
        `data:image/jpeg;base64,${logoBase64}`,
        "JPEG",
        marginX + (logoBoxW - logoW) / 2,
        topY + (boxH - logoH) / 2,
        logoW,
        logoH,
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ITAM", marginX + logoBoxW / 2, topY + boxH / 2 + 2, {
        align: "center",
      });
    }

    // Título centralizado na sua zona (entre a logo e a caixa de
    // Código/DATA). Fonte ajustada dinamicamente para nunca invadir a
    // caixa de Código/Versão.
    doc.setFont("helvetica", "bold");
    const tituloTexto = "RELAÇÃO HORA EXTRA/COMPENSAÇÃO";
    const tituloMaxW = infoBoxX - (marginX + logoBoxW) - 5;
    let tituloFontSize = 10;
    doc.setFontSize(tituloFontSize);
    while (tituloFontSize > 6 && doc.getTextWidth(tituloTexto) > tituloMaxW) {
      tituloFontSize -= 0.25;
      doc.setFontSize(tituloFontSize);
    }
    doc.text(
      tituloTexto,
      marginX + logoBoxW + (infoBoxX - (marginX + logoBoxW)) / 2,
      topY + boxH / 2 + 2,
      { align: "center" },
    );

    // Caixa de Código/Versão ficou bem mais estreita (28mm) — fonte ajustada
    // dinamicamente para "Data da Versão: 02/09/2025" (a linha mais longa)
    // caber sem estourar a borda.
    doc.setFont("helvetica", "normal");
    const codigoLinhas = ["Código: ITM 031", "Versão: 02", "Data da Versão: 02/09/2025"];
    const codigoMaxW = infoBoxW - 3;
    let codigoFontSize = 6.5;
    doc.setFontSize(codigoFontSize);
    while (
      codigoFontSize > 4 &&
      codigoLinhas.some((linha) => doc.getTextWidth(linha) > codigoMaxW)
    ) {
      codigoFontSize -= 0.25;
      doc.setFontSize(codigoFontSize);
    }
    const codigoLinhaH = boxH / (codigoLinhas.length + 1);
    codigoLinhas.forEach((linha, i) => {
      doc.text(linha, infoBoxX + 1.5, topY + codigoLinhaH * (i + 1));
    });

    return topY + boxH;
  };

  const desenharLinhaDeptSetorData = (
    doc: any,
    pageWidth: number,
    y: number,
    dataFormatada: string,
  ) => {
    const marginX = 8;
    const rowH = 8;
    // Grade de 5 células alinhada com a tabela abaixo, cada uma do tamanho
    // exato de uma coluna (ou metade dela): DEPARTAMENTO (label) = ITEM+
    // LOCAL (30); ASSISTENCIA TÉCNICA (valor) = NOME (67); SETOR (label) =
    // metade de ASSINATURA (24.5); ASSISTÊNCIA TÉCNICA (valor) = do fim da
    // célula anterior até o início de DATA; DATA = N+HORÁRIO SAÍDA (24),
    // no meio de PRECISA DE ROTA.
    const deptLabelW = 30;
    const deptValueW = 67;
    const setorLabelW = 24.5;
    const infoBoxW = 24;
    const dataColX = pageWidth - marginX - infoBoxW;
    const w2 = dataColX - marginX;

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(marginX, y, w2, rowH);
    doc.rect(dataColX, y, infoBoxW, rowH);

    const deptLabelText = "DEPARTAMENTO:";
    const deptValueText = "ASSISTENCIA TÉCNICA";
    const setorLabelText = "SETOR:";
    const setorValueText = "ASSISTÊNCIA TÉCNICA";
    const padding = 1.5;

    doc.setFont("helvetica", "bold");

    const c1 = marginX + deptLabelW;
    const c2 = c1 + deptValueW;
    const c3 = c2 + setorLabelW;
    doc.line(c1, y, c1, y + rowH);
    doc.line(c2, y, c2, y + rowH);
    doc.line(c3, y, c3, y + rowH);

    // Todas as células agora têm espaço de sobra — fonte fixa, mas ainda
    // encolhida via getTextWidth se algum dia não couber (ex: nomes de
    // departamento/setor maiores no futuro).
    const fitSingle = (text: string, maxWidth: number, startSize: number) => {
      let size = startSize;
      doc.setFontSize(size);
      while (size > 4 && doc.getTextWidth(text) > maxWidth) {
        size -= 0.25;
        doc.setFontSize(size);
      }
      return size;
    };
    const deptLabelSize = fitSingle(deptLabelText, deptLabelW - padding * 2, 7);
    const setorLabelSize = fitSingle(setorLabelText, c3 - c2 - padding * 2, 7);
    const deptValueSize = fitSingle(deptValueText, deptValueW - padding * 2, 9);
    const setorValueSize = fitSingle(setorValueText, dataColX - c3 - padding * 2, 9);

    const textY = y + rowH / 2 + 1.5;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(deptLabelSize);
    doc.text(deptLabelText, marginX + (c1 - marginX) / 2, textY, { align: "center" });
    doc.setFontSize(setorLabelSize);
    doc.text(setorLabelText, c2 + (c3 - c2) / 2, textY, { align: "center" });

    // "ASSISTENCIA TÉCNICA" em vermelho, igual ao original — "ASSISTÊNCIA
    // TÉCNICA" (Setor) já vem em preto. Valores centralizados na sua célula.
    doc.setFontSize(deptValueSize);
    doc.setTextColor(190, 0, 0);
    doc.text(deptValueText, c1 + (c2 - c1) / 2, textY, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(setorValueSize);
    doc.text(setorValueText, c3 + (dataColX - c3) / 2, textY, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("DATA", dataColX + infoBoxW / 2, y + 3, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(dataFormatada, dataColX + infoBoxW / 2, y + 6.5, { align: "center" });

    return y + rowH;
  };

  const desenharRodapeHoraExtra = (doc: any, pageWidth: number, pageHeight: number, y: number) => {
    const marginX = 8;
    const w = pageWidth - marginX * 2;

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);

    // Título "Local do(s) Serviço(s) Realizado(s)" com a mesma barra cinza
    // usada em "APROVAÇÃO", em vez de texto solto sem destaque.
    doc.setFillColor(230, 230, 230);
    doc.rect(marginX, y, w, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Local do (s) Serviço (s) Realizado (s):", pageWidth / 2, y + 3.5, {
      align: "center",
    });
    let curY = y + 5;

    // Texto sempre encostado no topo da caixa (não centralizado
    // verticalmente), como no formulário físico original.
    const TEXTO_TOPO = 3.2;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bolditalic");

    // Local, Descrição do Serviço e Endereço do Serviço agora são 3 caixas
    // com borda própria, cada uma com a mesma altura, dividindo igualmente
    // todo o espaço disponível até o topo de Nº OS. Observação é uma única
    // caixa alta à direita que cobre as 3 juntas + Nº OS — a linha vertical
    // do card continua até o final desta secção.
    const obsTopY = curY;
    const espacoAteNumeroOS = 30.5;
    const campoH = espacoAteNumeroOS / 3;

    doc.rect(marginX, curY, w * 0.5, campoH);
    doc.text(`Local: ${heLocal || ""}`, marginX + 2, curY + TEXTO_TOPO);
    curY += campoH;

    doc.rect(marginX, curY, w * 0.5, campoH);
    doc.text(`Descrição do Serviço: ${heDescricaoServico || ""}`, marginX + 2, curY + TEXTO_TOPO);
    curY += campoH;

    doc.rect(marginX, curY, w * 0.5, campoH);
    doc.text(`Endereço do Serviço: ${heEnderecoServico || ""}`, marginX + 2, curY + TEXTO_TOPO);
    curY += campoH;

    const numeroOSH = 4.5;
    doc.rect(marginX, curY, w * 0.5, numeroOSH);
    doc.text(`Nº OS.: ${heNumeroOS || ""}`, marginX + 2, curY + TEXTO_TOPO);
    curY += numeroOSH;

    // Observação cobre a coluna inteira (Local + Descrição + Endereço + Nº
    // OS) — a linha vertical do card continua até o final desta secção, em
    // vez de parar antes.
    const obsTotalH = espacoAteNumeroOS + numeroOSH;
    doc.rect(marginX + w * 0.5, obsTopY, w * 0.5, obsTotalH);
    doc.text(`Observação: ${heObservacao || ""}`, marginX + w * 0.5 + 2, obsTopY + TEXTO_TOPO);

    // Nota legal
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.text(
      "Assinatura para horas extras realizada. Funcionário (s) acima relacionado (s).",
      marginX + 2,
      curY + 4,
    );
    curY += 5.5;

    // Linha cinzenta dividindo a assinatura dos avisos numerados abaixo —
    // mesmo tom de cinza usado nas barras de título.
    doc.setFillColor(230, 230, 230);
    doc.rect(marginX, curY, w, 1.5, "F");
    curY += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    const notas = [
      "1. ESSE DOCUMENTO SOMENTE TERÁ VALIDADE SE CONSTAR A ASSINATURA NOS TRÊS CAMPOS DE APROVAÇÃO, CONFORME ESPECIFICADO ABAIXO.",
      "2. ESSE DOCUMENTO NÃO PODERÁ SER RASURADO.",
      "3. ESSE DOCUMENTO DEVERÁ ACOMPANHAR TODO E QUALQUER SERVIÇO FORA DO HORÁRIO DE EXPEDIENTE, PARA CONTROLE DE HORA EXTRA DO DEPARTAMENTO PESSOAL.",
    ];
    const notasPaddingLeft = 2;
    notas.forEach((linha, i) => {
      doc.text(linha, marginX + notasPaddingLeft, curY + 2.8 + i * 2.8, {
        maxWidth: w - notasPaddingLeft,
      });
    });
    curY += 2.8 * notas.length + 3;

    // Aprovação
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setFillColor(230, 230, 230);
    doc.rect(marginX, curY, w, 5, "FD");
    doc.text("APROVAÇÃO", pageWidth / 2, curY + 3.5, { align: "center" });
    curY += 5;

    const aprovadores = [
      "GESTOR RESPONSÁVEL",
      "DIRETOR INDUSTRIAL",
      "DIRETOR GERAL",
      "RECURSOS HUMANOS",
    ];
    const colW = w / aprovadores.length;
    const linhaY = Math.min(curY + 18, pageHeight - 16);
    aprovadores.forEach((label, i) => {
      const cx = marginX + colW * i + colW / 2;
      doc.setDrawColor(0);
      doc.line(cx - colW * 0.4, linhaY, cx + colW * 0.4, linhaY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(label, cx, linhaY + 4, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Data: ___/___/___", cx, linhaY + 8, { align: "center" });
    });

    return linhaY + 12;
  };

  const gerarPDFHoraExtra = async (
    jsPDF: any,
    autoTable: any,
    empsSelecionados: any[],
    logoBase64?: string,
  ) => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const dataFormatada = formatarData(heDataServico);

    const chunks: any[][] = [];
    for (let i = 0; i < empsSelecionados.length; i += HORA_EXTRA_ROWS_PER_PAGE) {
      chunks.push(empsSelecionados.slice(i, i + HORA_EXTRA_ROWS_PER_PAGE));
    }
    if (chunks.length === 0) chunks.push([]);

    chunks.forEach((chunk, pageIndex) => {
      if (pageIndex > 0) doc.addPage();

      let y = desenharCabecalhoHoraExtra(doc, pageWidth, logoBase64);
      y = desenharLinhaDeptSetorData(doc, pageWidth, y, dataFormatada);

      const body: any[] = [];
      for (let i = 0; i < HORA_EXTRA_ROWS_PER_PAGE; i++) {
        const emp = chunk[i];
        body.push([
          String(i + 1),
          emp ? heLocal : "",
          emp ? `${emp.name} - ${emp.enrollment || "S/M"}` : "",
          "",
          "",
          "",
          "",
          "",
        ]);
      }

      autoTable(doc, {
        startY: y,
        margin: { left: 8, right: 8 },
        head: [
          [
            { content: "ITEM", rowSpan: 2 },
            { content: "LOCAL", rowSpan: 2 },
            { content: "NOME", rowSpan: 2 },
            { content: "ASSINATURA", rowSpan: 2 },
            { content: "HORÁRIO\nENTRADA", rowSpan: 2 },
            { content: "PRECISA DE ROTA", colSpan: 2 },
            { content: "HORÁRIO\nSAÍDA", rowSpan: 2 },
          ],
          ["S", "N"],
        ],
        body,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 0.9, valign: "middle", lineColor: [0, 0, 0], lineWidth: 0.2 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", halign: "center", fontSize: 6 },
        columnStyles: {
          // Larguras somam exatamente a largura útil da página (pageWidth -
          // margin*2 = 194mm), para a tabela preencher a mesma largura da
          // caixa do cabeçalho em vez de sobrar espaço em branco à direita.
          // LOCAL e PRECISA DE ROTA (S/N) mais estreitas; o espaço liberado
          // vai para NOME.
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 67 },
          3: { cellWidth: 49 },
          4: { cellWidth: 18, halign: "center" },
          5: { cellWidth: 6, halign: "center" },
          6: { cellWidth: 6, halign: "center" },
          7: { cellWidth: 18, halign: "center" },
        },
      });

      // Estimativa da altura total do rodapé (título + 4 caixas + nota legal
      // + aprovação com assinaturas) — se não sobrar espaço suficiente até o
      // fim da página, o rodapé vai para uma página nova em vez de ser
      // desenhado por cima da margem inferior (conteúdo cortado/invisível).
      const RODAPE_ALTURA_ESTIMADA = 100;
      const finalY = (doc as any).lastAutoTable.finalY;
      let footerY = finalY + 2;
      let bordaTopoY = 8;
      if (footerY + RODAPE_ALTURA_ESTIMADA > pageHeight - 8) {
        doc.addPage();
        footerY = 10;
        bordaTopoY = 10;
      }
      const rodapeFinalY = desenharRodapeHoraExtra(doc, pageWidth, pageHeight, footerY);

      // Linha rodeando todo o conteúdo da página, do topo do cabeçalho até o
      // fim do bloco de aprovação — como no formulário físico original.
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(8, bordaTopoY, pageWidth - 16, rodapeFinalY - bordaTopoY);
    });

    doc.save(`Relacao_Hora_Extra_${heDataServico}.pdf`);
  };

  const gerarExcelHoraExtra = async (ExcelJS: any, empsSelecionados: any[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Hora Extra");

    worksheet.columns = [
      { header: "ITEM", key: "item", width: 6 },
      { header: "LOCAL", key: "local", width: 22 },
      { header: "NOME", key: "nome", width: 40 },
      { header: "MATRICULA", key: "matricula", width: 14 },
      { header: "ASSINATURA", key: "assinatura", width: 20 },
      { header: "HORÁRIO ENTRADA", key: "entrada", width: 16 },
      { header: "PRECISA DE ROTA (S/N)", key: "rota", width: 18 },
      { header: "HORÁRIO SAÍDA", key: "saida", width: 16 },
    ];

    for (let i = 0; i < HORA_EXTRA_ROWS_PER_PAGE; i++) {
      const emp = empsSelecionados[i];
      worksheet.addRow({
        item: i + 1,
        local: emp ? heLocal : "",
        nome: emp?.name || "",
        matricula: emp?.enrollment || "",
        assinatura: "",
        entrada: "",
        rota: "",
        saida: "",
      });
    }

    worksheet.addRow({});
    worksheet.addRow({ item: "Departamento:", local: "ASSISTENCIA TÉCNICA" });
    worksheet.addRow({ item: "Setor:", local: "ASSISTÊNCIA TÉCNICA" });
    worksheet.addRow({ item: "Data:", local: formatarData(heDataServico) });
    worksheet.addRow({ item: "Local do Serviço:", local: heLocal });
    worksheet.addRow({ item: "Descrição do Serviço:", local: heDescricaoServico || "-" });
    worksheet.addRow({ item: "Endereço do Serviço:", local: heEnderecoServico || "-" });
    worksheet.addRow({ item: "Nº OS:", local: heNumeroOS || "-" });
    worksheet.addRow({ item: "Observação:", local: heObservacao || "-" });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relacao_Hora_Extra_${heDataServico}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const persistHoraExtra = async (empsSelecionados: any[]) => {
    await HoraExtraService.createBulk({
      dataServico: heDataServico,
      local: heLocal,
      descricaoServico: heDescricaoServico || undefined,
      enderecoServico: heEnderecoServico || undefined,
      numeroOS: heNumeroOS || undefined,
      observacao: heObservacao || undefined,
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

    try {
      setIsLoading(true);
      const [{ default: jsPDF }, { default: autoTable }, assets] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        loadAssets(false),
      ]);
      await gerarPDFHoraExtra(jsPDF, autoTable, empsSelecionados, assets.logoBase64);
      await persistHoraExtra(empsSelecionados);
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

    try {
      setIsLoading(true);
      const ExcelJS = await import("exceljs");
      await gerarExcelHoraExtra(ExcelJS, empsSelecionados);
      await persistHoraExtra(empsSelecionados);
      toast.success("Folha de Hora Extra (Excel) gerada com sucesso!");
      setColaboradoresSelecionados([]);
    } catch (error) {
      console.error("Erro ao gerar folha de hora extra:", error);
      toast.error("Erro ao gerar a folha de Hora Extra.");
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
        await gerarPDFSaida(jsPDF, registrosParaGerar, assets);
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

            {/* Type Selector */}
            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
              <Button
                variant="ghost"
                className={`flex-1 h-auto py-3 text-sm font-bold rounded-xl transition-all ${tipoFormulario === "saida" ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-emerald-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                onClick={() => setTipoFormulario("saida")}
              >
                <Clock size={18} className="mr-2" /> Autorização de Saída
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 h-auto py-3 text-sm font-bold rounded-xl transition-all ${tipoFormulario === "uber" ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-blue-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                onClick={() => setTipoFormulario("uber")}
              >
                <Car size={18} className="mr-2" /> Solicitação de Uber
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 h-auto py-3 text-sm font-bold rounded-xl transition-all ${tipoFormulario === "hora_extra" ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-amber-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                onClick={() => setTipoFormulario("hora_extra")}
              >
                <Timer size={18} className="mr-2" /> Hora Extra
              </Button>
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
                <Input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl pl-10 h-11 text-sm"
                />
              </div>
              <div className="h-56 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
                {filteredEmployees.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${colaboradoresSelecionados.includes(e.id) ? "bg-emerald-50 border-emerald-200 shadow-sm" : "hover:bg-slate-200/50 border-transparent"}`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${colaboradoresSelecionados.includes(e.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {colaboradoresSelecionados.includes(e.id) && (
                        <CheckSquare
                          size={14}
                          className="text-white bg-emerald-500 rounded"
                        />
                      )}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colaboradoresSelecionados.includes(e.id) ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                    >
                      {e.name.charAt(0)}
                    </div>
                    <div className="flex flex-col select-none">
                      <span className="text-sm font-bold text-slate-700 leading-tight">
                        {e.name}
                      </span>
                      <span className="text-xs text-slate-400 font-medium leading-tight mt-0.5 flex items-center gap-1">
                        <Briefcase size={10} /> {e.enrollment || "S/M"}
                      </span>
                    </div>
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

            {tipoFormulario !== "hora_extra" ? (
              <>
                {/* Data e Opções Condicionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Data da Ocorrência
                    </label>
                    <Input
                      type="date"
                      className={`w-full border-slate-200 rounded-xl h-12 px-4 transition-all ${dataEmBranco ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60" : "bg-slate-50"}`}
                      value={dataEmBranco ? "" : dataSelecionada}
                      onChange={(e) => setDataSelecionada(e.target.value)}
                      disabled={dataEmBranco}
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <div
                        className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-all ${dataEmBranco ? "bg-slate-700 border-slate-700" : "border-slate-300 bg-white"}`}
                        onClick={() => setDataEmBranco((v) => !v)}
                      >
                        {dataEmBranco && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-xs font-medium text-slate-500"
                        onClick={() => setDataEmBranco((v) => !v)}
                      >
                        Emitir com data em branco
                      </span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={dataEmBranco}
                        onChange={(e) => setDataEmBranco(e.target.checked)}
                      />
                    </label>
                  </div>

                  {tipoFormulario === "saida" && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Preencher data em:
                      </label>
                      <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-12">
                        <label
                          className={`flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-bold transition-all ${tipoData === "saida" ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
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
                          className={`flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-bold transition-all ${tipoData === "entrada" ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
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
                      <Select value={destino} onValueChange={setDestino}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">VAZIO</SelectItem>
                          <SelectItem value="ITAM X CASA">ITAM X CASA</SelectItem>
                          <SelectItem value="CASA X ITAM">CASA X ITAM</SelectItem>
                          <SelectItem value="CASA X AEGEA RNA">
                            CASA X AEGEA RNA
                          </SelectItem>
                        </SelectContent>
                      </Select>
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

                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Motivo (Aplicado a todos os selecionados)
                  </label>
                  <Input
                    type="text"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4 uppercase"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value.toLocaleUpperCase())}
                    placeholder="Ex: Consulta médica / Serviço Externo"
                  />
                </div>

                <Button
                  onClick={handleAddRegistro}
                  className={`w-full h-14 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 ${tipoFormulario === "saida" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
                >
                  <Plus size={20} /> Adicionar à Lista de Impressão
                </Button>
              </>
            ) : (
              <>
                {/* Dados do Serviço (Relação Hora Extra/Compensação) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Data do Serviço
                    </label>
                    <Input
                      type="date"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                      value={heDataServico}
                      onChange={(e) => setHeDataServico(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Nº OS (Opcional)
                    </label>
                    <Input
                      type="text"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                      value={heNumeroOS}
                      onChange={(e) => setHeNumeroOS(e.target.value)}
                      placeholder="Ex: OS-4521"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Local do Serviço
                  </label>
                  <Input
                    type="text"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                    value={heLocal}
                    onChange={(e) => setHeLocal(e.target.value.toLocaleUpperCase())}
                    placeholder="Ex: AMBAR ENERGIA - RORAIMA"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Descrição do Serviço (Opcional)
                  </label>
                  <Input
                    type="text"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                    value={heDescricaoServico}
                    onChange={(e) => setHeDescricaoServico(e.target.value)}
                    placeholder="Ex: Parametrização e testes em relé"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Endereço do Serviço (Opcional)
                  </label>
                  <Input
                    type="text"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                    value={heEnderecoServico}
                    onChange={(e) => setHeEnderecoServico(e.target.value)}
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Observação (Opcional)
                  </label>
                  <Input
                    type="text"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                    value={heObservacao}
                    onChange={(e) => setHeObservacao(e.target.value)}
                  />
                </div>
              </>
            )}
          </Card>
        </div>

        {/* COLUNA DIREITA: LISTA E ACÇÕES */}
        <div className="lg:col-span-5 space-y-6">
          {/* Caixa de Ações de Exportação */}
          <div className="bg-slate-900 text-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

            <h3 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10">
              <Download size={20} className="text-emerald-400" />
              3. Gerar Documentos
            </h3>
            <p className="text-slate-400 font-medium text-sm mb-8 relative z-10">
              {tipoFormulario === "hora_extra"
                ? `Gere a folha de Relação Hora Extra/Compensação com os ${colaboradoresSelecionados.length} colaborador(es) selecionado(s).`
                : <>Gere os ficheiros finalizados em PDF ou Excel com base na lista de{" "}
                    {tipoFormulario === "saida" ? "Saída" : "Uber"} configurada
                    abaixo.</>}
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <Button
                onClick={tipoFormulario === "hora_extra" ? handleGerarHoraExtraPDF : handleGerarPDF}
                disabled={
                  tipoFormulario === "hora_extra"
                    ? colaboradoresSelecionados.length === 0 || !heLocal.trim()
                    : registrosFiltrados.length === 0
                }
                className="w-full h-14 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <FileText size={20} /> {tipoFormulario === "hora_extra" ? "Gerar PDF" : "Baixar PDF Prontos"}
              </Button>
              <Button
                onClick={tipoFormulario === "hora_extra" ? handleGerarHoraExtraExcel : gerarExcel}
                disabled={
                  tipoFormulario === "hora_extra"
                    ? colaboradoresSelecionados.length === 0 || !heLocal.trim()
                    : registrosFiltrados.length === 0
                }
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <Download size={20} /> {tipoFormulario === "hora_extra" ? "Gerar Excel" : "Exportar Planilha Excel"}
              </Button>
            </div>
          </div>

          {/* Lista de Registros — não se aplica a Hora Extra, que gera direto */}
          {tipoFormulario !== "hora_extra" && (
          <Card className="rounded-3xl shadow-sm border-slate-100 p-6 md:p-8 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <Briefcase size={20} className="text-slate-400" />
                2. Fila de Impressão
              </h3>
              {registros.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLimparRegistros}
                  className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg h-10 w-10"
                  title="Limpar Lista"
                  aria-label="Limpar Lista"
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {registros.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <FileText size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Fila Vazia</p>
                  <p className="text-xs text-slate-400 mt-1 text-center max-w-[200px]">
                    Adicione colaboradores ao lado para gerar documentos.
                  </p>
                </div>
              ) : (
                registros.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 pl-5 bg-white border border-slate-200 rounded-2xl relative group shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${r.tipoFormulario === "saida" ? "bg-emerald-400" : "bg-blue-400"}`}
                    ></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoverRegistro(r.id)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      title="Remover da Lista"
                      aria-label="Remover da Lista"
                    >
                      <X size={16} />
                    </Button>
                    <div className="flex items-start gap-2 mb-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${r.tipoFormulario === "saida" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {r.tipoFormulario}
                      </span>
                      <span className={`text-xs font-bold ${r.dataHora ? "text-slate-400" : "text-amber-500 italic"}`}>
                        {r.dataHora ? formatarData(r.dataHora) : "Sem data"}
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
          </Card>
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
