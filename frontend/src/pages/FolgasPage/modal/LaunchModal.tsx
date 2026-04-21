import {
  CheckSquare,
  Search,
  Users,
  Briefcase,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border-none rounded-3xl gap-0 [&>button]:text-white flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-slate-900 text-white m-0 shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users size={20} /> Lançamento em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto grow">
          <form
            id="recordForm"
            onSubmit={handleAddRecord}
            className="space-y-6"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-slate-700">
                  Selecione os Colaboradores
                </label>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                  {newRecord.employeeIds.length} selecionado(s)
                </span>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl pl-11 h-12 text-sm focus-visible:ring-emerald-500"
                />
              </div>
              <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
                {filteredEmployees.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${newRecord.employeeIds.includes(e.id) ? "bg-emerald-50 border-emerald-200 shadow-sm" : "hover:bg-slate-200/50 border-transparent"}`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${newRecord.employeeIds.includes(e.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {newRecord.employeeIds.includes(e.id) && (
                        <CheckSquare
                          size={14}
                          className="text-white bg-emerald-500 rounded"
                        />
                      )}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${newRecord.employeeIds.includes(e.id) ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                    >
                      {e.name.charAt(0)}
                    </div>
                    <div className="flex flex-col select-none">
                      <span className="text-sm font-bold text-slate-700 leading-tight">
                        {e.name}
                      </span>
                      <span className="text-xs text-slate-400 font-medium leading-tight mt-0.5 flex items-center gap-1">
                        <Briefcase size={10} /> {e.enrollment || "S/M"}
                      </span>
                    </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Tipo de Lançamento
                </label>
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setNewRecord({ ...newRecord, type: "trabalho" })
                    }
                    className={`flex-1 h-auto py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${newRecord.type === "trabalho" ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-emerald-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                  >
                    <TrendingUp size={16} className="mr-2" /> CRÉDITO
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setNewRecord({ ...newRecord, type: "folga" })
                    }
                    className={`flex-1 h-auto py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${newRecord.type === "folga" ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50 hover:bg-white hover:text-amber-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                  >
                    <Clock size={16} className="mr-2" /> DÉBITO
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Data{" "}
                  {newRecord.type === "trabalho" ? "do Serviço" : "da Folga"}
                </label>
                <Input
                  type="date"
                  className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 px-4 focus-visible:ring-emerald-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Local de Trabalho
                  </label>
                  <Select
                    value={isCustomLocal ? "OUTRO" : newRecord.local}
                    onValueChange={(val) => {
                      if (val === "OUTRO") {
                        setIsCustomLocal(true);
                        setNewRecord({ ...newRecord, local: "" });
                      } else {
                        setIsCustomLocal(false);
                        setNewRecord({ ...newRecord, local: val });
                      }
                    }}
                    required={!isCustomLocal}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-12 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione o local..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ITAM">ITAM</SelectItem>
                      <SelectItem value="LG">LG</SelectItem>
                      <SelectItem value="HONDA">HONDA</SelectItem>
                      <SelectItem value="ENERGISA/COPASA">
                        ENERGISA/COPASA
                      </SelectItem>
                      <SelectItem value="OUTRO">Outro...</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomLocal && (
                    <Input
                      type="text"
                      className="w-full mt-3 bg-white border-slate-200 rounded-xl h-12 px-4 focus-visible:ring-emerald-500"
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
                  <Input
                    type="text"
                    className="w-full bg-white border-slate-200 rounded-xl h-12 px-4 focus-visible:ring-emerald-500"
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
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Referente a qual Serviço/Domingo?
                </label>
                <Select
                  value={
                    isCustomRefDate
                      ? "outro"
                      : newRecord.refDate ===
                          "Compensação - baixar banco de horas"
                        ? "banco_horas"
                        : newRecord.refDate
                  }
                  onValueChange={(val) => {
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
                  <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-12 focus:ring-amber-500">
                    <SelectValue
                      placeholder={
                        newRecord.employeeIds.length === 0
                          ? "Selecione os colaboradores acima primeiro..."
                          : pastWorksOptions.length === 0
                            ? "Nenhum domingo pendente encontrado!"
                            : "Selecione do histórico pendente..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {pastWorksOptions.map((work, idx) => (
                      <SelectItem key={idx} value={work.refString}>
                        {new Date(work.date).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}{" "}
                        | {work.local || "Geral"} |{" "}
                        {work.description?.substring(0, 35) || "Sem desc."}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="banco_horas"
                      className="font-bold text-amber-700"
                    >
                      ⚖️ Compensação - Banco de Horas
                    </SelectItem>
                    <SelectItem value="outro">
                      Lançamento Antigo (Digitar manualmente)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {isCustomRefDate && (
                  <Input
                    type="text"
                    className="w-full mt-3 bg-white border-slate-200 rounded-xl h-12 px-4 focus-visible:ring-amber-500"
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
          <Button
            type="submit"
            form="recordForm"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-2xl transition-all shadow-xl shadow-slate-900/20 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={newRecord.employeeIds.length === 0}
          >
            Salvar Lançamentos ({newRecord.employeeIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
