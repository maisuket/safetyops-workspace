import { useEffect, useState } from "react";
import {
  Search,
  Calendar,
  Car,
  Truck,
  Trash2,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "../../context/EmployeesContext";
import { SaidasService, SaidaRecord } from "../../services/saidas.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
 * Tela de rastreio: consulta o histórico de "Autorização de Saída" e "Uber"
 * já emitidos (gravados no momento em que o PDF/Excel é gerado na tela de
 * Gestão de Saídas). Busca por nome do colaborador e/ou por período.
 * ============================================================================
 */

const formatarData = (iso?: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR");

export const RastreioSaidasPage = () => {
  const { employees } = useEmployees();

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tipo, setTipo] = useState<"all" | "saida" | "uber">("all");

  const [resultados, setResultados] = useState<SaidaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const buscar = async () => {
    try {
      setIsLoading(true);
      const data = await SaidasService.search({
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        tipo: tipo === "all" ? undefined : tipo,
      });
      setResultados(data);
    } catch (error) {
      console.error("Erro ao buscar rastreio de saídas:", error);
      toast.error("Falha ao buscar o rastreio. Verifique a conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
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
      setResultados((prev) => prev.filter((r) => r.id !== deleteTargetId));
      toast.success("Registo removido com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao excluir. Verifique a conexão.",
      );
    } finally {
      setDeleteTargetId(null);
    }
  };

  const enrollmentOf = (r: SaidaRecord) =>
    r.employee?.enrollment ||
    employees.find((e) => e.id === r.employeeId)?.enrollment ||
    "N/A";

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto relative h-full flex flex-col">
      <header className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 hidden sm:flex">
          <Search size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            Rastreio de Saídas
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Consulte todas as autorizações de saída e solicitações de Uber já
            emitidas, por colaborador ou por período
          </p>
        </div>
      </header>

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
                onKeyDown={(e) => e.key === "Enter" && buscar()}
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
                onClick={buscar}
                className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Search size={16} /> Buscar
              </Button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <Table className="w-full text-left relative bg-white">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent">
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
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={28} />
                    <span className="text-slate-400 text-sm">A buscar registos...</span>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                resultados.map((r) => {
                  const dataFormatada = formatarData(r.dataOcorrencia);
                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50 transition-colors">
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
                  <TableCell colSpan={6} className="py-12">
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
          <div className="p-4 border-t border-slate-100 text-sm text-slate-500 font-medium bg-white">
            {resultados.length} registo(s) encontrado(s)
          </div>
        )}
      </Card>

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
    </div>
  );
};
