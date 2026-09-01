import { formatarData, setupDocFonts } from "../utils";

export const gerarPDFSaida = async (
  jsPDF: any,
  registrosSaida: any[],
  assets: any,
  dataArquivo: string,
) => {
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

  doc.save(`Autorizacoes_Saida_${dataArquivo}.pdf`);
};
