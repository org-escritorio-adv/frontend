import { useQuery } from '@tanstack/react-query'
import {
  Download,
  Upload,
  FileText,
  Calendar,
  MapPin,
  Users,
  Scale,
  Hash,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { buscarProcessoPorId, exportarPdfProcesso } from '@/services/processos.service'
import { useAuth } from '@/context/AuthContext'
import { canEditProcessos, canExportDados } from '@/lib/rbac'

interface CaseDetailsProps {
  onBack?: () => void
  processoId?: string
}

type TipoMovimentacao =
  | 'Decisão'
  | 'Petição'
  | 'Audiência'
  | 'Documento'
  | 'Citação'
  | 'Distribuição'

function inferirTipo(descricao: string): TipoMovimentacao {
  const d = descricao.toLowerCase()
  if (
    d.includes('decisão') ||
    d.includes('despacho') ||
    d.includes('sentença') ||
    d.includes('acórdão')
  )
    return 'Decisão'
  if (
    d.includes('petição') ||
    d.includes('protocolo') ||
    d.includes('manifestação') ||
    d.includes('recurso')
  )
    return 'Petição'
  if (d.includes('audiência') || d.includes('sessão') || d.includes('julgamento'))
    return 'Audiência'
  if (d.includes('citação') || d.includes('intimação') || d.includes('notificação'))
    return 'Citação'
  if (d.includes('distribuição') || d.includes('distribuído') || d.includes('ajuizamento'))
    return 'Distribuição'
  return 'Documento'
}

function getIconeMovimentacao(tipo: TipoMovimentacao) {
  switch (tipo) {
    case 'Decisão':
      return <Scale className="w-5 h-5 text-purple-500" />
    case 'Petição':
      return <FileText className="w-5 h-5 text-blue-500" />
    case 'Audiência':
      return <Calendar className="w-5 h-5 text-green-500" />
    case 'Citação':
      return <Users className="w-5 h-5 text-yellow-600" />
    case 'Distribuição':
      return <FileText className="w-5 h-5 text-slate-500" />
    default:
      return <FileText className="w-5 h-5 text-orange-500" />
  }
}

function getBadgeMovimentacao(tipo: TipoMovimentacao): string {
  const map: Record<TipoMovimentacao, string> = {
    Decisão: 'bg-purple-100 text-purple-700',
    Petição: 'bg-blue-100   text-blue-700',
    Audiência: 'bg-green-100  text-green-700',
    Documento: 'bg-orange-100 text-orange-700',
    Citação: 'bg-yellow-100 text-yellow-700',
    Distribuição: 'bg-slate-100  text-slate-700'
  }
  return map[tipo] ?? 'bg-gray-100 text-gray-700'
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return iso
  }
}

function formatarDataCurta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return iso
  }
}

function normalizarStatus(status: string): string {
  if (!status) return 'Em Andamento'
  const s = status.toLowerCase()
  if (s === 'ativo' || s === 'ativa') return 'Em Andamento'
  if (s === 'arquivado' || s === 'arquivada') return 'Arquivado'
  if (s === 'em recurso') return 'Em Recurso'
  return status
}

export function CaseDetails({ onBack, processoId = '1' }: CaseDetailsProps) {
  const { user } = useAuth()
  const podeExportar = canExportDados(user)
  const podeEditar = canEditProcessos(user)

  const {
    data: processo = null,
    isLoading: loading,
    isError
  } = useQuery({
    queryKey: ['casos', processoId],
    queryFn: () => buscarProcessoPorId(processoId)
  })

  const error = isError ? 'Não foi possível carregar os dados do processo.' : null

  const handleExportarPDF = async () => {
    try {
      await exportarPdfProcesso(processoId)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao tentar baixar o PDF do processo.')
    }
  }

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Carregando processo…</p>
        </div>
      </div>
    )
  }

  /* ── Error ───────────────────────────────────────────────────────────────── */
  if (error || !processo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm">{error ?? 'Processo não encontrado.'}</p>
          {onBack && (
            <button onClick={onBack} className="text-[#D4AF37] text-sm hover:underline mt-1">
              Voltar para lista
            </button>
          )}
        </div>
      </div>
    )
  }

  const statusLabel = normalizarStatus(processo.status)
  const isAtivo =
    processo.status.toLowerCase() === 'ativo' || processo.status.toLowerCase() === 'ativa'

  const movimentacoes = (processo.movimentacoes ?? []).map(m => ({
    ...m,
    tipo: inferirTipo(m.descricao)
  }))

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ── Botão Voltar ───────────────────────────────────────────────────── */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#1A2B3C] mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para Processos Judiciais
        </button>
      )}

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-[#1A2B3C] mb-2">Detalhes do Processo Judicial</h2>
          <p className="text-slate-600 font-mono text-sm mb-3">{processo.numero_cnj}</p>
        </div>

        {podeExportar && (
          <button
            onClick={handleExportarPDF}
            className="self-start px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center gap-2 shadow-md whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            Exportar para PDF
          </button>
        )}
      </div>

      {/* ── Informações técnicas do processo ───────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-[#1A2B3C] mb-4">Informações do Processo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Número do Processo (CNJ)</span>
            </div>
            <div className="text-[#1A2B3C] font-mono text-sm">{processo.numero_cnj}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Tribunal</span>
            </div>
            <div className="text-[#1A2B3C] text-sm uppercase">{processo.tribunal}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Scale className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Status</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isAtivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}
              />
              {statusLabel}
            </span>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Partes</span>
            </div>
            <div className="text-[#1A2B3C] text-sm leading-relaxed">
              {processo.partes ?? 'Não informado'}
            </div>
          </div>

          {processo.data_abertura && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">Data de Distribuição</span>
              </div>
              <div className="text-[#1A2B3C] text-sm">{formatarData(processo.data_abertura)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline de movimentações ───────────────────────────────────────── */}
      {movimentacoes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-[#1A2B3C] mb-4">
            Movimentações
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({movimentacoes.length})
            </span>
          </h3>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />

            <div className="space-y-6">
              {movimentacoes.map((mov, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm z-10">
                    {getIconeMovimentacao(mov.tipo)}
                  </div>

                  <div className="flex-1 pt-1.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${getBadgeMovimentacao(mov.tipo)}`}
                      >
                        {mov.tipo}
                      </span>
                      <span className="text-xs text-slate-400">{formatarDataCurta(mov.data)}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{mov.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Documentos e Compliance ────────────────────────────────────────── */}
      {podeEditar && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-[#1A2B3C] mb-4">Documentos e Autorização de Compliance</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#D4AF37] transition-colors cursor-pointer group">
            <Upload className="w-12 h-12 text-slate-400 group-hover:text-[#D4AF37] mx-auto mb-3 transition-colors" />
            <p className="text-slate-600 mb-1">Enviar documentos de compliance</p>
            <p className="text-sm text-slate-400 mb-4">
              Arraste arquivos para cá ou clique para selecionar
            </p>
            <button className="px-5 py-2 bg-[#1A2B3C] text-white rounded-lg hover:bg-[#243447] transition-colors text-sm">
              Selecionar Arquivos
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
