import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft,
  User,
  Building2,
  Phone,
  Mail,
  Scale,
  Briefcase,
  Hash,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Pencil,
  Trash2,
  X
} from 'lucide-react'
import {
  buscarClientePorId,
  inferirTipo,
  formatarDocumento,
  registrarAutorizacaoDeclaracao,
  uploadTermoAutorizacao,
  atualizarCliente,
  removerCliente,
  type ClienteCompleto
} from '@/services/clientes.service'
import { useAuth } from '@/context/AuthContext'
import { canCreateClientes } from '@/lib/rbac'
import { api } from '@/services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProcessoVinculado {
  id: number
  numero_cnj: string
  tribunal: string
  status: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClienteDetailsMobile() {
  const { clienteId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const podeEditar = canCreateClientes(user)
  const podeExcluir = user?.role === 'admin'

  const [cliente, setCliente] = useState<ClienteCompleto | null>(null)
  const [processos, setProcessos] = useState<ProcessoVinculado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Autorização
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [declaracaoChecked, setDeclaracaoChecked] = useState(false)

  // Edição
  const [editOpen, setEditOpen] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [editForm, setEditForm] = useState({ nome_razao_social: '', email: '', telefone: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const openEdit = () => {
    if (!cliente) return
    setEditForm({
      nome_razao_social: cliente.nome_razao_social,
      email: cliente.email ?? '',
      telefone: cliente.telefone ?? ''
    })
    setEditError('')
    setEditOpen(true)
    setTimeout(() => setEditVisible(true), 10)
  }

  const closeEdit = () => {
    setEditVisible(false)
    setTimeout(() => setEditOpen(false), 300)
  }

  const handleSalvarEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.nome_razao_social.trim()) {
      setEditError('Nome é obrigatório.')
      return
    }
    setEditSubmitting(true)
    setEditError('')
    try {
      const atualizado = await atualizarCliente(Number(clienteId), {
        nome_razao_social: editForm.nome_razao_social,
        email: editForm.email || undefined,
        telefone: editForm.telefone || undefined
      })
      setCliente(atualizado)
      closeEdit()
    } catch (err: any) {
      setEditError(err?.response?.data?.detail || 'Erro ao salvar alterações.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const openDelete = () => {
    setDeleteOpen(true)
    setTimeout(() => setDeleteVisible(true), 10)
  }

  const closeDelete = () => {
    setDeleteVisible(false)
    setTimeout(() => setDeleteOpen(false), 300)
  }

  const handleExcluir = async () => {
    setDeleteSubmitting(true)
    try {
      await removerCliente(Number(clienteId))
      navigate(-1)
    } catch {
      setDeleteSubmitting(false)
      closeDelete()
    }
  }

  useEffect(() => {
    if (!clienteId) return

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [clienteData, processosData] = await Promise.all([
          buscarClientePorId(Number(clienteId)),
          api.get('/processos/').then(r => {
            const data: any[] = Array.isArray(r.data) ? r.data : (r.data?.results ?? [])
            return data.filter(p => p.cliente_id === Number(clienteId))
          })
        ])
        setCliente(clienteData)
        setProcessos(processosData)
      } catch {
        setError('Não foi possível carregar os dados do cliente.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [clienteId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-6" />
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="h-14 bg-slate-100 rounded-xl mb-4" />
          <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 gap-3">
        <AlertCircle className="w-10 h-10 text-red-300" />
        <p className="text-slate-500 text-sm text-center">{error || 'Cliente não encontrado.'}</p>
        <button onClick={() => navigate(-1)} className="text-[#D4AF37] text-sm hover:underline">
          Voltar
        </button>
      </div>
    )
  }

  const handleDeclaracao = async () => {
    if (!declaracaoChecked) {
      setAuthError('Marque a caixa de declaração para confirmar.')
      return
    }
    setAuthSubmitting(true)
    setAuthError('')
    setAuthSuccess('')
    try {
      await registrarAutorizacaoDeclaracao(Number(clienteId))
      setAuthSuccess('Autorização registrada com sucesso!')
      const atualizado = await buscarClientePorId(Number(clienteId))
      setCliente(atualizado)
    } catch {
      setAuthError('Erro ao registrar autorização. Tente novamente.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAuthSubmitting(true)
    setAuthError('')
    setAuthSuccess('')
    try {
      await uploadTermoAutorizacao(Number(clienteId), file)
      setAuthSuccess('Termo de autorização enviado com sucesso!')
      const atualizado = await buscarClientePorId(Number(clienteId))
      setCliente(atualizado)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setAuthError(typeof detail === 'string' ? detail : 'Erro ao enviar o arquivo.')
    } finally {
      setAuthSubmitting(false)
      e.target.value = ''
    }
  }

  const tipo = inferirTipo(cliente.cpf_cnpj)
  const isPJ = tipo === 'PJ'

  const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
    ativo: { label: 'Ativo', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    arquivado: { label: 'Arquivado', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* ── Topo ────────────────────────────────────────────────── */}
      <div className="bg-[#1A2B3C] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Clientes
          </button>
          <div className="flex items-center gap-1">
            {podeEditar && (
              <button
                onClick={openEdit}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {podeExcluir && (
              <button
                onClick={openDelete}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Avatar + Nome */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isPJ ? 'bg-blue-500/20' : 'bg-emerald-500/20'
            }`}
          >
            {isPJ ? (
              <Building2 className="w-7 h-7 text-blue-300" />
            ) : (
              <User className="w-7 h-7 text-emerald-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isPJ ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {tipo}
              </span>
            </div>
            <h1 className="text-white font-bold text-lg leading-tight truncate">
              {cliente.nome_razao_social}
            </h1>
            <p className="text-white/50 text-xs font-mono mt-0.5">
              {formatarDocumento(cliente.cpf_cnpj)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* ── Dados de Contato ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dados de Contato
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              {
                icon: Hash,
                label: 'CPF / CNPJ',
                value: formatarDocumento(cliente.cpf_cnpj),
                mono: true
              },
              {
                icon: Mail,
                label: 'E-mail',
                value: cliente.email || 'Não informado',
                muted: !cliente.email
              },
              {
                icon: Phone,
                label: 'Telefone',
                value: cliente.telefone || 'Não informado',
                muted: !cliente.telefone
              },
              {
                icon: Calendar,
                label: 'Cadastrado em',
                value: cliente.created_at
                  ? new Date(cliente.created_at).toLocaleDateString('pt-BR')
                  : '—',
                muted: !cliente.created_at
              }
            ].map(row => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#1A2B3C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                      {row.label}
                    </p>
                    <p
                      className={`text-sm mt-0.5 truncate ${
                        row.muted ? 'text-slate-300 italic' : 'text-[#1A2B3C] font-medium'
                      } ${row.mono ? 'font-mono' : ''}`}
                    >
                      {row.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Processos Vinculados ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Processos Judiciais
            </h2>
            <span className="text-xs font-bold text-[#1A2B3C] bg-slate-100 px-2 py-0.5 rounded-full">
              {processos.length}
            </span>
          </div>

          {processos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Scale className="w-8 h-8 text-slate-200" />
              <p className="text-xs text-slate-400">Nenhum processo vinculado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {processos.map(proc => {
                const cfg = statusConfig[proc.status] ?? statusConfig['ativo']
                return (
                  <div key={proc.id} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2B3C]/5 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-3.5 h-3.5 text-[#1A2B3C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium text-[#1A2B3C] truncate">
                        {proc.numero_cnj}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{proc.tribunal}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Casos Kanban ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Demandas Internas (Casos)
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Briefcase className="w-8 h-8 text-slate-200" />
            <p className="text-xs text-slate-400">Nenhum caso vinculado.</p>
          </div>
        </div>

        {/* ── Termo de Autorização ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Compliance — Autorização de Busca
            </h2>
            {cliente.autorizacao_busca ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <ShieldCheck className="w-3 h-3" />
                Autorizado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                <ShieldAlert className="w-3 h-3" />
                Pendente
              </span>
            )}
          </div>

          <div className="px-4 py-5 space-y-4">
            {cliente.autorizacao_busca ? (
              /* ── Status: autorizado ── */
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      Autorização registrada
                    </p>
                    {cliente.data_autorizacao_busca && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {new Date(cliente.data_autorizacao_busca).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {cliente.termo_autorizacao_arquivo && (
                      <p className="text-[11px] text-emerald-500 mt-0.5 font-mono truncate">
                        {cliente.termo_autorizacao_arquivo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Opção de atualizar arquivo */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para atualizar o termo assinado, envie um novo arquivo abaixo:
                </p>
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-5 px-4 transition-colors ${authSubmitting ? 'opacity-50 cursor-not-allowed border-slate-100' : 'cursor-pointer border-slate-200 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5'}`}>
                  {authSubmitting ? (
                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-300" />
                  )}
                  <span className="text-xs text-slate-400 text-center">Substituir arquivo</span>
                  <span className="text-[10px] text-slate-300">PDF, JPG ou PNG · Máx. 10 MB</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={authSubmitting}
                    onChange={handleUpload}
                  />
                </label>
              </div>
            ) : (
              /* ── Status: pendente ── */
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Registre a autorização do cliente para habilitar consultas por CPF/CNPJ no
                  DataJud, conforme exigência de compliance (LGPD).
                </p>

                {/* Upload de arquivo */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Opção 1 — Upload do termo assinado
                  </p>
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 px-4 transition-colors ${authSubmitting ? 'opacity-50 cursor-not-allowed border-slate-100' : 'cursor-pointer border-slate-200 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5'}`}>
                    {authSubmitting ? (
                      <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-300" />
                    )}
                    <span className="text-xs text-slate-400 text-center">
                      Toque para selecionar o arquivo
                    </span>
                    <span className="text-[10px] text-slate-300">PDF, JPG ou PNG · Máx. 10 MB</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      disabled={authSubmitting}
                      onChange={handleUpload}
                    />
                  </label>
                </div>

                {/* Declaração de posse */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Opção 2 — Declaração de posse do termo
                  </p>
                  <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-[#D4AF37]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={declaracaoChecked}
                      onChange={e => setDeclaracaoChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#1A2B3C] flex-shrink-0"
                    />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      Declaro que possuo o Termo de Autorização assinado pelo cliente para
                      consultas por CPF/CNPJ, e que ele está arquivado no escritório.
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDeclaracao}
                    disabled={authSubmitting || !declaracaoChecked}
                    className="mt-3 w-full h-[42px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-xl transition disabled:opacity-40"
                  >
                    {authSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registrando…
                      </span>
                    ) : (
                      'Confirmar declaração'
                    )}
                  </button>
                </div>
              </div>
            )}

            {authError && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                {authSuccess}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Sheet: Editar Cliente ─────────────────────── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeEdit}
          />
          <div
            className={`relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col transition-transform duration-300 ${editVisible ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Editar Cliente</h3>
                <p className="text-xs text-slate-400 mt-0.5">Atualize os dados do cliente</p>
              </div>
              <button
                onClick={closeEdit}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <form onSubmit={handleSalvarEdit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nome / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nome_razao_social}
                    onChange={e => setEditForm({ ...editForm, nome_razao_social: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="contato@exemplo.com"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="(61) 99999-9999"
                    value={editForm.telefone}
                    onChange={e => setEditForm({ ...editForm, telefone: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>
                {editError && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
                    {editError}
                  </div>
                )}
                <div className="flex gap-3 pt-2 pb-4">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={editSubmitting}
                    className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                  >
                    {editSubmitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Sheet: Confirmar Exclusão ─────────────────── */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeDelete}
          />
          <div
            className={`relative bg-white rounded-t-2xl shadow-2xl z-10 flex flex-col transition-transform duration-300 ${deleteVisible ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1A2B3C]">Excluir cliente</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Tem certeza que deseja excluir <span className="font-semibold text-[#1A2B3C]">{cliente?.nome_razao_social}</span>? Todos os dados vinculados serão removidos.
              </p>
              <div className="flex gap-3 pb-4">
                <button
                  onClick={closeDelete}
                  disabled={deleteSubmitting}
                  className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={deleteSubmitting}
                  className="flex-1 h-[44px] text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-60"
                >
                  {deleteSubmitting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
