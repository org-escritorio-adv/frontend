import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  User,
  Building2,
  Phone,
  Mail,
  Users
} from 'lucide-react'
import {
  listarClientes,
  criarCliente,
  inferirTipo,
  formatarDocumento,
  validarDocumento,
  type ClienteCompleto,
  type TipoCliente
} from '@/services/clientes.service'
import { routePaths } from '@/routeConfig'

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientesMobile() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'PF' | 'PJ'>('todos')

  // API State
  const [clientes, setClientes] = useState<ClienteCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorApi, setErrorApi] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({
    nome_razao_social: '',
    cpf_cnpj: '',
    email: '',
    telefone: ''
  })

  const loadClientes = async () => {
    setLoading(true)
    setErrorApi('')
    try {
      const data = await listarClientes()
      setClientes(data)
    } catch {
      setErrorApi('Erro ao carregar clientes. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  useEffect(() => {
    if (modalOpen) {
      setForm({ nome_razao_social: '', cpf_cnpj: '', email: '', telefone: '' })
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [modalOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!form.nome_razao_social || !form.cpf_cnpj) {
      setErrorMsg('Nome e CPF/CNPJ são obrigatórios.')
      return
    }
    if (!validarDocumento(form.cpf_cnpj)) {
      setErrorMsg('CPF deve ter 11 dígitos e CNPJ 14 dígitos.')
      return
    }

    setSubmitting(true)
    try {
      await criarCliente({
        nome_razao_social: form.nome_razao_social,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ''),
        email: form.email || undefined,
        telefone: form.telefone || undefined
      })
      setSuccessMsg('Cliente cadastrado com sucesso!')
      loadClientes()
      setTimeout(() => setModalOpen(false), 1200)
    } catch (error: any) {
      const msg = error?.response?.data?.detail
      if (typeof msg === 'string' && msg.toLowerCase().includes('duplicate')) {
        setErrorMsg('Já existe um cliente com este CPF/CNPJ.')
      } else {
        setErrorMsg(msg || 'Erro ao cadastrar cliente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Filtragem
  const filtered = clientes.filter(c => {
    const q = query.toLowerCase()
    const matchQuery = c.nome_razao_social.toLowerCase().includes(q) || c.cpf_cnpj.includes(q)
    const tipo: TipoCliente = inferirTipo(c.cpf_cnpj)
    const matchTipo = filtroTipo === 'todos' || tipo === filtroTipo
    return matchQuery && matchTipo
  })

  const totalPF = clientes.filter(c => inferirTipo(c.cpf_cnpj) === 'PF').length
  const totalPJ = clientes.filter(c => inferirTipo(c.cpf_cnpj) === 'PJ').length

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      {/* ── Cabeçalho ────────────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">Clientes</h2>
        <p className="text-slate-500 text-sm">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado
          {clientes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Botão Novo Cliente ────────────────────────────────────── */}
      <button
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-3 rounded-xl bg-[#1A2B3C] text-white text-sm font-medium hover:bg-[#243447] transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Novo Cliente
      </button>

      {/* ── Busca ─────────────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome ou documento…"
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

      {/* ── Filtro por tipo ───────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'todos', label: `Todos (${clientes.length})` },
          { value: 'PF', label: `Pessoa Física (${totalPF})` },
          { value: 'PJ', label: `Pessoa Jurídica (${totalPJ})` }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFiltroTipo(tab.value as typeof filtroTipo)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors border ${
              filtroTipo === tab.value
                ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Erro de API ───────────────────────────────────────────── */}
      {errorApi && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {errorApi}
        </div>
      )}

      {/* ── Lista ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
          <Users className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 text-sm text-center">
            {query ? `Nenhum cliente encontrado para "${query}"` : 'Nenhum cliente cadastrado.'}
          </p>
          {query && (
            <button onClick={() => setQuery('')} className="text-[#D4AF37] text-sm hover:underline">
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cliente => {
            const tipo = inferirTipo(cliente.cpf_cnpj)
            const isPJ = tipo === 'PJ'

            return (
              <button
                key={cliente.id}
                onClick={() => navigate(routePaths.appClienteDetails(String(cliente.id)))}
                className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:border-[#D4AF37]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPJ ? 'bg-blue-100' : 'bg-emerald-100'
                    }`}
                  >
                    {isPJ ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#1A2B3C] truncate">
                        {cliente.nome_razao_social}
                      </p>
                      <span
                        className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isPJ ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {tipo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {formatarDocumento(cliente.cpf_cnpj)}
                    </p>
                    {(cliente.email || cliente.telefone) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {cliente.email && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{cliente.email}</span>
                          </span>
                        )}
                        {cliente.telefone && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Phone className="w-3 h-3" />
                            {cliente.telefone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-4">
          Exibindo {filtered.length} de {clientes.length} clientes
        </p>
      )}

      {/* ─── MODAL DE CADASTRO (Bottom Sheet) ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Novo Cliente</h3>
                <p className="text-xs text-slate-400 mt-0.5">Preencha os dados do cliente</p>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nome / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva ou Empresa Alpha S/A"
                    value={form.nome_razao_social}
                    onChange={e => setForm({ ...form, nome_razao_social: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    CPF / CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Somente números (11 ou 14 dígitos)"
                    value={form.cpf_cnpj}
                    onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                  {form.cpf_cnpj.replace(/\D/g, '').length > 0 && (
                    <p className="text-[11px] text-slate-400">
                      Tipo detectado:{' '}
                      <span className="font-semibold text-[#1A2B3C]">
                        {inferirTipo(form.cpf_cnpj) === 'PF'
                          ? 'Pessoa Física (CPF)'
                          : 'Pessoa Jurídica (CNPJ)'}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="contato@exemplo.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
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
                    value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                {errorMsg && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    {successMsg}
                  </div>
                )}

                <div className="flex gap-3 pt-2 pb-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
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
    </div>
  )
}
