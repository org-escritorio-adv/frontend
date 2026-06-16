import { useState } from 'react'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { TopBar } from '@/shared/components/layout/TopBar'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { KanbanBoard } from '@/pages/kanban/KanbanBoard'
import { InstitutionalCMS } from '@/pages/cms/InstitutionalCMS'
import { CaseDetails } from '@/pages/casos/CaseDetails'
import { Processos } from '@/pages/processos/Processos'
import { SettingsView } from '@/pages/perfil/SettingsView'
import { TeamManagement } from '@/pages/equipe/TeamManagement'
import { ProfileView } from '@/pages/perfil/ProfileView'

type ViewId = 'dashboard' | 'processos' | 'cases' | 'cms' | 'team' | 'settings' | 'profile'

export function DashboardShell() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard')

  /* State for notification → kanban expand */
  const [pendingExpandId, setPendingExpandId] = useState<string | null>(null)

  /* State for DataJud: null = list, string = detail of that process id */
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null)

  /** Called when user clicks a notification in TopBar */
  const handleNotificationClick = (processId: string) => {
    setActiveView('processos')
    setPendingExpandId(processId)
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />

      case 'processos':
        return (
          <KanbanBoard
            initialExpandedId={pendingExpandId}
            onClearExpandedId={() => setPendingExpandId(null)}
          />
        )

      case 'cases':
        /* Sub-navigation: list ↔ detail */
        if (selectedProcessoId) {
          return (
            <CaseDetails
              processoId={selectedProcessoId}
              onBack={() => setSelectedProcessoId(null)}
            />
          )
        }
        return <Processos onViewProcess={id => setSelectedProcessoId(id)} />

      case 'cms':
        return <InstitutionalCMS />

      case 'team':
        return <TeamManagement />

      case 'settings':
        return <SettingsView />

      case 'profile':
        return <ProfileView />

      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={v => {
          setActiveView(v as ViewId)
          /* Clear states when navigating away */
          if (v !== 'processos') setPendingExpandId(null)
          if (v !== 'cases') setSelectedProcessoId(null)
        }}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onNotificationClick={handleNotificationClick}
          onNavigate={v => setActiveView(v as ViewId)}
        />
        <main className="flex-1 overflow-auto relative">{renderView()}</main>
      </div>
    </div>
  )
}
