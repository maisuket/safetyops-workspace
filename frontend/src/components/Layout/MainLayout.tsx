import { Sidebar } from "./Sidebar";

/**
 * ============================================================================
 * 📂 src/components/Layout/MainLayout.tsx
 * ============================================================================
 */
export const MainLayout = ({
  activePage,
  setActivePage,
  onLogout,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={onLogout}
      />
      <main className="flex-1 h-screen overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
};
