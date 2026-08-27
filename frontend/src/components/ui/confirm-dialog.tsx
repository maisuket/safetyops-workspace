import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** "danger" (padrão) para ações destrutivas — rose; "default" para confirmações neutras — slate */
  variant?: "danger" | "default";
}

/**
 * Diálogo de confirmação padrão do app. Centraliza o padrão visual que antes
 * era copiado em cada tela (Equipe, Folgas, Saídas, Rastreio de Saídas), o
 * que já causou inconsistência real: dois diálogos de exclusão usavam
 * cabeçalho neutro (slate) em vez do "perigo" (rose) usado nos demais.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "danger",
}) => {
  const headerBg = variant === "danger" ? "bg-rose-600" : "bg-slate-900";
  const confirmClasses =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : "bg-slate-900 hover:bg-slate-800 text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-white border-none rounded-3xl gap-0">
        <DialogHeader className={`p-6 ${headerBg} text-white m-0`}>
          <DialogTitle className="font-bold text-lg flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm">{description}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl font-bold"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 rounded-2xl font-bold ${confirmClasses}`}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
