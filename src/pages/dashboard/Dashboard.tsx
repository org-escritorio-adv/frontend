import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, TrendingUp, AlertCircle, CheckCircle, FileText, Calendar, Star } from 'lucide-react'
import { CaseFavoritoDrawer, type CasoDetalhado } from '@/pages/casos/CaseFavoritoDrawer'
import { buscarResumo, buscarAtividades } from '@/services/dashboard.service'
import { buscarProcessos, buscarClientes } from '@/services/processos.service'
import { useAuth } from '@/context/AuthContext'

export function Dashboard() {
  // ── State do drawer ────────────────────────────────────────────────────────
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [casoSelecionado, setCasoSelecionado] = useState<CasoDetalhado | null>(null)

  const { user } = useAuth()
  const nomeUsuario = user?.name ?? 'Usuário'

  // ── Dados reais via TanStack Query ─────────────────────────────────────────
  const { data: resumo } = useQuery({
    queryKey: ['dashboard', 'metricas'],
    queryFn: buscarResumo
  })

  const { data: atividades = [] } = useQuery({
    queryKey: ['dashboard', 'atividades'],
    queryFn: buscarAtividades
  })

  const { data: casosDestacados = [] } = useQuery({
    queryKey: ['dashboard', 'casos-destacados'],
    queryFn: async (): Promise<CasoDetalhado[]> => {
      const clientesApi = await buscarClientes()
      const map: Record<number, string> = {}
      clientesApi.forEach(c => {
        map[c.id] = c.nome_razao_social
      })
      const processosApi = await buscarProcessos(map)
      const favoritos = processosApi.filter(p => p.favorito)

      return favoritos.slice(0, 4).map(p => ({
        id: p.id,
        cnj: p.cnj,
        cliente: p.cliente,
        status:
          p.status === 'Ativo' ? 'ativo' : p.status === 'Arquivado' ? 'concluído' : 'pendente',
        tribunal: p.tribunal || 'N/A',
        vara: p.vara || 'N/A',
        valorCausa: p.valorCausa || 'R$ 0,00',
        responsavel: 'Responsável',
        telefone: 'Não informado',
        movimentacoes: [
          {
            data: p.ultimaMovimentacao.data,
            descricao: p.ultimaMovimentacao.descricao,
            tipo: 'peticao'
          }
        ]
      }))
    }
  })

  const abrirDrawer = (caso: CasoDetalhado) => {
    setCasoSelecionado(caso)
    setDrawerAberto(true)
  }

  const fecharDrawer = () => setDrawerAberto(false)

  const atividadesRecentes = atividades.slice(0, 4).map(a => ({
    tipo: 'atualizacao',
    processo: String(a.processo_id),
    descricao: a.descricao,
    tempo: new Date(a.data).toLocaleDateString('pt-BR')
  }))

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pendente':
        return 'bg-amber-100   text-amber-700   border-amber-200'
      case 'concluído':
        return 'bg-slate-100   text-slate-600   border-slate-200'
      default:
        return 'bg-gray-100    text-gray-700    border-gray-200'
    }
  }

  const getLabelStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'pendente':
        return 'Pendente'
      case 'concluído':
        return 'Concluído'
      default:
        return status
    }
  }

  const getIconeAtividade = (tipo: string) => {
    switch (tipo) {
      case 'atualizacao':
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      case 'audiencia':
        return <Calendar className="w-4 h-4 text-purple-500" />
      case 'documento':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'prazo':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <>
      {/* ── Side Drawer (renderizado acima do conteúdo) ─────────────────────── */}
      <CaseFavoritoDrawer caso={casoSelecionado} isOpen={drawerAberto} onClose={fecharDrawer} />

      <div className="p-8 max-w-7xl mx-auto">
        {/* ── Saudação ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-[#1A2B3C] mb-2">Bem-vindo, {nomeUsuario}</h2>
          <p className="text-slate-600">Aqui está uma visão geral dos seus processos jurídicos</p>
        </div>

        {/* ── Cards de estatísticas ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Casos Ativos</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.processosAtivos ?? '—'}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Tarefas Abertas</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.tarefasAbertas ?? '—'}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Total Processos</span>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.totalProcessos ?? '—'}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Prazos (7 dias)</span>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.prazosProximos ?? '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Casos Favoritos ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              <h3 className="text-[#1A2B3C]">Casos Favoritos</h3>
              <span className="text-xs text-slate-400 ml-1">· clique para expandir</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {casosDestacados.map((caso, index) => {
                const isFirst = index === 0
                return (
                  <div
                    key={caso.id}
                    onClick={() => abrirDrawer(caso)}
                    className={`
                      bg-white rounded-xl p-5 shadow-sm border transition-all duration-200 cursor-pointer group
                      ${
                        isFirst
                          ? 'border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)]'
                          : 'border-gray-100 hover:border-slate-200 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Topo do card */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border font-medium ${getCorStatus(caso.status)}`}
                      >
                        {getLabelStatus(caso.status)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {caso.tribunal}
                        </span>
                        {/* Indicador de clique */}
                        <div
                          className={`
                          w-5 h-5 rounded-full flex items-center justify-center transition-all
                          ${
                            isFirst
                              ? 'bg-[#D4AF37]/15 group-hover:bg-[#D4AF37]/30'
                              : 'bg-slate-100 group-hover:bg-slate-200'
                          }
                        `}
                        >
                          <Star
                            className={`w-2.5 h-2.5 ${isFirst ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-slate-400'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nome do cliente */}
                    <div className="text-sm text-[#1A2B3C] mb-2 font-medium group-hover:text-[#1A2B3C]">
                      {caso.cliente}
                    </div>

                    {/* Número CNJ */}
                    <div className="text-xs text-slate-500 mb-3 font-mono">{caso.cnj}</div>

                    {/* Rodapé do card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {caso.movimentacoes[0]?.data ?? '—'}
                      </div>
                      <span
                        className={`
                        text-[10px] font-semibold uppercase tracking-wide transition-opacity
                        ${isFirst ? 'text-[#D4AF37] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}
                      `}
                      >
                        Ver detalhes →
                      </span>
                    </div>

                    {/* Linha de destaque inferior (só no primeiro card) */}
                    {isFirst && (
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                        <p className="text-[10px] text-[#D4AF37]/70 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#D4AF37] inline-block" />
                          Última mov.: {caso.movimentacoes[0]?.descricao.slice(0, 40)}…
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Atividade Recente ──────────────────────────────────────────── */}
          <div>
            <h3 className="text-[#1A2B3C] mb-4">Atividade Recente</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="space-y-4">
                {atividadesRecentes.map((atividade, index) => (
                  <div
                    key={index}
                    className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="mt-1 flex-shrink-0">{getIconeAtividade(atividade.tipo)}</div>
                    <div className="flex-1">
                      <div className="text-sm text-[#1A2B3C] mb-1">{atividade.descricao}</div>
                      <div className="text-xs text-slate-500 font-mono mb-1">
                        {atividade.processo}
                      </div>
                      <div className="text-xs text-slate-400">{atividade.tempo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
