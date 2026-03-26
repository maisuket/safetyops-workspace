import { Calendar, FileText, X } from "lucide-react";

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
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
      <div className="p-6 bg-amber-500 text-white flex justify-between items-center shrink-0">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar size={20} /> Relatório de Folgas
        </h3>
        <button
          onClick={() => setIsReportModalOpen(false)}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>
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
    </div>
  </div>
);
