import { Outlet, useLocation, Link } from 'react-router'
import {
  LayoutDashboard,
  Briefcase,
  Scale,
  FileText,
  Users,
  Settings,
  UserRound
} from 'lucide-react'
import { MobileTopBar } from '@/shared/components/layout/mobile/MobileTopBar'
import { routePaths } from '@/routeConfig'
import { useAuth } from '@/context/AuthContext'
import { canAccessCMS, canViewClientes } from '@/lib/rbac'

export function MobileLayout() {
  const location = useLocation()
  const { user } = useAuth()

  const navItems = [
    { path: routePaths.app, icon: LayoutDashboard, label: 'Dashboard' },
    { path: routePaths.appCases, icon: Briefcase, label: 'Casos' },
    { path: routePaths.appProcessos, icon: Scale, label: 'Processos' },
    ...(canAccessCMS(user) ? [{ path: routePaths.appCMS, icon: FileText, label: 'CMS' }] : []),
    ...(canViewClientes(user)
      ? [{ path: routePaths.appClientes, icon: UserRound, label: 'Clientes' }]
      : []),
    { path: routePaths.appEquipe, icon: Users, label: 'Equipe' },
    { path: routePaths.appAjustes, icon: Settings, label: 'Ajustes' }
  ]

  const isActive = (path: string) => {
    if (path === routePaths.app) {
      return location.pathname === routePaths.app || location.pathname === `${routePaths.app}/`
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Global Fixed Top Bar ─────────────────────── */}
      <MobileTopBar />

      {/* ── Scrollable Content ──────────────────────────
          pt-14 → clears the 56px fixed TopBar
          pb-20 → clears the 80px fixed Bottom Nav        */}
      <div className="pt-14 pb-20">
        <Outlet />
      </div>

      {/* ── Bottom Navigation ───────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 overflow-x-auto scrollbar-hide"
        style={{ boxShadow: '0 -2px 12px rgba(26,43,60,0.07)' }}
      >
        <div className="flex justify-around items-center h-16 min-w-max px-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center h-full gap-0.5 transition-colors px-2 min-w-[48px] ${
                  active ? 'text-[#1A2B3C]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {/* Active gold indicator bar */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-[#D4AF37] rounded-full" />
                )}
                <Icon className={`w-4.5 h-4.5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span
                  className={`text-[9px] font-medium leading-tight text-center ${active ? 'text-[#1A2B3C]' : ''}`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
