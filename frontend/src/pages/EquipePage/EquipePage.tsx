import React, { useState, useEffect } from "react";
import {
  Users,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  Edit3,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  Briefcase,
  User,
  Hash,
} from "lucide-react";
import { INITIAL_EMPLOYEES } from "../../services/data-initial";
import { EmployeesService } from "../../services/employees.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const EquipePage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", enrollment: "" });

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await EmployeesService.findAll(1, 1000).catch(() => ({
        data: [],
        total: 0,
      }));
      const data = response.data || [];

      // Fallback para mock local se API falhar
      if (data.length === 0) {
        const mock = localStorage.getItem("itam_employees_mock");
        if (mock) setEmployees(JSON.parse(mock));
        else {
          const initial = INITIAL_EMPLOYEES.map((name, i) => ({
            id: `mock-${i}`,
            name,
            enrollment: `ITAM${100 + i}`,
            active: true,
          }));
          setEmployees(initial);
          localStorage.setItem("itam_employees_mock", JSON.stringify(initial));
        }
      } else {
        setEmployees(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Simulação de base de dados local para pré-visualização
  const saveToMock = (newEmployees: any[]) => {
    setEmployees(newEmployees);
    localStorage.setItem("itam_employees_mock", JSON.stringify(newEmployees));
  };

  const handleOpenModal = (employee: any = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        enrollment: employee.enrollment || "",
      });
    } else {
      setEditingEmployee(null);
      setFormData({ name: "", enrollment: "" });
    }
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsLoading(true);
      if (editingEmployee) {
        // Modo Edição
        await EmployeesService.update(editingEmployee.id, formData).catch(
          () => {
            // Fallback Local
            const updated = employees.map((emp) =>
              emp.id === editingEmployee.id ? { ...emp, ...formData } : emp,
            );
            saveToMock(updated);
          },
        );
        toast.success("Colaborador atualizado com sucesso!");
      } else {
        // Modo Criação
        await EmployeesService.create(formData).catch(() => {
          // Fallback Local
          const newEmp = {
            id: Date.now().toString(),
            name: formData.name.toUpperCase(),
            enrollment: formData.enrollment,
            active: true,
          };
          saveToMock([...employees, newEmp]);
        });
        toast.success("Colaborador cadastrado com sucesso!");
      }
      loadEmployees();
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      await EmployeesService.toggleStatus(id, !currentStatus).catch(() => {
        // Fallback Local
        const updated = employees.map((emp) =>
          emp.id === id ? { ...emp, active: !currentStatus } : emp,
        );
        saveToMock(updated);
      });
      toast.success(
        `Colaborador ${!currentStatus ? "ativado" : "desativado"}.`,
      );
      loadEmployees();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Aviso: Excluir um colaborador apagará o seu histórico. Tem a certeza?",
      )
    )
      return;
    try {
      setIsLoading(true);
      await EmployeesService.remove(id).catch(() => {
        // Fallback Local
        const updated = employees.filter((emp) => emp.id !== id);
        saveToMock(updated);
      });
      toast.success("Colaborador excluído com sucesso.");
      loadEmployees();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.enrollment &&
        emp.enrollment.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl mx-auto h-full flex flex-col relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <Loader2 size={40} className="text-emerald-500 animate-spin" />
        </div>
      )}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 hidden sm:flex">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Gestão de Equipa
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Administração de colaboradores e acessos da plataforma.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              className="w-full pl-12 h-12 rounded-2xl shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="h-12 px-6 rounded-2xl gap-2 font-bold whitespace-nowrap shadow-xl shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700"
          >
            <UserPlus size={20} /> Novo Colaborador
          </Button>
        </div>
      </header>

      <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table className="w-full text-left">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 pl-6 font-bold tracking-widest text-slate-500 uppercase text-xs">
                  Colaborador
                </TableHead>
                <TableHead className="py-5 text-center font-bold tracking-widest text-slate-500 uppercase text-xs">
                  Status
                </TableHead>
                <TableHead className="py-5 pr-6 text-right font-bold tracking-widest text-slate-500 uppercase text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className={`hover:bg-slate-50 transition-all duration-200 group ${!emp.active ? "opacity-60 grayscale-[0.5]" : ""}`}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors ${emp.active ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200" : "bg-slate-200 text-slate-500"}`}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {emp.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <Briefcase size={12} />{" "}
                          {emp.enrollment || "Sem Matrícula"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${emp.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                    >
                      {emp.active ? (
                        <UserCheck size={14} />
                      ) : (
                        <UserX size={14} />
                      )}
                      {emp.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(emp.id, emp.active)}
                        className={
                          emp.active
                            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }
                        title={emp.active ? "Desativar" : "Ativar"}
                      >
                        {emp.active ? (
                          <ToggleLeft size={20} />
                        ) : (
                          <ToggleRight size={20} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(emp)}
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit3 size={20} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(emp.id)}
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 mx-6 p-8">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Users size={32} className="text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-1">
                        Nenhum colaborador
                      </h3>
                      <p className="text-sm text-slate-500 text-center max-w-sm">
                        Não foi possível encontrar registos com os filtros
                        atuais.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-none rounded-[2.5rem] gap-0 [&>button]:text-white">
          <DialogHeader className="p-8 bg-slate-900 text-white m-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
            <DialogTitle className="text-2xl font-black flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                {editingEmployee ? <Edit3 size={20} /> : <UserPlus size={20} />}
              </div>
              {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
            <p className="text-slate-400 text-sm mt-2 relative z-10 font-medium">
              {editingEmployee
                ? "Atualize as informações cadastrais do membro da equipa."
                : "Preencha os dados abaixo para registar um novo membro na equipa."}
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveEmployee} className="p-8 space-y-6">
            <div className="space-y-5 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    type="text"
                    className="w-full bg-white border-slate-200 shadow-sm rounded-2xl pl-11 h-12 font-bold text-slate-700 transition-all uppercase focus-visible:ring-emerald-500"
                    placeholder="Ex: JOÃO SILVA"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Matrícula (Opcional)
                </label>
                <div className="relative">
                  <Hash
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    type="text"
                    className="w-full bg-white border-slate-200 shadow-sm rounded-2xl pl-11 h-12 font-bold text-slate-700 transition-all uppercase focus-visible:ring-emerald-500"
                    placeholder="Ex: ITAM001"
                    value={formData.enrollment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enrollment: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-12 rounded-2xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              >
                {editingEmployee
                  ? "Guardar Alterações"
                  : "Registar Colaborador"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
