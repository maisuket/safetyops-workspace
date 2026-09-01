import { formatarData } from "../utils";
import type { DadosServicoHoraExtra } from "../types";

// === RELAÇÃO HORA EXTRA/COMPENSAÇÃO (ITM 031) ===
// Diferente de Saída/Uber, é um único documento com uma tabela de até 32
// colaboradores (paginada em blocos de 32 quando a seleção é maior), dados
// do serviço partilhados e um bloco de aprovação com 4 assinaturas.
export const HORA_EXTRA_ROWS_PER_PAGE = 32;

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

const desenharRodapeHoraExtra = (
  doc: any,
  pageWidth: number,
  pageHeight: number,
  y: number,
  dados: DadosServicoHoraExtra,
) => {
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
  doc.text(`Local: ${dados.local || ""}`, marginX + 2, curY + TEXTO_TOPO);
  curY += campoH;

  doc.rect(marginX, curY, w * 0.5, campoH);
  doc.text(`Descrição do Serviço: ${dados.descricaoServico || ""}`, marginX + 2, curY + TEXTO_TOPO);
  curY += campoH;

  doc.rect(marginX, curY, w * 0.5, campoH);
  doc.text(`Endereço do Serviço: ${dados.enderecoServico || ""}`, marginX + 2, curY + TEXTO_TOPO);
  curY += campoH;

  const numeroOSH = 4.5;
  doc.rect(marginX, curY, w * 0.5, numeroOSH);
  doc.text(`Nº OS.: ${dados.numeroOS || ""}`, marginX + 2, curY + TEXTO_TOPO);
  curY += numeroOSH;

  // Observação cobre a coluna inteira (Local + Descrição + Endereço + Nº
  // OS) — a linha vertical do card continua até o final desta secção, em
  // vez de parar antes.
  const obsTotalH = espacoAteNumeroOS + numeroOSH;
  doc.rect(marginX + w * 0.5, obsTopY, w * 0.5, obsTotalH);
  doc.text(`Observação: ${dados.observacao || ""}`, marginX + w * 0.5 + 2, obsTopY + TEXTO_TOPO);

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

export const gerarPDFHoraExtra = async (
  jsPDF: any,
  autoTable: any,
  empsSelecionados: any[],
  dados: DadosServicoHoraExtra,
  logoBase64?: string,
) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dataFormatada = formatarData(dados.dataServico);

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
        emp ? dados.local : "",
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
        1: { cellWidth: 20, halign: "center", fontSize: 5.5 },
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
    const rodapeFinalY = desenharRodapeHoraExtra(doc, pageWidth, pageHeight, footerY, dados);

    // Linha rodeando todo o conteúdo da página, do topo do cabeçalho até o
    // fim do bloco de aprovação — como no formulário físico original.
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(8, bordaTopoY, pageWidth - 16, rodapeFinalY - bordaTopoY);
  });

  doc.save(`Relacao_Hora_Extra_${dados.dataServico}.pdf`);
};
