import { useEffect, useState } from "react";
import { LoginScreen } from "./pages/Login/LoginScreen";
import { MainLayout } from "./components/Layout/MainLayout";
import { FolgasPage } from "./pages/FolgasPage/FolgasPage";
import { SaidasPage } from "./pages/SaidasPage/SaidasPage";
import { SafetyDocsPage } from "./pages/SafetyDocsPage/SafetyDocsPage";
import { EquipePage } from "./pages/EquipePage/EquipePage";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("folgas"); // O Controlador de Rota Local

  useEffect(() => {
    const session = localStorage.getItem("itam_auth_session");
    if (session === "active") setIsAuthenticated(true);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("itam_auth_session", "active");
  };

  const logout = () => {
    if (window.confirm("Deseja realmente sair do sistema?")) {
      setIsAuthenticated(false);
      localStorage.removeItem("itam_auth_session");
    }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={login} />;

  return (
    <MainLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={logout}
    >
      {activePage === "folgas" && <FolgasPage />}
      {activePage === "saidas" && <SaidasPage />}
      {activePage === "sst" && <SafetyDocsPage />}
      {activePage === "equipe" && <EquipePage />}
    </MainLayout>
  );
};

export default App;
