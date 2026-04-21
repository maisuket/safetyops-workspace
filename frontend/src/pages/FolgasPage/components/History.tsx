import React, { useState, useMemo } from "react";
import {
  Clock,
  Trash2,
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Employee, FolgaRecord } from "../FolgasPage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- History Component ---
interface HistoryComponentProps {
  records: FolgaRecord[];
  employees: Employee[];
  isLoading: boolean;
  deleteRecord: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export const HistoryComponent: React.FC<HistoryComponentProps> = ({
  records,
  employees,
  isLoading,
  deleteRecord,
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "trabalho" | "folga">(
    "all",
  );

  // Filtro inteligente e memoizado para performance
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const emp = employees.find((e) => e.id === record.employeeId);

      // Busca por nome do colaborador, descrição ou referência
      const matchesSearch =
        (emp?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.refDate || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por tipo (todos, trabalho, folga)
      const matchesType = filterType === "all" || record.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [records, employees, searchTerm, filterType]);

  return (
    <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      {/* Header com Filtros */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
        <h2 className="text-lg font-bold text-slate-800">
          Histórico de Lançamentos
        </h2>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder="Buscar colaborador ou desc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 bg-slate-50 rounded-xl text-sm transition-all"
            />
          </div>

          <Select
            value={filterType}
            onValueChange={(val: any) => setFilterType(val)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 rounded-xl h-10">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <SelectValue placeholder="Filtros" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="trabalho">Apenas Créditos</SelectItem>
              <SelectItem value="folga">Apenas Folgas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
        <Table className="w-full text-left relative bg-white">
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-500">
                Data
              </TableHead>
              <TableHead className="font-semibold text-slate-500">
                Tipo
              </TableHead>
              <TableHead className="font-semibold text-slate-500">
                Colaborador
              </TableHead>
              <TableHead className="font-semibold text-slate-500">
                Descrição/Referência
              </TableHead>
              <TableHead className="font-semibold text-slate-500 text-right">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => {
              const emp = employees.find((e) => e.id === record.employeeId);
              return (
                <TableRow
                  key={record.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="text-sm text-slate-600 font-mono py-4">
                    {new Date(record.date).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </TableCell>
                  <TableCell className="py-4">
                    {record.type === "trabalho" ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <TrendingUp size={14} /> Crédito
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                        <Clock size={14} /> Folga
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-black text-slate-700 py-4">
                    {emp?.name || "Desconhecido"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 italic py-4">
                    {record.description ||
                      (record.refDate ? `Ref: ${record.refDate}` : "N/A")}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecord(record.id)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                      title="Excluir Lançamento"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredRecords.length === 0 && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-slate-400"
                >
                  Nenhum registo encontrado com estes filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de Paginação */}
      <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm bg-white">
        <span className="font-medium text-slate-500">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="flex items-center gap-1 rounded-lg"
          >
            <ChevronLeft size={16} />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="flex items-center gap-1 rounded-lg"
          >
            Próximo
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
