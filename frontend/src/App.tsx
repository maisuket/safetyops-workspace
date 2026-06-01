import { useEffect, useState } from "react";
import { LoginScreen } from "./pages/Login/LoginScreen";
import { MainLayout } from "./components/Layout/MainLayout";
import { FolgasPage } from "./pages/FolgasPage/FolgasPage";
import { SaidasPage } from "./pages/SaidasPage/SaidasPage";
import { SafetyDocsPage } from "./pages/SafetyDocsPage/SafetyDocsPage";
import { EquipePage } from "./pages/EquipePage/EquipePage";
import { EmployeesProvider } from "./context/EmployeesContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";

const TOKEN_KEY = "itam_auth_token";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("folgas");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) setIsAuthenticated(true);
  }, []);

  const login = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    setShowLogoutDialog(false);
  };

  if (!isAuthenticated) return <LoginScreen onLogin={login} />;

  return (
    <EmployeesProvider>
      <MainLayout activePage={activePage} setActivePage={setActivePage} onLogout={() => setShowLogoutDialog(true)}>
        {activePage === "folgas" && <FolgasPage />}
        {activePage === "saidas" && <SaidasPage />}
        {activePage === "sst" && <SafetyDocsPage />}
        {activePage === "equipe" && <EquipePage />}
      </MainLayout>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-white border-none rounded-3xl gap-0">
          <DialogHeader className="p-6 bg-slate-900 text-white m-0">
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <LogOut size={20} /> Sair do Sistema
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">Deseja realmente encerrar a sessão?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="flex-1 rounded-2xl font-bold">
                Cancelar
              </Button>
              <Button onClick={logout} className="flex-1 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white">
                Sair
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </EmployeesProvider>
  );
};

export default App;
