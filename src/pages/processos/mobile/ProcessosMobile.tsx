import { useState, useEffect } from 'react'
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Database,
  CheckCircle,
  Scale,
  Calendar,
  FileText,
  AlertCircle,
  Archive,
  Hash,
  Building2,
  Clock,
  X,
  ChevronDown,
  Download,
  UserSearch
} from 'lucide-react'
import {
  buscarClientes,
  buscarProcessos,
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
  type DataJudProcesso,
  type DataJudImportarResponse
} from '@/services/datajud.service'
import { useAuth } from '@/context/AuthContext'
import { canCreateProcessos, canEditProcessos, canViewClientes, canExportDados } from '@/lib/rbac'

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusProcesso = 'Ativo' | 'Arquivado' | 'Em Recurso' | 'Suspenso'

const statusConfig: Record<StatusProcesso, { label: string; dot: string; badge: string }> = {
  Ativo: { label: 'Ativo', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  Arquivado: { label: 'Arquivado', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
  'Em Recurso': { label: 'Em Recurso', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  Suspenso: { label: 'Suspenso', dot: 'bg-red-400', badge: 'bg-red-100 text-red-600' }
}

const TRIBUNAIS = ['TJSP', 'TJDFT', 'TJRJ', 'TJMG', 'TRF1', 'STJ', 'TST']

type SyncStep = 'form' | 'preview' | 'success'

// ─── Component ───────────────────────────────────────────────────────────────

export function ProcessosMobile() {
  const { user } = useAuth()
  const podeCriar = canCreateProcessos(user)
  const podeEditar = canEditProcessos(user)
  const podeVerClientes = canViewClientes(user)
  const podeExportar = canExportDados(user)

  const [query, setQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isBuscarClienteModalOpen, setIsBuscarClienteModalOpen] = useState(false)
  const [buscarClienteTermo, setBuscarClienteTermo] = useState('')

  const handleExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    try { await exportarCsvProcessos() }
    catch { /* silencioso */ }
    finally { setExporting(false) }
  }

  // API State
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<ClienteAPI[]>([])
  const [clientesMap, setClientesMap] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [errorApi, setErrorApi] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({
    numero_cnj: '',
    tribunal: '',
    partes: '',
    data_abertura: '',
    status: 'ativo',
    cliente_id: ''
  })

  // Edit modal state (US 2.3.2)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProcesso, setEditingProcesso] = useState<ProcessoAPI | null>(null)
  const [editForm, setEditForm] = useState({ cliente_id: '', status: 'ativo', partes: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Sincronizar com API / DataJud state (US 2.3.3)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncStep, setSyncStep] = useState<SyncStep>('form')
  const [syncForm, setSyncForm] = useState({ cnj: '', tribunal: 'tjdft' })
  const [syncBuscando, setSyncBuscando] = useState(false)
  const [syncResultado, setSyncResultado] = useState<DataJudProcesso | null>(null)
  const [syncClienteId, setSyncClienteId] = useState('')
  const [syncImportando, setSyncImportando] = useState(false)
  const [syncImportResponse, setSyncImportResponse] = useState<DataJudImportarResponse | null>(null)
  const [syncError, setSyncError] = useState('')

  const fetchClientes = async () => {
    if (!podeVerClientes) return {}
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
    } catch {
      return {}
    } finally {
      setLoadingClientes(false)
    }
  }

  const fetchProcessos = async (currMap?: Record<number, string>) => {
    const activeMap = currMap ?? clientesMap
    try {
      const mapped = await buscarProcessos(activeMap)
      setProcessos(mapped)
      setErrorApi('')
    } catch {
      setErrorApi('Erro ao carregar processos. Verifique sua conexão.')
    }
  }

  const loadData = async () => {
    setLoading(true)
    const map = await fetchClientes()
    await fetchProcessos(map)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (modalOpen) {
      setForm({
        numero_cnj: '',
        tribunal: '',
        partes: '',
        data_abertura: '',
        status: 'ativo',
        cliente_id: ''
      })
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [modalOpen])

  const validarCNJ = (cnj: string) => cnj.replace(/\D/g, '').length === 20

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!form.numero_cnj || !form.tribunal || !form.partes || !form.data_abertura) {
      setErrorMsg('Preencha todos os campos obrigatórios.')
      return
    }
    if (!validarCNJ(form.numero_cnj)) {
      setErrorMsg('O Número CNJ deve conter exatamente 20 dígitos numéricos.')
      return
    }

    setSubmitting(true)
    try {
      const payload: CriarProcessoPayload = {
        numero_cnj: form.numero_cnj,
        tribunal: form.tribunal,
        partes: form.partes,
        data_abertura: new Date(form.data_abertura).toISOString(),
        status: form.status,
        favorito: false,
        cliente_id: form.cliente_id ? parseInt(form.cliente_id) : null,
        advogado_id: null
      }
      await criarProcesso(payload)
      setSuccessMsg('Processo cadastrado com sucesso!')
      loadData()
      setTimeout(() => setModalOpen(false), 1200)
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setErrorMsg(msg || 'Erro ao cadastrar processo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSync = () => {
    if (syncing) return
    setSyncing(true)
    loadData().finally(() => setSyncing(false))
  }

  // ── Edição de processo manual (US 2.3.2) ────────────────────────────────────

  const handleOpenEdit = async (proc: Processo) => {
    setErrorApi('')
    try {
      const raw = await buscarProcessoPorId(proc.id)
      setEditingProcesso(raw)
      setEditForm({
        cliente_id: raw.cliente_id != null ? String(raw.cliente_id) : '',
        status: raw.status ?? 'ativo',
        partes: raw.partes ?? ''
      })
      setEditError('')
      setEditModalOpen(true)
    } catch {
      setErrorApi('Não foi possível carregar o processo para edição.')
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
      setEditModalOpen(false)
      loadData()
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setEditError(msg || 'Erro ao salvar alterações.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // ── Sincronizar com API / DataJud (US 2.3.3) ────────────────────────────────

  const resetSyncModal = () => {
    setSyncStep('form')
    setSyncResultado(null)
    setSyncClienteId('')
    setSyncImportResponse(null)
    setSyncError('')
  }

  const handleOpenSync = (proc: Processo) => {
    resetSyncModal()
    setSyncForm({ cnj: proc.cnj, tribunal: proc.tribunal.toLowerCase() })
    setSyncModalOpen(true)
  }

  const handleSyncBuscar = async () => {
    setSyncError('')
    if (!syncForm.cnj.trim()) {
      setSyncError('Informe o número CNJ do processo.')
      return
    }
    setSyncBuscando(true)
    try {
      const result = await consultarDataJud(syncForm.cnj.trim(), syncForm.tribunal)
      if (result.total === 0 || result.processos.length === 0) {
        setSyncError(
          'Processo não encontrado no DataJud. Verifique o número CNJ e o tribunal selecionado.'
        )
        return
      }
      setSyncResultado(result.processos[0])
      setSyncStep('preview')
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setSyncError(msg || 'Erro ao consultar o DataJud. Tente novamente.')
    } finally {
      setSyncBuscando(false)
    }
  }

  const handleSyncImportar = async () => {
    setSyncError('')
    setSyncImportando(true)
    try {
      const result = await importarDataJud(
        syncForm.cnj.trim(),
        syncForm.tribunal,
        syncClienteId ? parseInt(syncClienteId) : null
      )
      setSyncImportResponse(result)
      setSyncStep('success')
      loadData()
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      setSyncError(msg || 'Erro ao importar o processo.')
    } finally {
      setSyncImportando(false)
    }
  }

  // Stats
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">Processos Judiciais</h2>
        <p className="text-slate-500 text-sm">
          Integração DataJud · {processos.length} processos vinculados
        </p>
      </div>

      {/* ── Botões de ação ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {podeExportar && (
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-[#D4AF37] bg-white hover:bg-slate-50 transition-all disabled:opacity-60"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Baixando...' : 'Exportar CSV'}
          </button>
        )}

        <button
          onClick={() => setIsBuscarClienteModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white hover:bg-slate-50 transition-all"
        >
          <UserSearch className="w-4 h-4" />
          Buscar Cliente
        </button>

        {podeCriar && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Processo
          </button>
        )}
      </div>

      {/* ── Busca ─────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por número CNJ ou parte…"
          className="w-full h-[44px] pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs px-2 py-0.5 rounded bg-slate-200"
          >
            limpar
          </button>
        )}
      </div>

      {/* ── Estatísticas ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
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
            label: 'Arquiv.',
            value: totalArquivados,
            icon: Archive,
            color: 'text-slate-500',
            bg: 'bg-slate-100'
          },
          {
            label: 'Recurso',
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
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg ${chip.bg}`}
            >
              <Icon className={`w-3.5 h-3.5 ${chip.color} mb-0.5`} />
              <span className={`text-base font-bold ${chip.color}`}>{chip.value}</span>
              <span className="text-[9px] text-slate-500 font-medium">{chip.label}</span>
            </div>
          )
        })}
      </div>

      {/* ── Última sincronização ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mb-4">
        <Clock className="w-3 h-3" />
        Última sincronização: agora
      </div>

      {/* ── Erro de API ────────────────────────────────────────────── */}
      {errorApi && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {errorApi}
        </div>
      )}

      {/* ── Lista de Processos ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse"
            >
              <div className="h-3 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
              <Search className="w-10 h-10 text-slate-300" />
              <p className="text-slate-500 text-sm text-center">
                {query
                  ? `Nenhum processo encontrado para "${query}"`
                  : 'Nenhum processo cadastrado.'}
              </p>
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
              const isDestaque = index === 0

              return (
                <div
                  key={proc.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden"
                >
                  {isDestaque && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A059]" />
                  )}

                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="font-mono text-xs text-[#1A2B3C] font-medium tracking-tight truncate">
                          {proc.cnj}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#1A2B3C] truncate">
                        {proc.cliente}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        × {proc.parteContraria}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                      {isDestaque && (
                        <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wide flex items-center gap-1 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                          <span className="w-1 h-1 rounded-full bg-[#D4AF37] inline-block" />
                          Mais recente
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${cfg.dot} ${proc.status === 'Ativo' ? 'animate-pulse' : ''}`}
                        />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1A2B3C]">{proc.tribunal}</p>
                        <p className="text-[10px] text-slate-400 truncate">{proc.vara}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-600">
                          {proc.ultimaMovimentacao.data}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-2">
                          {proc.ultimaMovimentacao.descricao}
                        </p>
                      </div>
                    </div>

                    {podeEditar && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleOpenEdit(proc)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#1A2B3C] transition-colors border border-slate-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Editar</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Exibindo {filtered.length} de {processos.length} processos
          </p>
        </div>
      )}

      {/* ─── MODAL DE CADASTRO MANUAL (Bottom Sheet) ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setModalOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Cadastrar Processo</h3>
                <p className="text-xs text-slate-400 mt-0.5">Preencha os dados do processo</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <form onSubmit={handleCreateManual} className="space-y-4">
                {/* Número CNJ */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Número CNJ (20 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 0001234-56.2024.8.26.0100"
                    value={form.numero_cnj}
                    onChange={e => setForm({ ...form, numero_cnj: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                {/* Tribunal */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tribunal *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.tribunal}
                      onChange={e => setForm({ ...form, tribunal: e.target.value })}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {TRIBUNAIS.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="arquivado">Arquivado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Partes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Partes (Autor vs. Réu) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva vs. Empresa Alpha S/A"
                    value={form.partes}
                    onChange={e => setForm({ ...form, partes: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                {/* Data de Início */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.data_abertura}
                    onChange={e => setForm({ ...form, data_abertura: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none transition"
                  />
                </div>

                {/* Cliente Vinculado */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cliente Vinculado
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={form.cliente_id}
                      onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                      disabled={loadingClientes}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none disabled:opacity-60"
                    >
                      <option value="">Nenhum</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nome_razao_social}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-3">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-xs text-emerald-500 font-medium bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    {successMsg}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2 pb-safe">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                  >
                    {submitting ? 'Cadastrando...' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE EDIÇÃO (US 2.3.2 — Bottom Sheet) ─── */}
      {editModalOpen && editingProcesso && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setEditModalOpen(false)}
          />

          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Editar Processo</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {editingProcesso.numero_cnj}
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4">
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Cliente / Parte Representada
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.cliente_id}
                      onChange={e => setEditForm({ ...editForm, cliente_id: e.target.value })}
                      disabled={loadingClientes}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none disabled:opacity-60"
                    >
                      <option value="">Sem cliente vinculado</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nome_razao_social}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="arquivado">Arquivado</option>
                      <option value="em_recurso">Em Recurso</option>
                      <option value="suspenso">Suspenso</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tribunal
                  </label>
                  <input
                    type="text"
                    value={editingProcesso.tribunal ?? ''}
                    disabled
                    className="h-[44px] px-3 border border-slate-100 rounded-lg text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                  />
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
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                {editError && (
                  <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-3">
                    {editError}
                  </div>
                )}

                <div className="flex gap-3 pt-2 pb-safe">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    disabled={editSubmitting}
                    className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                  >
                    <Pencil className={`w-3.5 h-3.5 ${editSubmitting ? 'animate-pulse' : ''}`} />
                    {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL BUSCAR CLIENTE (Bottom Sheet) ─── */}
      {isBuscarClienteModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setIsBuscarClienteModalOpen(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-base font-semibold text-[#1A2B3C] flex items-center gap-2">
                <UserSearch className="w-4 h-4 text-[#D4AF37]" />
                Buscar Cliente
              </h3>
              <button onClick={() => setIsBuscarClienteModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pt-4 flex-shrink-0">
              <input
                type="text"
                placeholder="Nome, CPF ou CNPJ..."
                value={buscarClienteTermo}
                onChange={e => setBuscarClienteTermo(e.target.value)}
                className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
            <div className="p-5 overflow-y-auto flex flex-col gap-2">
              {clientes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Nenhum cliente cadastrado.</p>
              ) : (
                clientes
                  .filter(c => c.nome_razao_social.toLowerCase().includes(buscarClienteTermo.toLowerCase()))
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => setIsBuscarClienteModalOpen(false)}
                      className="p-3 border border-slate-100 rounded-lg hover:border-[#D4AF37]/50 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-semibold text-[#1A2B3C]">{c.nome_razao_social}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SINCRONIZAR COM API / DATAJUD (US 2.3.3 — Bottom Sheet) ─── */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setSyncModalOpen(false)}
          />

          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Sincronizar com API</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Busque o processo no DataJud e substitua os dados manuais pelos oficiais
                </p>
              </div>
              <button
                onClick={() => setSyncModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Step: form */}
              {syncStep === 'form' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Número CNJ *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 0001234-56.2024.8.07.0001"
                      value={syncForm.cnj}
                      onChange={e => setSyncForm({ ...syncForm, cnj: e.target.value })}
                      className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Tribunal *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: tjdft"
                      value={syncForm.tribunal}
                      onChange={e => setSyncForm({ ...syncForm, tribunal: e.target.value })}
                      className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition lowercase"
                    />
                  </div>

                  {syncError && (
                    <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-3">
                      {syncError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 pb-safe">
                    <button
                      type="button"
                      onClick={() => setSyncModalOpen(false)}
                      className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncBuscar}
                      disabled={syncBuscando}
                      className="flex-1 flex items-center justify-center gap-2 h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                    >
                      <Search className={`w-3.5 h-3.5 ${syncBuscando ? 'animate-pulse' : ''}`} />
                      {syncBuscando ? 'Buscando…' : 'Buscar no DataJud'}
                    </button>
                  </div>
                </>
              )}

              {/* Step: preview */}
              {syncStep === 'preview' && syncResultado && (
                <>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      <CheckCircle className="w-3 h-3" />
                      Encontrado no DataJud
                    </span>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Número CNJ
                      </span>
                      <p className="font-mono text-sm text-[#1A2B3C] font-semibold mt-0.5">
                        {syncResultado.numeroProcesso}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Classe
                        </span>
                        <p className="text-xs text-[#1A2B3C] mt-0.5 truncate">
                          {syncResultado.classe?.nome ?? '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Tribunal
                        </span>
                        <p className="text-xs text-[#1A2B3C] mt-0.5 uppercase">
                          {syncResultado.tribunal ?? syncForm.tribunal}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-200 pt-2.5">
                      <Clock className="w-3 h-3" />
                      <span>{syncResultado.movimentos.length} movimentações serão importadas</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Vincular a Cliente (opcional)
                    </label>
                    <div className="relative">
                      <select
                        value={syncClienteId}
                        onChange={e => setSyncClienteId(e.target.value)}
                        disabled={loadingClientes}
                        className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none"
                      >
                        <option value="">Nenhum</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nome_razao_social}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {syncError && (
                    <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-3">
                      {syncError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 pb-safe">
                    <button
                      type="button"
                      onClick={() => setSyncModalOpen(false)}
                      className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncImportar}
                      disabled={syncImportando}
                      className="flex-1 flex items-center justify-center gap-2 h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                    >
                      <Database
                        className={`w-3.5 h-3.5 ${syncImportando ? 'animate-pulse' : ''}`}
                      />
                      {syncImportando ? 'Importando…' : 'Importar Processo'}
                    </button>
                  </div>
                </>
              )}

              {/* Step: success */}
              {syncStep === 'success' && syncImportResponse && (
                <>
                  <div className="flex flex-col items-center text-center gap-3 py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B3C]">
                        Processo sincronizado com sucesso!
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {syncImportResponse.movimentacoes_importadas} movimentações importadas
                      </p>
                    </div>
                    <p className="font-mono text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                      {syncImportResponse.numero_cnj}
                    </p>
                  </div>

                  <div className="pb-safe">
                    <button
                      type="button"
                      onClick={() => setSyncModalOpen(false)}
                      className="w-full h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition"
                    >
                      Concluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
