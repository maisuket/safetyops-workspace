import React, { useState, useEffect } from "react";
import {
  Users,
  Trash2,
  X,
  Search,
  Loader2,
  CheckCircle2,
  Edit3,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
} from "lucide-react";
import { INITIAL_EMPLOYEES } from "../../services/data-initial";
import { EmployeesService } from "../../services/employees.service";

export const EquipePage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<any>(null);

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", enrollment: "" });

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await EmployeesService.findAll().catch(() => []);

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
        showToast("Colaborador atualizado com sucesso!");
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
        showToast("Colaborador cadastrado com sucesso!");
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
      showToast(`Colaborador ${!currentStatus ? "ativado" : "desativado"}.`);
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
      showToast("Colaborador excluído.");
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
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-emerald-500" size={32} /> Gestão de Equipa
          </h2>
          <p className="text-slate-500 font-medium ml-11">
            Administração de colaboradores e acessos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-600/20 font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            <UserPlus size={20} /> Novo Colaborador
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-6 py-5">Matrícula</th>
                <th className="px-6 py-5">Nome do Colaborador</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className={`hover:bg-slate-50 transition-colors ${!emp.active ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4 font-mono text-sm text-slate-500 font-bold">
                    {emp.enrollment || "S/M"}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-700">
                    {emp.name}
                  </td>
                  <td className="px-6 py-4 text-center">
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
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(emp.id, emp.active)}
                        className={`p-2 rounded-xl transition-all ${emp.active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                        title={emp.active ? "Desativar" : "Ativar"}
                      >
                        {emp.active ? (
                          <ToggleLeft size={20} />
                        ) : (
                          <ToggleRight size={20} />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenModal(emp)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} />{" "}
                {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all uppercase"
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

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Matrícula (Opcional)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all uppercase"
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

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-white ${toast.type === "error" ? "bg-rose-600" : "bg-slate-900"}`}
        >
          <CheckCircle2
            className={
              toast.type === "error" ? "text-white" : "text-emerald-400"
            }
            size={20}
          />
          <span className="font-bold text-sm tracking-tight">
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
};
