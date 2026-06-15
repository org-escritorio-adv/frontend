import { Download, Upload, FileText, Calendar, MapPin, Users, Scale, Link2, Hash, DollarSign, ArrowLeft } from 'lucide-react';
import { exportarPdfProcesso } from '../../services/processos.service';

interface CaseDetailsProps {
  onBack?: () => void;
  processoId?: string;
}

export function CaseDetails({ onBack, processoId = "1" }: CaseDetailsProps) {
  const handleExportarPDF = async () => {
    try {
      console.log('Baixando PDF do backend:', processoId);
      await exportarPdfProcesso(processoId);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao tentar baixar o PDF do processo.");
    }
  };

  /* ── Dados técnicos do processo judicial (CNJ) ─────────────────────────── */
  const processo = {
    numero:          '0001234-56.2024.8.26.0100',
    tribunal:        'TJSP – 1ª Vara Cível de São Paulo',
    partes:          'Silva & Associates Ltda. (Autor) × Estado de São Paulo (Réu)',
    assunto:         'Recuperação de Tributos – ICMS',
    valorCausa:      'R$ 2.450.000,00',
    dataDistribuicao:'2024-01-15',
    status:          'Em Andamento',
    /* vínculo semântico com o Caso (Demanda) correspondente no Kanban */
    casoVinculado:   'Elaboração de Contrato Social – Fusão Alpha Corp.',
  };

  /* ── Timeline cronológica de movimentações ─────────────────────────────── */
  type TipoMovimentacao = 'Decisão' | 'Petição' | 'Audiência' | 'Documento' | 'Citação' | 'Distribuição';

  const timeline: { data: string; tipo: TipoMovimentacao; descricao: string; orgao: string }[] = [
    {
      data: '2026-04-03',
      tipo: 'Decisão',
      descricao: 'Decisão interlocutória publicada – Pedido de prova pericial deferido pelo juízo',
      orgao: 'TJSP – 1ª Vara Cível',
    },
    {
      data: '2026-03-28',
      tipo: 'Petição',
      descricao: 'Manifestação sobre tutela de urgência protocolada pelo autor',
      orgao: 'TJSP – 1ª Vara Cível',
    },
    {
      data: '2026-03-15',
      tipo: 'Audiência',
      descricao: 'Audiência de conciliação realizada – Sem acordo entre as partes',
      orgao: 'TJSP – 1ª Vara Cível',
    },
    {
      data: '2026-02-20',
      tipo: 'Documento',
      descricao: 'Contestação apresentada pelo réu com preliminares de mérito',
      orgao: 'TJSP – 1ª Vara Cível',
    },
    {
      data: '2026-02-05',
      tipo: 'Citação',
      descricao: 'Réu oficialmente citado para apresentar defesa em 15 dias',
      orgao: 'TJSP – 1ª Vara Cível',
    },
    {
      data: '2026-01-20',
      tipo: 'Decisão',
      descricao: 'Petição inicial recebida e despacho de processamento expedido',
      orgao: 'TJSP – 1ª Vara Cível',
    },
    {
      data: '2026-01-15',
      tipo: 'Distribuição',
      descricao: 'Ação distribuída com petição inicial e documentos instrutórios',
      orgao: 'TJSP – 1ª Vara Cível',
    },
  ];

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const getIconeMovimentacao = (tipo: TipoMovimentacao) => {
    switch (tipo) {
      case 'Decisão':       return <Scale    className="w-5 h-5 text-purple-500" />;
      case 'Petição':       return <FileText className="w-5 h-5 text-blue-500"   />;
      case 'Audiência':     return <Calendar className="w-5 h-5 text-green-500"  />;
      case 'Documento':     return <FileText className="w-5 h-5 text-orange-500" />;
      case 'Citação':       return <Users    className="w-5 h-5 text-yellow-600" />;
      case 'Distribuição':  return <FileText className="w-5 h-5 text-slate-500"  />;
      default:              return <FileText className="w-5 h-5 text-gray-500"   />;
    }
  };

  const getBadgeMovimentacao = (tipo: TipoMovimentacao) => {
    const map: Record<TipoMovimentacao, string> = {
      'Decisão':      'bg-purple-100 text-purple-700',
      'Petição':      'bg-blue-100   text-blue-700',
      'Audiência':    'bg-green-100  text-green-700',
      'Documento':    'bg-orange-100 text-orange-700',
      'Citação':      'bg-yellow-100 text-yellow-700',
      'Distribuição': 'bg-slate-100  text-slate-700',
    };
    return map[tipo] ?? 'bg-gray-100 text-gray-700';
  };

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const formatarDataCurta = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* ── Botão Voltar ───────────────────────────────────────────────────── */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#1A2B3C] mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para Processos Judiciais
        </button>
      )}

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {/* Título principal */}
          <h2 className="text-[#1A2B3C] mb-2">Detalhes do Processo Judicial</h2>

          {/* Número CNJ */}
          <p className="text-slate-600 font-mono text-sm mb-3">{processo.numero}</p>

          {/* ── Tag: Vinculado ao Caso ───────────────────────────────────── */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1A2B3C]/[0.06] rounded-lg border border-[#1A2B3C]/[0.10]">
            <Link2 className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
            <span className="text-[13px] text-slate-500 whitespace-nowrap">Vinculado ao Caso:</span>
            <span className="text-[13px] font-semibold text-[#1A2B3C] whitespace-nowrap">
              {processo.casoVinculado}
            </span>
          </div>
        </div>

        {/* Exportar PDF */}
        <button 
          onClick={handleExportarPDF}
          className="self-start px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center gap-2 shadow-md whitespace-nowrap"
        >
          <Download className="w-5 h-5" />
          Exportar para PDF
        </button>
      </div>

      {/* ── Informações técnicas do processo ───────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-[#1A2B3C] mb-4">Informações do Processo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Número CNJ */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Número do Processo (CNJ)</span>
            </div>
            <div className="text-[#1A2B3C] font-mono text-sm">{processo.numero}</div>
          </div>

          {/* Tribunal */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Tribunal / Vara</span>
            </div>
            <div className="text-[#1A2B3C] text-sm">{processo.tribunal}</div>
          </div>

          {/* Assunto */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Scale className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Assunto</span>
            </div>
            <div className="text-[#1A2B3C] text-sm">{processo.assunto}</div>
          </div>

          {/* Partes */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Partes</span>
            </div>
            <div className="text-[#1A2B3C] text-sm leading-relaxed">{processo.partes}</div>
          </div>

          {/* Valor da Causa */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Valor da Causa</span>
            </div>
            <div className="text-[#1A2B3C] text-sm font-semibold">{processo.valorCausa}</div>
          </div>

          {/* Data de Distribuição */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Data de Distribuição</span>
            </div>
            <div className="text-[#1A2B3C] text-sm">{formatarData(processo.dataDistribuicao)}</div>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Status</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {processo.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Documentos e Compliance ────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-[#1A2B3C] mb-4">Documentos e Autorização de Compliance</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#D4AF37] transition-colors cursor-pointer group">
          <Upload className="w-12 h-12 text-slate-400 group-hover:text-[#D4AF37] mx-auto mb-3 transition-colors" />
          <p className="text-slate-600 mb-1">Enviar documentos de compliance</p>
          <p className="text-sm text-slate-400 mb-4">Arraste arquivos para cá ou clique para selecionar</p>
          <button className="px-5 py-2 bg-[#1A2B3C] text-white rounded-lg hover:bg-[#243447] transition-colors text-sm">
            Selecionar Arquivos
          </button>
        </div>
      </div>

    </div>
  );
}