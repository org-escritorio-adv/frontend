import { createBrowserRouter, Navigate, useParams } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { RecuperacaoSenhaPage } from "./components/RecuperacaoSenhaPage";
import { DashboardShell } from "./components/DashboardShell";
import { MobileLayout } from "./components/mobile/MobileLayout";
import { DashboardMobile } from "./components/mobile/DashboardMobile";
import { KanbanMobile } from "./components/mobile/KanbanMobile";
import { ProcessosMobile } from "./components/mobile/ProcessosMobile";
import { PesquisaMobile } from "./components/mobile/PesquisaMobile";
import { CMSMobile } from "./components/mobile/CMSMobile";
import { EquipeMobile } from "./components/mobile/EquipeMobile";
import { AjustesMobile } from "./components/mobile/AjustesMobile";
import { CaseDetailsMobile } from "./components/mobile/CaseDetailsMobile";
import { useIsMobile } from "./hooks/useIsMobile";

// ─────────────────────────────────────────────────────────────────────────────
// Portão para /dashboard
//   • Mobile  → redireciona para /app   (MobileLayout)
//   • Desktop → renderiza DashboardShell
// ─────────────────────────────────────────────────────────────────────────────
function DashboardGate() {
  const isMobile = useIsMobile();
  if (isMobile) return <Navigate to="/app" replace />;
  return <DashboardShell />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portão para /app  (componente-pai do grupo de rotas mobile)
//   • Desktop → redireciona para /dashboard (DashboardShell)
//   • Mobile  → renderiza MobileLayout com <Outlet /> para os filhos
// ─────────────────────────────────────────────────────────────────────────────
function MobileGate() {
  const isMobile = useIsMobile();
  if (!isMobile) return <Navigate to="/dashboard" replace />;
  return <MobileLayout />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

/** Redireciona o legado /caso/:caseId → /app/caso/:caseId */
function LegacyCaseRedirect() {
  const { caseId } = useParams();
  return <Navigate to={`/app/caso/${caseId}`} replace />;
}

/** Qualquer rota desconhecida → Landing Page */
function NotFound() {
  return <Navigate to="/" replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Páginas públicas ─────────────────────────────────
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/recuperar-senha",
    Component: RecuperacaoSenhaPage,
  },

  // ── Dashboard com renderização condicional ───────────
  //    Mobile  → redireciona para /app
  //    Desktop → DashboardShell
  {
    path: "/dashboard",
    Component: DashboardGate,
  },

  // ── App mobile com renderização condicional ──────────
  //    Desktop → redireciona para /dashboard
  //    Mobile  → MobileLayout + sub-rotas abaixo
  {
    path: "/app",
    Component: MobileGate,   // ← portão; MobileLayout renderizado dentro dele
    children: [
      { index: true,              Component: DashboardMobile   },
      { path: "casos",            Component: KanbanMobile      },
      { path: "processos",        Component: ProcessosMobile   },
      { path: "pesquisa",         Component: PesquisaMobile    },
      { path: "cms",              Component: CMSMobile         },
      { path: "equipe",           Component: EquipeMobile      },
      { path: "ajustes",          Component: AjustesMobile     },
      { path: "caso/:caseId",     Component: CaseDetailsMobile },
    ],
  },

  // ── Legacy & catch-all ───────────────────────────────
  {
    path: "/caso/:caseId",
    Component: LegacyCaseRedirect,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
