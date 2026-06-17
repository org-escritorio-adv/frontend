import React, { useState, useEffect, useRef } from 'react'
import {
  Bell,
  User,
  X,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle,
  Scale,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Globe
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { AppLogo } from '@/shared/components/layout/AppLogo'
import { PrazosCalculadoraModal } from '@/pages/processos/PrazosCalculadoraModal'
import { useAuth } from '@/context/AuthContext'
import { routePaths } from '@/routeConfig'
import {
  buscarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  type NotificacaoAPI
} from '@/services/notificacoes.service'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  advogado: 'Advogado(a)',
  estagiario: 'Estagiário(a)'
}

const ROLE_BADGES: Record<string, string> = {
  admin: 'Admin',
  advogado: 'Advogado',
  estagiario: 'Estagiário'
}

// Ícone/cor escolhidos pelo campo "tipo" da notificação vinda do backend.
const notifIcon = (tipo: string) => {
  switch (tipo) {
    case 'novo_processo':
      return <Briefcase className="w-4 h-4 text-blue-500" />
    case 'prazo':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'sincronizacao_falha':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'nova_movimentacao':
    case 'atualizacao':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />
    case 'audiencia':
      return <Clock className="w-4 h-4 text-purple-500" />
    default:
      return <Bell className="w-4 h-4 text-slate-500" />
  }
}

const notifBg = (tipo: string) => {
  switch (tipo) {
    case 'novo_processo':
      return 'bg-blue-50'
    case 'prazo':
    case 'sincronizacao_falha':
      return 'bg-red-50'
    case 'nova_movimentacao':
    case 'atualizacao':
      return 'bg-emerald-50'
    case 'audiencia':
      return 'bg-purple-50'
    default:
      return 'bg-slate-100'
  }
}

// Converte o created_at (ISO) num texto relativo simples ("há 2 h", "há 3 dias").
function tempoRelativo(iso: string | null): string {
  if (!iso) return ''
  const data = new Date(iso)
  const agora = new Date()
  const diffMs = agora.getTime() - data.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

interface TopBarProps {
  onNotificationClick?: (processId: string) => void
  onNavigate?: (view: string) => void
}

export function TopBar({ onNotificationClick, onNavigate }: TopBarProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificacaoAPI[]>([])
  const [calcOpen, setCalcOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const displayName = user?.name ?? 'Usuário'
  const displayEmail = user?.email ?? ''
  const roleKey = user?.role ?? 'advogado'
  const roleLabel = ROLE_LABELS[roleKey] ?? 'Advogado(a)'
  const roleBadge = ROLE_BADGES[roleKey] ?? 'Usuário'

  // Carrega notificações reais do backend ao montar e a cada 60s.
  const carregarNotificacoes = async () => {
    try {
      const data = await buscarNotificacoes()
      setNotifications(data)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  useEffect(() => {
    carregarNotificacoes()
    const intervalo = setInterval(carregarNotificacoes, 60000)
    return () => clearInterval(intervalo)
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    await signOut()
    navigate(routePaths.login, { replace: true })
  }

  const handleGoToSite = async () => {
    setProfileOpen(false)
    await signOut()
    navigate(routePaths.landing, { replace: true })
  }

  const handleProfile = () => {
    setProfileOpen(false)
    onNavigate?.('profile')
  }

  const handleSettings = () => {
    setProfileOpen(false)
    onNavigate?.('settings')
  }

  const unreadCount = notifications.filter(n => !n.lida).length

  /* Close notification panel on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  /* Close profile menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const handleNotifClick = async (notif: NotificacaoAPI) => {
    // Marca como lida no backend e atualiza localmente
    if (!notif.lida) {
      try {
        await marcarComoLida(notif.id)
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, lida: true } : n))
        )
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
      }
    }
    setPanelOpen(false)
  }

  const markAllRead = async () => {
    try {
      await marcarTodasComoLidas()
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })))
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm relative z-30">
      <div className="flex items-center">
        <AppLogo variant="dark" size="md" />
      </div>

      <div className="flex items-center gap-3">
        {/* ── Calculadora de Prazos ─────────────── */}
        <button
          onClick={() => setCalcOpen(true)}
          title="Calculadora de Prazos Processuais"
          className="relative w-10 h-10 rounded-lg bg-slate-100 hover:bg-[#1A2B3C] hover:text-white flex items-center justify-center transition-all group"
        >
          <Scale className="w-5 h-5 text-slate-600 group-hover:text-[#D4AF37] transition-colors" />
        </button>

        {/* ── Bell ─────────────────────────────────── */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="relative w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* ── Notification dropdown ─────────────── */}
          {panelOpen && (
            <div
              className="absolute right-0 top-12 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              style={{ animation: 'slideDownFade 0.18s ease' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1A2B3C]">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-[#C5A059] font-medium hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell className="w-8 h-8 text-slate-300" />
                    <p className="text-xs text-slate-400">Nenhuma notificação por aqui.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group ${!notif.lida ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Icon pill */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${notifBg(notif.tipo)}`}
                      >
                        {notifIcon(notif.tipo)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-[12px] leading-snug ${!notif.lida ? 'font-semibold text-[#1A2B3C]' : 'font-medium text-slate-600'}`}
                          >
                            {notif.titulo}
                          </p>
                          {!notif.lida && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {notif.mensagem}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {tempoRelativo(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-5 py-2.5 text-center">
                <button className="text-[11px] text-[#C5A059] font-medium hover:underline">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── User profile ─────────────────────── */}
        <div className="relative" ref={profileRef}>
          {/* Gatilho */}
          <button
            onClick={() => {
              setProfileOpen(v => !v)
              setPanelOpen(false)
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150
              ${profileOpen ? 'bg-[#1A2B3C] shadow-md' : 'hover:bg-slate-100'}`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${
                profileOpen
                  ? 'bg-white/20 ring-2 ring-white/40'
                  : 'bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C]'
              }`}
            >
              <User className={`w-5 h-5 ${profileOpen ? 'text-white' : 'text-white'}`} />
            </div>

            {/* Nome + cargo */}
            <div className="text-left">
              <div
                className={`text-sm font-medium transition-colors ${profileOpen ? 'text-white' : 'text-[#1A2B3C]'}`}
              >
                {displayName}
              </div>
              <div
                className={`text-xs transition-colors ${profileOpen ? 'text-white/60' : 'text-slate-500'}`}
              >
                {roleLabel}
              </div>
            </div>

            {/* Chevron indicador */}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-all duration-200 flex-shrink-0
                ${profileOpen ? 'rotate-180 text-white/70' : 'text-slate-400'}`}
            />
          </button>

          {/* ── Dropdown Menu ───────────────────── */}
          {profileOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-[248px] bg-white rounded-2xl z-50 overflow-hidden"
              style={{
                boxShadow:
                  '0 4px 6px -1px rgba(26,43,60,0.08), 0 16px 40px -4px rgba(26,43,60,0.18)',
                animation: 'slideDownFade 0.16s ease'
              }}
            >
              {/* ── Área de identificação ─────────── */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar grande */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B3C] leading-tight truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{displayEmail}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-[#1A2B3C]/8 rounded-full">
                      <Shield className="w-2.5 h-2.5 text-[#D4AF37]" />
                      <span className="text-[10px] font-semibold text-[#1A2B3C]">{roleBadge}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mx-4" />

              {/* ── Opções de navegação ───────────── */}
              <div className="px-2 py-2">
                {/* Meu Perfil */}
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             text-[#1A2B3C] hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <User className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Meu Perfil</p>
                    <p className="text-[11px] text-slate-400">Dados pessoais e OAB</p>
                  </div>
                </button>

                {/* Preferências */}
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             text-[#1A2B3C] hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Settings className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Preferências</p>
                    <p className="text-[11px] text-slate-400">Notificações e aparência</p>
                  </div>
                </button>

                {/* Site Institucional */}
                <button
                  onClick={handleGoToSite}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             text-[#1A2B3C] hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Globe className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Site Institucional</p>
                    <p className="text-[11px] text-slate-400">Voltar para a página inicial</p>
                  </div>
                </button>
              </div>

              {/* Divider antes do logout */}
              <div className="h-px bg-gray-100 mx-4" />

              {/* Sair da Conta */}
              <div className="px-2 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             hover:bg-red-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <LogOut className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#EF4444]">Sair da Conta</p>
                    <p className="text-[11px] text-red-400">Encerrar sessão atual</p>
                  </div>
                </button>
              </div>

              {/* Rodapé do menu */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-gray-100">
                <p className="text-[10px] text-slate-400 text-center">
                  Barcelos & Takaki v2.4.1 · Sessão segura 🔒
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Calculadora Modal ─────────────────────────────────────────────── */}
      <PrazosCalculadoraModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}