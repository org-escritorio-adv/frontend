import React from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { RecuperacaoSenhaPage } from '@/pages/login/RecuperacaoSenhaPage'
import { RedefinicaoSenhaPage } from '@/pages/login/RedefinicaoSenhaPage'
import { DashboardShell } from '@/shared/components/layout/DashboardShell'
import { MobileLayout } from '@/shared/components/layout/mobile/MobileLayout'
import { DashboardMobile } from '@/pages/dashboard/mobile/DashboardMobile'
import { KanbanMobile } from '@/pages/kanban/mobile/KanbanMobile'
import { ProcessosMobile } from '@/pages/processos/mobile/ProcessosMobile'
import { CMSMobile } from '@/pages/cms/mobile/CMSMobile'
import { EquipeMobile } from '@/pages/equipe/mobile/EquipeMobile'
import { AjustesMobile } from '@/pages/perfil/mobile/AjustesMobile'
import { CaseDetailsMobile } from '@/pages/casos/mobile/CaseDetailsMobile'
import { useIsMobile } from '@/hooks/useIsMobile'
import { routePaths } from '@/routeConfig'
import { useAuth } from '@/context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to={routePaths.login} replace />
  return <>{children}</>
}

function DashboardGate() {
  const isMobile = useIsMobile()
  if (isMobile) return <Navigate to={routePaths.app} replace />
  return <DashboardShell />
}

function MobileGate() {
  const isMobile = useIsMobile()
  if (!isMobile) return <Navigate to={routePaths.dashboard} replace />
  return <MobileLayout />
}

function LegacyCaseRedirect() {
  const { caseId } = useParams()
  return <Navigate to={routePaths.appCaseDetails(caseId ?? '')} replace />
}

function NotFound() {
  return <Navigate to="/" replace />
}

export const router = createBrowserRouter([
  {
    path: routePaths.landing,
    Component: LandingPage
  },
  {
    path: routePaths.login,
    Component: LoginPage
  },
  {
    path: routePaths.recoverPassword,
    Component: RecuperacaoSenhaPage
  },
  {
    path: routePaths.resetPassword,
    Component: RedefinicaoSenhaPage
  },
  {
    path: routePaths.dashboard,
    element: (
      <ProtectedRoute>
        <DashboardGate />
      </ProtectedRoute>
    )
  },

  {
    path: routePaths.app,
    element: (
      <ProtectedRoute>
        <MobileGate />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DashboardMobile },
      { path: 'casos', Component: KanbanMobile },
      { path: 'processos', Component: ProcessosMobile },
      { path: 'cms', Component: CMSMobile },
      { path: 'equipe', Component: EquipeMobile },
      { path: 'ajustes', Component: AjustesMobile },
      { path: 'caso/:caseId', Component: CaseDetailsMobile }
    ]
  },

  {
    path: '/caso/:caseId',
    Component: LegacyCaseRedirect
  },
  {
    path: '*',
    Component: NotFound
  }
])
