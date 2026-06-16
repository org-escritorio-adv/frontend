import { useState } from 'react'
import { Search, Star, Clock, Plus, Filter, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { useNavigate } from 'react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'

type CaseItem = {
  id: string
  number: string
  client: string
  status: string
  statusColor: string
  type: string
  lastUpdate: string
  isFavorite: boolean
}

const typeColors: Record<string, string> = {
  Cível: 'bg-blue-50 text-blue-700 border-blue-200',
  Trabalhista: 'bg-purple-50 text-purple-700 border-purple-200',
  Empresarial: 'bg-amber-50 text-amber-700 border-amber-200'
}

export function MeusCasos() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const cases = {
    ativos: [
      {
        id: '1',
        number: '0001234-56.2024.8.26.0100',
        client: 'João da Silva',
        status: 'Em Andamento',
        statusColor: 'bg-blue-500',
        type: 'Cível',
        lastUpdate: '2 dias atrás',
        isFavorite: true
      },
      {
        id: '2',
        number: '0007890-12.2024.8.26.0200',
        client: 'Maria Oliveira',
        status: 'Aguardando',
        statusColor: 'bg-yellow-500',
        type: 'Trabalhista',
        lastUpdate: '5 dias atrás',
        isFavorite: true
      },
      {
        id: '4',
        number: '0009876-54.2024.8.26.0400',
        client: 'Pedro Santos',
        status: 'Em Andamento',
        statusColor: 'bg-blue-500',
        type: 'Trabalhista',
        lastUpdate: '1 dia atrás',
        isFavorite: false
      }
    ] as CaseItem[],
    finalizados: [
      {
        id: '3',
        number: '0005678-90.2024.8.26.0300',
        client: 'Empresa XYZ Ltda',
        status: 'Finalizado',
        statusColor: 'bg-green-500',
        type: 'Empresarial',
        lastUpdate: '1 semana atrás',
        isFavorite: true
      }
    ] as CaseItem[]
  }

  const filter = (list: CaseItem[]) =>
    list.filter(
      c =>
        !searchQuery ||
        c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.number.includes(searchQuery)
    )

  const totalFav =
    cases.ativos.filter(c => c.isFavorite).length +
    cases.finalizados.filter(c => c.isFavorite).length

  const renderCard = (c: CaseItem) => (
    <div
      key={c.id}
      onClick={() => navigate(`/app/caso/${c.id}`)}
      className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:scale-[0.99] transition-all"
      style={{ boxShadow: '0 2px 10px rgba(26,43,60,0.07)' }}
    >
      {/* Row 1: Status + Favorite */}
      <div className="flex items-center justify-between mb-3">
        <Badge className={`${c.statusColor} text-white border-0 text-xs`}>{c.status}</Badge>
        <button
          onClick={e => e.stopPropagation()}
          className="w-8 h-8 -mr-1 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Star
            className={`w-4 h-4 ${
              c.isFavorite ? 'fill-[#C5A059] text-[#C5A059]' : 'text-slate-300'
            }`}
          />
        </button>
      </div>

      {/* Row 2: Case number */}
      <p className="font-mono text-xs text-slate-400 mb-1.5 leading-snug">{c.number}</p>

      {/* Row 3: Client name */}
      <h3 className="text-sm font-semibold text-[#1A2B3C] mb-3">{c.client}</h3>

      {/* Row 4: Type tag + Time */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            typeColors[c.type] ?? 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {c.type}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{c.lastUpdate}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Search sub-header ─────────────────────────── */}
      <div
        className="bg-white border-b border-slate-100 px-4 py-3"
        style={{ boxShadow: '0 1px 6px rgba(26,43,60,0.05)' }}
      >
        {/* Search input — full width, touch-friendly 48px */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none w-[18px] h-[18px]" />
          <input
            type="text"
            placeholder="Buscar por cliente ou número..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1A2B3C] placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 focus:border-[#1A2B3C]/40 transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Stats card ───────────────────────────────── */}
      <div className="px-4 mt-4 mb-4">
        <div
          className="bg-white rounded-2xl border border-slate-100 p-4"
          style={{ boxShadow: '0 2px 10px rgba(26,43,60,0.07)' }}
        >
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[
              { value: cases.ativos.length, label: 'Ativos', accent: 'text-blue-600' },
              { value: cases.finalizados.length, label: 'Finalizados', accent: 'text-green-600' },
              { value: totalFav, label: 'Favoritos', accent: 'text-[#C5A059]' }
            ].map(s => (
              <div key={s.label} className="text-center px-2">
                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="px-4 pb-6">
        <Tabs defaultValue="ativos" className="w-full">
          <TabsList className="w-full bg-slate-100 p-1 rounded-xl mb-4 h-11">
            <TabsTrigger
              value="ativos"
              className="flex-1 rounded-lg h-9 text-sm data-[state=active]:bg-white data-[state=active]:text-[#1A2B3C] data-[state=active]:shadow-sm"
            >
              Ativos ({cases.ativos.length})
            </TabsTrigger>
            <TabsTrigger
              value="finalizados"
              className="flex-1 rounded-lg h-9 text-sm data-[state=active]:bg-white data-[state=active]:text-[#1A2B3C] data-[state=active]:shadow-sm"
            >
              Finalizados ({cases.finalizados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="space-y-3 mt-0">
            {filter(cases.ativos).length > 0 ? (
              filter(cases.ativos).map(renderCard)
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">Nenhum caso encontrado</div>
            )}
          </TabsContent>

          <TabsContent value="finalizados" className="space-y-3 mt-0">
            {filter(cases.finalizados).length > 0 ? (
              filter(cases.finalizados).map(renderCard)
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">Nenhum caso encontrado</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── FAB: Novo caso ──────────────────────────── */}
      <button
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-[#C5A059] text-white rounded-full flex items-center justify-center z-30 active:scale-95 transition-transform"
        style={{ boxShadow: '0 4px 16px rgba(197,160,89,0.45)' }}
        aria-label="Adicionar novo caso"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
