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
import { ClientesMobile } from "./components/mobile/ClientesMobile";
import { ClienteDetailsMobile } from "./components/mobile/ClienteDetailsMobile";
import { routePaths } from "./routeConfig";

function LegacyCaseRedirect() {
  const { caseId } = useParams();
  return <Navigate to={routePaths.appCaseDetails(caseId ?? "")} replace />;
}

function NotFound() {
  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: routePaths.landing,
    Component: LandingPage,
  },
  {
    path: routePaths.login,
    Component: LoginPage,
  },
  {
    path: routePaths.recoverPassword,
    Component: RecuperacaoSenhaPage,
  },
  {
    path: routePaths.dashboard,
    Component: DashboardShell,
  },

  {
    path: routePaths.app,
    Component: MobileLayout,
    children: [
      { index: true,              Component: DashboardMobile   },
      { path: "casos",            Component: KanbanMobile      },
      { path: "processos",        Component: ProcessosMobile   },
      { path: "pesquisa",         Component: PesquisaMobile    },
      { path: "cms",              Component: CMSMobile         },
      { path: "equipe",           Component: EquipeMobile      },
      { path: "ajustes",          Component: AjustesMobile     },
      { path: "caso/:caseId",      Component: CaseDetailsMobile    },
      { path: "clientes",          Component: ClientesMobile       },
      { path: "cliente/:clienteId", Component: ClienteDetailsMobile },
    ],
  },

  {
    path: "/caso/:caseId",
    Component: LegacyCaseRedirect,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
