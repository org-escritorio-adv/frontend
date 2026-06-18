import { useState, useEffect } from 'react'
import {
  Paperclip,
  MessageSquare,
  Calendar,
  Plus,
  X,
  Phone,
  Mail,
  FileText,
  Clock,
  User,
  Scale,
  ChevronRight,
  Edit3,
  History,
  Download,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { canEditProcessos } from '@/lib/rbac'
import { exportarCsvProcessos, buscarProcessosRaw, type ProcessoAPI } from '@/services/processos.service'
import { criarTarefa } from '@/services/tarefas.service'
import { listarUsuarios, type UsuarioAPI } from '@/services/equipe.service'

// ─── Types ──────────────────────────────────────────────────────────────────

type Priority = 'Alta' | 'Média' | 'Baixa'

interface HistoryEvent {
  id: string
  type: 'criado' | 'atualizado' | 'documento' | 'audiencia' | 'decisao'
  descricao: string
  data: string
  autor: string
}

interface KanbanCard {
  id: string
  title: string
  priority: Priority
  tags: string[]
  attachments: number
  comments: number
  assignee: string
  assigneeColor: string
  assigneeFullName: string
  assigneeRole: string
  phone: string
  email: string
  dueDate: string
  processNumber: string
  court: string
  vara: string
  description: string
  hearingDate?: string
  history: HistoryEvent[]
}

interface KanbanColumn {
  id: string
  title: string
  dotColor: string
  headerBg: string
  cards: KanbanCard[]
}

// ─── Constant maps ───────────────────────────────────────────────────────────

const priorityStyles: Record<Priority, string> = {
  Alta: 'bg-red-100 text-red-700 border border-red-200',
  Média: 'bg-amber-100 text-amber-700 border border-amber-200',
  Baixa: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
}

const historyIcon = (type: HistoryEvent['type']) => {
  switch (type) {
    case 'criado':
      return <Plus className="w-3.5 h-3.5 text-blue-500" />
    case 'atualizado':
      return <Edit3 className="w-3.5 h-3.5 text-amber-500" />
    case 'documento':
      return <FileText className="w-3.5 h-3.5 text-green-500" />
    case 'audiencia':
      return <Calendar className="w-3.5 h-3.5 text-purple-500" />
    case 'decisao':
      return <Scale className="w-3.5 h-3.5 text-[#C5A059]" />
  }
}

// ─── Initial data ────────────────────────────────────────────────────────────

const initialColumns: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    dotColor: 'bg-slate-400',
    headerBg: 'bg-slate-100',
    cards: [
      {
        id: 'b1',
        title: 'Elaboração de Contrato Social – Fusão Alpha Corp.',
        priority: 'Alta',
        tags: ['Contratos'],
        attachments: 3,
        comments: 2,
        assignee: 'CS',
        assigneeColor: 'bg-blue-500',
        assigneeFullName: 'Dr. Carlos Silva',
        assigneeRole: 'Sócio Fundador',
        phone: '(61) 98765-4321',
        email: 'carlos.silva@lexflow.com.br',
        dueDate: '15/05/2026',
        processNumber: '0001234-56.2024.8.07.0001',
        court: 'TJDFT',
        vara: '1ª Vara Empresarial de Brasília',
        description:
          'Análise e revisão de cláusulas contratuais referentes à fusão societária entre a Empresa Alpha Corp. e a Empresa Beta Ltda.',
        hearingDate: '28/05/2026',
        history: [
          {
            id: 'h1',
            type: 'criado',
            descricao: 'Processo cadastrado no sistema',
            data: '10/04/2026',
            autor: 'Dr. Carlos Silva'
          }
        ]
      },
      {
        id: 'b2',
        title: 'Consultoria Trabalhista – Rescisão Contrato João Santos',
        priority: 'Média',
        tags: ['Trabalhista'],
        attachments: 1,
        comments: 5,
        assignee: 'AC',
        assigneeColor: 'bg-purple-500',
        assigneeFullName: 'Dra. Ana Costa',
        assigneeRole: 'Advogada Trabalhista',
        phone: '(61) 99123-5678',
        email: 'ana.costa@lexflow.com.br',
        dueDate: '20/05/2026',
        processNumber: '0007890-12.2024.5.10.0001',
        court: 'TRT 10ª Região',
        vara: '2ª Vara do Trabalho de Brasília',
        description:
          'Ação trabalhista movida pelo reclamante João Santos por verbas rescisórias não pagas.',
        history: [
          {
            id: 'h1',
            type: 'criado',
            descricao: 'Processo cadastrado',
            data: '12/04/2026',
            autor: 'Dra. Ana Costa'
          }
        ]
      }
    ]
  },
  {
    id: 'em-execucao',
    title: 'Em Execução',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    cards: [
      {
        id: 'e1',
        title: 'Ação Trabalhista – Cliente João Santos',
        priority: 'Alta',
        tags: ['Trabalhista'],
        attachments: 4,
        comments: 7,
        assignee: 'RA',
        assigneeColor: 'bg-emerald-500',
        assigneeFullName: 'Dr. Roberto Alves',
        assigneeRole: 'Advogado Trabalhista Sênior',
        phone: '(61) 98234-9012',
        email: 'roberto.alves@lexflow.com.br',
        dueDate: '08/05/2026',
        processNumber: '0098-45.2024.5.10.0001',
        court: 'TRT 10ª Região',
        vara: '3ª Vara do Trabalho de Brasília',
        description: 'Defesa do reclamado em ação trabalhista por rescisão indireta.',
        hearingDate: '22/05/2026',
        history: [
          {
            id: 'h1',
            type: 'criado',
            descricao: 'Processo cadastrado no sistema',
            data: '02/04/2026',
            autor: 'Dr. Roberto Alves'
          }
        ]
      }
    ]
  },
  {
    id: 'revisao',
    title: 'Revisão',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    cards: [
      {
        id: 'r1',
        title: 'Revisão de Estatuto Social – Reestruturação Societária',
        priority: 'Média',
        tags: ['Contratos'],
        attachments: 5,
        comments: 8,
        assignee: 'ML',
        assigneeColor: 'bg-orange-500',
        assigneeFullName: 'Dra. Marina Lima',
        assigneeRole: 'Advogada Sênior',
        phone: '(61) 97654-3210',
        email: 'marina.lima@lexflow.com.br',
        dueDate: '06/05/2026',
        processNumber: '0034567-89.2024.8.07.0007',
        court: 'TJDFT',
        vara: '6ª Vara Empresarial de Brasília',
        description: 'Revisão completa de contrato social de empresa em fase de reestruturação.',
        history: [
          {
            id: 'h1',
            type: 'criado',
            descricao: 'Processo iniciado',
            data: '01/04/2026',
            autor: 'Dra. Marina Lima'
          }
        ]
      }
    ]
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    cards: [
      {
        id: 'f1',
        title: 'Homologação de Acordo Trabalhista – Caso 0076/2023',
        priority: 'Alta',
        tags: ['Trabalhista'],
        attachments: 3,
        comments: 5,
        assignee: 'AC',
        assigneeColor: 'bg-purple-500',
        assigneeFullName: 'Dra. Ana Costa',
        assigneeRole: 'Advogada Trabalhista',
        phone: '(61) 99123-5678',
        email: 'ana.costa@lexflow.com.br',
        dueDate: '02/05/2026',
        processNumber: '0076-34.2023.5.10.0009',
        court: 'TRT 10ª Região',
        vara: '2ª Vara do Trabalho de Brasília',
        description: 'Acordo trabalhista homologado com sucesso. Processo encerrado.',
        history: [
          {
            id: 'h1',
            type: 'criado',
            descricao: 'Processo cadastrado',
            data: '10/01/2026',
            autor: 'Dra. Ana Costa'
          },
          {
            id: 'h2',
            type: 'decisao',
            descricao: 'Acordo homologado pelo juiz',
            data: '28/04/2026',
            autor: 'Sistema'
          }
        ]
      }
    ]
  }
]

// ─── Bottom Sheet: Detalhes do Caso ───────────────────────────────────────────

function CaseDetailBottomSheet({
  card,
  onClose,
  podeEditar
}: {
  card: KanbanCard
  onClose: () => void
  podeEditar: boolean
}) {
  const historyBg: Record<HistoryEvent['type'], string> = {
    criado: 'bg-blue-100',
    atualizado: 'bg-amber-100',
    documento: 'bg-green-100',
    audiencia: 'bg-purple-100',
    decisao: 'bg-[#C5A059]/20'
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px] z-50" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slide-up max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="bg-[#1A2B3C] px-5 py-4 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[card.priority]}`}
              >
                {card.priority}
              </span>
              <span className="text-[10px] text-white/60 font-mono">{card.processNumber}</span>
            </div>
            <h3 className="text-white text-sm font-semibold leading-snug">{card.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center gap-3 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 whitespace-nowrap">
            <Calendar className="w-3 h-3 text-[#C5A059]" />
            <span>Vence: {card.dueDate}</span>
          </div>
          {card.hearingDate && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 text-[10px] text-purple-600 whitespace-nowrap">
                <Scale className="w-3 h-3" />
                <span>Audiência: {card.hearingDate}</span>
              </div>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Responsável */}
          <section>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Responsável
            </h4>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div
                className={`w-9 h-9 rounded-full ${card.assigneeColor} flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm`}
              >
                <span className="text-white text-xs font-bold">{card.assignee}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A2B3C]">{card.assigneeFullName}</p>
                <p className="text-[10px] text-slate-500">{card.assigneeRole}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <a
                  href={`tel:${card.phone}`}
                  className="flex items-center gap-1 text-[10px] text-[#C5A059] hover:text-[#b8903f] font-medium"
                >
                  <Phone className="w-3 h-3" />
                  {card.phone}
                </a>
                <a
                  href={`mailto:${card.email}`}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#1A2B3C]"
                >
                  <Mail className="w-3 h-3" />
                  E-mail
                </a>
              </div>
            </div>
          </section>

          {/* Tribunal */}
          <section>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tribunal
            </h4>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-sm font-semibold text-[#1A2B3C]">{card.court}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.vara}</p>
            </div>
          </section>

          {/* Descrição */}
          <section>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Descrição
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-200">
              {card.description}
            </p>
          </section>

          {/* Tags */}
          {card.tags.length > 0 && (
            <section>
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Área Jurídica
              </h4>
              <div className="flex flex-wrap gap-2">
                {card.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 bg-[#1A2B3C]/8 text-[#1A2B3C] rounded-full border border-[#1A2B3C]/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Anexos & comentários */}
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-[#1A2B3C]">{card.attachments}</p>
                <p className="text-[10px] text-slate-400">Anexos</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-[#1A2B3C]">{card.comments}</p>
                <p className="text-[10px] text-slate-400">Comentários</p>
              </div>
            </div>
          </section>

          {/* Histórico */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Histórico
              </h4>
            </div>
            <div className="relative pl-4">
              {/* Line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />

              <div className="space-y-3">
                {card.history.map(event => (
                  <div key={event.id} className="relative flex gap-2.5">
                    {/* Dot */}
                    <div
                      className={`w-5 h-5 rounded-full ${historyBg[event.type]} flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm`}
                    >
                      {historyIcon(event.type)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm text-[#1A2B3C] leading-snug">{event.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{event.data}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">{event.autor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        {podeEditar && (
          <div className="border-t border-slate-200 px-5 py-3 flex items-center gap-3 flex-shrink-0 bg-white">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1A2B3C] text-white text-sm font-medium rounded-xl hover:bg-[#243447] transition-colors">
              <Edit3 className="w-4 h-4" />
              Editar Caso
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main KanbanMobile ───────────────────────────────────────────────────────

export function KanbanMobile() {
  const { user } = useAuth()
  const podeEditar = canEditProcessos(user)
  const [exporting, setExporting] = useState(false)

  const handleExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    try { await exportarCsvProcessos() }
    catch { /* silencioso */ }
    finally { setExporting(false) }
  }

  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('backlog')

  // ── Novo Caso ────────────────────────────────────────────────────────────────
  const [novoOpen, setNovoOpen] = useState(false)
  const [novoVisible, setNovoVisible] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoPriority, setNovoPriority] = useState<Priority>('Média')
  const [novoDueDate, setNovoDueDate] = useState('')
  const [novoResponsavelId, setNovoResponsavelId] = useState<string>('')
  const [novoProcessoId, setNovoProcessoId] = useState<number | null>(null)
  const [processos, setProcessos] = useState<ProcessoAPI[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([])
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const colToStatus: Record<string, string> = {
    backlog: 'aberta',
    'em-execucao': 'em_andamento',
    revisao: 'revisao',
    finalizado: 'concluida'
  }

  const avatarColors = [
    'bg-[#1A2B3C]', 'bg-blue-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-amber-500', 'bg-rose-500'
  ]

  const openNovo = () => {
    setNovoTitulo('')
    setNovoPriority('Média')
    setNovoDueDate('')
    setNovoResponsavelId('')
    setNovoProcessoId(null)
    setSalvo(false)
    setSalvando(false)
    setNovoOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setNovoVisible(true)))
  }

  const closeNovo = () => {
    setNovoVisible(false)
    setTimeout(() => setNovoOpen(false), 300)
  }

  useEffect(() => {
    if (novoOpen) {
      document.body.style.overflow = 'hidden'
      buscarProcessosRaw().then(setProcessos).catch(() => {})
      listarUsuarios().then(setUsuarios).catch(() => {})
    }
    return () => { document.body.style.overflow = '' }
  }, [novoOpen])

  const handleSalvarNovo = async () => {
    if (salvando || !novoTitulo.trim()) return
    setSalvando(true)
    try {
      const tarefa = await criarTarefa({
        titulo: novoTitulo.trim(),
        descricao: null,
        status: colToStatus[activeTab] ?? 'aberta',
        processo_id: novoProcessoId ?? null
      })
      const responsavel = usuarios.find(u => u.id === novoResponsavelId)
      const fullName = responsavel?.nome ?? 'Não atribuído'
      const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
      const colorIdx = initials.charCodeAt(0) % avatarColors.length
      const newCard: KanbanCard = {
        id: String(tarefa.id),
        title: tarefa.titulo,
        priority: novoPriority,
        tags: [],
        attachments: 0,
        comments: 0,
        assignee: initials || '??',
        assigneeColor: avatarColors[colorIdx],
        assigneeFullName: fullName,
        assigneeRole: responsavel?.perfil === 'admin' ? 'Administrador' : responsavel?.perfil === 'advogado' ? 'Advogado(a)' : 'Estagiário(a)',
        phone: '',
        email: '',
        dueDate: novoDueDate
          ? new Date(novoDueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '—',
        processNumber: novoProcessoId ? String(novoProcessoId) : 'N/A',
        court: 'A definir',
        vara: 'A definir',
        description: '',
        history: [{
          id: 'h1', type: 'criado',
          descricao: 'Caso cadastrado manualmente',
          data: new Date().toLocaleDateString('pt-BR'),
          autor: 'Usuário'
        }]
      }
      setColumns(prev => prev.map(col =>
        col.id === activeTab ? { ...col, cards: [newCard, ...col.cards] } : col
      ))
      setSalvo(true)
      setTimeout(closeNovo, 900)
    } catch {
      alert('Erro ao criar caso. Verifique a conexão.')
    } finally {
      setSalvando(false)
    }
  }

  const totalCards = columns.reduce((acc, col) => acc + col.cards.length, 0)

  const findCard = (id: string): KanbanCard | null => {
    for (const col of columns) {
      const card = col.cards.find(c => c.id === id)
      if (card) return card
    }
    return null
  }

  const selectedCard = selectedCardId ? findCard(selectedCardId) : null
  const activeColumn = columns.find(c => c.id === activeTab)

  return (
    <>
      {selectedCard && (
        <CaseDetailBottomSheet
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          podeEditar={podeEditar}
        />
      )}

      {/* ── Bottom Sheet: Novo Caso ─────────────────────────────────────── */}
      {novoOpen && (
        <>
          <div
            className={`fixed inset-0 z-[70] transition-all duration-300 ${novoVisible ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-transparent'}`}
            onClick={closeNovo}
            aria-hidden="true"
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-3xl transition-transform duration-300 ease-out ${novoVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ boxShadow: '0 -8px 40px rgba(26,43,60,0.22)', maxHeight: '92vh' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Novo Caso</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Será adicionado em <span className="font-medium text-[#1A2B3C]">{columns.find(c => c.id === activeTab)?.title ?? activeTab}</span>
                </p>
              </div>
              <button onClick={closeNovo} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: 'calc(92vh - 160px)' }}>
              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  placeholder="Título do processo..."
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#1A2B3C] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40 focus:bg-white transition-all"
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prioridade</label>
                <select
                  value={novoPriority}
                  onChange={e => setNovoPriority(e.target.value as Priority)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40 appearance-none"
                >
                  <option value="Alta">🔴 Alta</option>
                  <option value="Média">🟡 Média</option>
                  <option value="Baixa">🟢 Baixa</option>
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Responsável</label>
                <select
                  value={novoResponsavelId}
                  onChange={e => setNovoResponsavelId(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40 appearance-none"
                >
                  <option value="">Não atribuído</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              {/* Data limite */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Data Limite</label>
                <input
                  type="date"
                  value={novoDueDate}
                  onChange={e => setNovoDueDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40 transition-all"
                />
              </div>

              {/* Processo vinculado */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Processo Vinculado</label>
                <select
                  value={novoProcessoId ?? ''}
                  onChange={e => setNovoProcessoId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/15 focus:border-[#1A2B3C]/40 appearance-none"
                >
                  <option value="">Sem processo vinculado</option>
                  {processos.map(p => (
                    <option key={p.id} value={p.id}>{p.numero_cnj}</option>
                  ))}
                </select>
              </div>
              <div className="h-2" />
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-white">
              <button
                onClick={closeNovo}
                disabled={salvando}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovo}
                disabled={salvando || salvo || !novoTitulo.trim()}
                className={`flex-1 h-12 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${salvo ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}`}
              >
                {salvo ? (
                  <><CheckCircle2 className="w-4 h-4" /> Criado!</>
                ) : salvando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</>
                ) : (
                  <><Plus className="w-4 h-4" /> Criar Caso</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="min-h-screen bg-slate-50 px-4 py-6">
        {/* Cabeçalho */}
        <div className="mb-4">
          <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">Gestão de Casos</h2>
          <p className="text-slate-500 text-sm">{totalCards} casos · Fluxo de Trabalho</p>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-slate-600 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex-1 disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Baixando...' : 'Exportar CSV'}
          </button>
          {podeEditar && (
            <button
              onClick={openNovo}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1A2B3C] text-white text-sm rounded-lg hover:bg-[#243447] transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo
            </button>
          )}
        </div>

        {/* Tabs das colunas */}
        <div className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
            {columns.map(col => (
              <button
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                  activeTab === col.id
                    ? `${col.headerBg} text-[#1A2B3C] shadow-sm border border-slate-200`
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${col.dotColor} flex-shrink-0`} />
                <span>{col.title}</span>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center">
                  {col.cards.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards da coluna ativa */}
        <div className="space-y-3">
          {activeColumn?.cards.map(card => {
            const isFinished = activeTab === 'finalizado'

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 active:scale-[0.99] transition-all"
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[card.priority]}`}
                  >
                    {card.priority}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>

                {/* Title */}
                <h4
                  className={`text-sm font-medium leading-snug mb-2.5 line-clamp-2 ${isFinished ? 'text-slate-400 line-through' : 'text-[#1A2B3C]'}`}
                >
                  {card.title}
                </h4>

                {/* Tags */}
                {card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {card.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 bg-[#1A2B3C]/8 text-[#1A2B3C]/70 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-400">
                    {card.attachments > 0 && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <Paperclip className="w-3 h-3" />
                        <span>{card.attachments}</span>
                      </div>
                    )}
                    {card.comments > 0 && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <MessageSquare className="w-3 h-3" />
                        <span>{card.comments}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{card.dueDate}</span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full ${card.assigneeColor} flex items-center justify-center flex-shrink-0 ring-2 ring-white`}
                    >
                      <span className="text-white text-[9px] font-bold">{card.assignee}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
