import { useEffect } from 'react';
import {
  X, Phone, Building2, DollarSign, User,
  Scale, FileText, Calendar, AlertCircle,
  Clock, ChevronRight, Star, ExternalLink,
} from 'lucide-react';
import { exportarPdfProcesso } from '../../services/processos.service';


// ─── Types ────────────────────────────────────────────────────────────────────


export type StatusCaso = 'ativo' | 'pendente' | 'concluído';
export type TipoMovimentacao = 'decisao' | 'peticao' | 'audiencia' | 'prazo' | 'documento';


export interface Movimentacao {
  data: string;
  descricao: string;
  tipo: TipoMovimentacao;
}


export interface CasoDetalhado {
  id: string;
  cnj: string;
  cliente: string;
  status: StatusCaso;
  tribunal: string;
  vara: string;
  valorCausa: string;
  responsavel: string;
  telefone: string;
  movimentacoes: Movimentacao[];
}


interface CaseFavoritoDrawerProps {
  caso: CasoDetalhado | null;
  isOpen: boolean;
  onClose: () => void;
  onVerProcessoCompleto?: (id: string) => void;
  onVerTodasMovimentacoes?: (id: string) => void;
  onExportarPDF?: (id: string) => void;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────


const statusConfig: Record<StatusCaso, { dot: string; badge: string; label: string }> = {
  ativo:      { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Ativo'     },
  pendente:   { dot: 'bg-amber-500',   badge: 'bg-amber-100   text-amber-700   border-amber-200',   label: 'Pendente'  },
  concluído:  { dot: 'bg-slate-400',   badge: 'bg-slate-100   text-slate-600   border-slate-200',   label: 'Concluído' },
};


const movIcon: Record<TipoMovimentacao, { icon: typeof Scale; color: string; bg: string }> = {
  decisao:  { icon: Scale,         color: 'text-blue-500',   bg: 'bg-blue-50'   },
  peticao:  { icon: FileText,      color: 'text-purple-500', bg: 'bg-purple-50' },
  audiencia:{ icon: Calendar,      color: 'text-amber-500',  bg: 'bg-amber-50'  },
  prazo:    { icon: AlertCircle,   color: 'text-red-500',    bg: 'bg-red-50'    },
  documento:{ icon: FileText,      color: 'text-green-500',  bg: 'bg-green-50'  },
};


// ─── Component ────────────────────────────────────────────────────────────────


export function CaseFavoritoDrawer({ 
  caso, 
  isOpen, 
  onClose,
  onVerProcessoCompleto,
  onVerTodasMovimentacoes,
  onExportarPDF
}: CaseFavoritoDrawerProps) {


  /* Fechar com ESC */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);


  /* Travar scroll do body enquanto aberto */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);


  if (!isOpen || !caso) return null;


  const statusCfg = statusConfig[caso.status];


  // Handlers com fallback seguro
  const handleVerProcessoCompleto = () => {
    if (onVerProcessoCompleto) {
      onVerProcessoCompleto(caso.id);
    } else {
      console.log('Ver processo completo:', caso.id);
      // TODO: Implementar navegação para página de detalhes
    }
  };


  const handleVerTodasMovimentacoes = () => {
    if (onVerTodasMovimentacoes) {
      onVerTodasMovimentacoes(caso.id);
    } else {
      console.log('Ver todas movimentações:', caso.id);
      // TODO: Implementar modal de timeline completa
      alert(`Total de ${caso.movimentacoes.length} movimentações\n\n${caso.movimentacoes.map((m, i) => `${i + 1}. ${m.data} - ${m.descricao}`).join('\n')}`);
    }
  };


  const handleExportarPDF = async () => {
    if (onExportarPDF) {
      onExportarPDF(caso.id);
    } else {
      try {
        // Use a lib de toast se disponível, caso contrário use um alert simples para feedback
        console.log('Baixando PDF do backend:', caso.id);
        await exportarPdfProcesso(caso.id);
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        alert("Erro ao tentar baixar o PDF. Tente novamente mais tarde.");
      }
    }
  };


  return (
    <>
      {/* ── Backdrop escurecido ──────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 transition-all duration-300
          ${isOpen
            ? 'bg-[#1A2B3C]/40 backdrop-blur-[1px] pointer-events-auto'
            : 'bg-transparent pointer-events-none'
          }
        `}
        aria-hidden="true"
      />


      {/* ── Side Drawer ─────────────────────────────────────────────────────── */}
      <aside
        aria-label="Detalhes do Caso Favorito"
        className={`
          fixed top-0 right-0 h-full z-50 w-[400px] max-w-[100vw]
          bg-white shadow-2xl
          rounded-l-2xl
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ boxShadow: '-8px 0 40px rgba(26,43,60,0.18), -2px 0 12px rgba(26,43,60,0.08)' }}
      >


        {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">


            {/* Label superior */}
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
              <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">
                Caso Favorito
              </span>
            </div>


            {/* Nome do Cliente */}
            <h3 className="text-[#1A2B3C] text-lg font-semibold leading-snug truncate">
              {caso.cliente}
            </h3>


            {/* Badge de status */}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${caso.status === 'ativo' ? 'animate-pulse' : ''}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>


          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>


        {/* ── Corpo com scroll ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">


          {/* ── Informações do Processo ─────────────────────────────────────── */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Dados do Processo
            </p>


            {/* Número CNJ */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Scale className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Número do Processo (CNJ)</p>
                <p className="text-sm font-mono text-[#1A2B3C] font-medium">{caso.cnj}</p>
              </div>
            </div>


            {/* Tribunal */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Tribunal</p>
                <p className="text-sm text-[#1A2B3C] font-medium">{caso.tribunal}</p>
                <p className="text-xs text-slate-400 mt-0.5">{caso.vara}</p>
              </div>
            </div>


            {/* Valor da Causa */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Valor da Causa</p>
                <p className="text-sm text-[#1A2B3C] font-semibold">{caso.valorCausa}</p>
              </div>
            </div>


            {/* Responsável */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Responsável</p>
                <p className="text-sm text-[#1A2B3C] font-medium">{caso.responsavel}</p>
              </div>
            </div>
          </div>


          {/* Divisor */}
          <div className="mx-6 border-t border-gray-100" />


          {/* ── Contato do Cliente ──────────────────────────────────────────── */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Contato do Cliente
            </p>


            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-[#1A2B3C]" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Telefone (Brasília)</p>
                <p className="text-sm font-semibold text-[#1A2B3C]">{caso.telefone}</p>
              </div>
              <button className="ml-auto p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>


          {/* Divisor */}
          <div className="mx-6 border-t border-gray-100" />


          {/* ── Mini Timeline ───────────────────────────────────────────────── */}
          <div className="px-6 py-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Últimas Movimentações
              </p>
              <button 
                onClick={handleVerTodasMovimentacoes}
                className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-medium hover:underline"
              >
                Ver todas
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>


            <div className="relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-200 via-slate-100 to-transparent" />


              <div className="space-y-5">
                {caso.movimentacoes.slice(0, 3).map((mov, i) => {
                  const cfg = movIcon[mov.tipo];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="flex gap-3 relative">
                      {/* Ícone da timeline */}
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${cfg.bg} border border-white shadow-sm relative z-10
                      `}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>


                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-[#1A2B3C] leading-snug">{mov.descricao}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-400">{mov.data}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>


        {/* ── Rodapé com ações ─────────────────────────────────────────────── */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 bg-white rounded-bl-2xl">
          <button 
            onClick={handleExportarPDF}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            Exportar PDF
          </button>
          <button 
            onClick={handleVerProcessoCompleto}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors font-medium shadow-sm"
          >
            Ver Processo Completo
          </button>
        </div>


      </aside>
    </>
  );
}