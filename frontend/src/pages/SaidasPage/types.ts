export type TipoFormulario = "saida" | "uber" | "hora_extra" | "servico_semanal";

// Dados partilhados de uma folha de Relação Hora Extra/Compensação — passados
// como parâmetro (em vez de lidos do estado da aba "Hora Extra") para que a
// mesma geração de PDF/Excel/persistência sirva também à aba "Serviço
// Semanal", que reúne Saída + Uber + Hora Extra num só passo.
export interface DadosServicoHoraExtra {
  dataServico: string;
  local: string;
  descricaoServico?: string;
  enderecoServico?: string;
  numeroOS?: string;
  observacao?: string;
}

export interface RegistroSaidaUber {
  id: string;
  employeeId: string;
  nome: string;
  enrollment: string;
  motivo: string;
  dataHora: string;
  tipoFormulario: "saida" | "uber";
  tipoData?: string;
  destino?: string;
  _synced?: boolean;
}
