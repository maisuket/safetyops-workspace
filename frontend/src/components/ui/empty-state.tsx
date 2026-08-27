import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

/**
 * Estado vazio padrão para tabelas/listas. Antes cada tela tinha o seu:
 * Equipe já usava este padrão (ícone + título + descrição, borda tracejada);
 * Histórico e Dashboard de Folgas e o Rastreio de Saídas só mostravam uma
 * linha de texto simples. Centralizado para ficar visualmente consistente.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 mx-2 sm:mx-6 p-8">
    <div className="bg-white p-4 rounded-full shadow-sm mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-slate-700 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 text-center max-w-sm">
        {description}
      </p>
    )}
  </div>
);
