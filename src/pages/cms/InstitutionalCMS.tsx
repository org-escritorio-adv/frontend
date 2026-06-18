import { useState, useEffect, useRef } from 'react'
import {
  Edit,
  Mail,
  User,
  Plus,
  Trash2,
  X,
  Send,
  Archive,
  CheckCircle,
  Scale,
  Briefcase,
  AtSign,
  ChevronDown,
  Inbox,
  Clock,
  Phone,
  Image as ImageIcon,
  FileText,
  ShieldAlert
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { canAccessCMS } from '@/lib/rbac'
import {
  listarAdvogados,
  criarAdvogado,
  atualizarAdvogado,
  removerAdvogado,
  uploadFotoAdvogado,
  type Advogado
} from '@/services/advogados.service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: number
  nome: string
  email: string
  telefone: string
  assunto: string
  mensagem: string
  data: string
  status: 'novo' | 'contatado' | 'encerrado'
}

// ─── ModalAdvogado ────────────────────────────────────────────────────────────

interface ModalAdvogadoProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  initial: Partial<Advogado>
  onClose: () => void
  onSave: (dados: Partial<Advogado>, foto: File | null) => Promise<void>
}

function ModalAdvogado({ isOpen, mode, initial, onClose, onSave }: ModalAdvogadoProps) {
  const [form, setForm] = useState<Partial<Advogado>>(initial)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  /* Sincroniza quando modal abre com novo `initial` */
  useEffect(() => {
    setForm(initial)
    setSucesso(false)
    setFotoFile(null)
    setFotoPreview(null)
  }, [isOpen, initial])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem excede 5 MB.')
      return
    }
    setErro(null)
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  /* Foco no primeiro campo ao abrir */
  useEffect(() => {
    if (isOpen) setTimeout(() => firstFieldRef.current?.focus(), 80)
  }, [isOpen])

  /* ESC fecha */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  const [erro, setErro] = useState<string | null>(null)

  const handleSave = async () => {
    if (!form.nome?.trim()) {
      setErro('Informe o nome do advogado.')
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      await onSave(form, fotoFile)
      setSalvando(false)
      setSucesso(true)
      setTimeout(onClose, 900)
    } catch (e) {
      setSalvando(false)
      const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      setErro(
        typeof detail === 'string'
          ? detail
          : 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
      )
    }
  }

  const especialidades = [
    'Direito Empresarial',
    'Direito Tributário',
    'Direito Trabalhista',
    'Direito Civil',
    'Direito Penal',
    'Direito Previdenciário',
    'Direito Digital',
    'Direito Ambiental'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#1A2B3C]/50 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl z-10 overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(26,43,60,0.22)' }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h4 className="text-[#1A2B3C] font-semibold">
              {mode === 'add' ? 'Adicionar Advogado' : 'Editar Perfil'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'add'
                ? 'Preencha os dados do novo membro da equipe'
                : `Editando perfil de ${initial.nome ?? ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <User className="w-3 h-3" /> Nome Completo
            </label>
            <input
              ref={firstFieldRef}
              type="text"
              value={form.nome ?? ''}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Dr. João Silva"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <Briefcase className="w-3 h-3" /> Cargo
            </label>
            <input
              type="text"
              value={form.cargo ?? ''}
              onChange={e => setForm({ ...form, cargo: e.target.value })}
              placeholder="Ex: Sócio Sênior, Associado…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Especialidade */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <Briefcase className="w-3 h-3" /> Especialidade
            </label>
            <div className="relative">
              <select
                value={form.especialidade ?? ''}
                onChange={e => setForm({ ...form, especialidade: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition appearance-none bg-white"
              >
                <option value="">Selecione uma especialidade…</option>
                {especialidades.map(e => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* OAB */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <Scale className="w-3 h-3" /> Registro OAB
            </label>
            <input
              type="text"
              value={form.oab ?? ''}
              onChange={e => setForm({ ...form, oab: e.target.value })}
              placeholder="Ex: OAB/SP 123.456"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition font-mono"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <AtSign className="w-3 h-3" /> E-mail Institucional
            </label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="nome@barcelostakaki.adv.br"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <Phone className="w-3 h-3" /> Telefone
            </label>
            <input
              type="text"
              value={form.telefone ?? ''}
              onChange={e => setForm({ ...form, telefone: e.target.value })}
              placeholder="(61) 98765-4321"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Foto */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <ImageIcon className="w-3 h-3" /> Foto
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                {fotoPreview ?? form.foto_url ? (
                  <img
                    src={fotoPreview ?? form.foto_url ?? ''}
                    alt="Pré-visualização"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fotoInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {fotoPreview ?? form.foto_url ? 'Trocar foto' : 'Escolher foto'}
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5">PNG, JPG ou WEBP · até 5 MB</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <FileText className="w-3 h-3" /> Biografia
            </label>
            <textarea
              value={form.bio ?? ''}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Breve descrição da atuação e experiência…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition resize-none"
            />
          </div>

          {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={salvando || sucesso}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm
              ${sucesso ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}
              disabled:opacity-80
            `}
          >
            {sucesso ? (
              <>
                <CheckCircle className="w-4 h-4" /> Salvo!
              </>
            ) : salvando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
                Salvando…
              </>
            ) : (
              <>
                {mode === 'add' ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}{' '}
                {mode === 'add' ? 'Adicionar' : 'Salvar Alterações'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ModalResponderLead ───────────────────────────────────────────────────────

interface ModalResponderLeadProps {
  isOpen: boolean
  lead: Lead | null
  onClose: () => void
}

function ModalResponderLead({ isOpen, lead, onClose }: ModalResponderLeadProps) {
  const defaultBody = lead
    ? `Prezado(a) ${lead.nome.split(' ')[0]},\n\nAgradecemos o seu contato com o escritório Barcelos & Takaki Advocacia.\n\nAnalisamos a sua solicitação referente a "${lead.assunto}" e entramos em contato para agendar uma consulta inicial.\n\nPor favor, confirme sua disponibilidade para que possamos dar prosseguimento ao atendimento.\n\nAtenciosamente,\nEquipe Barcelos & Takaki\n(61) 98765-0001`
    : ''

  const [corpo, setCorpo] = useState(defaultBody)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    setCorpo(defaultBody)
    setEnviado(false)
  }, [lead, isOpen])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  const handleEnviar = () => {
    setEnviando(true)
    setTimeout(() => {
      setEnviando(false)
      setEnviado(true)
      setTimeout(onClose, 1200)
    }, 800)
  }

  if (!isOpen || !lead) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#1A2B3C]/50 backdrop-blur-[2px]" />

      {/* Modal de e-mail */}
      <div
        className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col"
        style={{ boxShadow: '0 24px 64px rgba(26,43,60,0.22)', maxHeight: '90vh' }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A2B3C]/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#1A2B3C]" />
            </div>
            <div>
              <h4 className="text-[#1A2B3C] font-semibold">Responder Lead</h4>
              <p className="text-xs text-slate-400">Composição de e-mail para o cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campos do e-mail */}
        <div className="flex-shrink-0">
          {/* Para */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14 flex-shrink-0">
              Para
            </span>
            <div className="flex-1 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-[#1A2B3C]">
                {lead.nome}
              </span>
              <span className="text-xs text-slate-400">{lead.email}</span>
            </div>
          </div>

          {/* Assunto */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14 flex-shrink-0">
              Assunto
            </span>
            <input
              type="text"
              defaultValue={`Re: ${lead.assunto}`}
              className="flex-1 text-sm text-[#1A2B3C] focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Corpo da mensagem */}
        <div className="flex-1 px-6 py-4 overflow-auto">
          <textarea
            value={corpo}
            onChange={e => setCorpo(e.target.value)}
            rows={10}
            className="w-full h-full min-h-[200px] text-sm text-slate-700 leading-relaxed resize-none focus:outline-none placeholder-slate-300"
            placeholder="Digite sua mensagem…"
          />
        </div>

        {/* Info do lead (contextual) */}
        <div className="mx-6 mb-4 p-3 rounded-xl bg-slate-50 border border-gray-100 flex-shrink-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Mensagem Original do Lead
          </p>
          <p className="text-xs text-slate-500 italic line-clamp-2">"{lead.mensagem}"</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Phone className="w-3 h-3" />
              {lead.telefone}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              {new Date(lead.data).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || enviado}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm
              ${enviado ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}
              disabled:opacity-80
            `}
          >
            {enviado ? (
              <>
                <CheckCircle className="w-4 h-4" /> Enviado!
              </>
            ) : enviando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
                Enviando…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Enviar E-mail
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── InstitutionalCMS ─────────────────────────────────────────────────────────

export function InstitutionalCMS() {
  const { user } = useAuth()

  // ── Dados dos advogados (carregados da API) ────────────────────────────────
  const [advogados, setAdvogados] = useState<Advogado[]>([])
  const [carregandoAdvogados, setCarregandoAdvogados] = useState(true)
  const [erroCarregarAdvogados, setErroCarregarAdvogados] = useState(false)

  useEffect(() => {
    listarAdvogados()
      .then(setAdvogados)
      .catch(() => setErroCarregarAdvogados(true))
      .finally(() => setCarregandoAdvogados(false))
  }, [])

  // ── Dados dos leads ────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      nome: 'Roberto Santos',
      email: 'roberto.santos@email.com',
      telefone: '(61) 98765-4321',
      assunto: 'Consulta sobre Litígio Tributário',
      mensagem:
        'Preciso de assistência jurídica em um litígio tributário envolvendo recuperação de ICMS.',
      data: '2026-04-05',
      status: 'novo'
    },
    {
      id: 2,
      nome: 'Ana Paula Lima',
      email: 'ana.lima@empresa.com',
      telefone: '(61) 97654-3210',
      assunto: 'Revisão de Contrato Societário',
      mensagem: 'Nossa empresa precisa de ajuda para revisar um acordo de fusão entre sociedades.',
      data: '2026-04-04',
      status: 'contatado'
    },
    {
      id: 3,
      nome: 'Fernando Alves',
      email: 'f.alves@negocio.com',
      telefone: '(61) 96543-2109',
      assunto: 'Disputa Trabalhista',
      mensagem: 'Busco representação legal para um caso de demissão sem justa causa.',
      data: '2026-04-03',
      status: 'novo'
    }
  ])

  // ── Estado: leads arquivados ───────────────────────────────────────────────
  const [arquivados, setArquivados] = useState<Set<number>>(new Set())

  // ── Estado: modal de advogado ──────────────────────────────────────────────
  const [advModal, setAdvModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    initial: Partial<Advogado>
  }>({ isOpen: false, mode: 'add', initial: {} })

  // ── Estado: modal de responder lead ───────────────────────────────────────
  const [leadModal, setLeadModal] = useState<{
    isOpen: boolean
    lead: Lead | null
  }>({ isOpen: false, lead: null })

  if (!canAccessCMS(user)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] p-8">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-[#1A2B3C] font-semibold">Acesso restrito</h3>
          <p className="text-sm text-slate-500">
            O CMS do site institucional é exclusivo para administradores.
          </p>
        </div>
      </div>
    )
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const abrirAdicionarAdvogado = () => setAdvModal({ isOpen: true, mode: 'add', initial: {} })

  const abrirEditarAdvogado = (adv: Advogado) =>
    setAdvModal({ isOpen: true, mode: 'edit', initial: { ...adv } })

  const fecharAdvModal = () => setAdvModal(prev => ({ ...prev, isOpen: false }))

  const salvarAdvogado = async (dados: Partial<Advogado>, foto: File | null) => {
    const payload = {
      nome: dados.nome!,
      cargo: dados.cargo?.trim() || 'Advogado',
      especialidade: dados.especialidade ?? null,
      oab: dados.oab ?? null,
      email: dados.email ?? null,
      telefone: dados.telefone ?? null,
      foto_url: dados.foto_url ?? null,
      bio: dados.bio ?? null
    }

    let salvo =
      advModal.mode === 'add'
        ? await criarAdvogado(payload)
        : await atualizarAdvogado(dados.id!, payload)

    // Reflete o advogado salvo na lista (mesmo que o upload da foto falhe depois).
    setAdvogados(prev =>
      prev.some(a => a.id === salvo.id)
        ? prev.map(a => (a.id === salvo.id ? salvo : a))
        : [...prev, salvo]
    )

    if (foto) {
      salvo = await uploadFotoAdvogado(salvo.id, foto)
      setAdvogados(prev => prev.map(a => (a.id === salvo.id ? salvo : a)))
    }
  }

  const excluirAdvogado = async (id: number) => {
    if (!window.confirm('Remover este advogado? Ele deixará de aparecer na landing page.')) return
    try {
      await removerAdvogado(id)
      setAdvogados(prev => prev.filter(a => a.id !== id))
    } catch {
      window.alert('Não foi possível remover o advogado. Tente novamente.')
    }
  }

  const abrirResponder = (lead: Lead) => setLeadModal({ isOpen: true, lead })

  const fecharLeadModal = () => setLeadModal({ isOpen: false, lead: null })

  const arquivarLead = (id: number) => setArquivados(prev => new Set([...prev, id]))

  const desarquivarLead = (id: number) =>
    setArquivados(prev => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })

  // ── Status helpers ─────────────────────────────────────────────────────────

  const statusLeadConfig: Record<Lead['status'], { badge: string; label: string }> = {
    novo: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Novo' },
    contatado: { badge: 'bg-blue-100    text-blue-700    border-blue-200', label: 'Contatado' },
    encerrado: { badge: 'bg-slate-100   text-slate-600   border-slate-200', label: 'Encerrado' }
  }

  const novosCount = leads.filter(l => l.status === 'novo' && !arquivados.has(l.id)).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Modal Advogado ────────────────────────────────────────────────── */}
      <ModalAdvogado
        isOpen={advModal.isOpen}
        mode={advModal.mode}
        initial={advModal.initial}
        onClose={fecharAdvModal}
        onSave={salvarAdvogado}
      />

      {/* ── Modal Responder Lead ──────────────────────────────────────────── */}
      <ModalResponderLead
        isOpen={leadModal.isOpen}
        lead={leadModal.lead}
        onClose={fecharLeadModal}
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* ── Título ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-[#1A2B3C] mb-2">CMS Institucional</h2>
          <p className="text-slate-600">
            Gerencie perfis de advogados e consultas do site institucional
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* Seção: Perfis de Advogados                                          */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[#1A2B3C]">Perfis de Advogados</h3>
              <p className="text-xs text-slate-400 mt-0.5">{advogados.length} membros na equipe</p>
            </div>
            <button
              onClick={abrirAdicionarAdvogado}
              className="px-4 py-2.5 bg-[#1A2B3C] text-white rounded-lg hover:bg-[#243447] transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar Advogado
            </button>
          </div>

          {carregandoAdvogados ? (
            <div className="py-12 text-center text-sm text-slate-400">Carregando advogados…</div>
          ) : erroCarregarAdvogados ? (
            <div className="py-12 text-center text-sm text-red-500">
              Não foi possível carregar os advogados.
            </div>
          ) : advogados.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Nenhum advogado cadastrado. Clique em “Adicionar Advogado” para começar.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advogados.map(adv => (
              <div
                key={adv.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-slate-200 transition-all group"
              >
                {/* Foto + ações */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center shadow-md overflow-hidden">
                      {adv.foto_url ? (
                        <img src={adv.foto_url} alt={adv.nome} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    {/* OAB badge */}
                    <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] rounded-full px-1.5 py-0.5">
                      <span className="text-[9px] font-bold text-white leading-none">OAB</span>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => abrirEditarAdvogado(adv)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar perfil"
                    >
                      <Edit className="w-4 h-4 text-slate-500 hover:text-[#1A2B3C]" />
                    </button>
                    <button
                      onClick={() => excluirAdvogado(adv.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir perfil"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <h4 className="text-[#1A2B3C] mb-0.5">{adv.nome}</h4>
                <p className="text-sm text-[#D4AF37] font-medium mb-1">{adv.cargo}</p>
                <p className="text-sm text-slate-500 mb-3">{adv.especialidade}</p>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500 font-mono">{adv.oab}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500 truncate">{adv.email}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{adv.bio}</p>

                {/* Botão editar — visível no hover */}
                <button
                  onClick={() => abrirEditarAdvogado(adv)}
                  className="mt-4 w-full py-2 rounded-lg border border-gray-100 text-xs text-slate-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all opacity-0 group-hover:opacity-100"
                >
                  Editar Perfil
                </button>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* Seção: Caixa de Entrada de Leads                                   */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-[#1A2B3C] flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-slate-400" />
                  Caixa de Entrada de Leads
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consultas recebidas pelo site institucional
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {novosCount > 0 && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                  {novosCount} {novosCount === 1 ? 'novo' : 'novos'}
                </span>
              )}
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs">
                {leads.length} total
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    {['Data', 'Contato', 'Assunto', 'Mensagem', 'Status', 'Ações'].map(col => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map(lead => {
                    const isArquivado = arquivados.has(lead.id)
                    const cfg = statusLeadConfig[lead.status]

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-all duration-300 group ${
                          isArquivado ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Data */}
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(lead.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </td>

                        {/* Contato */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#1A2B3C]">{lead.nome}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{lead.email}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {lead.telefone}
                          </div>
                        </td>

                        {/* Assunto */}
                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap max-w-[180px] truncate">
                          {lead.assunto}
                        </td>

                        {/* Mensagem */}
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-[220px]">
                          <p className="line-clamp-2 text-xs leading-relaxed">{lead.mensagem}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${lead.status === 'novo' ? 'bg-emerald-500 animate-pulse' : lead.status === 'contatado' ? 'bg-blue-500' : 'bg-slate-400'}`}
                            />
                            {isArquivado ? 'Arquivado' : cfg.label}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4">
                          {isArquivado ? (
                            /* Linha arquivada: botão de desfazer */
                            <button
                              onClick={() => desarquivarLead(lead.id)}
                              className="px-3 py-1.5 border border-slate-200 text-slate-400 rounded-lg text-xs hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                              Desfazer
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Responder */}
                              <button
                                onClick={() => abrirResponder(lead)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2B3C] text-white rounded-lg text-xs hover:bg-[#243447] transition-colors shadow-sm"
                              >
                                <Send className="w-3 h-3" />
                                Responder
                              </button>

                              {/* Arquivar */}
                              <button
                                onClick={() => arquivarLead(lead.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-slate-500 rounded-lg text-xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                              >
                                <Archive className="w-3 h-3" />
                                Arquivar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé da tabela */}
            <div className="px-6 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {leads.length - arquivados.size} ativos · {arquivados.size} arquivados
              </span>
              <span className="text-xs text-slate-400">Atualizado em 27/04/2026</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
