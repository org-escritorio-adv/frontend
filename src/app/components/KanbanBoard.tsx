import { useState, useEffect, useRef } from "react";
import {
  Paperclip, MessageSquare, Calendar, Plus, MoreHorizontal,
  Filter, SlidersHorizontal, X, Phone, Mail, FileText,
  Clock, CheckCircle, User, Scale, Briefcase, ChevronRight,
  AlertCircle, Edit3, ArrowRight, Hash, MapPin, Download,
  Send, History,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Priority = "Alta" | "Média" | "Baixa";

interface HistoryEvent {
  id: string;
  type: "criado" | "atualizado" | "documento" | "audiencia" | "decisao";
  descricao: string;
  data: string;
  autor: string;
}

interface KanbanCard {
  id: string;
  title: string;
  priority: Priority;
  tags: string[];
  attachments: number;
  comments: number;
  assignee: string;
  assigneeColor: string;
  assigneeFullName: string;
  assigneeRole: string;
  phone: string;
  email: string;
  dueDate: string;
  processNumber: string;
  court: string;
  vara: string;
  description: string;
  hearingDate?: string;
  history: HistoryEvent[];
}

interface KanbanColumn {
  id: string;
  title: string;
  dotColor: string;
  headerBg: string;
  cards: KanbanCard[];
}

// ─── Constant maps ───────────────────────────────────────────────────────────

const priorityStyles: Record<Priority, string> = {
  Alta:  "bg-red-100 text-red-700 border border-red-200",
  Média: "bg-amber-100 text-amber-700 border border-amber-200",
  Baixa: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const avatarColors = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500",
  "bg-orange-500", "bg-pink-500", "bg-cyan-500",
];

const historyIcon = (type: HistoryEvent["type"]) => {
  switch (type) {
    case "criado":     return <Plus className="w-3.5 h-3.5 text-blue-500" />;
    case "atualizado": return <Edit3 className="w-3.5 h-3.5 text-amber-500" />;
    case "documento":  return <FileText className="w-3.5 h-3.5 text-green-500" />;
    case "audiencia":  return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
    case "decisao":    return <Scale className="w-3.5 h-3.5 text-[#C5A059]" />;
  }
};

// ─── Initial data ────────────────────────────────────────────────────────────

const initialColumns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    dotColor: "bg-slate-400",
    headerBg: "bg-slate-100",
    cards: [
      {
        id: "b1",
        title: "Elaboração de Contrato Social – Fusão Alpha Corp.",
        priority: "Alta",
        tags: ["Contratos"],
        attachments: 3,
        comments: 2,
        assignee: "CS",
        assigneeColor: "bg-blue-500",
        assigneeFullName: "Dr. Carlos Silva",
        assigneeRole: "Sócio Fundador",
        phone: "(61) 98765-4321",
        email: "carlos.silva@lexflow.com.br",
        dueDate: "15/05/2026",
        processNumber: "0001234-56.2024.8.07.0001",
        court: "TJDFT",
        vara: "1ª Vara Empresarial de Brasília",
        description: "Análise e revisão de cláusulas contratuais referentes à fusão societária entre a Empresa Alpha Corp. e a Empresa Beta Ltda. Inclui due diligence completa e elaboração de parecer jurídico.",
        hearingDate: "28/05/2026",
        history: [
          { id: "h1", type: "criado", descricao: "Processo cadastrado no sistema", data: "10/04/2026", autor: "Dr. Carlos Silva" },
          { id: "h2", type: "documento", descricao: "Documentos contratuais recebidos do cliente", data: "15/04/2026", autor: "Dr. Carlos Silva" },
          { id: "h3", type: "atualizado", descricao: "Prioridade alterada para Alta", data: "22/04/2026", autor: "Sistema" },
        ],
      },
      {
        id: "b2",
        title: "Consultoria Trabalhista – Rescisão Contrato João Santos",
        priority: "Média",
        tags: ["Trabalhista"],
        attachments: 1,
        comments: 5,
        assignee: "AC",
        assigneeColor: "bg-purple-500",
        assigneeFullName: "Dra. Ana Costa",
        assigneeRole: "Advogada Trabalhista",
        phone: "(61) 99123-5678",
        email: "ana.costa@lexflow.com.br",
        dueDate: "20/05/2026",
        processNumber: "0007890-12.2024.5.10.0001",
        court: "TRT 10ª Região",
        vara: "2ª Vara do Trabalho de Brasília",
        description: "Ação trabalhista movida pelo reclamante João Santos por verbas rescisórias não pagas. O reclamante alega justa causa indevida e solicita indenização por danos morais.",
        history: [
          { id: "h1", type: "criado", descricao: "Processo cadastrado", data: "12/04/2026", autor: "Dra. Ana Costa" },
          { id: "h2", type: "documento", descricao: "Contestação protocolada", data: "18/04/2026", autor: "Dra. Ana Costa" },
        ],
      },
      {
        id: "b3",
        title: "Due Diligence Imobiliária – Ativo Comercial Brasília",
        priority: "Baixa",
        tags: ["Imobiliário"],
        attachments: 6,
        comments: 1,
        assignee: "RA",
        assigneeColor: "bg-emerald-500",
        assigneeFullName: "Dr. Roberto Alves",
        assigneeRole: "Advogado Empresarial",
        phone: "(61) 98234-9012",
        email: "roberto.alves@lexflow.com.br",
        dueDate: "01/06/2026",
        processNumber: "0005678-90.2024.8.07.0003",
        court: "TJDFT",
        vara: "3ª Vara Cível de Brasília",
        description: "Due diligence completa do ativo imobiliário localizado na Av. Paulista, São Paulo. Análise de escrituras, matrículas, certidões de ônus e conformidade fiscal.",
        history: [
          { id: "h1", type: "criado", descricao: "Processo cadastrado", data: "05/04/2026", autor: "Dr. Roberto Alves" },
        ],
      },
      {
        id: "b4",
        title: "Recurso Administrativo – Licitação 0045/2024",
        priority: "Alta",
        tags: ["Recurso"],
        attachments: 2,
        comments: 4,
        assignee: "ML",
        assigneeColor: "bg-orange-500",
        assigneeFullName: "Dra. Marina Lima",
        assigneeRole: "Advogada Sênior",
        phone: "(61) 97654-3210",
        email: "marina.lima@lexflow.com.br",
        dueDate: "10/05/2026",
        processNumber: "0009012-34.2024.8.07.0002",
        court: "TJDFT",
        vara: "2ª Turma Cível do TJDFT",
        description: "Recurso de apelação em face de sentença desfavorável de primeira instância. Foco em reforma da decisão quanto aos danos materiais e morais pleiteados.",
        hearingDate: "10/05/2026",
        history: [
          { id: "h1", type: "criado", descricao: "Recurso interposto", data: "01/04/2026", autor: "Dra. Marina Lima" },
          { id: "h2", type: "documento", descricao: "Razões de recurso protocoladas", data: "08/04/2026", autor: "Dra. Marina Lima" },
          { id: "h3", type: "audiencia", descricao: "Sessão de julgamento agendada", data: "20/04/2026", autor: "Sistema" },
        ],
      },
      {
        id: "b5",
        title: "Renovação de Contrato de Prestação de Serviços",
        priority: "Média",
        tags: ["Contratos"],
        attachments: 0,
        comments: 3,
        assignee: "CS",
        assigneeColor: "bg-blue-500",
        assigneeFullName: "Dr. Carlos Silva",
        assigneeRole: "Sócio Fundador",
        phone: "(61) 98765-4321",
        email: "carlos.silva@lexflow.com.br",
        dueDate: "25/05/2026",
        processNumber: "0003456-78.2024.8.07.0004",
        court: "TJDFT",
        vara: "4ª Vara Cível de Brasília",
        description: "Revisão e renovação do contrato de prestação de serviços jurídicos com cliente recorrente. Atualização de honorários e cláusulas de confidencialidade.",
        history: [
          { id: "h1", type: "criado", descricao: "Processo cadastrado", data: "14/04/2026", autor: "Dr. Carlos Silva" },
        ],
      },
    ],
  },
  {
    id: "em-execucao",
    title: "Em Execução",
    dotColor: "bg-blue-500",
    headerBg: "bg-blue-50",
    cards: [
      {
        id: "e1",
        title: "Ação Trabalhista – Cliente João Santos",
        priority: "Alta",
        tags: ["Trabalhista"],
        attachments: 4,
        comments: 7,
        assignee: "RA",
        assigneeColor: "bg-emerald-500",
        assigneeFullName: "Dr. Roberto Alves",
        assigneeRole: "Advogado Trabalhista Sênior",
        phone: "(61) 98234-9012",
        email: "roberto.alves@lexflow.com.br",
        dueDate: "08/05/2026",
        processNumber: "0098-45.2024.5.10.0001",
        court: "TRT 10ª Região",
        vara: "3ª Vara do Trabalho de Brasília",
        description: "Defesa do reclamado em ação trabalhista por rescisão indireta. O reclamante alega falta de pagamento de salários por 3 meses consecutivos e solicita indenização por danos morais e materiais.",
        hearingDate: "22/05/2026",
        history: [
          { id: "h1", type: "criado", descricao: "Processo cadastrado no sistema", data: "02/04/2026", autor: "Dr. Roberto Alves" },
          { id: "h2", type: "documento", descricao: "Documentos de defesa protocolados", data: "15/04/2026", autor: "Dr. Roberto Alves" },
          { id: "h3", type: "audiencia", descricao: "Audiência de instrução agendada para 22/05", data: "25/04/2026", autor: "Sistema" },
          { id: "h4", type: "atualizado", descricao: "Status movido para Em Execução", data: "01/05/2026", autor: "Dr. Roberto Alves" },
        ],
      },
      {
        id: "e2",
        title: "Negociação de Acordo Extrajudicial – Empresa Beta S.A.",
        priority: "Média",
        tags: ["Acordos"],
        attachments: 2,
        comments: 3,
        assignee: "CS",
        assigneeColor: "bg-blue-500",
        assigneeFullName: "Dr. Carlos Silva",
        assigneeRole: "Sócio Fundador",
        phone: "(61) 98765-4321",
        email: "carlos.silva@lexflow.com.br",
        dueDate: "12/05/2026",
        processNumber: "0045678-23.2024.8.07.0005",
        court: "TJDFT",
        vara: "5ª Vara Cível de Brasília",
        description: "Condução de negociação extrajudicial para resolução de conflito societário entre partes. Elaboração de minuta de acordo e acompanhamento das tratativas.",
        hearingDate: "22/05/2026",
        history: [
          { id: "h1", type: "criado", descricao: "Caso aberto para negociação", data: "08/04/2026", autor: "Dr. Carlos Silva" },
          { id: "h2", type: "atualizado", descricao: "Proposta de acordo enviada à contraparte", data: "20/04/2026", autor: "Dr. Carlos Silva" },
          { id: "h3", type: "documento", descricao: "Contraproposta recebida e analisada", data: "28/04/2026", autor: "Dr. Carlos Silva" },
        ],
      },
      {
        id: "e3",
        title: "Consultoria LGPD – Empresa Digital Tech Ltda.",
        priority: "Alta",
        tags: ["Petição"],
        attachments: 1,
        comments: 2,
        assignee: "AC",
        assigneeColor: "bg-purple-500",
        assigneeFullName: "Dra. Ana Costa",
        assigneeRole: "Advogada Trabalhista",
        phone: "(61) 99123-5678",
        email: "ana.costa@lexflow.com.br",
        dueDate: "07/05/2026",
        processNumber: "0012345-67.2024.5.10.0006",
        court: "TRT 10ª Região",
        vara: "1ª Vara do Trabalho de Brasília",
        description: "Redação e protocolo de petição inicial em ação de cobrança de verbas trabalhistas. Cliente reclama pagamento de horas extras e 13º salário do período 2022–2024.",
        history: [
          { id: "h1", type: "criado", descricao: "Mandato assinado pelo cliente", data: "10/04/2026", autor: "Dra. Ana Costa" },
          { id: "h2", type: "documento", descricao: "Documentos trabalhistas coletados", data: "18/04/2026", autor: "Dra. Ana Costa" },
        ],
      },
    ],
  },
  {
    id: "revisao",
    title: "Revisão",
    dotColor: "bg-amber-500",
    headerBg: "bg-amber-50",
    cards: [
      {
        id: "r1",
        title: "Revisão de Estatuto Social – Reestruturação Societária",
        priority: "Média",
        tags: ["Contratos"],
        attachments: 5,
        comments: 8,
        assignee: "ML",
        assigneeColor: "bg-orange-500",
        assigneeFullName: "Dra. Marina Lima",
        assigneeRole: "Advogada Sênior",
        phone: "(61) 97654-3210",
        email: "marina.lima@lexflow.com.br",
        dueDate: "06/05/2026",
        processNumber: "0034567-89.2024.8.07.0007",
        court: "TJDFT",
        vara: "6ª Vara Empresarial de Brasília",
        description: "Revisão completa de contrato social de empresa em fase de reestruturação. Análise de participação acionária, cláusulas de saída e direitos preferenciais.",
        history: [
          { id: "h1", type: "criado", descricao: "Processo iniciado", data: "01/04/2026", autor: "Dra. Marina Lima" },
          { id: "h2", type: "documento", descricao: "Contrato social versão preliminar entregue", data: "12/04/2026", autor: "Dra. Marina Lima" },
          { id: "h3", type: "atualizado", descricao: "Revisão interna concluída, aguardando aprovação", data: "25/04/2026", autor: "Dra. Marina Lima" },
        ],
      },
      {
        id: "r2",
        title: "Parecer Tributário – Enquadramento Fiscal Tech Ltda.",
        priority: "Baixa",
        tags: ["Tributário"],
        attachments: 2,
        comments: 1,
        assignee: "CS",
        assigneeColor: "bg-blue-500",
        assigneeFullName: "Dr. Carlos Silva",
        assigneeRole: "Sócio Fundador",
        phone: "(61) 98765-4321",
        email: "carlos.silva@lexflow.com.br",
        dueDate: "09/05/2026",
        processNumber: "0056789-01.2024.8.07.0008",
        court: "TJDFT",
        vara: "Vara Tributária de Brasília",
        description: "Elaboração de parecer jurídico sobre enquadramento tributário de empresa do setor de tecnologia. Análise de benefícios fiscais e riscos de autuação.",
        history: [
          { id: "h1", type: "criado", descricao: "Solicitação de parecer recebida", data: "15/04/2026", autor: "Dr. Carlos Silva" },
          { id: "h2", type: "documento", descricao: "Documentos fiscais analisados", data: "22/04/2026", autor: "Dr. Carlos Silva" },
        ],
      },
    ],
  },
  {
    id: "finalizado",
    title: "Finalizado",
    dotColor: "bg-emerald-500",
    headerBg: "bg-emerald-50",
    cards: [
      {
        id: "f1",
        title: "Homologação de Acordo Trabalhista – Caso 0076/2023",
        priority: "Alta",
        tags: ["Trabalhista"],
        attachments: 3,
        comments: 5,
        assignee: "AC",
        assigneeColor: "bg-purple-500",
        assigneeFullName: "Dra. Ana Costa",
        assigneeRole: "Advogada Trabalhista",
        phone: "(61) 99123-5678",
        email: "ana.costa@lexflow.com.br",
        dueDate: "02/05/2026",
        processNumber: "0076-34.2023.5.10.0009",
        court: "TRT 10ª Região",
        vara: "2ª Vara do Trabalho de Brasília",
        description: "Acordo trabalhista homologado com sucesso. Processo encerrado com pagamento de todas as verbas rescisórias e indenizações acordadas.",
        history: [
          { id: "h1", type: "criado", descricao: "Processo cadastrado", data: "10/01/2026", autor: "Dra. Ana Costa" },
          { id: "h2", type: "audiencia", descricao: "Audiência de conciliação realizada", data: "15/03/2026", autor: "Dra. Ana Costa" },
          { id: "h3", type: "decisao", descricao: "Acordo homologado pelo juiz", data: "28/04/2026", autor: "Sistema" },
          { id: "h4", type: "atualizado", descricao: "Processo concluído e arquivado", data: "02/05/2026", autor: "Dra. Ana Costa" },
        ],
      },
      {
        id: "f2",
        title: "Registro de marca comercial – Grupo Alfa",
        priority: "Baixa",
        tags: ["Propriedade Intelectual"],
        attachments: 1,
        comments: 2,
        assignee: "RA",
        assigneeColor: "bg-emerald-500",
        assigneeFullName: "Dr. Roberto Alves",
        assigneeRole: "Advogado Empresarial",
        phone: "(61) 98234-9012",
        email: "roberto.alves@lexflow.com.br",
        dueDate: "01/05/2026",
        processNumber: "0089012-45.2023.8.07.0010",
        court: "TJDFT",
        vara: "Vara de Propriedade Intelectual",
        description: "Registro de marca comercial concluído junto ao INPI. Certificado de registro emitido e entregue ao cliente.",
        history: [
          { id: "h1", type: "criado", descricao: "Pedido de registro protocolado no INPI", data: "05/01/2026", autor: "Dr. Roberto Alves" },
          { id: "h2", type: "decisao", descricao: "Marca deferida pelo INPI", data: "20/04/2026", autor: "Sistema" },
          { id: "h3", type: "atualizado", descricao: "Certificado entregue ao cliente", data: "01/05/2026", autor: "Dr. Roberto Alves" },
        ],
      },
      {
        id: "f3",
        title: "Assessoria Jurídica em Licitação Pública – Pregão 05/2024",
        priority: "Média",
        tags: ["Licitação"],
        attachments: 4,
        comments: 6,
        assignee: "CS",
        assigneeColor: "bg-blue-500",
        assigneeFullName: "Dr. Carlos Silva",
        assigneeRole: "Sócio Fundador",
        phone: "(61) 98765-4321",
        email: "carlos.silva@lexflow.com.br",
        dueDate: "28/04/2026",
        processNumber: "0011234-56.2024.8.07.0011",
        court: "TJDFT",
        vara: "Vara de Direito Público de Brasília",
        description: "Assessoria jurídica completa no processo licitatório – Pregão Eletrônico nº 05/2024. Elaboração de impugnação e recursos administrativos.",
        history: [
          { id: "h1", type: "criado", descricao: "Mandato de assessoria assinado", data: "15/01/2026", autor: "Dr. Carlos Silva" },
          { id: "h2", type: "documento", descricao: "Impugnação ao edital protocolada", data: "10/03/2026", autor: "Dr. Carlos Silva" },
          { id: "h3", type: "decisao", descricao: "Recurso administrativo julgado procedente", data: "15/04/2026", autor: "Sistema" },
          { id: "h4", type: "atualizado", descricao: "Processo encerrado com êxito", data: "28/04/2026", autor: "Dr. Carlos Silva" },
        ],
      },
      {
        id: "f4",
        title: "Distrato contratual – Cliente XYZ Ltda.",
        priority: "Alta",
        tags: ["Contratos"],
        attachments: 2,
        comments: 3,
        assignee: "ML",
        assigneeColor: "bg-orange-500",
        assigneeFullName: "Dra. Marina Lima",
        assigneeRole: "Advogada Sênior",
        phone: "(61) 97654-3210",
        email: "marina.lima@lexflow.com.br",
        dueDate: "25/04/2026",
        processNumber: "0023456-78.2024.8.07.0012",
        court: "TJDFT",
        vara: "7ª Vara Cível de Brasília",
        description: "Elaboração e assinatura de distrato contratual entre as partes. Todas as obrigações rescisórias foram cumpridas sem litígio judicial.",
        history: [
          { id: "h1", type: "criado", descricao: "Solicitação de distrato recebida", data: "01/03/2026", autor: "Dra. Marina Lima" },
          { id: "h2", type: "documento", descricao: "Minuta de distrato elaborada", data: "15/03/2026", autor: "Dra. Marina Lima" },
          { id: "h3", type: "atualizado", descricao: "Distrato assinado por ambas as partes", data: "25/04/2026", autor: "Sistema" },
        ],
      },
    ],
  },
];

// ─── Process Detail Panel ────────────────────────────────────────────────────

function ProcessDetailPanel({
  card,
  columnTitle,
  onClose,
}: {
  card: KanbanCard;
  columnTitle: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [comment, setComment] = useState("");
  const [visible, setVisible] = useState(false);

  /* Animate in */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  /* Esc key closes */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const statusLabel: Record<string, string> = {
    backlog: "Backlog",
    "em-execucao": "Em Execução",
    revisao: "Revisão",
    finalizado: "Finalizado",
  };

  const historyBg: Record<HistoryEvent["type"], string> = {
    criado: "bg-blue-100",
    atualizado: "bg-amber-100",
    documento: "bg-green-100",
    audiencia: "bg-purple-100",
    decisao: "bg-[#C5A059]/20",
  };

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
        style={{ transform: visible ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* ── Header ──────────────────────────── */}
        <div className="bg-[#1A2B3C] px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[card.priority]}`}>
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
            <span>{card.court} · {card.vara}</span>
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
                <div className={`w-10 h-10 rounded-full ${card.assigneeColor} flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow`}>
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
                  {card.tags.map((tag) => (
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
                  <p className="text-xs font-semibold text-[#1A2B3C]">{card.attachments} anexo(s)</p>
                  <p className="text-[10px] text-slate-400">Documentos</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-[#1A2B3C]">{card.comments} comentário(s)</p>
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
                  {card.history.map((event) => (
                    <div key={event.id} className="relative flex gap-3">
                      {/* Dot */}
                      <div className={`w-5 h-5 rounded-full ${historyBg[event.type]} flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm`}>
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
            <section>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Adicionar Comentário
              </h3>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1A2B3C] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-bold">CS</span>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    rows={2}
                    className="w-full text-sm text-slate-700 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 focus:border-[#1A2B3C]/30 transition"
                  />
                  {comment && (
                    <button
                      className="absolute right-2 bottom-2 w-6 h-6 bg-[#1A2B3C] rounded-lg flex items-center justify-center hover:bg-[#243447] transition-colors"
                      onClick={() => setComment("")}
                    >
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Footer actions ──────────────────── */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center gap-3 flex-shrink-0 bg-white">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1A2B3C] text-white text-sm font-medium rounded-xl hover:bg-[#243447] transition-colors">
            <Edit3 className="w-4 h-4" />
            Editar Processo
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Add Card Form ────────────────────────────────────────────────────────────

function AddCardForm({
  onSave,
  onCancel,
}: {
  onSave: (card: Partial<KanbanCard>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("Média");
  const [dueDate, setDueDate] = useState("");
  const [assigneeInitials, setAssigneeInitials] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSave = () => {
    if (!title.trim()) { titleRef.current?.focus(); return; }
    const initials = (assigneeInitials.trim().toUpperCase() || "??").slice(0, 2);
    const colorIdx = initials.charCodeAt(0) % avatarColors.length;
    onSave({
      title: title.trim(),
      priority,
      dueDate: dueDate
        ? new Date(dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—",
      assignee: initials,
      assigneeColor: avatarColors[colorIdx],
      assigneeFullName: assigneeInitials.trim() || "Não atribuído",
      assigneeRole: "Advogado(a)",
      phone: "(61) 9XXXX-XXXX",
      email: "advogado@lexflow.com.br",
      tags: [],
      attachments: 0,
      comments: 0,
      processNumber: `${Date.now()}`.slice(-10),
      court: "A definir",
      vara: "A definir",
      description: "Descrição do processo a ser preenchida.",
      history: [
        { id: "h1", type: "criado", descricao: "Processo cadastrado manualmente", data: new Date().toLocaleDateString("pt-BR"), autor: "Dr. Carlos Silva" },
      ],
    });
  };

  return (
    <div className="bg-white rounded-xl p-3.5 shadow-md border-2 border-[#1A2B3C]/20"
      style={{ animation: "slideDownFade 0.15s ease" }}>
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
        placeholder="Título do processo..."
        className="w-full text-[13px] text-[#1A2B3C] placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 mb-2.5"
      />

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="text-[12px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 bg-white"
        >
          <option value="Alta">🔴 Alta</option>
          <option value="Média">🟡 Média</option>
          <option value="Baixa">🟢 Baixa</option>
        </select>
        <input
          type="text"
          value={assigneeInitials}
          onChange={(e) => setAssigneeInitials(e.target.value)}
          placeholder="Responsável (siglas)"
          maxLength={2}
          className="text-[12px] text-slate-600 placeholder-slate-400 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20"
        />
      </div>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full text-[12px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 py-1.5 bg-[#1A2B3C] text-white text-[12px] font-medium rounded-lg hover:bg-[#243447] transition-colors"
        >
          Adicionar
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
  );
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCardComponent({
  card,
  isFinished,
  onClick,
}: {
  card: KanbanCard;
  isFinished: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      style={{ animation: "slideDownFade 0.2s ease" }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[card.priority]}`}>
          {card.priority}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h4 className={`text-[13px] font-medium leading-snug mb-3 line-clamp-2 ${isFinished ? "text-slate-400 line-through" : "text-[#1A2B3C]"}`}>
        {card.title}
      </h4>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#1A2B3C]/8 text-[#1A2B3C]/70 rounded-full">
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
          <div className={`w-6 h-6 rounded-full ${card.assigneeColor} flex items-center justify-center flex-shrink-0 ring-2 ring-white`}>
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
  );
}

// ─── Main KanbanBoard ────────────────────────────────────────────────────────

interface KanbanBoardProps {
  initialExpandedId?: string | null;
  onClearExpandedId?: () => void;
}

export function KanbanBoard({ initialExpandedId, onClearExpandedId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  /* Open panel when triggered from notification */
  useEffect(() => {
    if (initialExpandedId) setExpandedCardId(initialExpandedId);
  }, [initialExpandedId]);

  const totalCards = columns.reduce((acc, col) => acc + col.cards.length, 0);

  const findCard = (id: string): { card: KanbanCard; columnTitle: string } | null => {
    for (const col of columns) {
      const card = col.cards.find((c) => c.id === id);
      if (card) return { card, columnTitle: col.title };
    }
    return null;
  };

  const handleAddCard = (colId: string, partial: Partial<KanbanCard>) => {
    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      title: "Novo processo",
      priority: "Média",
      tags: [],
      attachments: 0,
      comments: 0,
      assignee: "??",
      assigneeColor: "bg-slate-500",
      assigneeFullName: "Não atribuído",
      assigneeRole: "Advogado(a)",
      phone: "(61) 9XXXX-XXXX",
      email: "advogado@lexflow.com.br",
      dueDate: "—",
      processNumber: `${Date.now()}`.slice(-10),
      court: "A definir",
      vara: "A definir",
      description: "Descrição do processo a ser preenchida.",
      history: [
        { id: "h1", type: "criado", descricao: "Processo cadastrado manualmente", data: new Date().toLocaleDateString("pt-BR"), autor: "Dr. Carlos Silva" },
      ],
      ...partial,
    } as KanbanCard;

    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId ? { ...col, cards: [newCard, ...col.cards] } : col
      )
    );
    setAddingInColumn(null);
  };

  const handleClosePanel = () => {
    setExpandedCardId(null);
    onClearExpandedId?.();
  };

  const expandedData = expandedCardId ? findCard(expandedCardId) : null;

  return (
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filtrar
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Ordenar
          </button>
          <button
            onClick={() => setAddingInColumn("backlog")}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1A2B3C] text-white text-sm rounded-lg hover:bg-[#243447] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Caso
          </button>
        </div>
      </div>

      {/* ── Kanban board ──────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-5 h-full px-8 py-6 min-w-max">
          {columns.map((column) => {
            const isAddingHere = addingInColumn === column.id;

            return (
              <div
                key={column.id}
                className="w-72 flex flex-col rounded-2xl bg-[#eef0f3] overflow-hidden flex-shrink-0"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                {/* Column header */}
                <div className={`px-4 py-3 flex items-center justify-between flex-shrink-0 ${column.headerBg} border-b border-slate-200/60`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor} flex-shrink-0`} />
                    <span className="text-[13px] font-semibold text-[#1A2B3C]">{column.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center">
                      {column.cards.length}
                    </span>
                    <button
                      onClick={() => setAddingInColumn(isAddingHere ? null : column.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isAddingHere
                          ? "bg-[#1A2B3C] text-white"
                          : "text-slate-400 hover:text-[#1A2B3C] hover:bg-white"
                      }`}
                      title="Adicionar caso"
                    >
                      {isAddingHere ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Cards scroll area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* Inline add form */}
                  {isAddingHere && (
                    <AddCardForm
                      onSave={(partial) => handleAddCard(column.id, partial)}
                      onCancel={() => setAddingInColumn(null)}
                    />
                  )}

                  {column.cards.map((card) => (
                    <KanbanCardComponent
                      key={card.id}
                      card={card}
                      isFinished={column.id === "finalizado"}
                      onClick={() => setExpandedCardId(card.id)}
                    />
                  ))}

                  {/* Add card button (bottom) */}
                  {!isAddingHere && (
                    <button
                      onClick={() => setAddingInColumn(column.id)}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xs flex items-center justify-center gap-1.5 hover:border-[#1A2B3C]/40 hover:text-[#1A2B3C]/60 hover:bg-white/50 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar caso
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Process Detail Panel ──────────────────────── */}
      {expandedCardId && expandedData && (
        <ProcessDetailPanel
          card={expandedData.card}
          columnTitle={expandedData.columnTitle}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
