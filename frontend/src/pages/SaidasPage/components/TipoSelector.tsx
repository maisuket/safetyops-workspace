import type { ReactNode } from "react";
import { Clock, Car, Timer, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TipoFormulario } from "../types";

interface Opcao {
  tipo: TipoFormulario;
  label: string;
  icon: ReactNode;
  activeClass: string;
}

const OPCOES: Opcao[] = [
  {
    tipo: "saida",
    label: "Saída",
    icon: <Clock size={18} />,
    activeClass: "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-emerald-700",
  },
  {
    tipo: "uber",
    label: "Uber",
    icon: <Car size={18} />,
    activeClass: "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-blue-700",
  },
  {
    tipo: "hora_extra",
    label: "Hora Extra",
    icon: <Timer size={18} />,
    activeClass: "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-amber-700",
  },
  {
    tipo: "servico_semanal",
    label: "Serviço Semanal",
    icon: <Briefcase size={18} />,
    activeClass: "bg-white text-violet-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-violet-700",
  },
];

interface TipoSelectorProps {
  tipoFormulario: TipoFormulario;
  onChange: (tipo: TipoFormulario) => void;
}

// Grid fixo de 2 colunas (2 linhas) em vez de uma linha flex única — com 4
// abas e rótulos em português, uma linha só não tinha espaço para todas sem
// estourar o container (texto/ícone cortados na borda do card). O grid usa a
// largura real do card, que é mais estreita que o viewport (a página tem
// sidebar + coluna de ações ao lado), então basear a quebra em breakpoints
// de viewport (sm:, md:) não é confiável — 2 colunas sempre é que garante
// espaço de sobra para o rótulo mais longo ("Serviço Semanal").
export const TipoSelector = ({ tipoFormulario, onChange }: TipoSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-8">
      {OPCOES.map((opcao) => (
        <Button
          key={opcao.tipo}
          variant="ghost"
          className={`h-auto py-3 px-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 min-w-0 ${tipoFormulario === opcao.tipo ? opcao.activeClass : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          onClick={() => onChange(opcao.tipo)}
        >
          <span className="shrink-0">{opcao.icon}</span>
          <span className="truncate">{opcao.label}</span>
        </Button>
      ))}
    </div>
  );
};
