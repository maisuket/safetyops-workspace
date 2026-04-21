import {
  Calendar,
  Briefcase,
  User,
  LogOut,
  Truck,
  ShieldCheck,
  Users,
  Hexagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ============================================================================
 * 📂 src/components/Layout/Sidebar.tsx
 * ============================================================================
 */

const logoImg = "/assets/itam-logo.jpeg";

export const Sidebar = ({ activePage, setActivePage, onLogout }) => {
  const menuItems = [
    { id: "folgas", icon: Calendar, label: "Controle de Folgas" },
    { id: "saidas", icon: Truck, label: "Gestão de Saídas" },
    { id: "sst", icon: ShieldCheck, label: "Safety / SST" },
    { id: "equipe", icon: Users, label: "Gestão de Equipe" },
  ];

  return (
    <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col h-auto md:h-screen shrink-0 sticky top-0 z-40">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        {/* NOVA ÁREA DA LOGO NA SIDEBAR */}
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden shrink-0 p-1">
          <img
            src={logoImg}
            alt="ITAM"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextElementSibling) {
                (
                  e.currentTarget.nextElementSibling as HTMLElement
                ).style.display = "flex";
              }
            }}
          />
          <div className="hidden w-full h-full bg-emerald-500 rounded-lg items-center justify-center">
            <Hexagon size={24} className="text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-black tracking-tight">
            ITAM <span className="text-emerald-400">HUB</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Workspace Central
          </p>
        </div>
      </div>
      <div className="p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActivePage(item.id)}
              className={`justify-start gap-3 px-4 h-auto py-3.5 rounded-xl transition-all font-medium whitespace-nowrap md:whitespace-normal ${isActive ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
            >
              <Icon size={20} /> {item.label}
            </Button>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-800 hidden md:block">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-3 px-4 h-auto py-3 rounded-xl transition-all font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <LogOut size={20} /> Sair do Sistema
        </Button>
      </div>
    </aside>
  );
};
