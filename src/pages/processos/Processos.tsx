import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Download,
  Scale,
  Calendar,
  FileText,
  AlertCircle,
  Archive,
  Hash,
  Building2,
  Clock,
  ArrowUpRight,
  Database,
  CheckCircle,
  Pencil,
  Star
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import {
  buscarClientes,
  buscarProcessos,
  buscarProcessosRaw,
  buscarProcessoPorId,
  criarProcesso,
  atualizarProcesso,
  exportarCsvProcessos,
  type Processo,
  type ProcessoAPI,
  type ClienteAPI,
  type CriarProcessoPayload
} from '@/services/processos.service'
import {
  consultarDataJud,
  importarDataJud,
  sincronizarTodosProcessos,
  type DataJudProcesso,
  type DataJudImportarResponse
} from '@/services/datajud.service'
import { NovoClienteModal } from '@/pages/casos/NovoClienteModal'
import { ClienteDetailPanel } from './ClienteDetailPanel'

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusProcesso = 'Ativo' | 'Arquivado' | 'Em Recurso' | 'Suspenso'

const statusConfig: Record<StatusProcesso, { label: string; dot: string; badge: string }> = {
  Ativo: { label: 'Ativo', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  Arquivado: { label: 'Arquivado', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
  'Em Recurso': { label: 'Em Recurso', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  Suspenso: { label: 'Suspenso', dot: 'bg-red-400', badge: 'bg-red-100 text-red-600' }
}

const TRIBUNAIS = [
  { value: 'tjdft', label: 'TJDFT' },
  { value: 'tjsp', label: 'TJSP' },
  { value: 'tjrj', label: 'TJRJ' },
  { value: 'tjmg', label: 'TJMG' },
  { value: 'tjrs', label: 'TJRS' },
  { value: 'tjpr', label: 'TJPR' },
  { value: 'tjba', label: 'TJBA' },
  { value: 'tjpe', label: 'TJPE' },
  { value: 'tjce', label: 'TJCE' },
  { value: 'tjgo', label: 'TJGO' },
  { value: 'tjsc', label: 'TJSC' },
  { value: 'tjam', label: 'TJAM' },
  { value: 'tjpa', label: 'TJPA' },
  { value: 'trf1', label: 'TRF1' },
  { value: 'trf2', label: 'TRF2' },
  { value: 'trf3', label: 'TRF3' },
  { value: 'trf4', label: 'TRF4' },
  { value: 'trf5', label: 'TRF5' },
  { value: 'tst', label: 'TST' },
  { value: 'stj', label: 'STJ' }
]

function parseDateAjuizamento(valor: string | null): string {
  if (!valor || valor.length < 8) return '—'
  return `${valor.slice(6, 8)}/${valor.slice(4, 6)}/${valor.slice(0, 4)}`
}

// Formata o timestamp ISO retornado pelo backend para o padrão "dd/mm/aaaa às hh:mm".
// Se ainda não houver nenhum valor (ex: antes da primeira sincronização da sessão),
// mostra um aviso claro em vez de uma data falsa.
function formatarDataHora(iso: string | null): string {
  if (!iso) return 'ainda não sincronizado'
  const d = new Date(iso)
  const data = d.toLocaleDateString('pt-BR')
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${data} às ${hora}`
}

type ModalTab = 'datajud' | 'manual'
type DataJudStep = 'form' | 'preview' | 'success'

// ─── Component ───────────────────────────────────────────────────────────────

interface ProcessosProps {
  onViewProcess: (id: string) => void
  autoEditProcessoId?: string | null
  onEditOpened?: () => void
}

export function Processos({ onViewProcess, autoEditProcessoId, onEditOpened }: ProcessosProps) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // API State
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<ClienteAPI[]>([])
  const [clientesMap, setClientesMap] = useState<Record<number, string>>({})
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNovoClienteModalOpen, setIsNovoClienteModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<ModalTab>('datajud')

  // Manual tab state
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [manualForm, setManualForm] = useState({
    numero_cnj: '',
    tribunal: '',
    partes: '',
    data_abertura: '',
    status: 'ativo',
    cliente_id: ''
  })

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProcesso, setEditingProcesso] = useState<ProcessoAPI | null>(null)
  const [editForm, setEditForm] = useState({ cliente_id: '', status: 'ativo', partes: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Cliente Panel state
  const [isClientePanelOpen, setIsClientePanelOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteAPI | null>(null)
  const [processosDoCliente, setProcessosDoCliente] = useState<ProcessoAPI[]>([])
  const [isBuscarClienteModalOpen, setIsBuscarClienteModalOpen] = useState(false)
  // DataJud tab state
  const [datajudStep, setDatajudStep] = useState<DataJudStep>('form')
  const [datajudForm, setDatajudForm] = useState({ cnj: '', tribunal: 'tjdft' })
  const [datajudBuscando, setDatajudBuscando] = useState(false)
  const [datajudResultado, setDatajudResultado] = useState<DataJudProcesso | null>(null)
  const [datajudClienteId, setDatajudClienteId] = useState('')
  const [datajudImportando, setDatajudImportando] = useState(false)
  const [datajudImportResponse, setDatajudImportResponse] =
    useState<DataJudImportarResponse | null>(null)
  const [datajudError, setDatajudError] = useState('')

  const fetchClientes = async () => {
    setLoadingClientes(true)
    try {
      const data = await buscarClientes()
      setClientes(data)
      const map: Record<number, string> = {}
      data.forEach(c => {
        map[c.id] = c.nome_razao_social
      })
      setClientesMap(map)
      return map
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return {}
    } finally {
      setLoadingClientes(false)
    }
  }

  const fetchProcessos = async (currClientesMap?: Record<number, string>) => {
    const activeMap = currClientesMap ?? clientesMap
    try {
      const mapped = await buscarProcessos(activeMap)
      setProcessos(mapped)
    } catch (error) {
      console.error('Erro ao buscar processos:', error)
    }
  }

  const loadData = async () => {
    const map = await fetchClientes()
    await fetchProcessos(map)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetModal = () => {
    setModalTab('datajud')
    setManualForm({
      numero_cnj: '',
      tribunal: '',
      partes: '',
      data_abertura: '',
      status: 'ativo',
      cliente_id: ''
    })
    setErrorMsg('')
    setSuccessMsg('')
    setDatajudStep('form')
    setDatajudForm({ cnj: '', tribunal: 'tjdft' })
    setDatajudResultado(null)
    setDatajudClienteId('')
    setDatajudImportResponse(null)
    setDatajudError('')
  }

  const openModal = () => {
    resetModal()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isNovoClienteModalOpen) return
    setIsModalOpen(false)
  }

  // ── DataJud handlers ──────────────────────────────────────────────────────

  const handleDataJudBuscar = async () => {
    setDatajudError('')
    if (!datajudForm.cnj.trim()) {
      setDatajudError('Informe o número CNJ do processo.')
      return
    }
    setDatajudBuscando(true)
    try {
      const result = await consultarDataJud(datajudForm.cnj.trim(), datajudForm.tribunal)
      if (result.total === 0 || result.processos.length === 0) {
        setDatajudError(
          'Processo não encontrado no DataJud. Verifique o número CNJ e o tribunal selecionado.'
        )
        return
      }
      setDatajudResultado(result.processos[0])
      setDatajudStep('preview')
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setDatajudError(msg || 'Erro ao consultar o DataJud. Tente novamente.')
    } finally {
      setDatajudBuscando(false)
    }
  }

  const handleDataJudImportar = async () => {
    setDatajudError('')
    setDatajudImportando(true)
    try {
      const result = await importarDataJud(
        datajudForm.cnj.trim(),
        datajudForm.tribunal,
        datajudClienteId ? parseInt(datajudClienteId) : null
      )
      setDatajudImportResponse(result)
      setDatajudStep('success')
      loadData()
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setDatajudError(msg || 'Erro ao importar o processo.')
    } finally {
      setDatajudImportando(false)
    }
  }

  const resetDatajudForm = () => {
    setDatajudStep('form')
    setDatajudResultado(null)
    setDatajudImportResponse(null)
    setDatajudClienteId('')
    setDatajudError('')
    setDatajudForm({ cnj: '', tribunal: 'tjdft' })
  }

  // ── Manual handler ────────────────────────────────────────────────────────

  const validarCNJ = (cnj: string) => cnj.replace(/\D/g, '').length === 20

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (
      !manualForm.numero_cnj ||
      !manualForm.tribunal ||
      !manualForm.partes ||
      !manualForm.data_abertura
    ) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }
    if (!validarCNJ(manualForm.numero_cnj)) {
      setErrorMsg('O Número CNJ deve conter exatamente 20 dígitos numéricos.')
      return
    }

    setSubmitting(true)
    try {
      const payload: CriarProcessoPayload = {
        numero_cnj: manualForm.numero_cnj,
        tribunal: manualForm.tribunal,
        partes: manualForm.partes,
        data_abertura: new Date(manualForm.data_abertura).toISOString(),
        status: manualForm.status,
        favorito: false,
        cliente_id: manualForm.cliente_id ? parseInt(manualForm.cliente_id) : null,
        advogado_id: null
      }
      await criarProcesso(payload)
      setSuccessMsg('Processo cadastrado com sucesso!')
      loadData()
      setTimeout(() => setIsModalOpen(false), 1200)
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setErrorMsg(msg || 'Erro ao cadastrar processo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit handlers ────────────────────────────────────────────────────────

  const handleOpenEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditError('')
    try {
      const raw = await buscarProcessoPorId(id)
      setEditingProcesso(raw)
      setEditForm({
        cliente_id: raw.cliente_id != null ? String(raw.cliente_id) : '',
        status: raw.status ?? 'ativo',
        partes: raw.partes ?? ''
      })
      setIsEditModalOpen(true)
    } catch {
      console.error('Erro ao carregar processo para edição')
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProcesso) return
    setEditError('')
    setEditSubmitting(true)
    try {
      await atualizarProcesso(String(editingProcesso.id), {
        cliente_id: editForm.cliente_id ? parseInt(editForm.cliente_id) : null,
        status: editForm.status,
        partes: editForm.partes || undefined
      })
      setIsEditModalOpen(false)
      loadData()
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setEditError(msg || 'Erro ao salvar alterações.')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleToggleFavorito = async (id: string, atual: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await atualizarProcesso(id, { favorito: !atual })
      loadData()
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'casos-destacados'] })
    } catch (error) {
      console.error('Erro ao alternar favorito', error)
    }
  }

  const handleOpenClientePanel = async (clienteId: number | null, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!clienteId) return
    const cli = clientes.find(c => c.id === clienteId)
    if (cli) {
      try {
        const pRaw = await buscarProcessosRaw()
        const pCli = pRaw.filter(p => p.cliente_id === clienteId)
        setProcessosDoCliente(pCli)
        setSelectedCliente(cli)
        setIsClientePanelOpen(true)
      } catch(err) {
        console.error(err)
      }
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const totalAtivos = processos.filter(p => p.status === 'Ativo').length
  const totalArquivados = processos.filter(p => p.status === 'Arquivado').length
  const totalRecurso = processos.filter(p => p.status === 'Em Recurso').length

  const filtered = processos.filter(p => {
    const q = query.toLowerCase()
    return (
      p.cnj.includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      p.parteContraria.toLowerCase().includes(q) ||
      p.tribunal.toLowerCase().includes(q)
    )
  })

  // Sincronização REAL com o DataJud (US 2.1.1).
  // Antes era um mock (setTimeout fingindo carregar). Agora chama o backend de
  // verdade e trata o caso de falha: mostra mensagem de erro clara e mantém os
  // dados antigos + a data da última sincronização bem-sucedida na tela.
  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncError('')
    try {
      const resultado = await sincronizarTodosProcessos()
      setUltimaSincronizacao(resultado.ultima_sincronizacao)
      await loadData()
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setSyncError(
        msg ||
          'Não foi possível sincronizar com o DataJud agora. Os dados exibidos podem estar desatualizados.'
      )
    } finally {
      setSyncing(false)
    }
  }

  const [exporting, setExporting] = useState(false)
  const handleExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    try {
      await exportarCsvProcessos()
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao tentar baixar o arquivo CSV.')
    } finally {
      setExporting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <ClienteDetailPanel
        isOpen={isClientePanelOpen}
        onClose={() => setIsClientePanelOpen(false)}
        cliente={selectedCliente}
        processos={processosDoCliente}
        onViewProcesso={onViewProcess}
      />
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[#1A2B3C] text-xl font-semibold">Processos Judiciais</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Integração DataJud · {processos.length} processos vinculados
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#D4AF37] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Baixando...' : 'Exportar CSV'}
            </button>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-[#D4AF37]' : ''}`} />
              {syncing ? 'Sincronizando…' : 'Sincronizar DataJud'}
            </button>

            <button
              onClick={() => setIsBuscarClienteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1A2B3C] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
            >
              <Search className="w-4 h-4" />
              Buscar Cliente
            </button>

            <button
              onClick={() => setIsNovoClienteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1A2B3C] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
            >
              <Building2 className="w-4 h-4" />
              Novo Cliente
            </button>

            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo Processo
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por número CNJ ou nome da parte…"
            className="w-full h-[44px] pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5 rounded bg-slate-200"
            >
              limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Stats chips ──────────────────────────────────────────────────────── */}
      <div className="px-8 py-3 flex items-center gap-3 border-b border-gray-100 bg-white/70">
        {[
          {
            label: 'Total',
            value: processos.length,
            icon: Scale,
            color: 'text-[#1A2B3C]',
            bg: 'bg-slate-100'
          },
          {
            label: 'Ativos',
            value: totalAtivos,
            icon: FileText,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
          {
            label: 'Arquivados',
            value: totalArquivados,
            icon: Archive,
            color: 'text-slate-500',
            bg: 'bg-slate-100'
          },
          {
            label: 'Em Recurso',
            value: totalRecurso,
            icon: AlertCircle,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
          }
        ].map(chip => {
          const Icon = chip.icon
          return (
            <div
              key={chip.label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${chip.bg}`}
            >
              <Icon className={`w-3.5 h-3.5 ${chip.color}`} />
              <span className={`text-xs font-semibold ${chip.color}`}>{chip.value}</span>
              <span className="text-xs text-slate-500">{chip.label}</span>
            </div>
          )
        })}

        <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          Última sincronização: {formatarDataHora(ultimaSincronizacao)}
        </div>
      </div>

      {/* ── Aviso de erro de sincronização (US 2.1.1) ───────────────────────── */}
      {syncError && (
        <div className="px-8 py-2.5 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {syncError}
          </p>
        </div>
      )}

      {/* ── Data Grid ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[minmax(200px,1fr)_minmax(180px,1.2fr)_minmax(160px,1fr)_minmax(200px,1.2fr)_100px_160px] px-5 py-3 bg-slate-50 border-b border-gray-100">
            {[
              { label: 'Número CNJ', icon: Hash },
              { label: 'Cliente / Parte', icon: Scale },
              { label: 'Tribunal', icon: Building2 },
              { label: 'Última Movimentação', icon: Calendar },
              { label: 'Status', icon: null },
              { label: '', icon: null }
            ].map((col, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {col.icon && <col.icon className="w-3 h-3 text-slate-400" />}
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </span>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Search className="w-10 h-10 text-slate-300" />
              <p className="text-slate-500 text-sm">Nenhum processo encontrado.</p>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-[#D4AF37] text-sm hover:underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            filtered.map((proc, index) => {
              const cfg = statusConfig[proc.status] ?? statusConfig['Ativo']
              const isFirst = index === 0
              const isHovered = hoveredRow === proc.id

              return (
                <div
                  key={proc.id}
                  onClick={() => onViewProcess(proc.id)}
                  onMouseEnter={() => setHoveredRow(proc.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    grid grid-cols-[minmax(200px,1fr)_minmax(180px,1.2fr)_minmax(160px,1fr)_minmax(200px,1.2fr)_100px_160px]
                    px-5 py-4 cursor-pointer transition-all duration-150 relative
                    ${index < filtered.length - 1 ? 'border-b border-gray-50' : ''}
                    ${isHovered ? 'bg-slate-50/80' : 'bg-white'}
                  `}
                >
                  {isHovered && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4AF37] rounded-r-full" />
                  )}

                  <div className="flex flex-col justify-center min-w-0">
                    <span className="font-mono text-[13px] text-[#1A2B3C] font-medium tracking-tight truncate">
                      {proc.cnj}
                    </span>
                    {isFirst && (
                      <span className="text-[10px] text-[#D4AF37] font-medium mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block" />
                        Mais recente
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span 
                      onClick={(e) => handleOpenClientePanel(proc.clienteId, e)}
                      className={`text-sm font-semibold truncate transition-colors ${proc.clienteId ? 'text-[#1A2B3C] hover:text-[#D4AF37] hover:underline cursor-pointer' : 'text-[#1A2B3C]'}`}
                    >
                      {proc.cliente}
                    </span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">
                      × {proc.parteContraria}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-sm font-semibold text-[#1A2B3C]">{proc.tribunal}</span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">{proc.vara}</span>
                  </div>

                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-xs font-medium text-slate-600">
                      {proc.ultimaMovimentacao.data}
                    </span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">
                      {proc.ultimaMovimentacao.descricao}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${proc.status === 'Ativo' ? 'animate-pulse' : ''}`}
                      />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={e => handleToggleFavorito(proc.id, proc.favorito, e)}
                      title={proc.favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      className={`
                        flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${proc.favorito ? 'text-[#D4AF37] hover:bg-[#D4AF37]/10' : isHovered ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-100' : 'text-transparent'}
                      `}
                    >
                      <Star className={`w-4 h-4 ${proc.favorito ? 'fill-[#D4AF37]' : ''}`} />
                    </button>
                    <button
                      onClick={e => handleOpenEdit(proc.id, e)}
                      title="Editar processo"
                      className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isHovered ? 'bg-slate-100 text-[#1A2B3C] hover:bg-slate-200' : 'text-slate-300 hover:text-slate-500'}
                      `}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {isHovered && <span>Editar</span>}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onViewProcess(proc.id)
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isHovered ? 'bg-[#1A2B3C] text-white shadow-sm' : 'text-slate-400 hover:text-[#1A2B3C]'}
                      `}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isHovered ? 'Abrir' : 'Ver'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-slate-400">
            Exibindo {filtered.length} de {processos.length} processos
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
            Clique em qualquer linha para ver os detalhes completos
          </div>
        </div>
      </div>

      {/* ─── MODAL NOVO PROCESSO ─── */}
      <Dialog
        open={isModalOpen}
        onOpenChange={open => {
          if (!open && isNovoClienteModalOpen) return
          if (!open) setIsModalOpen(false)
        }}
      >
        <DialogContent
          className="sm:max-w-[520px] bg-white border border-slate-100 rounded-xl p-6"
          onInteractOutside={e => {
            if (isNovoClienteModalOpen) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1A2B3C]">
              Novo Processo
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Importe via DataJud (automático) ou cadastre manualmente.
            </p>
          </DialogHeader>

          {/* ── Tab switcher ── */}
          <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 mt-1">
            <button
              type="button"
              onClick={() => setModalTab('datajud')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                modalTab === 'datajud'
                  ? 'bg-white text-[#1A2B3C] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Via DataJud
            </button>
            <button
              type="button"
              onClick={() => setModalTab('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                modalTab === 'manual'
                  ? 'bg-white text-[#1A2B3C] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Manual
            </button>
          </div>

          {/* ── DataJud tab ── */}
          {modalTab === 'datajud' && (
            <div className="space-y-4 mt-2">
              {/* Step: form */}
              {datajudStep === 'form' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Número CNJ *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 0001234-56.2024.8.07.0001"
                      value={datajudForm.cnj}
                      onChange={e => setDatajudForm({ ...datajudForm, cnj: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleDataJudBuscar()
                      }}
                      className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Tribunal *
                    </label>
                    <select
                      value={datajudForm.tribunal}
                      onChange={e => setDatajudForm({ ...datajudForm, tribunal: e.target.value })}
                      className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                    >
                      {TRIBUNAIS.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {datajudError && (
                    <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-2.5">
                      {datajudError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDataJudBuscar}
                      disabled={datajudBuscando}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                    >
                      <Search className={`w-3.5 h-3.5 ${datajudBuscando ? 'animate-pulse' : ''}`} />
                      {datajudBuscando ? 'Buscando…' : 'Buscar no DataJud'}
                    </button>
                  </div>
                </>
              )}

              {/* Step: preview */}
              {datajudStep === 'preview' && datajudResultado && (
                <>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle className="w-3 h-3" />
                        Encontrado no DataJud
                      </span>
                      <button
                        type="button"
                        onClick={resetDatajudForm}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                      >
                        Buscar outro
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Número CNJ
                      </span>
                      <p className="font-mono text-sm text-[#1A2B3C] font-semibold mt-0.5">
                        {datajudResultado.numeroProcesso}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Classe
                        </span>
                        <p className="text-xs text-[#1A2B3C] mt-0.5 truncate">
                          {datajudResultado.classe?.nome ?? '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Tribunal
                        </span>
                        <p className="text-xs text-[#1A2B3C] mt-0.5 uppercase">
                          {datajudResultado.tribunal ?? datajudForm.tribunal}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Órgão Julgador
                        </span>
                        <p className="text-xs text-[#1A2B3C] mt-0.5 truncate">
                          {datajudResultado.orgaoJulgador?.nome ?? '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Data Ajuizamento
                        </span>
                        <p className="text-xs text-[#1A2B3C] mt-0.5">
                          {parseDateAjuizamento(datajudResultado.dataAjuizamento)}
                        </p>
                      </div>
                    </div>

                    {datajudResultado.partes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Partes
                        </span>
                        <div className="space-y-1 mt-1.5">
                          {datajudResultado.partes.slice(0, 4).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span
                                className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                  p.polo === 'ATIVO'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {p.polo ?? '?'}
                              </span>
                              <span className="text-slate-600 truncate">
                                {p.nome ?? 'Sem nome'}
                              </span>
                            </div>
                          ))}
                          {datajudResultado.partes.length > 4 && (
                            <p className="text-[10px] text-slate-400 pl-1">
                              +{datajudResultado.partes.length - 4} outras partes
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-200 pt-2.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        {datajudResultado.movimentos.length} movimentações serão importadas
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Vincular a Cliente (opcional)
                    </label>
                    <select
                      value={datajudClienteId}
                      onChange={e => setDatajudClienteId(e.target.value)}
                      disabled={loadingClientes}
                      className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                    >
                      <option value="">Nenhum</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nome_razao_social}
                        </option>
                      ))}
                    </select>
                  </div>

                  {datajudError && (
                    <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-2.5">
                      {datajudError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDataJudImportar}
                      disabled={datajudImportando}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                    >
                      <Database
                        className={`w-3.5 h-3.5 ${datajudImportando ? 'animate-pulse' : ''}`}
                      />
                      {datajudImportando ? 'Importando…' : 'Importar Processo'}
                    </button>
                  </div>
                </>
              )}

              {/* Step: success */}
              {datajudStep === 'success' && datajudImportResponse && (
                <>
                  <div className="flex flex-col items-center text-center gap-3 py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B3C]">
                        Processo importado com sucesso!
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {datajudImportResponse.movimentacoes_importadas} movimentações importadas
                      </p>
                    </div>
                    <p className="font-mono text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                      {datajudImportResponse.numero_cnj}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetDatajudForm}
                      className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition"
                    >
                      Importar Outro
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition"
                    >
                      Concluir
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Manual tab ── */}
          {modalTab === 'manual' && (
            <form onSubmit={handleCreateManual} className="space-y-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Número CNJ (20 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 0001234-56.2024.8.26.0100"
                  value={manualForm.numero_cnj}
                  onChange={e => setManualForm({ ...manualForm, numero_cnj: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tribunal *
                  </label>
                  <select
                    required
                    value={manualForm.tribunal}
                    onChange={e => setManualForm({ ...manualForm, tribunal: e.target.value })}
                    className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                  >
                    <option value="">Selecione...</option>
                    {TRIBUNAIS.map(t => (
                      <option key={t.value} value={t.value.toUpperCase()}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status *
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={e => setManualForm({ ...manualForm, status: e.target.value })}
                    className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Partes (Autor vs. Réu) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva vs. Empresa Alpha S/A"
                  value={manualForm.partes}
                  onChange={e => setManualForm({ ...manualForm, partes: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.data_abertura}
                    onChange={e => setManualForm({ ...manualForm, data_abertura: e.target.value })}
                    className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cliente
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNovoClienteModalOpen(true)}
                      className="text-[10px] text-[#D4AF37] hover:underline"
                    >
                      + Novo cliente
                    </button>
                  </div>
                  <select
                    value={manualForm.cliente_id}
                    onChange={e => setManualForm({ ...manualForm, cliente_id: e.target.value })}
                    className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                    disabled={loadingClientes}
                  >
                    <option value="">Nenhum</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome_razao_social}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-2.5">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="text-xs text-emerald-500 font-medium bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                  {successMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                >
                  {submitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL EDITAR PROCESSO ─── */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={open => {
          if (!open) setIsEditModalOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border border-slate-100 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1A2B3C]">
              Editar Processo
            </DialogTitle>
            {editingProcesso && (
              <p className="text-xs text-slate-400 font-mono mt-1">{editingProcesso.numero_cnj}</p>
            )}
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Cliente / Parte Representada
                </label>
                <button
                  type="button"
                  onClick={() => setIsNovoClienteModalOpen(true)}
                  className="text-[10px] text-[#D4AF37] hover:underline"
                >
                  + Novo cliente
                </button>
              </div>
              <select
                value={editForm.cliente_id}
                onChange={e => setEditForm({ ...editForm, cliente_id: e.target.value })}
                disabled={loadingClientes}
                className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none bg-white transition"
              >
                <option value="">Sem cliente vinculado</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome_razao_social}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Selecione o cliente/parte que este escritório representa no processo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                >
                  <option value="ativo">Ativo</option>
                  <option value="arquivado">Arquivado</option>
                  <option value="em_recurso">Em Recurso</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tribunal
                </label>
                <input
                  type="text"
                  value={editingProcesso?.tribunal ?? ''}
                  disabled
                  className="h-[40px] px-3 border border-slate-100 rounded-lg text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Partes (Autor vs. Réu)
              </label>
              <input
                type="text"
                placeholder="Ex: João Silva vs. Empresa Alpha S/A"
                value={editForm.partes}
                onChange={e => setEditForm({ ...editForm, partes: e.target.value })}
                className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
              />
            </div>

            {editError && (
              <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-2.5">
                {editError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
              >
                <Pencil className={`w-3.5 h-3.5 ${editSubmitting ? 'animate-pulse' : ''}`} />
                {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NovoClienteModal
        isOpen={isNovoClienteModalOpen}
        onClose={() => setIsNovoClienteModalOpen(false)}
        onClienteCriado={async c => {
          await fetchClientes()
          if (isEditModalOpen) {
            setEditForm(prev => ({ ...prev, cliente_id: c.id.toString() }))
          } else if (modalTab === 'datajud') {
            setDatajudClienteId(c.id.toString())
          } else {
            setManualForm(prev => ({ ...prev, cliente_id: c.id.toString() }))
          }
        }}
      />

      <Dialog open={isBuscarClienteModalOpen} onOpenChange={setIsBuscarClienteModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 shadow-xl p-0 overflow-hidden">
          <DialogHeader className="bg-slate-50 border-b border-gray-100 px-6 py-4">
            <DialogTitle className="text-lg text-[#1A2B3C] font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-[#D4AF37]" />
              Buscar Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
            {clientes.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum cliente cadastrado ainda.</p>
            ) : (
              clientes.map(c => (
                <div 
                  key={c.id} 
                  onClick={(e) => {
                    setIsBuscarClienteModalOpen(false)
                    handleOpenClientePanel(c.id, e as unknown as React.MouseEvent)
                  }}
                  className="p-3 border border-slate-100 rounded-lg hover:border-[#D4AF37]/50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-semibold text-[#1A2B3C]">{c.nome_razao_social}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{c.cpf_cnpj}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}