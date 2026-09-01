import { formatarData } from "../utils";
import { HORA_EXTRA_ROWS_PER_PAGE } from "./gerarPDFHoraExtra";
import type { DadosServicoHoraExtra } from "../types";

export const gerarExcelHoraExtra = async (
  ExcelJS: any,
  empsSelecionados: any[],
  dados: DadosServicoHoraExtra,
) => {
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
      local: emp ? dados.local : "",
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
  worksheet.addRow({ item: "Data:", local: formatarData(dados.dataServico) });
  worksheet.addRow({ item: "Local do Serviço:", local: dados.local });
  worksheet.addRow({ item: "Descrição do Serviço:", local: dados.descricaoServico || "-" });
  worksheet.addRow({ item: "Endereço do Serviço:", local: dados.enderecoServico || "-" });
  worksheet.addRow({ item: "Nº OS:", local: dados.numeroOS || "-" });
  worksheet.addRow({ item: "Observação:", local: dados.observacao || "-" });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Relacao_Hora_Extra_${dados.dataServico}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
