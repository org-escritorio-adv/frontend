import { useState } from 'react'
import {
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Briefcase
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { useNavigate } from 'react-router'

export function DashboardMobile() {
  const navigate = useNavigate()
  const [userName] = useState('Dr. Carlos Silva')

  const stats = [
    { value: '24', label: 'Casos Ativos', color: 'text-white' },
    { value: '8', label: 'Audiências', color: 'text-[#D4AF37]' },
    { value: '3', label: 'Prazos Próx.', color: 'text-red-300' }
  ]

  const favoriteCases = [
    {
      id: '1',
      number: '0001234-56.2024.8.26.0100',
      client: 'João da Silva',
      status: 'Em Andamento',
      statusColor: 'bg-blue-500',
      lastUpdate: '2 dias atrás'
    },
    {
      id: '2',
      number: '0007890-12.2024.8.26.0200',
      client: 'Maria Oliveira',
      status: 'Aguardando',
      statusColor: 'bg-yellow-500',
      lastUpdate: '5 dias atrás'
    },
    {
      id: '3',
      number: '0005678-90.2024.8.26.0300',
      client: 'Empresa XYZ Ltda',
      status: 'Finalizado',
      statusColor: 'bg-green-500',
      lastUpdate: '1 semana atrás'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      title: 'Nova movimentação processual',
      case: '0001234-56.2024.8.26.0100',
      description: 'Audiência marcada para 15/05/2026',
      time: '2h atrás',
      icon: Calendar,
      accent: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      title: 'Novo processo cadastrado',
      case: '0009876-54.2024.8.26.0400',
      description: 'Cliente: Pedro Santos',
      time: '5h atrás',
      icon: TrendingUp,
      accent: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      id: 3,
      title: 'Sentença publicada',
      case: '0005678-90.2024.8.26.0300',
      description: 'Resultado favorável ao cliente',
      time: '1 dia atrás',
      icon: Briefcase,
      accent: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      id: 4,
      title: 'Prazo se aproximando',
      case: '0007890-12.2024.8.26.0200',
      description: 'Contestação deve ser enviada em 3 dias',
      time: '2 dias atrás',
      icon: AlertTriangle,
      accent: 'bg-amber-50',
      iconColor: 'text-amber-600'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero: Greeting + Stats ───────────────────── */}
      <div
        className="bg-[#1A2B3C] text-white px-4 pt-6 pb-8 rounded-b-[32px]"
        style={{ boxShadow: '0 8px 24px rgba(26,43,60,0.30)' }}
      >
        {/* Greeting */}
        <p className="text-slate-300 text-sm mb-0.5">Bem-vindo de volta,</p>
        <h1 className="text-xl font-semibold mb-6">{userName}</h1>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl py-3 px-2 text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-300 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Casos Favoritos ──────────────────────────── */}
      <div className="mt-6 px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1A2B3C] flex items-center gap-2">
            <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
            Casos Favoritos
          </h2>
          <button
            onClick={() => navigate('/app/casos')}
            className="text-xs text-[#C5A059] font-medium flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {favoriteCases.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/app/caso/${c.id}`)}
              className="min-w-[260px] bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:scale-[0.98] transition-all"
              style={{ boxShadow: '0 2px 10px rgba(26,43,60,0.08)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge className={`${c.statusColor} text-white border-0 text-xs`}>{c.status}</Badge>
                <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
              </div>

              <p className="font-mono text-xs text-slate-400 mb-1.5 leading-snug">{c.number}</p>

              <h3 className="text-sm font-semibold text-[#1A2B3C] mb-3 line-clamp-1">{c.client}</h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{c.lastUpdate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Atividade Recente ────────────────────────── */}
      <div className="mt-6 px-4 mb-4">
        <h2 className="text-base font-semibold text-[#1A2B3C] mb-3">Atividade Recente</h2>

        <div className="space-y-2.5">
          {recentActivities.map(activity => {
            const Icon = activity.icon
            return (
              <div
                key={activity.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 active:bg-slate-50 transition-colors cursor-pointer"
                style={{ boxShadow: '0 1px 6px rgba(26,43,60,0.06)' }}
              >
                <div className="flex gap-3 items-start">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl ${activity.accent} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B3C] leading-tight mb-1">
                      {activity.title}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400 mb-1 truncate">
                      {activity.case}
                    </p>
                    <p className="text-xs text-slate-500 leading-snug">{activity.description}</p>
                  </div>

                  {/* Time + chevron */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-[10px] text-slate-400 whitespace-nowrap">{activity.time}</p>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
