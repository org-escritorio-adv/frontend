import { useEffect, useState } from 'react'
import {
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Briefcase,
  Scale,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { buscarResumo, buscarAtividades, type AtividadeRecente } from '@/services/dashboard.service'
import { buscarProcessos, buscarClientes } from '@/services/processos.service'
import { useAuth } from '@/context/AuthContext'
import type { ResumoDashboard } from '@/pages/dashboard/dtos/Dashboard.dto'

interface ProcessoResumo {
  id: string
  cnj: string
  cliente: string
  tribunal: string
  status: string
  ultimaMovimentacao: { data: string; descricao: string }
}

export function DashboardMobile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const nomeUsuario = user?.name ?? 'Usuário'

  const [resumo, setResumo] = useState<ResumoDashboard | null>(null)
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([])
  const [processos, setProcessos] = useState<ProcessoResumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [resumoData, atividadesData, clientesData] = await Promise.all([
          buscarResumo(),
          buscarAtividades(),
          buscarClientes()
        ])

        const clientesMap: Record<number, string> = {}
        clientesData.forEach(c => { clientesMap[c.id] = c.nome_razao_social })

        const processosData = await buscarProcessos(clientesMap)

        setResumo(resumoData)
        setAtividades(atividadesData)
        setProcessos(processosData.slice(0, 3))
      } catch {
        // mantém estado vazio em caso de erro
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = [
    {
      value: loading ? '…' : String(resumo?.processosAtivos ?? 0),
      label: 'Casos Ativos',
      color: 'text-white'
    },
    {
      value: loading ? '…' : String(resumo?.prazosProximos ?? 0),
      label: 'Prazos Próx.',
      color: 'text-[#D4AF37]'
    },
    {
      value: loading ? '…' : String(resumo?.tarefasAbertas ?? 0),
      label: 'Tarefas Abertas',
      color: 'text-red-300'
    }
  ]

  const getCorStatus = (status: string) => {
    if (status === 'Ativo') return 'bg-emerald-500'
    if (status === 'Arquivado') return 'bg-slate-400'
    return 'bg-amber-500'
  }

  const getIconeAtividade = (index: number) => {
    const configs = [
      { icon: Calendar, accent: 'bg-blue-50', iconColor: 'text-blue-600' },
      { icon: TrendingUp, accent: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      { icon: Briefcase, accent: 'bg-purple-50', iconColor: 'text-purple-600' },
      { icon: AlertTriangle, accent: 'bg-amber-50', iconColor: 'text-amber-600' }
    ]
    return configs[index % configs.length]
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero: Greeting + Stats ───────────────────── */}
      <div
        className="bg-[#1A2B3C] text-white px-4 pt-6 pb-8 rounded-b-[32px]"
        style={{ boxShadow: '0 8px 24px rgba(26,43,60,0.30)' }}
      >
        <p className="text-slate-300 text-sm mb-0.5">Bem-vindo de volta,</p>
        <h1 className="text-xl font-semibold mb-6">{nomeUsuario}</h1>

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

      {/* ── Processos Recentes ───────────────────────── */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1A2B3C] flex items-center gap-2">
            <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
            Processos Recentes
          </h2>
          <button
            onClick={() => navigate('/app/processos')}
            className="text-xs text-[#C5A059] font-medium flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {[1, 2].map(i => (
              <div
                key={i}
                className="min-w-[260px] bg-white rounded-2xl border border-slate-100 p-4 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : processos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-slate-100 gap-2">
            <Scale className="w-8 h-8 text-slate-200" />
            <p className="text-xs text-slate-400">Nenhum processo cadastrado.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {processos.map(p => (
              <div
                key={p.id}
                onClick={() => navigate('/app/processos')}
                className="min-w-[260px] bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 2px 10px rgba(26,43,60,0.08)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`${getCorStatus(p.status)} text-white text-xs px-2 py-0.5 rounded-full font-medium`}
                  >
                    {p.status}
                  </span>
                  <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                </div>

                <p className="font-mono text-xs text-slate-400 mb-1.5 leading-snug truncate">
                  {p.cnj}
                </p>
                <h3 className="text-sm font-semibold text-[#1A2B3C] mb-3 truncate">{p.cliente}</h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{p.ultimaMovimentacao.data}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Atividade Recente ────────────────────────── */}
      <div className="mt-6 px-4 mb-4">
        <h2 className="text-base font-semibold text-[#1A2B3C] mb-3">Atividade Recente</h2>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : atividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-slate-100 gap-2">
            <AlertCircle className="w-8 h-8 text-slate-200" />
            <p className="text-xs text-slate-400">Nenhuma atividade recente.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {atividades.slice(0, 4).map((activity, index) => {
              const { icon: Icon, accent, iconColor } = getIconeAtividade(index)
              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 active:bg-slate-50 transition-colors cursor-pointer"
                  style={{ boxShadow: '0 1px 6px rgba(26,43,60,0.06)' }}
                >
                  <div className="flex gap-3 items-start">
                    <div
                      className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2B3C] leading-tight mb-1 truncate">
                        {activity.descricao}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 mb-1">
                        Processo #{activity.processo_id}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(activity.data).toLocaleDateString('pt-BR')}
                      </p>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
