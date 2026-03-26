import { CheckSquare, Search, Users, X } from "lucide-react";
import { useState } from "react";

interface LaunchModalProps {
  closeModal: () => void;
  handleAddRecord: (e: React.FormEvent) => void;
  newRecord: any;
  setNewRecord: (record: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredEmployees: any[];
  toggleEmployeeSelection: (id: string) => void;
  pastWorksOptions: any[];
}

export const LaunchModal: React.FC<LaunchModalProps> = ({
  closeModal,
  handleAddRecord,
  newRecord,
  setNewRecord,
  searchTerm,
  setSearchTerm,
  filteredEmployees,
  toggleEmployeeSelection,
  pastWorksOptions,
}) => {
  const [isCustomLocal, setIsCustomLocal] = useState(false);
  const [isCustomRefDate, setIsCustomRefDate] = useState(false); // NOVO: Controle de digitação manual da folga

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} /> Lançamento em Lote
          </h3>
          <button
            onClick={closeModal}
            className="hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto grow">
          <form
            id="recordForm"
            onSubmit={handleAddRecord}
            className="space-y-5"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-slate-700">
                  Selecione os Colaboradores
                </label>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {newRecord.employeeIds.length} selecionado(s)
                </span>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-t-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="h-40 overflow-y-auto border-x border-b border-slate-200 rounded-b-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
                {filteredEmployees.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${newRecord.employeeIds.includes(e.id) ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-200 border border-transparent"}`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded border ${newRecord.employeeIds.includes(e.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {newRecord.employeeIds.includes(e.id) && (
                        <CheckSquare
                          size={14}
                          className="text-white bg-emerald-500 rounded"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 select-none">
                      {e.name}
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={newRecord.employeeIds.includes(e.id)}
                      onChange={() => toggleEmployeeSelection(e.id)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Tipo de Lançamento
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setNewRecord({ ...newRecord, type: "trabalho" })
                    }
                    className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${newRecord.type === "trabalho" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}
                  >
                    CRÉDITO
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewRecord({ ...newRecord, type: "folga" })
                    }
                    className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${newRecord.type === "folga" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500"}`}
                  >
                    DÉBITO
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Data{" "}
                  {newRecord.type === "trabalho" ? "do Serviço" : "da Folga"}
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-[38px] mt-1"
                  value={newRecord.date}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Renderização Condicional baseada no Tipo */}
            {newRecord.type === "trabalho" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Local de Trabalho
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-[38px]"
                    value={isCustomLocal ? "OUTRO" : newRecord.local}
                    onChange={(e) => {
                      if (e.target.value === "OUTRO") {
                        setIsCustomLocal(true);
                        setNewRecord({ ...newRecord, local: "" });
                      } else {
                        setIsCustomLocal(false);
                        setNewRecord({ ...newRecord, local: e.target.value });
                      }
                    }}
                    required={!isCustomLocal}
                  >
                    <option value="">Selecione o local...</option>
                    <option value="ITAM">ITAM</option>
                    <option value="DENSO">LG</option>
                    <option value="HONDA">HONDA</option>
                    <option value="ENERGISA/COPASA">ENERGISA/COPASA</option>
                    <option value="OUTRO">Outro...</option>
                  </select>
                  {isCustomLocal && (
                    <input
                      type="text"
                      className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Digite o local..."
                      value={newRecord.local}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, local: e.target.value })
                      }
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Descrição do Serviço
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-[38px]"
                    placeholder="Ex: Correção de vazamento..."
                    value={newRecord.description}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Referente a qual Serviço/Domingo?
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-[38px]"
                  value={
                    isCustomRefDate
                      ? "outro"
                      : newRecord.refDate ===
                          "Compensação - baixar banco de horas"
                        ? "banco_horas"
                        : newRecord.refDate
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "outro") {
                      setIsCustomRefDate(true);
                      setNewRecord({ ...newRecord, refDate: "" });
                    } else if (val === "banco_horas") {
                      setIsCustomRefDate(false);
                      setNewRecord({
                        ...newRecord,
                        refDate: "Compensação - baixar banco de horas",
                      });
                    } else {
                      setIsCustomRefDate(false);
                      setNewRecord({ ...newRecord, refDate: val });
                    }
                  }}
                  required={!isCustomRefDate}
                >
                  <option value="">
                    {newRecord.employeeIds.length === 0
                      ? "Selecione os colaboradores acima primeiro..."
                      : pastWorksOptions.length === 0
                        ? "Nenhum domingo pendente encontrado!"
                        : "Selecione do histórico pendente..."}
                  </option>

                  {/* Histórico Dinâmico */}
                  {pastWorksOptions.map((work, idx) => (
                    <option key={idx} value={work.refString}>
                      {new Date(work.date).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}{" "}
                      | {work.local || "Geral"} |{" "}
                      {work.description?.substring(0, 35) || "Sem desc."}
                    </option>
                  ))}

                  {/* Opção Rápida de Banco de Horas */}
                  <option
                    value="banco_horas"
                    className="font-bold text-amber-700"
                  >
                    ⚖️ Compensação - Banco de Horas
                  </option>

                  {/* Opção Livre */}
                  <option value="outro">
                    Lançamento Antigo (Digitar manualmente)
                  </option>
                </select>

                {isCustomRefDate && (
                  <input
                    type="text"
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Ex: 22/03/2026 - ITAM"
                    value={newRecord.refDate}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, refDate: e.target.value })
                    }
                    required
                  />
                )}
              </div>
            )}
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl">
          <button
            type="submit"
            form="recordForm"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={newRecord.employeeIds.length === 0}
          >
            Salvar Lançamentos ({newRecord.employeeIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
