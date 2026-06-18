import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, User, Building2, Phone, Mail, Hash, Calendar,
  ShieldCheck, ShieldAlert, CheckCircle2, Upload, Loader2,
  Pencil, Trash2, X, ChevronRight, Users, AlertCircle, Scale
} from 'lucide-react'
import {
  listarClientes, buscarClientePorId, criarCliente, atualizarCliente, removerCliente,
  registrarAutorizacaoDeclaracao, uploadTermoAutorizacao,
  inferirTipo, formatarDocumento, validarDocumento,
  type ClienteCompleto, type TipoCliente
} from '@/services/clientes.service'
import { api } from '@/services/api'

interface ProcessoVinculado {
  id: number
  numero_cnj: string
  tribunal: string
  status: string
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormCliente {
  nome_razao_social: string
  cpf_cnpj: string
  email: string
  telefone: string
}

const FORM_VAZIO: FormCliente = { nome_razao_social: '', cpf_cnpj: '', email: '', telefone: '' }

// ─── Componente principal ─────────────────────────────────────────────────────

export function Clientes() {
  // Lista
  const [clientes, setClientes] = useState<ClienteCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'PF' | 'PJ'>('todos')

  // Painel de detalhes
  const [selecionado, setSelecionado] = useState<ClienteCompleto | null>(null)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)

  // Modal criar / editar
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<ClienteCompleto | null>(null)
  const [form, setForm] = useState<FormCliente>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [sucessoForm, setSucessoForm] = useState('')

  // Confirmação exclusão
  const [excluindo, setExcluindo] = useState<ClienteCompleto | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  // Processos vinculados ao cliente selecionado
  const [processosVinculados, setProcessosVinculados] = useState<ProcessoVinculado[]>([])
  const [loadingProcessos, setLoadingProcessos] = useState(false)

  // Compliance (autorização)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [declaracaoChecked, setDeclaracaoChecked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Carregar lista ──────────────────────────────────────────────────────────

  const carregar = async () => {
    setLoading(true)
    try {
      const data = await listarClientes()
      setClientes(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // ── Selecionar cliente (painel lateral) ────────────────────────────────────

  const selecionarCliente = async (c: ClienteCompleto) => {
    setSelecionado(c)
    setAuthError('')
    setAuthSuccess('')
    setDeclaracaoChecked(false)
    setProcessosVinculados([])
    setLoadingDetalhe(true)
    setLoadingProcessos(true)
    try {
      const [atualizado, resProcessos] = await Promise.all([
        buscarClientePorId(c.id),
        api.get('/processos/').catch(() => ({ data: [] })),
      ])
      setSelecionado(atualizado)
      const todos: any[] = Array.isArray(resProcessos.data)
        ? resProcessos.data
        : resProcessos.data?.results ?? []
      setProcessosVinculados(
        todos
          .filter((p: any) => p.cliente_id === c.id)
          .map((p: any) => ({
            id: p.id,
            numero_cnj: p.numero_cnj ?? p.numero ?? '—',
            tribunal: p.tribunal ?? '—',
            status: p.status ?? '—',
          }))
      )
    } finally {
      setLoadingDetalhe(false)
      setLoadingProcessos(false)
    }
  }

  // ── Abrir modal ─────────────────────────────────────────────────────────────

  const abrirCriar = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErroForm('')
    setSucessoForm('')
    setModalAberto(true)
  }

  const abrirEditar = (c: ClienteCompleto) => {
    setEditando(c)
    setForm({
      nome_razao_social: c.nome_razao_social,
      cpf_cnpj: c.cpf_cnpj,
      email: c.email ?? '',
      telefone: c.telefone ?? '',
    })
    setErroForm('')
    setSucessoForm('')
    setModalAberto(true)
  }

  // ── Salvar (criar ou editar) ────────────────────────────────────────────────

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm('')
    setSucessoForm('')

    if (!form.nome_razao_social || !form.cpf_cnpj) {
      setErroForm('Nome e CPF/CNPJ são obrigatórios.')
      return
    }
    if (!validarDocumento(form.cpf_cnpj)) {
      setErroForm('CPF deve ter 11 dígitos e CNPJ 14 dígitos.')
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome_razao_social: form.nome_razao_social,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ''),
        email: form.email || undefined,
        telefone: form.telefone || undefined,
      }

      if (editando) {
        const atualizado = await atualizarCliente(editando.id, payload)
        setClientes(prev => prev.map(c => c.id === atualizado.id ? atualizado : c))
        if (selecionado?.id === atualizado.id) setSelecionado(atualizado)
        setSucessoForm('Cliente atualizado com sucesso!')
      } else {
        await criarCliente(payload)
        setSucessoForm('Cliente cadastrado com sucesso!')
        await carregar()
      }
      setTimeout(() => setModalAberto(false), 1000)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string' && detail.toLowerCase().includes('já cadastrado')) {
        setErroForm('Já existe um cliente com este CPF/CNPJ.')
      } else {
        setErroForm(detail || 'Erro ao salvar cliente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  // ── Excluir ─────────────────────────────────────────────────────────────────

  const confirmarExclusao = async () => {
    if (!excluindo) return
    setConfirmandoExclusao(true)
    try {
      await removerCliente(excluindo.id)
      setClientes(prev => prev.filter(c => c.id !== excluindo.id))
      if (selecionado?.id === excluindo.id) setSelecionado(null)
      setExcluindo(null)
    } catch {
      // mantém modal aberto
    } finally {
      setConfirmandoExclusao(false)
    }
  }

  // ── Compliance — Declaração ─────────────────────────────────────────────────

  const handleDeclaracao = async () => {
    if (!selecionado || !declaracaoChecked) return
    setAuthSubmitting(true)
    setAuthError('')
    setAuthSuccess('')
    try {
      await registrarAutorizacaoDeclaracao(selecionado.id)
      const atualizado = await buscarClientePorId(selecionado.id)
      setSelecionado(atualizado)
      setClientes(prev => prev.map(c => c.id === atualizado.id ? atualizado : c))
      setAuthSuccess('Autorização registrada com sucesso!')
    } catch {
      setAuthError('Erro ao registrar autorização. Tente novamente.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  // ── Compliance — Upload ─────────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selecionado) return
    setAuthSubmitting(true)
    setAuthError('')
    setAuthSuccess('')
    try {
      await uploadTermoAutorizacao(selecionado.id, file)
      const atualizado = await buscarClientePorId(selecionado.id)
      setSelecionado(atualizado)
      setClientes(prev => prev.map(c => c.id === atualizado.id ? atualizado : c))
      setAuthSuccess('Termo enviado com sucesso!')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setAuthError(typeof detail === 'string' ? detail : 'Erro ao enviar o arquivo.')
    } finally {
      setAuthSubmitting(false)
      e.target.value = ''
    }
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────

  const filtrados = clientes.filter(c => {
    const q = query.toLowerCase()
    const match = c.nome_razao_social.toLowerCase().includes(q) || c.cpf_cnpj.includes(q)
    const tipo: TipoCliente = inferirTipo(c.cpf_cnpj)
    return match && (filtroTipo === 'todos' || tipo === filtroTipo)
  })

  const totalPF = clientes.filter(c => inferirTipo(c.cpf_cnpj) === 'PF').length
  const totalPJ = clientes.filter(c => inferirTipo(c.cpf_cnpj) === 'PJ').length

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Coluna esquerda — Lista ───────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">

        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-bold text-[#1A2B3C]">Clientes</h1>
              <p className="text-xs text-slate-400">{clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={abrirCriar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2B3C] text-white text-xs font-medium rounded-lg hover:bg-[#243447] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo
            </button>
          </div>

          {/* Busca */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nome ou documento…"
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1A2B3C] placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-1.5">
            {[
              { v: 'todos', l: `Todos (${clientes.length})` },
              { v: 'PF', l: `PF (${totalPF})` },
              { v: 'PJ', l: `PJ (${totalPJ})` },
            ].map(tab => (
              <button
                key={tab.v}
                onClick={() => setFiltroTipo(tab.v as typeof filtroTipo)}
                className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                  filtroTipo === tab.v
                    ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.l}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 px-4">
              <Users className="w-8 h-8 text-slate-200" />
              <p className="text-xs text-slate-400 text-center">
                {query ? `Nenhum cliente para "${query}"` : 'Nenhum cliente cadastrado.'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtrados.map(c => {
                const tipo = inferirTipo(c.cpf_cnpj)
                const isPJ = tipo === 'PJ'
                const isSelected = selecionado?.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => selecionarCliente(c)}
                    className={`w-full text-left rounded-lg p-3 transition-all border ${
                      isSelected
                        ? 'bg-[#1A2B3C] border-[#1A2B3C] text-white'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-[#1A2B3C]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-white/20' : isPJ ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}>
                        {isPJ
                          ? <Building2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                          : <User className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-[#1A2B3C]'}`}>
                          {c.nome_razao_social}
                        </p>
                        <p className={`text-[10px] font-mono ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                          {formatarDocumento(c.cpf_cnpj)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {c.autorizacao_busca
                          ? <ShieldCheck className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-emerald-500'}`} />
                          : <ShieldAlert className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-amber-400'}`} />
                        }
                        <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-white/40' : 'text-slate-300'}`} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Painel direito — Detalhes ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {!selecionado ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Users className="w-12 h-12 text-slate-200" />
            <p className="text-sm">Selecione um cliente para ver os detalhes</p>
          </div>
        ) : loadingDetalhe ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-6 space-y-5">

            {/* ── Cabeçalho do cliente ─── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {(() => {
                    const isPJ = inferirTipo(selecionado.cpf_cnpj) === 'PJ'
                    return (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPJ ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                        {isPJ
                          ? <Building2 className="w-6 h-6 text-blue-600" />
                          : <User className="w-6 h-6 text-emerald-600" />
                        }
                      </div>
                    )
                  })()}
                  <div>
                    <h2 className="text-lg font-bold text-[#1A2B3C]">{selecionado.nome_razao_social}</h2>
                    <p className="text-sm text-slate-400 font-mono">{formatarDocumento(selecionado.cpf_cnpj)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirEditar(selecionado)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setExcluindo(selecionado)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>

            {/* ── Dados de contato ─── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dados de Contato</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { icon: Hash, label: 'CPF / CNPJ', value: formatarDocumento(selecionado.cpf_cnpj), mono: true },
                  { icon: Mail, label: 'E-mail', value: selecionado.email || '—', muted: !selecionado.email },
                  { icon: Phone, label: 'Telefone', value: selecionado.telefone || '—', muted: !selecionado.telefone },
                  { icon: Calendar, label: 'Cadastrado em', value: selecionado.created_at ? new Date(selecionado.created_at).toLocaleDateString('pt-BR') : '—', muted: !selecionado.created_at },
                ].map(row => {
                  const Icon = row.icon
                  return (
                    <div key={row.label} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#1A2B3C]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{row.label}</p>
                        <p className={`text-sm mt-0.5 ${row.muted ? 'text-slate-300 italic' : 'text-[#1A2B3C] font-medium'} ${row.mono ? 'font-mono' : ''}`}>
                          {row.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Compliance — Autorização de Busca ─── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Compliance — Autorização de Busca por CPF/CNPJ
                </h3>
                {selecionado.autorizacao_busca ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <ShieldCheck className="w-3 h-3" /> Autorizado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    <ShieldAlert className="w-3 h-3" /> Pendente
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {selecionado.autorizacao_busca ? (
                  /* ── Já autorizado ── */
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">Autorização registrada</p>
                        {selecionado.data_autorizacao_busca && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {new Date(selecionado.data_autorizacao_busca).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {selecionado.termo_autorizacao_arquivo && (
                          <p className="text-[11px] text-emerald-500 mt-0.5 font-mono">
                            {selecionado.termo_autorizacao_arquivo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-medium">Substituir documento:</p>
                      <label className={`flex items-center gap-3 border border-dashed border-slate-200 rounded-xl px-4 py-3 transition-colors ${authSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5'}`}>
                        {authSubmitting ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Upload className="w-4 h-4 text-slate-400" />}
                        <span className="text-xs text-slate-400">Selecionar novo arquivo (PDF, JPG ou PNG · máx. 10 MB)</span>
                        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={authSubmitting} onChange={handleUpload} />
                      </label>
                    </div>
                  </div>
                ) : (
                  /* ── Pendente ── */
                  <div className="space-y-5">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Registre a autorização do cliente para habilitar consultas por CPF/CNPJ no DataJud, conforme a LGPD.
                      Escolha uma das opções abaixo:
                    </p>

                    {/* Opção 1 — Upload */}
                    <div className="border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-700 mb-3">Opção 1 — Upload do termo assinado</p>
                      <label className={`flex items-center gap-3 border border-dashed rounded-xl px-4 py-4 transition-colors ${authSubmitting ? 'opacity-50 cursor-not-allowed border-slate-100' : 'cursor-pointer border-slate-200 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5'}`}>
                        {authSubmitting
                          ? <Loader2 className="w-5 h-5 text-slate-300 animate-spin flex-shrink-0" />
                          : <Upload className="w-5 h-5 text-slate-300 flex-shrink-0" />
                        }
                        <div>
                          <p className="text-xs text-slate-500">Clique para selecionar o arquivo</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">PDF, JPG ou PNG · Máx. 10 MB</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={authSubmitting} onChange={handleUpload} />
                      </label>
                    </div>

                    {/* Opção 2 — Declaração */}
                    <div className="border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-700 mb-3">Opção 2 — Declaração de posse do termo</p>
                      <label className="flex items-start gap-3 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={declaracaoChecked}
                          onChange={e => setDeclaracaoChecked(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#1A2B3C] flex-shrink-0"
                        />
                        <span className="text-xs text-slate-500 leading-relaxed">
                          Declaro que possuo o Termo de Autorização assinado pelo cliente para consultas
                          por CPF/CNPJ, e que ele está arquivado fisicamente no escritório.
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleDeclaracao}
                        disabled={authSubmitting || !declaracaoChecked}
                        className="w-full h-9 text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-40"
                      >
                        {authSubmitting
                          ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Registrando…</span>
                          : 'Confirmar declaração'
                        }
                      </button>
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {authError}
                  </div>
                )}
                {authSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {authSuccess}
                  </div>
                )}
              </div>
            </div>

            {/* ── Processos vinculados ─── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Processos Vinculados
                  {processosVinculados.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">
                      {processosVinculados.length}
                    </span>
                  )}
                </h3>
              </div>
              {loadingProcessos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
              ) : processosVinculados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Scale className="w-8 h-8 text-slate-200" />
                  <p className="text-xs text-slate-400">Nenhum processo vinculado.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {processosVinculados.map(p => (
                    <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                      <Scale className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.numero_cnj}</p>
                        <p className="text-xs text-slate-500 truncate">{p.tribunal}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        p.status === 'ativo' ? 'bg-green-100 text-green-700' :
                        p.status === 'encerrado' ? 'bg-slate-100 text-slate-500' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Modal Criar / Editar ──────────────────────────────────────────── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setModalAberto(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-[#1A2B3C]">
                {editando ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvar} className="px-6 py-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome / Razão Social *</label>
                <input
                  type="text" required
                  placeholder="Ex: João da Silva ou Empresa Alpha S/A"
                  value={form.nome_razao_social}
                  onChange={e => setForm({ ...form, nome_razao_social: e.target.value })}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">CPF / CNPJ *</label>
                <input
                  type="text" required
                  placeholder="Somente números (11 ou 14 dígitos)"
                  value={form.cpf_cnpj}
                  onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })}
                  disabled={!!editando}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                />
                {form.cpf_cnpj.replace(/\D/g, '').length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Tipo detectado: <span className="font-semibold text-[#1A2B3C]">
                      {inferirTipo(form.cpf_cnpj) === 'PF' ? 'Pessoa Física (CPF)' : 'Pessoa Jurídica (CNPJ)'}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail</label>
                <input
                  type="email"
                  placeholder="contato@exemplo.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</label>
                <input
                  type="tel"
                  placeholder="(61) 99999-9999"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                />
              </div>

              {erroForm && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">{erroForm}</div>
              )}
              {sucessoForm && (
                <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">{sucessoForm}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalAberto(false)} disabled={salvando}
                  className="flex-1 h-10 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 h-10 text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60">
                  {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmação de Exclusão ─────────────────────────────────── */}
      {excluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setExcluindo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A2B3C]">Excluir cliente</h3>
                <p className="text-xs text-slate-500 mt-0.5">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Tem certeza que deseja excluir <strong>{excluindo.nome_razao_social}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setExcluindo(null)} disabled={confirmandoExclusao}
                className="flex-1 h-10 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={confirmarExclusao} disabled={confirmandoExclusao}
                className="flex-1 h-10 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-60">
                {confirmandoExclusao ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
