import { Button } from "./button";

interface Tab {
  key: string;
  label: string;
}

interface PageTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  accentColor?: "slate" | "emerald" | "amber";
}

const accentMap = {
  slate: "bg-slate-900 text-white shadow-md hover:bg-slate-800",
  emerald: "bg-emerald-500 text-white shadow-md hover:bg-emerald-600",
  amber: "bg-amber-500 text-white shadow-md hover:bg-amber-600",
};

export const PageTabs = ({ tabs, activeTab, onTabChange, accentColor = "slate" }: PageTabsProps) => (
  <nav className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
    {tabs.map((tab) => (
      <Button
        key={tab.key}
        variant="ghost"
        onClick={() => onTabChange(tab.key)}
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all h-auto ${
          activeTab === tab.key
            ? accentMap[accentColor]
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }`}
      >
        {tab.label}
      </Button>
    ))}
  </nav>
);
