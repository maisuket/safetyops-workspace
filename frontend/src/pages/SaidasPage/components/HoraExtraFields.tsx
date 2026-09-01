import { Input } from "@/components/ui/input";

interface HoraExtraFieldsProps {
  heDataServico: string;
  onHeDataServicoChange: (v: string) => void;
  heNumeroOS: string;
  onHeNumeroOSChange: (v: string) => void;
  heLocal: string;
  onHeLocalChange: (v: string) => void;
  heDescricaoServico: string;
  onHeDescricaoServicoChange: (v: string) => void;
  heEnderecoServico: string;
  onHeEnderecoServicoChange: (v: string) => void;
  heObservacao: string;
  onHeObservacaoChange: (v: string) => void;
}

export const HoraExtraFields = ({
  heDataServico,
  onHeDataServicoChange,
  heNumeroOS,
  onHeNumeroOSChange,
  heLocal,
  onHeLocalChange,
  heDescricaoServico,
  onHeDescricaoServicoChange,
  heEnderecoServico,
  onHeEnderecoServicoChange,
  heObservacao,
  onHeObservacaoChange,
}: HoraExtraFieldsProps) => {
  return (
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
            onChange={(e) => onHeDataServicoChange(e.target.value)}
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
            onChange={(e) => onHeNumeroOSChange(e.target.value)}
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
          onChange={(e) => onHeLocalChange(e.target.value.toLocaleUpperCase())}
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
          onChange={(e) => onHeDescricaoServicoChange(e.target.value)}
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
          onChange={(e) => onHeEnderecoServicoChange(e.target.value)}
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
          onChange={(e) => onHeObservacaoChange(e.target.value)}
        />
      </div>
    </>
  );
};
