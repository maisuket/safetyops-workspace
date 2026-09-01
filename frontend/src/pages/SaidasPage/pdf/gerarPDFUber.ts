import { formatarData } from "../utils";

export const gerarPDFUber = async (jsPDF: any, registrosUber: any[], assets: any) => {
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

    // A solicitação de Uber é sempre assinada fisicamente (empregado e
    // responsável do transporte) — ao contrário da Autorização de Saída, não
    // deve trazer a assinatura digital sobreposta, mesmo com "Incluir
    // assinatura do responsável" marcado.
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
