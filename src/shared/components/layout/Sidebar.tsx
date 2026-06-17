import { LayoutDashboard, Briefcase, Building2, Settings, Columns3, Users, UserSquare2 } from 'lucide-react'
import { AppLogo } from '@/shared/components/layout/AppLogo'
import { useAuth } from '@/context/AuthContext'
import { canAccessCMS } from '@/lib/rbac'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user } = useAuth()
  const iniciais = user?.name
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : '?'

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', short: 'Início' },
    { id: 'processos', icon: Columns3, label: 'Casos (Demandas)', short: 'Casos' },
    { id: 'cases', icon: Briefcase, label: 'Processos (DataJud)', short: 'Proc.' },
    { id: 'clientes', icon: UserSquare2, label: 'Clientes', short: 'Clientes' },
    ...(canAccessCMS(user) ? [{ id: 'cms', icon: Building2, label: 'CMS', short: 'CMS' }] : []),
    { id: 'team', icon: Users, label: 'Equipe & Permissões', short: 'Equipe' },
    { id: 'settings', icon: Settings, label: 'Ajustes', short: 'Ajustes' }
  ]

  return (
    <div className="w-20 bg-[#1A2B3C] h-screen flex flex-col items-center py-6 shadow-lg flex-shrink-0">
      {/* Logo */}
      <div className="mb-10 flex items-center justify-center px-1">
        <AppLogo variant="light" size="xs" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 flex flex-col gap-1.5 w-full px-3">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full h-14 rounded-xl flex flex-col items-center justify-center gap-1
                transition-all duration-200 group relative
                ${
                  isActive
                    ? 'bg-[#D4AF37] text-white shadow-lg'
                    : 'text-slate-400 hover:bg-[#243447] hover:text-white'
                }
              `}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium tracking-wide">{item.short}</span>

              {/* Tooltip */}
              <div
                className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F1C29] text-white text-xs rounded-lg
                            opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity
                            whitespace-nowrap z-50 shadow-xl border border-white/10"
              >
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0F1C29]" />
              </div>
            </button>
          )
        })}
      </nav>

      {/* Bottom avatar */}
      <div className="mt-4 w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
        <span className="text-[#D4AF37] text-xs font-bold">{iniciais}</span>
      </div>
    </div>
  )
}
