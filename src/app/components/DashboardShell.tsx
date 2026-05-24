import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Dashboard } from "./Dashboard";
import { KanbanBoard } from "./KanbanBoard";
import { SearchView } from "./SearchView";
import { InstitutionalCMS } from "./InstitutionalCMS";
import { CaseDetails } from "./CaseDetails";
import { ProcessosJusbrasil } from "./ProcessosJusbrasil";
import { SettingsView } from "./SettingsView";
import { TeamManagement } from "./TeamManagement";

type ViewId = "dashboard" | "processos" | "cases" | "search" | "cms" | "team" | "settings";

export function DashboardShell() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");

  /* State for notification → kanban expand */
  const [pendingExpandId, setPendingExpandId] = useState<string | null>(null);

  /* State for Jusbrasil: null = list, string = detail of that process id */
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);

  /** Called when user clicks a notification in TopBar */
  const handleNotificationClick = (processId: string) => {
    setActiveView("processos");
    setPendingExpandId(processId);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;

      case "processos":
        return (
          <KanbanBoard
            initialExpandedId={pendingExpandId}
            onClearExpandedId={() => setPendingExpandId(null)}
          />
        );

      case "cases":
        /* Sub-navigation: list ↔ detail */
        if (selectedProcessoId) {
          return (
            <CaseDetails
              onBack={() => setSelectedProcessoId(null)}
            />
          );
        }
        return (
          <ProcessosJusbrasil
            onViewProcess={(id) => setSelectedProcessoId(id)}
          />
        );

      case "search":
        return <SearchView />;

      case "cms":
        return <InstitutionalCMS />;

      case "team":
        return <TeamManagement />;

      case "settings":
        return <SettingsView />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v as ViewId);
          /* Clear states when navigating away */
          if (v !== "processos") setPendingExpandId(null);
          if (v !== "cases")     setSelectedProcessoId(null);
        }}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onNotificationClick={handleNotificationClick} />
        <main className="flex-1 overflow-auto relative">
          {renderView()}
        </main>
      </div>
    </div>
  );
}