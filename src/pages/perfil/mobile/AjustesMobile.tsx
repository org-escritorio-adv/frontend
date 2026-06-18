import { useState } from 'react'
import {
  User,
  Lock,
  Globe,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Download,
  Trash2,
  Edit3
} from 'lucide-react'
import { Switch } from '@/shared/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { AppLogo } from '@/shared/components/layout/AppLogo'
import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { routePaths } from '@/routeConfig'
import { useDarkMode } from '@/hooks/useDarkMode'

const userProfile = {
  name: 'Dr. Carlos Silva',
  email: 'carlos.silva@barcelostakaki.adv.br',
  oab: 'OAB/DF 123.456',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'
}

type SettingAction = 'toggle' | 'navigate'

interface SettingItem {
  icon: React.ElementType
  label: string
  description: string
  action: SettingAction
  enabled?: boolean
  danger?: boolean
}

const settingsSections: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Conta',
    items: [
      {
        icon: User,
        label: 'Editar Perfil',
        description: 'Nome, foto e informações',
        action: 'navigate'
      },
      {
        icon: Lock,
        label: 'Alterar Senha',
        description: 'Segurança da sua conta',
        action: 'navigate'
      },
      { icon: Shield, label: 'Privacidade', description: 'Controle seus dados', action: 'navigate' }
    ]
  },
  {
    title: 'Preferências',
    items: [
      {
        icon: Moon,
        label: 'Modo Escuro',
        description: 'Tema escuro para o app',
        action: 'toggle',
        enabled: false
      },
      { icon: Globe, label: 'Idioma', description: 'Português (Brasil)', action: 'navigate' }
    ]
  },
  {
    title: 'Dados',
    items: [
      {
        icon: Download,
        label: 'Exportar Dados',
        description: 'Baixe todos os seus dados',
        action: 'navigate'
      },
      {
        icon: Trash2,
        label: 'Limpar Cache',
        description: 'Libere espaço do dispositivo',
        action: 'navigate'
      }
    ]
  },
  {
    title: 'Suporte',
    items: [
      {
        icon: HelpCircle,
        label: 'Central de Ajuda',
        description: 'FAQ e tutoriais',
        action: 'navigate'
      },
      {
        icon: HelpCircle,
        label: 'Contatar Suporte',
        description: 'Fale conosco',
        action: 'navigate'
      }
    ]
  }
]

export function AjustesMobile() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [darkMode, setDarkMode] = useDarkMode()

  const handleLogout = async () => {
    await signOut()
    navigate(routePaths.login)
  }

  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  const toggle = (label: string) => {
    if (label === 'Modo Escuro') {
      setDarkMode(!darkMode)
      return
    }
    setToggles(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── User Profile Card ─────────────────────────── */}
      <div
        className="bg-[#1A2B3C] px-4 pt-5 pb-8 rounded-b-[32px]"
        style={{ boxShadow: '0 8px 24px rgba(26,43,60,0.30)' }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-16 h-16 border-2 border-[#C5A059]">
              <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
              <AvatarFallback className="bg-[#C5A059] text-white text-lg">
                {userProfile.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            {/* Edit badge */}
            <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#C5A059] rounded-full flex items-center justify-center border-2 border-[#1A2B3C]">
              <Edit3 className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold mb-0.5 truncate">{userProfile.name}</h2>
            <p className="text-white/60 text-xs truncate mb-1">{userProfile.email}</p>
            <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
              <Shield className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[11px] text-white/80">{userProfile.oab}</span>
            </span>
          </div>

          <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
        </div>
      </div>

      {/* ── Settings Sections ─────────────────────────── */}
      <div className="px-4 py-5 space-y-5">
        {settingsSections.map(section => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>

            <div
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}
            >
              {section.items.map((item, idx) => {
                const Icon = item.icon
                const isLast = idx === section.items.length - 1
                const isOn =
                  item.label === 'Modo Escuro'
                    ? darkMode
                    : (toggles[item.label] ?? item.enabled ?? false)

                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer ${
                      !isLast ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#1A2B3C]" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2B3C] leading-tight">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>

                    {/* Action */}
                    {item.action === 'toggle' ? (
                      <Switch
                        checked={isOn}
                        onCheckedChange={() => toggle(item.label)}
                        className="data-[state=checked]:bg-[#C5A059] flex-shrink-0"
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ── App Info Card ──────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-100 p-5 text-center"
          style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}
        >
          {/* Logo centered — mix-blend-multiply removes white bg */}
          <div className="flex items-center justify-center mb-3">
            <AppLogo variant="dark" size="md" />
          </div>
          <p className="text-xs text-slate-500 mb-1">Versão 2.4.1 (Build 2026.04.28)</p>
          <p className="text-[11px] text-slate-400">
            © 2026 Barcelos &amp; Takaki. Todos os direitos reservados.
          </p>
        </div>

        {/* ── Logout ─────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full h-12 bg-white border border-red-200 text-red-500 font-medium rounded-2xl flex items-center justify-center gap-2 active:bg-red-50 transition-colors"
          style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.10)' }}
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </div>
    </div>
  )
}
