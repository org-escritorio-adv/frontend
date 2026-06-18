import { useState, useEffect } from 'react'
import {
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit,
  MessageSquare,
  Briefcase,
  X,
  CheckCircle2,
  Loader2,
  Shield,
  Users,
  AlertTriangle,
  ShieldAlert,
  Send,
  Archive
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { canAccessCMS } from '@/lib/rbac'

// ── Tipos ────────────────────────────────────────────────────────────────────

type Lawyer = {
  id: number
  name: string
  specialty: string
  oab: string
  email: string
  phone: string
  bio: string
  avatar: string
  casesActive: number
}

type NivelAcesso = 'Admin' | 'Advogado' | 'Estagiário'
type StatusUsuario = 'Ativo' | 'Inativo' | 'Pendente'

type TeamMember = {
  id: number
  nome: string
  email: string
  telefone: string
  nivel: NivelAcesso
  status: StatusUsuario
  avatar: string
  permissoes: Record<string, boolean>
}

type FormData = {
  nome: string
  especialidade: string
  oab: string
  email: string
}

type TeamFormData = {
  nome: string
  email: string
  telefone: string
  nivel: NivelAcesso
}

type FormErrors = Partial<Record<keyof FormData, string>>
type TeamFormErrors = Partial<Record<keyof TeamFormData, string>>

// ── Dados iniciais ────────────────────────────────────────────────────────────

const initialLawyers: Lawyer[] = [
  {
    id: 1,
    name: 'Dr. Carlos Silva',
    specialty: 'Direito Civil',
    oab: 'OAB/DF 123.456',
    email: 'carlos.silva@barcelostakaki.adv.br',
    phone: '(61) 98765-4321',
    bio: 'Especialista em Direito Civil com 15 anos de experiência',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    casesActive: 12
  },
  {
    id: 2,
    name: 'Dra. Ana Costa',
    specialty: 'Direito Trabalhista',
    oab: 'OAB/DF 234.567',
    email: 'ana.costa@barcelostakaki.adv.br',
    phone: '(61) 97654-3210',
    bio: 'Advogada especializada em relações trabalhistas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    casesActive: 8
  },
  {
    id: 3,
    name: 'Dr. Roberto Alves',
    specialty: 'Direito Empresarial',
    oab: 'OAB/DF 345.678',
    email: 'roberto.alves@barcelostakaki.adv.br',
    phone: '(61) 96543-2109',
    bio: 'Consultoria jurídica para empresas de médio e grande porte',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
    casesActive: 15
  }
]

const leads = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(61) 91234-5678',
    subject: 'Consultoria sobre Ação Trabalhista',
    message: 'Gostaria de agendar uma consulta para discutir um caso de rescisão contratual.',
    date: '15/04/2026',
    status: 'novo',
    area: 'Trabalhista'
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(61) 91234-5679',
    subject: 'Dúvidas sobre Inventário',
    message: 'Preciso de orientação sobre o processo de inventário de bens.',
    date: '14/04/2026',
    status: 'em_contato',
    area: 'Cível'
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '(61) 91234-5680',
    subject: 'Assessoria Empresarial',
    message: 'Empresa precisa de assessoria jurídica para abertura de filial.',
    date: '13/04/2026',
    status: 'novo',
    area: 'Empresarial'
  }
]

const statusMap: Record<string, { color: string; label: string }> = {
  novo: { color: 'bg-blue-500', label: 'Novo' },
  em_contato: { color: 'bg-yellow-500', label: 'Em Contato' },
  convertido: { color: 'bg-green-500', label: 'Convertido' }
}

const areaColors: Record<string, string> = {
  Trabalhista: 'bg-purple-50 text-purple-700 border-purple-200',
  Cível: 'bg-blue-50   text-blue-700   border-blue-200',
  Empresarial: 'bg-amber-50  text-amber-700  border-amber-200'
}

const emptyForm: FormData = { nome: '', especialidade: '', oab: '', email: '' }
const emptyTeamForm: TeamFormData = { nome: '', email: '', telefone: '', nivel: 'Advogado' }

// ── Permissões padrão por perfil ─────────────────────────────────────────────

const permissoesPadrao: Record<NivelAcesso, Record<string, boolean>> = {
  Admin: {
    visualizarProcessos: true,
    criarProcessos: true,
    editarProcessos: true,
    excluirProcessos: true,
    gerenciarUsuarios: true
  },
  Advogado: {
    visualizarProcessos: true,
    criarProcessos: true,
    editarProcessos: true,
    excluirProcessos: false,
    gerenciarUsuarios: false
  },
  Estagiário: {
    visualizarProcessos: true,
    criarProcessos: false,
    editarProcessos: false,
    excluirProcessos: false,
    gerenciarUsuarios: false
  }
}

// ── Configurações visuais dos níveis ─────────────────────────────────────────

const nivelConfig: Record<NivelAcesso, { badge: string; dot: string; icon: typeof Shield }> = {
  Admin: { badge: 'bg-[#1A2B3C] text-white', dot: 'bg-white', icon: Shield },
  Advogado: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    icon: Shield
  },
  Estagiário: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    icon: Users
  }
}

const statusConfig: Record<StatusUsuario, { badge: string; dot: string }> = {
  Ativo: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500'
  },
  Inativo: { badge: 'bg-slate-100 text-slate-500 border border-slate-200', dot: 'bg-slate-400' },
  Pendente: { badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' }
}

// ── Dados iniciais da equipe ─────────────────────────────────────────────────

const initialTeamMembers: TeamMember[] = [
  {
    id: 1,
    nome: 'Dr. Carlos Silva',
    email: 'carlos.silva@barcelostakaki.adv.br',
    telefone: '(61) 98765-4321',
    nivel: 'Admin',
    status: 'Ativo',
    avatar: 'CS',
    permissoes: { ...permissoesPadrao['Admin'] }
  },
  {
    id: 2,
    nome: 'Dra. Ana Costa',
    email: 'ana.costa@barcelostakaki.adv.br',
    telefone: '(61) 97654-3210',
    nivel: 'Advogado',
    status: 'Ativo',
    avatar: 'AC',
    permissoes: { ...permissoesPadrao['Advogado'] }
  },
  {
    id: 3,
    nome: 'Pedro Lima',
    email: 'pedro.lima@barcelostakaki.adv.br',
    telefone: '(61) 96543-2109',
    nivel: 'Estagiário',
    status: 'Pendente',
    avatar: 'PL',
    permissoes: { ...permissoesPadrao['Estagiário'] }
  }
]

// ── Componente principal ─────────────────────────────────────────────────────

export function CMSMobile() {
  const { user } = useAuth()

  const [selectedTab, setSelectedTab] = useState('advogados')
  const [lawyers, setLawyers] = useState<Lawyer[]>(initialLawyers)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers)

  // ── Estado do Bottom Sheet (Advogados) ──
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false) // controla animação
  const [form, setForm] = useState<FormData>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Estado de leads arquivados ──
  const [arquivados, setArquivados] = useState<Set<number>>(new Set())
  const arquivarLead = (id: number) => setArquivados(prev => new Set([...prev, id]))
  const desarquivarLead = (id: number) => setArquivados(prev => { const s = new Set(prev); s.delete(id); return s })

  // ── Estado do modal Responder Lead ──
  type LeadItem = typeof leads[0]
  const [leadResponder, setLeadResponder] = useState<LeadItem | null>(null)
  const [leadSheetOpen, setLeadSheetOpen] = useState(false)
  const [leadSheetVisible, setLeadSheetVisible] = useState(false)
  const [emailCorpo, setEmailCorpo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const openLeadSheet = (lead: LeadItem) => {
    setLeadResponder(lead)
    setEmailCorpo(
      `Prezado(a) ${lead.name},\n\nAgradecemos o seu contato com o escritório Barcelos & Takaki Advocacia.\n\nAnalisamos a sua solicitação referente a "${lead.subject}" e entramos em contato para agendar uma consulta inicial.\n\nPor favor, confirme sua disponibilidade para que possamos dar prosseguimento ao atendimento.`
    )
    setEnviando(false)
    setEnviado(false)
    setLeadSheetOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setLeadSheetVisible(true)))
  }

  const closeLeadSheet = () => {
    setLeadSheetVisible(false)
    setTimeout(() => {
      setLeadSheetOpen(false)
      setLeadResponder(null)
    }, 300)
  }

  const handleEnviarLead = () => {
    setEnviando(true)
    setTimeout(() => {
      setEnviando(false)
      setEnviado(true)
      setTimeout(closeLeadSheet, 1200)
    }, 800)
  }

  useEffect(() => {
    if (leadSheetOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [leadSheetOpen])

  // ── Estado do Bottom Sheet (Equipe) ──
  const [teamSheetOpen, setTeamSheetOpen] = useState(false)
  const [teamSheetVisible, setTeamSheetVisible] = useState(false)
  const [teamForm, setTeamForm] = useState<TeamFormData>(emptyTeamForm)
  const [teamErrors, setTeamErrors] = useState<TeamFormErrors>({})
  const [teamSaving, setTeamSaving] = useState(false)
  const [teamSaved, setTeamSaved] = useState(false)

  // Abre o sheet com animação de entrada
  const openSheet = () => {
    setSheetOpen(true)
    // Pequeno delay para o DOM montar antes de iniciar a transição
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)))
  }

  // Fecha com animação de saída
  const closeSheet = () => {
    setSheetVisible(false)
    setTimeout(() => {
      setSheetOpen(false)
      setForm(emptyForm)
      setErrors({})
      setSaved(false)
    }, 300) // duração da transição CSS
  }

  // Bloqueia scroll do body quando o sheet está aberto
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  // Validação simples
  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório'
    if (!form.especialidade.trim()) e.especialidade = 'Especialidade é obrigatória'
    if (!form.oab.trim()) e.oab = 'OAB é obrigatória'
    if (!form.email.trim()) e.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    // Simula chamada à API (~1.2s)
    await new Promise(r => setTimeout(r, 1200))

    const newLawyer: Lawyer = {
      id: Date.now(),
      name: form.nome,
      specialty: form.especialidade,
      oab: form.oab,
      email: form.email,
      phone: '(61) 99999-0000',
      bio: `Especialista em ${form.especialidade}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.nome)}`,
      casesActive: 0
    }

    setLawyers(prev => [...prev, newLawyer])
    setSaving(false)
    setSaved(true)

    // Fecha após feedback visual
    setTimeout(closeSheet, 900)
  }

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // ── Funções do Bottom Sheet de Equipe ──

  const openTeamSheet = () => {
    setTeamSheetOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setTeamSheetVisible(true)))
  }

  const closeTeamSheet = () => {
    setTeamSheetVisible(false)
    setTimeout(() => {
      setTeamSheetOpen(false)
      setTeamForm(emptyTeamForm)
      setTeamErrors({})
      setTeamSaved(false)
    }, 300)
  }

  useEffect(() => {
    document.body.style.overflow = teamSheetOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [teamSheetOpen])

  if (!canAccessCMS(user)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
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

  const validateTeam = (): boolean => {
    const e: TeamFormErrors = {}
    if (!teamForm.nome.trim()) e.nome = 'Nome é obrigatório'
    if (!teamForm.telefone.trim()) e.telefone = 'Telefone é obrigatório'
    if (!teamForm.email.trim()) e.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(teamForm.email)) e.email = 'E-mail inválido'
    setTeamErrors(e)
    return Object.keys(e).length === 0
  }

  const handleTeamSave = async () => {
    if (!validateTeam()) return

    setTeamSaving(true)
    await new Promise(r => setTimeout(r, 1200))

    const newMember: TeamMember = {
      id: Date.now(),
      nome: teamForm.nome,
      email: teamForm.email,
      telefone: teamForm.telefone,
      nivel: teamForm.nivel,
      status: 'Pendente',
      avatar: teamForm.nome
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join(''),
      permissoes: { ...permissoesPadrao[teamForm.nivel] }
    }

    setTeamMembers(prev => [...prev, newMember])
    setTeamSaving(false)
    setTeamSaved(true)
    setTimeout(closeTeamSheet, 900)
  }

  const updateTeamField = (field: keyof TeamFormData, value: string | NivelAcesso) => {
    setTeamForm(prev => ({ ...prev, [field]: value }))
    if (teamErrors[field]) setTeamErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Cabeçalho + Stats ────────────────────────────── */}
      <div
        className="bg-white border-b border-slate-100 px-4 pt-4 pb-4"
        style={{ boxShadow: '0 1px 6px rgba(26,43,60,0.05)' }}
      >
        <h2 className="text-base font-semibold text-[#1A2B3C] mb-3">CMS Institucional</h2>

        <div className="flex gap-3">
          {(selectedTab === 'equipe'
            ? [
                { value: teamMembers.length, label: 'Total Equipe', color: 'text-[#1A2B3C]' },
                {
                  value: teamMembers.filter(m => m.status === 'Ativo').length,
                  label: 'Ativos',
                  color: 'text-emerald-600'
                },
                {
                  value: teamMembers.filter(m => m.nivel === 'Admin').length,
                  label: 'Admins',
                  color: 'text-blue-600'
                }
              ]
            : [
                { value: lawyers.length, label: 'Advogados', color: 'text-[#1A2B3C]' },
                {
                  value: leads.filter(l => l.status === 'novo').length,
                  label: 'Novos Leads',
                  color: 'text-blue-600'
                },
                { value: leads.length, label: 'Total Leads', color: 'text-slate-600' }
              ]
          ).map(s => (
            <div
              key={s.label}
              className="flex-1 bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-100 text-center"
            >
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="px-4 mt-4 pb-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full bg-slate-100 p-1 rounded-xl mb-4 h-11 grid grid-cols-2">
            <TabsTrigger
              value="advogados"
              className="rounded-lg h-9 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1A2B3C] data-[state=active]:shadow-sm"
            >
              Advogados
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="rounded-lg h-9 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1A2B3C] data-[state=active]:shadow-sm"
            >
              Leads ({leads.filter(l => l.status === 'novo').length})
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Advogados ── */}
          <TabsContent value="advogados" className="space-y-3 mt-0">
            {/* CTA — full width, 48px, ABRE O BOTTOM SHEET */}
            <button
              onClick={openSheet}
              className="w-full h-12 bg-[#C5A059] hover:bg-[#C5A059]/90 active:scale-[0.99] text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
              style={{ boxShadow: '0 2px 10px rgba(197,160,89,0.35)' }}
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Advogado
            </button>

            {lawyers.map(l => (
              <div
                key={l.id}
                className="bg-white rounded-2xl border border-slate-100 p-4"
                style={{ boxShadow: '0 2px 10px rgba(26,43,60,0.07)' }}
              >
                <div className="flex gap-3 mb-3">
                  <Avatar className="w-14 h-14 border-2 border-[#C5A059] flex-shrink-0">
                    <AvatarImage src={l.avatar} alt={l.name} />
                    <AvatarFallback className="bg-[#1A2B3C] text-white text-sm">
                      {l.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#1A2B3C] mb-0.5 truncate">
                      {l.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-1">{l.specialty}</p>
                    <p className="text-[11px] text-slate-400">{l.oab}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => setLawyers(prev => prev.filter(x => x.id !== l.id))}
                      className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100 leading-relaxed">
                  {l.bio}
                </p>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{l.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600">{l.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                  <Briefcase className="w-3.5 h-3.5 text-[#1A2B3C]" />
                  <span className="text-xs font-semibold text-[#1A2B3C]">
                    {l.casesActive} casos ativos
                  </span>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── Tab: Leads ── */}
          <TabsContent value="leads" className="space-y-3 mt-0">
            {leads.map(lead => {
              const s = statusMap[lead.status] ?? statusMap.novo
              const isArquivado = arquivados.has(lead.id)
              return (
                <div
                  key={lead.id}
                  className={`bg-white rounded-2xl border border-slate-100 p-4 transition-opacity duration-300 ${isArquivado ? 'opacity-50' : ''}`}
                  style={{ boxShadow: '0 2px 10px rgba(26,43,60,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${isArquivado ? 'bg-slate-400' : s.color} text-white border-0 text-xs`}>
                      {isArquivado ? 'Arquivado' : s.label}
                    </Badge>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        areaColors[lead.area] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {lead.area}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#1A2B3C] mb-0.5">{lead.name}</h3>
                  <p className="text-xs font-medium text-slate-600 mb-3">{lead.subject}</p>

                  <div className="space-y-1.5 mb-3 pb-3 border-b border-slate-100">
                    {[
                      { Icon: Mail, text: lead.email },
                      { Icon: Phone, text: lead.phone },
                      { Icon: Calendar, text: lead.date }
                    ].map(({ Icon, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-500 truncate">{text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">{lead.message}</p>
                  </div>

                  {isArquivado ? (
                    <button
                      onClick={() => desarquivarLead(lead.id)}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Desfazer
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openLeadSheet(lead)}
                        className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Responder
                      </button>
                      <button
                        onClick={() => arquivarLead(lead.id)}
                        className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                        Arquivar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* ══════════════════════════════════════════════════════
          BOTTOM SHEET — Responder Lead
      ══════════════════════════════════════════════════════ */}
      {leadSheetOpen && leadResponder && (
        <>
          <div
            className={`fixed inset-0 z-[70] transition-all duration-300 ${leadSheetVisible ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-transparent'}`}
            onClick={closeLeadSheet}
            aria-hidden="true"
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-3xl transition-transform duration-300 ease-out ${leadSheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ boxShadow: '0 -8px 40px rgba(26,43,60,0.22)', maxHeight: '92vh' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1A2B3C]/10 flex items-center justify-center">
                  <Send className="w-4 h-4 text-[#1A2B3C]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1A2B3C]">Responder Lead</h3>
                  <p className="text-[11px] text-slate-400">Composição de e-mail para o cliente</p>
                </div>
              </div>
              <button
                onClick={closeLeadSheet}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Para / Assunto */}
            <div className="border-b border-slate-100">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14 flex-shrink-0">Para</span>
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-[#1A2B3C]">{leadResponder.name}</span>
                  <span className="text-xs text-slate-400 truncate">{leadResponder.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14 flex-shrink-0">Assunto</span>
                <input
                  type="text"
                  defaultValue={`Re: ${leadResponder.subject}`}
                  className="flex-1 text-sm text-[#1A2B3C] focus:outline-none bg-transparent min-w-0"
                />
              </div>
            </div>

            {/* Corpo + info original */}
            <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: 'calc(92vh - 280px)' }}>
              <textarea
                value={emailCorpo}
                onChange={e => setEmailCorpo(e.target.value)}
                rows={7}
                className="w-full text-sm text-slate-700 leading-relaxed resize-none focus:outline-none placeholder-slate-300"
                placeholder="Digite sua mensagem…"
              />

              {/* Mensagem original do lead */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Mensagem Original do Lead</p>
                <p className="text-xs text-slate-500 italic">"{leadResponder.message}"</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Phone className="w-3 h-3" />{leadResponder.phone}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3" />{leadResponder.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-white">
              <button
                onClick={closeLeadSheet}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarLead}
                disabled={enviando || enviado}
                className={`flex-1 h-12 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-80 ${enviado ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}`}
              >
                {enviado ? (
                  <><CheckCircle2 className="w-4 h-4" /> Enviado!</>
                ) : enviando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar E-mail</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          BOTTOM SHEET — Adicionar Advogado
      ══════════════════════════════════════════════════════ */}
      {sheetOpen && (
        <>
          {/* Overlay escuro */}
          <div
            className={`fixed inset-0 z-[70] transition-all duration-300 ${
              sheetVisible ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-transparent'
            }`}
            onClick={closeSheet}
            aria-hidden="true"
          />

          {/* Sheet em si — sobe de baixo */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-3xl
              transition-transform duration-300 ease-out
              ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ boxShadow: '0 -8px 40px rgba(26,43,60,0.22)', maxHeight: '92vh' }}
          >
            {/* Drag handle decorativo */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Cabeçalho do sheet */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Novo Advogado</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Preencha os dados do profissional
                </p>
              </div>
              <button
                onClick={closeSheet}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Formulário */}
            <div
              className="overflow-y-auto px-5 py-4 space-y-4"
              style={{ maxHeight: 'calc(92vh - 160px)' }}
            >
              {/* Nome completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => updateField('nome', e.target.value)}
                  placeholder="Ex: Dr. João Barcelos"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.nome
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {errors.nome && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.nome}
                  </p>
                )}
              </div>

              {/* Especialidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Especialidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.especialidade}
                  onChange={e => updateField('especialidade', e.target.value)}
                  placeholder="Ex: Direito Empresarial, Direito Tributário…"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C]
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.especialidade
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {errors.especialidade && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.especialidade}
                  </p>
                )}
              </div>

              {/* OAB */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Número OAB <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.oab}
                  onChange={e => updateField('oab', e.target.value)}
                  placeholder="Ex: OAB/DF 123.456"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.oab
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {errors.oab && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.oab}
                  </p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  E-mail profissional <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="nome@barcelostakaki.adv.br"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.email
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Espaço extra para o footer fixo não cobrir */}
              <div className="h-2" />
            </div>

            {/* Botões de ação — fixos na base do sheet */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-white">
              <button
                onClick={closeSheet}
                disabled={saving}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex-1 h-12 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all ${
                  saved
                    ? 'bg-emerald-500'
                    : 'bg-[#C5A059] hover:bg-[#C5A059]/90 active:scale-[0.99]'
                } disabled:opacity-70`}
                style={!saved ? { boxShadow: '0 2px 10px rgba(197,160,89,0.35)' } : {}}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando…
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Salvar Advogado
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          BOTTOM SHEET — Adicionar Membro da Equipe
      ══════════════════════════════════════════════════════ */}
      {teamSheetOpen && (
        <>
          {/* Overlay escuro */}
          <div
            className={`fixed inset-0 z-[70] transition-all duration-300 ${
              teamSheetVisible ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-transparent'
            }`}
            onClick={closeTeamSheet}
            aria-hidden="true"
          />

          {/* Sheet em si — sobe de baixo */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-3xl
              transition-transform duration-300 ease-out
              ${teamSheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ boxShadow: '0 -8px 40px rgba(26,43,60,0.22)', maxHeight: '92vh' }}
          >
            {/* Drag handle decorativo */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Cabeçalho do sheet */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Novo Membro</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Adicionar à equipe</p>
              </div>
              <button
                onClick={closeTeamSheet}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Formulário */}
            <div
              className="overflow-y-auto px-5 py-4 space-y-4"
              style={{ maxHeight: 'calc(92vh - 160px)' }}
            >
              {/* Nome completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={teamForm.nome}
                  onChange={e => updateTeamField('nome', e.target.value)}
                  placeholder="Ex: Dr. João Silva"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      teamErrors.nome
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {teamErrors.nome && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {teamErrors.nome}
                  </p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  E-mail institucional <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={teamForm.email}
                  onChange={e => updateTeamField('email', e.target.value)}
                  placeholder="nome@barcelostakaki.adv.br"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      teamErrors.email
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {teamErrors.email && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {teamErrors.email}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={teamForm.telefone}
                  onChange={e => updateTeamField('telefone', e.target.value)}
                  placeholder="(61) 9XXXX-XXXX"
                  className={`w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      teamErrors.telefone
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40'
                    }`}
                />
                {teamErrors.telefone && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                    {teamErrors.telefone}
                  </p>
                )}
              </div>

              {/* Nível de Acesso */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nível de Acesso <span className="text-red-500">*</span>
                </label>
                <select
                  value={teamForm.nivel}
                  onChange={e => updateTeamField('nivel', e.target.value as NivelAcesso)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#1A2B3C]
                    focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40 focus:bg-white transition-all appearance-none"
                >
                  <option value="Admin">Admin — Acesso total ao sistema</option>
                  <option value="Advogado">Advogado — Acesso padrão</option>
                  <option value="Estagiário">Estagiário — Acesso restrito</option>
                </select>

                {/* Aviso visual do nível selecionado */}
                {teamForm.nivel === 'Estagiário' && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Perfil com permissões restritas (somente visualização).
                    </p>
                  </div>
                )}

                {/* Preview das permissões */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(permissoesPadrao[teamForm.nivel])
                    .filter(([, v]) => v)
                    .slice(0, 3)
                    .map(([k]) => (
                      <span
                        key={k}
                        className="text-[10px] px-2 py-0.5 bg-[#1A2B3C]/8 text-[#1A2B3C] rounded-full"
                      >
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  {Object.values(permissoesPadrao[teamForm.nivel]).filter(Boolean).length > 3 && (
                    <span className="text-[10px] text-slate-400">
                      +{Object.values(permissoesPadrao[teamForm.nivel]).filter(Boolean).length - 3}{' '}
                      mais
                    </span>
                  )}
                </div>
              </div>

              {/* Espaço extra para o footer fixo não cobrir */}
              <div className="h-2" />
            </div>

            {/* Botões de ação — fixos na base do sheet */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-white">
              <button
                onClick={closeTeamSheet}
                disabled={teamSaving}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleTeamSave}
                disabled={teamSaving || teamSaved}
                className={`flex-1 h-12 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all ${
                  teamSaved
                    ? 'bg-emerald-500'
                    : 'bg-[#1A2B3C] hover:bg-[#243447] active:scale-[0.99]'
                } disabled:opacity-70`}
                style={!teamSaved ? { boxShadow: '0 2px 10px rgba(26,43,60,0.25)' } : {}}
              >
                {teamSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando…
                  </>
                ) : teamSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Adicionar à Equipe
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
