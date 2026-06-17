import { useState, useEffect, useRef } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  Paperclip,
  MessageSquare,
  Calendar,
  Plus,
  MoreHorizontal,
  X,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle,
  User,
  Scale,
  Briefcase,
  ChevronRight,
  AlertCircle,
  Edit3,
  ArrowRight,
  Hash,
  MapPin,
  Download,
  History
} from 'lucide-react'
import { exportarCsvProcessos, buscarProcessosRaw } from '@/services/processos.service'
import type { ProcessoAPI } from '@/services/processos.service'
import { buscarTarefas, criarTarefa, atualizarTarefa } from '@/services/tarefas.service'
import type { TarefaAPI } from '@/services/tarefas.service'
import { useAuth } from '@/context/AuthContext'
import { canEditProcessos, canExportDados } from '@/lib/rbac'

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
  processoId?: number | null
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

// ─── Drag-and-Drop types ─────────────────────────────────────────────────────

const CARD_TYPE = 'KANBAN_CARD'

interface DragItem {
  cardId: string
  fromColId: string
}

// ─── Constant maps ───────────────────────────────────────────────────────────

const priorityStyles: Record<Priority, string> = {
  Alta: 'bg-red-100 text-red-700 border border-red-200',
  Média: 'bg-amber-100 text-amber-700 border border-amber-200',
  Baixa: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
}

const avatarColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500'
]

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
    cards: []
  },
  {
    id: 'em-execucao',
    title: 'Em Execução',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    cards: []
  },
  {
    id: 'revisao',
    title: 'Revisão',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    cards: []
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    cards: []
  }
]

// ─── Process Detail Panel ────────────────────────────────────────────────────

function ProcessDetailPanel({
  card,
  columnTitle,
  processos,
  onClose,
  podeEditar,
  podeExportar,
  onEditProcesso,
  onVincularProcesso
}: {
  card: KanbanCard
  columnTitle: string
  processos: ProcessoAPI[]
  onClose: () => void
  podeEditar: boolean
  podeExportar: boolean
  onEditProcesso?: (processoId: string) => void
  onVincularProcesso?: (cardId: string, processoId: number) => Promise<void>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [comment, setComment] = useState('')
  const [visible, setVisible] = useState(false)
  const [vincularId, setVincularId] = useState<number | null>(null)
  const [isVinculando, setIsVinculando] = useState(false)

  /* Animate in */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  /* Esc key closes */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const historyBg: Record<HistoryEvent['type'], string> = {
    criado: 'bg-blue-100',
    atualizado: 'bg-amber-100',
    documento: 'bg-green-100',
    audiencia: 'bg-purple-100',
    decisao: 'bg-[#C5A059]/20'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-[460px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* ── Header ──────────────────────────── */}
        <div className="bg-[#1A2B3C] px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[card.priority]}`}
              >
                {card.priority}
              </span>
              <span className="text-[11px] text-white/60 font-mono">{card.processNumber}</span>
            </div>
            <h2 className="text-white text-[15px] font-semibold leading-snug">{card.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ── Status bar ──────────────────────── */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>
              {card.court} · {card.vara}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Vence: {card.dueDate}</span>
          </div>
          {card.hearingDate && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 text-xs text-purple-600">
                <Scale className="w-3.5 h-3.5" />
                <span>Audiência: {card.hearingDate}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Scrollable body ─────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {/* Responsável */}
            <section>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Responsável
              </h3>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div
                  className={`w-10 h-10 rounded-full ${card.assigneeColor} flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow`}
                >
                  <span className="text-white text-xs font-bold">{card.assignee}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2B3C]">{card.assigneeFullName}</p>
                  <p className="text-xs text-slate-500">{card.assigneeRole}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <a
                    href={`tel:${card.phone}`}
                    className="flex items-center gap-1 text-[11px] text-[#C5A059] hover:text-[#b8903f] font-medium transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {card.phone}
                  </a>
                  <a
                    href={`mailto:${card.email}`}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#1A2B3C] transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[140px]">{card.email}</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Descrição */}
            <section>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Descrição
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                {card.description}
              </p>
            </section>

            {/* Tags */}
            {card.tags.length > 0 && (
              <section>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Área Jurídica
                </h3>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 bg-[#1A2B3C]/8 text-[#1A2B3C] rounded-full border border-[#1A2B3C]/10"
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
                  <p className="text-xs font-semibold text-[#1A2B3C]">
                    {card.attachments} anexo(s)
                  </p>
                  <p className="text-[10px] text-slate-400">Documentos</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-[#1A2B3C]">
                    {card.comments} comentário(s)
                  </p>
                  <p className="text-[10px] text-slate-400">Interações</p>
                </div>
              </div>
            </section>

            {/* Histórico */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Histórico de Atividades
                </h3>
              </div>
              <div className="relative pl-5">
                {/* Line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />

                <div className="space-y-4">
                  {card.history.map(event => (
                    <div key={event.id} className="relative flex gap-3">
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

            {/* Add comment */}
            {podeEditar && (
              <section>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Adicionar Comentário
                  <span className="ml-2 text-[10px] font-normal text-slate-300 normal-case tracking-normal">
                    (em breve)
                  </span>
                </h3>
                <div className="flex gap-2 opacity-50 cursor-not-allowed">
                  <div className="w-7 h-7 rounded-full bg-[#1A2B3C] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">CS</span>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Funcionalidade em desenvolvimento..."
                      rows={2}
                      disabled
                      className="w-full text-sm text-slate-700 placeholder-slate-400 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 resize-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Footer actions ──────────────────── */}
        {(podeEditar || podeExportar) && (
          <div className="border-t border-slate-200 px-6 py-4 flex items-center gap-3 flex-shrink-0 bg-white">
            {podeEditar &&
              (card.processNumber !== 'N/A' && onEditProcesso ? (
                <button
                  onClick={() => {
                    handleClose()
                    onEditProcesso(card.processNumber)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1A2B3C] text-white text-sm font-medium rounded-xl hover:bg-[#243447] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Processo
                </button>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <select
                    value={vincularId ?? ''}
                    onChange={e => setVincularId(e.target.value ? Number(e.target.value) : null)}
                    className="flex-1 text-[12px] text-slate-600 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 bg-white"
                  >
                    <option value="">Vincular processo...</option>
                    {processos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.numero_cnj}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!vincularId || !onVincularProcesso) return
                      setIsVinculando(true)
                      try {
                        await onVincularProcesso(card.id, vincularId)
                      } finally {
                        setIsVinculando(false)
                      }
                    }}
                    disabled={!vincularId || isVinculando}
                    className="px-4 py-2.5 bg-[#1A2B3C] text-white text-sm font-medium rounded-xl hover:bg-[#243447] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isVinculando ? '...' : 'Vincular'}
                  </button>
                </div>
              ))}
            {podeExportar && (
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Add Card Form ────────────────────────────────────────────────────────────

function AddCardForm({
  processos,
  onSave,
  onCancel,
  isSaving = false
}: {
  processos: ProcessoAPI[]
  onSave: (card: Partial<KanbanCard>) => void
  onCancel: () => void
  isSaving?: boolean
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('Média')
  const [dueDate, setDueDate] = useState('')
  const [assigneeInitials, setAssigneeInitials] = useState('')
  const [processoId, setProcessoId] = useState<number | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (isSaving || !title.trim()) {
      titleRef.current?.focus()
      return
    }
    const initials = (assigneeInitials.trim().toUpperCase() || '??').slice(0, 2)
    const colorIdx = initials.charCodeAt(0) % avatarColors.length
    onSave({
      title: title.trim(),
      priority,
      dueDate: dueDate
        ? new Date(dueDate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '—',
      assignee: initials,
      assigneeColor: avatarColors[colorIdx],
      assigneeFullName: assigneeInitials.trim() || 'Não atribuído',
      assigneeRole: 'Advogado(a)',
      phone: '(61) 9XXXX-XXXX',
      email: 'advogado@lexflow.com.br',
      tags: [],
      attachments: 0,
      comments: 0,
      processoId,
      processNumber: 'N/A',
      court: 'A definir',
      vara: 'A definir',
      description: 'Descrição do processo a ser preenchida.',
      history: [
        {
          id: 'h1',
          type: 'criado',
          descricao: 'Processo cadastrado manualmente',
          data: new Date().toLocaleDateString('pt-BR'),
          autor: 'Dr. Carlos Silva'
        }
      ]
    })
  }

  return (
    <div
      className="bg-white rounded-xl p-3.5 shadow-md border-2 border-[#1A2B3C]/20"
      style={{ animation: 'slideDownFade 0.15s ease' }}
    >
      <input
        ref={titleRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Título do processo..."
        className="w-full text-[13px] text-[#1A2B3C] placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 mb-2.5"
      />

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className="text-[12px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 bg-white"
        >
          <option value="Alta">🔴 Alta</option>
          <option value="Média">🟡 Média</option>
          <option value="Baixa">🟢 Baixa</option>
        </select>
        <input
          type="text"
          value={assigneeInitials}
          onChange={e => setAssigneeInitials(e.target.value)}
          placeholder="Responsável (siglas)"
          maxLength={2}
          className="text-[12px] text-slate-600 placeholder-slate-400 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20"
        />
      </div>

      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className="w-full text-[12px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 mb-2.5"
      />

      <select
        value={processoId ?? ''}
        onChange={e => setProcessoId(e.target.value ? Number(e.target.value) : null)}
        className="w-full text-[12px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 bg-white mb-3"
      >
        <option value="">Sem processo vinculado</option>
        {processos.map(p => (
          <option key={p.id} value={p.id}>
            {p.numero_cnj}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-1.5 bg-[#1A2B3C] text-white text-[12px] font-medium rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Salvando...' : 'Adicionar'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 border border-slate-200 text-slate-500 text-[12px] rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
      </div>

      <style>{`
        @keyframes slideDownFade {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCardComponent({
  card,
  isFinished,
  fromColId,
  onClick
}: {
  card: KanbanCard
  isFinished: boolean
  fromColId: string
  onClick: () => void
}) {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: CARD_TYPE,
    item: { cardId: card.id, fromColId },
    collect: monitor => ({ isDragging: monitor.isDragging() })
  })

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.4 : 1, animation: 'slideDownFade 0.2s ease' }}
      className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing group"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[card.priority]}`}
        >
          {card.priority}
        </span>
        <button
          onClick={e => {
            e.stopPropagation()
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h4
        className={`text-[13px] font-medium leading-snug mb-3 line-clamp-2 ${isFinished ? 'text-slate-400 line-through' : 'text-[#1A2B3C]'}`}
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
            <div className="flex items-center gap-1 text-[11px]">
              <Paperclip className="w-3 h-3" />
              <span>{card.attachments}</span>
            </div>
          )}
          {card.comments > 0 && (
            <div className="flex items-center gap-1 text-[11px]">
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
            <span className="text-white text-[9px] font-bold tracking-tight">{card.assignee}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDownFade {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({
  column,
  isAddingHere,
  savingCard,
  processos,
  podeEditar,
  onAddCard,
  onSetAdding,
  onCardClick,
  onMoveCard
}: {
  column: KanbanColumn
  isAddingHere: boolean
  savingCard: boolean
  processos: ProcessoAPI[]
  podeEditar: boolean
  onAddCard: (partial: Partial<KanbanCard>) => void
  onSetAdding: (colId: string | null) => void
  onCardClick: (cardId: string) => void
  onMoveCard: (cardId: string, fromColId: string, toColId: string) => void
}) {
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: CARD_TYPE,
    drop: item => {
      if (item.fromColId !== column.id) {
        onMoveCard(item.cardId, item.fromColId, column.id)
      }
    },
    collect: monitor => ({ isOver: monitor.isOver() })
  })

  return (
    <div
      className="w-72 flex flex-col rounded-2xl bg-[#eef0f3] overflow-hidden flex-shrink-0"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Column header */}
      <div
        className={`px-4 py-3 flex items-center justify-between flex-shrink-0 ${column.headerBg} border-b border-slate-200/60`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor} flex-shrink-0`} />
          <span className="text-[13px] font-semibold text-[#1A2B3C]">{column.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center">
            {column.cards.length}
          </span>
          {podeEditar && (
            <button
              onClick={() => onSetAdding(isAddingHere ? null : column.id)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                isAddingHere
                  ? 'bg-[#1A2B3C] text-white'
                  : 'text-slate-400 hover:text-[#1A2B3C] hover:bg-white'
              }`}
              title="Adicionar caso"
            >
              {isAddingHere ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Cards scroll area — drop target */}
      <div
        ref={drop}
        className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${
          isOver ? 'bg-[#1A2B3C]/5 ring-2 ring-inset ring-[#1A2B3C]/20 rounded-b-2xl' : ''
        }`}
      >
        {podeEditar && isAddingHere && (
          <AddCardForm
            processos={processos}
            onSave={onAddCard}
            onCancel={() => onSetAdding(null)}
            isSaving={savingCard}
          />
        )}

        {column.cards.map(card => (
          <KanbanCardComponent
            key={card.id}
            card={card}
            isFinished={column.id === 'finalizado'}
            fromColId={column.id}
            onClick={() => onCardClick(card.id)}
          />
        ))}

        {podeEditar && !isAddingHere && (
          <button
            onClick={() => onSetAdding(column.id)}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xs flex items-center justify-center gap-1.5 hover:border-[#1A2B3C]/40 hover:text-[#1A2B3C]/60 hover:bg-white/50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar caso
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main KanbanBoard ────────────────────────────────────────────────────────

interface KanbanBoardProps {
  initialExpandedId?: string | null
  onClearExpandedId?: () => void
  onEditProcesso?: (processoId: string) => void
}

export function KanbanBoard({
  initialExpandedId,
  onClearExpandedId,
  onEditProcesso
}: KanbanBoardProps) {
  const { user } = useAuth()
  const podeEditar = canEditProcessos(user)
  const podeExportar = canExportDados(user)
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns)
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [savingCard, setSavingCard] = useState(false)
  const [processos, setProcessos] = useState<ProcessoAPI[]>([])

  /* Open panel when triggered from notification */
  useEffect(() => {
    if (initialExpandedId) setExpandedCardId(initialExpandedId)
  }, [initialExpandedId])

  /* Load Tarefas and Processos from Backend */
  useEffect(() => {
    const loadTarefas = async () => {
      try {
        const [tarefas, processosData] = await Promise.all([buscarTarefas(), buscarProcessosRaw()])
        setProcessos(processosData)
        setColumns(prev =>
          prev.map(col => {
            let filtered: TarefaAPI[] = []
            if (col.id === 'backlog') filtered = tarefas.filter(t => t.status === 'aberta')
            else if (col.id === 'em-execucao')
              filtered = tarefas.filter(t => t.status === 'em_andamento')
            else if (col.id === 'revisao') filtered = tarefas.filter(t => t.status === 'revisao')
            else if (col.id === 'finalizado')
              filtered = tarefas.filter(t => t.status === 'concluida')

            const cards: KanbanCard[] = filtered.map(t => ({
              id: String(t.id),
              title: t.titulo,
              priority: 'Média',
              tags: ['Prazo'],
              attachments: 0,
              comments: 0,
              assignee: 'S',
              assigneeColor: 'bg-[#1A2B3C]',
              assigneeFullName: 'Sistema',
              assigneeRole: 'Automático',
              phone: '',
              email: '',
              dueDate: t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '',
              processNumber: t.processo_id ? String(t.processo_id) : 'N/A',
              court: 'Ver detalhes',
              vara: '',
              description: t.descricao || '',
              history: []
            }))
            return { ...col, cards }
          })
        )
      } catch (err) {
        console.error('Erro ao buscar tarefas', err)
      }
    }
    loadTarefas()
  }, [])

  const totalCards = columns.reduce((acc, col) => acc + col.cards.length, 0)

  const findCard = (id: string): { card: KanbanCard; columnTitle: string } | null => {
    for (const col of columns) {
      const card = col.cards.find(c => c.id === id)
      if (card) return { card, columnTitle: col.title }
    }
    return null
  }

  const colToStatus: Record<string, string> = {
    backlog: 'aberta',
    'em-execucao': 'em_andamento',
    revisao: 'revisao',
    finalizado: 'concluida'
  }

  const handleAddCard = async (colId: string, partial: Partial<KanbanCard>) => {
    setSavingCard(true)
    try {
      const tarefa = await criarTarefa({
        titulo: partial.title || 'Nova tarefa',
        descricao: partial.description || null,
        status: colToStatus[colId] ?? 'aberta',
        processo_id: partial.processoId ?? null
      })

      const newCard: KanbanCard = {
        id: String(tarefa.id),
        title: tarefa.titulo,
        priority: partial.priority ?? 'Média',
        tags: [],
        attachments: 0,
        comments: 0,
        assignee: partial.assignee ?? '??',
        assigneeColor: partial.assigneeColor ?? 'bg-slate-500',
        assigneeFullName: partial.assigneeFullName ?? 'Não atribuído',
        assigneeRole: 'Advogado(a)',
        phone: '',
        email: '',
        dueDate: partial.dueDate ?? '—',
        processNumber: tarefa.processo_id ? String(tarefa.processo_id) : 'N/A',
        court: 'Ver detalhes',
        vara: '',
        description: tarefa.descricao || '',
        history: []
      }

      setColumns(prev =>
        prev.map(col => (col.id === colId ? { ...col, cards: [newCard, ...col.cards] } : col))
      )
      setAddingInColumn(null)
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
      alert('Não foi possível salvar a tarefa. Tente novamente.')
    } finally {
      setSavingCard(false)
    }
  }

  /* Atualização otimista: move o card localmente e sincroniza com a API.
     Em caso de falha, reverte ao estado anterior. */
  const handleMoveCard = async (cardId: string, fromColId: string, toColId: string) => {
    const snapshot = columns

    setColumns(prev => {
      let movedCard: KanbanCard | undefined
      const next = prev.map(col => {
        if (col.id === fromColId) {
          movedCard = col.cards.find(c => c.id === cardId)
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) }
        }
        return col
      })
      if (!movedCard) return prev
      const card = movedCard
      return next.map(col => (col.id === toColId ? { ...col, cards: [card, ...col.cards] } : col))
    })

    try {
      await atualizarTarefa(Number(cardId), { status: colToStatus[toColId] })
    } catch (err) {
      console.error('Erro ao mover tarefa:', err)
      setColumns(snapshot)
      alert('Não foi possível mover a tarefa. Tente novamente.')
    }
  }

  const handleClosePanel = () => {
    setExpandedCardId(null)
    onClearExpandedId?.()
  }

  const handleVincularProcesso = async (cardId: string, processoId: number) => {
    await atualizarTarefa(Number(cardId), { processo_id: processoId })
    setColumns(prev =>
      prev.map(col => ({
        ...col,
        cards: col.cards.map(c =>
          c.id === cardId ? { ...c, processoId, processNumber: String(processoId) } : c
        )
      }))
    )
  }

  const expandedData = expandedCardId ? findCard(expandedCardId) : null

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full bg-[#f4f5f7] overflow-hidden">
        {/* ── Page header ───────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-[#1A2B3C] text-xl font-semibold">Gestão de Casos</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {totalCards} casos no total · Fluxo de Trabalho do Escritório
            </p>
          </div>
          <div className="flex items-center gap-2">
            {podeExportar && (
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#D4AF37] text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium disabled:opacity-60"
              >
                <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Baixando...' : 'Exportar CSV'}
              </button>
            )}

            {podeEditar && (
              <button
                onClick={() => setAddingInColumn('backlog')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1A2B3C] text-white text-sm rounded-lg hover:bg-[#243447] transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Novo Caso
              </button>
            )}
          </div>
        </div>

        {/* ── Kanban board ──────────────────────────────── */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-5 h-full px-8 py-6 min-w-max">
            {columns.map(column => (
              <DroppableColumn
                key={column.id}
                column={column}
                isAddingHere={addingInColumn === column.id}
                savingCard={savingCard}
                processos={processos}
                podeEditar={podeEditar}
                onAddCard={partial => handleAddCard(column.id, partial)}
                onSetAdding={setAddingInColumn}
                onCardClick={setExpandedCardId}
                onMoveCard={handleMoveCard}
              />
            ))}
          </div>
        </div>

        {/* ── Process Detail Panel ──────────────────────── */}
        {expandedCardId && expandedData && (
          <ProcessDetailPanel
            card={expandedData.card}
            columnTitle={expandedData.columnTitle}
            processos={processos}
            onClose={handleClosePanel}
            podeEditar={podeEditar}
            podeExportar={podeExportar}
            onEditProcesso={onEditProcesso}
            onVincularProcesso={handleVincularProcesso}
          />
        )}
      </div>
    </DndProvider>
  )
}
