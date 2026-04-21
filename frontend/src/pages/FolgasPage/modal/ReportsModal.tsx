import { Calendar, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Report Modal Component ---
interface ReportModalProps {
  setIsReportModalOpen: (isOpen: boolean) => void;
  generateFolgasReport: (e: React.FormEvent) => void;
  reportPeriod: any;
  setReportPeriod: (period: any) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  setIsReportModalOpen,
  generateFolgasReport,
  reportPeriod,
  setReportPeriod,
}) => (
  <Dialog
    open={true}
    onOpenChange={(open) => {
      if (!open) setIsReportModalOpen(false);
    }}
  >
    <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-white border-none rounded-3xl gap-0 [&>button]:text-white flex flex-col">
      <DialogHeader className="p-6 bg-amber-500 text-white m-0 shrink-0">
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          <Calendar size={20} /> Relatório de Folgas
        </DialogTitle>
      </DialogHeader>

      <div className="p-6">
        <form
          id="reportForm"
          onSubmit={generateFolgasReport}
          className="space-y-4"
        >
          <p className="text-sm text-slate-500 mb-4">
            Selecione o período para gerar o PDF detalhado de todas as folgas.
          </p>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={reportPeriod.start}
              onChange={(e) =>
                setReportPeriod({ ...reportPeriod, start: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={reportPeriod.end}
              onChange={(e) =>
                setReportPeriod({ ...reportPeriod, end: e.target.value })
              }
              required
            />
          </div>
        </form>
      </div>
      <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl">
        <button
          type="submit"
          form="reportForm"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
        >
          <FileText size={20} /> Gerar PDF
        </button>
      </div>
    </DialogContent>
  </Dialog>
);
