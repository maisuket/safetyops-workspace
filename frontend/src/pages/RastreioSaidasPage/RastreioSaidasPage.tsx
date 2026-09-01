import { useEffect, useState } from "react";
import {
  Search,
  Calendar,
  Car,
  Truck,
  Timer,
  Trash2,
  Loader2,
  X,
  Filter,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "../../context/EmployeesContext";
import { SaidasService, SaidaRecord } from "../../services/saidas.service";
import { HoraExtraService, HoraExtraRecord } from "../../services/hora-extra.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTabs } from "@/components/ui/page-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * ============================================================================
 * 📂 src/pages/RastreioSaidasPage/RastreioSaidasPage.tsx
 * Tela de rastreio: consulta o histórico de "Autorização de Saída", "Uber" e
 * "Relação Hora Extra/Compensação" já emitidos (gravados no momento em que o
 * PDF/Excel é gerado na tela de Gestão de Saídas). Busca por colaborador
 * e/ou por período.
 * ============================================================================
 */

const PAGE_SIZE = 20;

const formatarData = (iso?: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR");

// Mesmo padrão visual de checkbox já usado no LaunchModal (Folgas), para
// manter consistência em vez de introduzir outro estilo de seleção.
const RowCheckbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onChange}
    aria-label={label}
    title={label}
    className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-colors ${
      checked
        ? "bg-emerald-500 border-emerald-500"
        : "border-slate-300 bg-white hover:border-emerald-400"
    }`}
  >
    {checked && <CheckSquare size={14} className="text-white" />}
  </button>
);

export const RastreioSaidasPage = () => {
  const { employees } = useEmployees();
  const [activeTab, setActiveTab] = useState<"saidas" | "hora_extra">("saidas");

  // ==========================================================================
  // SAÍDA / UBER
  // ==========================================================================
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tipo, setTipo] = useState<"all" | "saida" | "uber">("all");

  const [resultados, setResultados] = useState<SaidaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Seleção para exclusão em lote — limpa sempre que uma nova busca é feita,
  // já que as linhas selecionadas podem não estar mais na lista.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const buscar = async (page = currentPage) => {
    try {
      setIsLoading(true);
      const { data, total } = await SaidasService.search(
        {
          search: search.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          tipo: tipo === "all" ? undefined : tipo,
        },
        page,
        PAGE_SIZE,
      );
      setResultados(data);
      setTotalRecords(total);
      setCurrentPage(page);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erro ao buscar rastreio de saídas:", error);
      toast.error("Falha ao buscar o rastreio. Verifique a conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Busca explícita (filtros mudaram) sempre reinicia a paginação — senão o
  // utilizador poderia ficar preso numa página 5 que não existe mais para o
  // novo filtro.
  const buscarDoInicio = () => buscar(1);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    resultados.length > 0 && selectedIds.size === resultados.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(resultados.map((r) => r.id)));
  };

  // Carrega a lista inicial (mais recentes primeiro, sem filtros) assim que a tela abre
  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limparFiltros = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setTipo("all");
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await SaidasService.remove(deleteTargetId);
      toast.success("Registo removido com sucesso.");
      // Se este era o único registo da página atual (e não é a primeira),
      // volta para a página anterior em vez de recarregar uma página vazia.
      const voltarPagina = resultados.length === 1 && currentPage > 1;
      await buscar(voltarPagina ? currentPage - 1 : currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao excluir. Verifique a conexão.",
      );
    } finally {
      setDeleteTargetId(null);
    }
  };

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const confirmBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    try {
      const { count } = await SaidasService.removeBulk(ids);
      toast.success(`${count} registo(s) removido(s) com sucesso.`);
      const voltarPagina = ids.length >= resultados.length && currentPage > 1;
      await buscar(voltarPagina ? currentPage - 1 : currentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao excluir. Verifique a conexão.",
      );
    } finally {
      setShowBulkDeleteConfirm(false);
    }
  };

  const enrollmentOf = (r: SaidaRecord) =>
    r.employee?.enrollment ||
    employees.find((e) => e.id === r.employeeId)?.enrollment ||
    "N/A";

  // ==========================================================================
  // HORA EXTRA
  // ==========================================================================
  const [heSearch, setHeSearch] = useState("");
  const [heStartDate, setHeStartDate] = useState("");
  const [heEndDate, setHeEndDate] = useState("");

  const [heResultados, setHeResultados] = useState<HoraExtraRecord[]>([]);
  const [heIsLoading, setHeIsLoading] = useState(true);
  const [heSelectedIds, setHeSelectedIds] = useState<Set<string>>(new Set());

  const [heCurrentPage, setHeCurrentPage] = useState(1);
  const [heTotalRecords, setHeTotalRecords] = useState(0);
  const heTotalPages = Math.max(1, Math.ceil(heTotalRecords / PAGE_SIZE));

  const buscarHoraExtra = async (page = heCurrentPage) => {
    try {
      setHeIsLoading(true);
      const { data, total } = await HoraExtraService.search(
        {
          search: heSearch.trim() || undefined,
          startDate: heStartDate || undefined,
          endDate: heEndDate || undefined,
        },
        page,
        PAGE_SIZE,
      );
      setHeResultados(data);
      setHeTotalRecords(total);
      setHeCurrentPage(page);
      setHeSelectedIds(new Set());
    } catch (error) {
      console.error("Erro ao buscar rastreio de horas extras:", error);
      toast.error("Falha ao buscar o rastreio. Verifique a conexão com o servidor.");
    } finally {
      setHeIsLoading(false);
    }
  };

  const buscarHoraExtraDoInicio = () => buscarHoraExtra(1);

  const toggleHeSelected = (id: string) => {
    setHeSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const heAllSelected =
    heResultados.length > 0 && heSelectedIds.size === heResultados.length;

  const toggleHeSelectAll = () => {
    setHeSelectedIds(
      heAllSelected ? new Set() : new Set(heResultados.map((r) => r.id)),
    );
  };

  // Carrega a aba de Hora Extra só quando o utilizador entra nela pela
  // primeira vez (ou volta a ela) — evita uma requisição desnecessária para
  // quem nunca chega a abrir essa aba.
  useEffect(() => {
    if (activeTab === "hora_extra") buscarHoraExtra(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const limparFiltrosHoraExtra = () => {
    setHeSearch("");
    setHeStartDate("");
    setHeEndDate("");
  };

  const [heDeleteTargetId, setHeDeleteTargetId] = useState<string | null>(null);

  const handleHeDelete = (id: string) => {
    setHeDeleteTargetId(id);
  };

  const confirmHeDelete = async () => {
    if (!heDeleteTargetId) return;
    try {
      await HoraExtraService.remove(heDeleteTargetId);
      toast.success("Registo removido com sucesso.");
      const voltarPagina = heResultados.length === 1 && heCurrentPage > 1;
      await buscarHoraExtra(voltarPagina ? heCurrentPage - 1 : heCurrentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao excluir. Verifique a conexão.",
      );
    } finally {
      setHeDeleteTargetId(null);
    }
  };

  const [heShowBulkDeleteConfirm, setHeShowBulkDeleteConfirm] = useState(false);

  const confirmHeBulkDelete = async () => {
    const ids = [...heSelectedIds];
    if (ids.length === 0) return;
    try {
      const { count } = await HoraExtraService.removeBulk(ids);
      toast.success(`${count} registo(s) removido(s) com sucesso.`);
      const voltarPagina = ids.length >= heResultados.length && heCurrentPage > 1;
      await buscarHoraExtra(voltarPagina ? heCurrentPage - 1 : heCurrentPage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao excluir. Verifique a conexão.",
      );
    } finally {
      setHeShowBulkDeleteConfirm(false);
    }
  };

  const heEnrollmentOf = (r: HoraExtraRecord) =>
    r.employee?.enrollment ||
    employees.find((e) => e.id === r.employeeId)?.enrollment ||
    "N/A";

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto relative h-full flex flex-col">
      <header className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 hidden sm:flex">
          <Search size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            Rastreio de Saídas
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Consulte todas as autorizações de saída, solicitações de Uber e
            folhas de Hora Extra já emitidas, por colaborador ou por período
          </p>
        </div>
      </header>

      <div className="mb-6">
        <PageTabs
          tabs={[
            { key: "saidas", label: "Saída / Uber" },
            { key: "hora_extra", label: "Hora Extra" },
          ]}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as "saidas" | "hora_extra")}
          accentColor="emerald"
        />
      </div>

      {activeTab === "saidas" ? (
      <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Filtros */}
        <div className="p-6 border-b border-slate-50 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                placeholder="Buscar por colaborador, motivo ou destino..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarDoInicio()}
                className="w-full pl-9 bg-slate-50 rounded-xl text-sm"
              />
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 rounded-xl text-sm"
              title="Data inicial"
              aria-label="Data inicial"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 rounded-xl text-sm"
              title="Data final"
              aria-label="Data final"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Select value={tipo} onValueChange={(val: any) => setTipo(val)}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-50 rounded-xl h-10">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <SelectValue placeholder="Tipo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="saida">Apenas Saída</SelectItem>
                <SelectItem value="uber">Apenas Uber</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={limparFiltros}
                className="rounded-xl gap-2"
              >
                <X size={16} /> Limpar Filtros
              </Button>
              <Button
                onClick={buscarDoInicio}
                className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Search size={16} /> Buscar
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de ação em lote — só aparece com algo selecionado */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-emerald-700">
              {selectedIds.size} selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-xl"
              >
                Limpar seleção
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="rounded-xl gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 size={16} /> Excluir Selecionados
              </Button>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <Table className="w-full text-left relative bg-white">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <RowCheckbox
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    label="Selecionar todos os resultados"
                  />
                </TableHead>
                <TableHead className="font-semibold text-slate-500">Data</TableHead>
                <TableHead className="font-semibold text-slate-500">Tipo</TableHead>
                <TableHead className="font-semibold text-slate-500">Colaborador</TableHead>
                <TableHead className="font-semibold text-slate-500">Motivo / Destino</TableHead>
                <TableHead className="font-semibold text-slate-500">Emitido em</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={28} />
                    <span className="text-slate-400 text-sm">A buscar registos...</span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                resultados.map((r) => {
                  const dataFormatada = formatarData(r.dataOcorrencia);
                  return (
                    <TableRow
                      key={r.id}
                      className={`transition-colors ${selectedIds.has(r.id) ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-slate-50"}`}
                    >
                      <TableCell>
                        <RowCheckbox
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelected(r.id)}
                          label={`Selecionar registo de ${r.employee?.name || "colaborador"}`}
                        />
                      </TableCell>
                      <TableCell className="text-sm py-4">
                        {dataFormatada ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-slate-600">{dataFormatada}</span>
                            {r.tipo === "saida" && r.tipoData && (
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Data de {r.tipoData === "saida" ? "Saída" : "Entrada"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                            Sem data
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {r.tipo === "saida" ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 w-fit">
                            <Truck size={12} /> Saída
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700 w-fit">
                            <Car size={12} /> Uber
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700">
                            {r.employee?.name || "Desconhecido"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {enrollmentOf(r)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 py-4 max-w-xs">
                        <span className="line-clamp-2">{r.motivo}</span>
                        {r.destino && (
                          <span className="block text-xs text-blue-600 font-bold mt-1">
                            → {r.destino}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono py-4">
                        {formatarDataHora(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(r.id)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                          title="Excluir Registo"
                          aria-label="Excluir Registo"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {!isLoading && resultados.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12">
                    <EmptyState
                      icon={<Search size={32} className="text-slate-300" />}
                      title="Nenhuma saída encontrada"
                      description="Não foi possível encontrar registos com estes filtros."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm bg-white">
            <span className="font-medium text-slate-500">
              {totalRecords} registo(s) encontrado(s)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscar(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className="flex items-center gap-1 rounded-lg"
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscar(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="flex items-center gap-1 rounded-lg"
              >
                Próximo
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
      ) : (
      <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Filtros */}
        <div className="p-6 border-b border-slate-50 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                placeholder="Buscar por colaborador, local ou nº OS..."
                value={heSearch}
                onChange={(e) => setHeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarHoraExtraDoInicio()}
                className="w-full pl-9 bg-slate-50 rounded-xl text-sm"
              />
            </div>
            <Input
              type="date"
              value={heStartDate}
              onChange={(e) => setHeStartDate(e.target.value)}
              className="bg-slate-50 rounded-xl text-sm"
              title="Data inicial"
              aria-label="Data inicial"
            />
            <Input
              type="date"
              value={heEndDate}
              onChange={(e) => setHeEndDate(e.target.value)}
              className="bg-slate-50 rounded-xl text-sm"
              title="Data final"
              aria-label="Data final"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={limparFiltrosHoraExtra}
              className="rounded-xl gap-2"
            >
              <X size={16} /> Limpar Filtros
            </Button>
            <Button
              onClick={buscarHoraExtraDoInicio}
              className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Search size={16} /> Buscar
            </Button>
          </div>
        </div>

        {/* Barra de ação em lote — só aparece com algo selecionado */}
        {heSelectedIds.size > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-emerald-700">
              {heSelectedIds.size} selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHeSelectedIds(new Set())}
                className="rounded-xl"
              >
                Limpar seleção
              </Button>
              <Button
                size="sm"
                onClick={() => setHeShowBulkDeleteConfirm(true)}
                className="rounded-xl gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 size={16} /> Excluir Selecionados
              </Button>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <Table className="w-full text-left relative bg-white">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <RowCheckbox
                    checked={heAllSelected}
                    onChange={toggleHeSelectAll}
                    label="Selecionar todos os resultados"
                  />
                </TableHead>
                <TableHead className="font-semibold text-slate-500">Data do Serviço</TableHead>
                <TableHead className="font-semibold text-slate-500">Colaborador</TableHead>
                <TableHead className="font-semibold text-slate-500">Local</TableHead>
                <TableHead className="font-semibold text-slate-500">Descrição / Nº OS</TableHead>
                <TableHead className="font-semibold text-slate-500">Emitido em</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heIsLoading && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={28} />
                    <span className="text-slate-400 text-sm">A buscar registos...</span>
                  </TableCell>
                </TableRow>
              )}

              {!heIsLoading &&
                heResultados.map((r) => (
                  <TableRow
                    key={r.id}
                    className={`transition-colors ${heSelectedIds.has(r.id) ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-slate-50"}`}
                  >
                    <TableCell>
                      <RowCheckbox
                        checked={heSelectedIds.has(r.id)}
                        onChange={() => toggleHeSelected(r.id)}
                        label={`Selecionar registo de ${r.employee?.name || "colaborador"}`}
                      />
                    </TableCell>
                    <TableCell className="text-sm py-4 font-mono text-slate-600">
                      {formatarData(r.dataServico)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700">
                          {r.employee?.name || "Desconhecido"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {heEnrollmentOf(r)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700 w-fit">
                        <Timer size={12} /> {r.local}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 py-4 max-w-xs">
                      <span className="line-clamp-2">{r.descricaoServico || "-"}</span>
                      {r.numeroOS && (
                        <span className="block text-xs text-slate-400 font-mono mt-1">
                          OS: {r.numeroOS}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono py-4">
                      {formatarDataHora(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHeDelete(r.id)}
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        title="Excluir Registo"
                        aria-label="Excluir Registo"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

              {!heIsLoading && heResultados.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12">
                    <EmptyState
                      icon={<Timer size={32} className="text-slate-300" />}
                      title="Nenhuma folha de hora extra encontrada"
                      description="Não foi possível encontrar registos com estes filtros."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!heIsLoading && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm bg-white">
            <span className="font-medium text-slate-500">
              {heTotalRecords} registo(s) encontrado(s)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">
                Página {heCurrentPage} de {heTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarHoraExtra(heCurrentPage - 1)}
                disabled={heCurrentPage <= 1 || heIsLoading}
                className="flex items-center gap-1 rounded-lg"
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarHoraExtra(heCurrentPage + 1)}
                disabled={heCurrentPage >= heTotalPages || heIsLoading}
                className="flex items-center gap-1 rounded-lg"
              >
                Próximo
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
      )}

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="Excluir Registo de Saída"
        icon={<Trash2 size={20} />}
        description="Tem a certeza que deseja excluir este registo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Excluir Registos Selecionados"
        icon={<Trash2 size={20} />}
        description={`Tem a certeza que deseja excluir ${selectedIds.size} registo(s) selecionado(s)? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmBulkDelete}
      />

      <ConfirmDialog
        open={!!heDeleteTargetId}
        onOpenChange={(open) => {
          if (!open) setHeDeleteTargetId(null);
        }}
        title="Excluir Registo de Hora Extra"
        icon={<Trash2 size={20} />}
        description="Tem a certeza que deseja excluir este registo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmHeDelete}
      />

      <ConfirmDialog
        open={heShowBulkDeleteConfirm}
        onOpenChange={setHeShowBulkDeleteConfirm}
        title="Excluir Registos Selecionados"
        icon={<Trash2 size={20} />}
        description={`Tem a certeza que deseja excluir ${heSelectedIds.size} registo(s) selecionado(s)? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmHeBulkDelete}
      />
    </div>
  );
};
