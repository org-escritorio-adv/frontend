import { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertCircle, CheckCircle, FileText, Calendar, Star } from 'lucide-react';
import { CaseFavoritoDrawer, type CasoDetalhado } from './CaseFavoritoDrawer';
import { buscarResumo, buscarAtividades, type ResumoDashboard, type AtividadeRecente } from '../../services/dashboard.service';

export function Dashboard() {

  // ── State do drawer ────────────────────────────────────────────────────────
  const [drawerAberto,   setDrawerAberto]   = useState(false);
  const [casoSelecionado, setCasoSelecionado] = useState<CasoDetalhado | null>(null);

  // ── State de dados reais ───────────────────────────────────────────────────
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);

  useEffect(() => {
    buscarResumo().then(setResumo).catch(() => {});
    buscarAtividades().then(setAtividades).catch(() => {});
  }, []);

  const abrirDrawer = (caso: CasoDetalhado) => {
    setCasoSelecionado(caso);
    setDrawerAberto(true);
  };

  const fecharDrawer = () => setDrawerAberto(false);

  // ── Dados enriquecidos dos casos favoritos ─────────────────────────────────
  const casosDestacados: CasoDetalhado[] = [
    {
      id: '0001234-56.2024.8.26.0100',
      cliente: 'Silva & Associados',
      status: 'ativo',
      tribunal: 'TJSP',
      vara: '1ª Vara Cível de São Paulo',
      valorCausa: 'R$ 2.450.000,00',
      responsavel: 'Dr. Carlos Silva',
      telefone: '(61) 98765-4321',
      movimentacoes: [
        { data: '03/04/2026', descricao: 'Decisão interlocutória — Perícia técnica deferida pelo juízo', tipo: 'decisao'  },
        { data: '15/03/2026', descricao: 'Petição de juntada de documentos protocolada com sucesso',    tipo: 'peticao'  },
        { data: '28/02/2026', descricao: 'Audiência de conciliação realizada sem acordo entre as partes', tipo: 'audiencia' },
      ],
    },
    {
      id: '0007890-12.2023.8.26.0577',
      cliente: 'Costa Indústrias',
      status: 'pendente',
      tribunal: 'TJRJ',
      vara: '2ª Vara Empresarial do Rio de Janeiro',
      valorCausa: 'R$ 870.000,00',
      responsavel: 'Dra. Ana Costa',
      telefone: '(61) 99234-5678',
      movimentacoes: [
        { data: '01/04/2026', descricao: 'Prazo para contestação em 10 dias — atenção necessária',  tipo: 'prazo'     },
        { data: '22/03/2026', descricao: 'Novo documento recebido da Receita Federal via sistema',  tipo: 'documento' },
        { data: '10/03/2026', descricao: 'Despacho de distribuição publicado no DJe',               tipo: 'decisao'   },
      ],
    },
    {
      id: '0003456-78.2024.5.02.0038',
      cliente: 'Oliveira Ltda',
      status: 'concluído',
      tribunal: 'TRT2',
      vara: '15ª Vara do Trabalho de São Paulo',
      valorCausa: 'R$ 125.000,00',
      responsavel: 'Dr. Pedro Oliveira',
      telefone: '(61) 99876-5432',
      movimentacoes: [
        { data: '28/03/2026', descricao: 'Acórdão publicado — trânsito em julgado confirmado',     tipo: 'decisao'  },
        { data: '05/03/2026', descricao: 'Cálculos homologados pelo perito judicial nomeado',      tipo: 'documento' },
        { data: '12/02/2026', descricao: 'Recurso ordinário julgado improcedente pela 3ª turma',  tipo: 'decisao'  },
      ],
    },
    {
      id: '0009012-34.2024.8.26.0602',
      cliente: 'Santos Corporation',
      status: 'ativo',
      tribunal: 'TJSP',
      vara: '3ª Vara Cível de Sorocaba',
      valorCausa: 'R$ 1.200.000,00',
      responsavel: 'Dr. Roberto Santos',
      telefone: '(61) 97654-3210',
      movimentacoes: [
        { data: '04/04/2026', descricao: 'Prazo de resposta expira em 5 dias — urgente',              tipo: 'prazo'     },
        { data: '30/03/2026', descricao: 'Audiência de instrução agendada para 20 de maio de 2026',   tipo: 'audiencia' },
        { data: '18/03/2026', descricao: 'Petição inicial recebida e distribuída ao juízo competente', tipo: 'peticao'  },
      ],
    },
  ];

  const atividadesRecentes = atividades.slice(0, 4).map((a) => ({
    tipo: 'atualizacao',
    processo: String(a.processo_id),
    descricao: a.descricao,
    tempo: new Date(a.data).toLocaleDateString('pt-BR'),
  }));

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'ativo':     return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pendente':  return 'bg-amber-100   text-amber-700   border-amber-200';
      case 'concluído': return 'bg-slate-100   text-slate-600   border-slate-200';
      default:          return 'bg-gray-100    text-gray-700    border-gray-200';
    }
  };

  const getLabelStatus = (status: string) => {
    switch (status) {
      case 'ativo':     return 'Ativo';
      case 'pendente':  return 'Pendente';
      case 'concluído': return 'Concluído';
      default:          return status;
    }
  };

  const getIconeAtividade = (tipo: string) => {
    switch (tipo) {
      case 'atualizacao': return <TrendingUp className="w-4 h-4 text-blue-500"   />;
      case 'audiencia':   return <Calendar   className="w-4 h-4 text-purple-500" />;
      case 'documento':   return <FileText   className="w-4 h-4 text-green-500"  />;
      case 'prazo':       return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:            return <Clock      className="w-4 h-4 text-gray-500"   />;
    }
  };

  return (
    <>
      {/* ── Side Drawer (renderizado acima do conteúdo) ─────────────────────── */}
      <CaseFavoritoDrawer
        caso={casoSelecionado}
        isOpen={drawerAberto}
        onClose={fecharDrawer}
      />

      <div className="p-8 max-w-7xl mx-auto">

        {/* ── Saudação ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-[#1A2B3C] mb-2">Bem-vindo, Dr. Silva</h2>
          <p className="text-slate-600">Aqui está uma visão geral dos seus processos jurídicos</p>
        </div>

        {/* ── Cards de estatísticas ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Casos Ativos</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.processosAtivos ?? '—'}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Tarefas Abertas</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.tarefasAbertas ?? '—'}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Total Processos</span>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.totalProcessos ?? '—'}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm">Prazos (7 dias)</span>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl text-[#1A2B3C]">{resumo?.prazosProximos ?? '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Casos Favoritos ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              <h3 className="text-[#1A2B3C]">Casos Favoritos</h3>
              <span className="text-xs text-slate-400 ml-1">· clique para expandir</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {casosDestacados.map((caso, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={caso.id}
                    onClick={() => abrirDrawer(caso)}
                    className={`
                      bg-white rounded-xl p-5 shadow-sm border transition-all duration-200 cursor-pointer group
                      ${isFirst
                        ? 'border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)]'
                        : 'border-gray-100 hover:border-slate-200 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Topo do card */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs border font-medium ${getCorStatus(caso.status)}`}>
                        {getLabelStatus(caso.status)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {caso.tribunal}
                        </span>
                        {/* Indicador de clique */}
                        <div className={`
                          w-5 h-5 rounded-full flex items-center justify-center transition-all
                          ${isFirst
                            ? 'bg-[#D4AF37]/15 group-hover:bg-[#D4AF37]/30'
                            : 'bg-slate-100 group-hover:bg-slate-200'
                          }
                        `}>
                          <Star className={`w-2.5 h-2.5 ${isFirst ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-slate-400'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Nome do cliente */}
                    <div className="text-sm text-[#1A2B3C] mb-2 font-medium group-hover:text-[#1A2B3C]">
                      {caso.cliente}
                    </div>

                    {/* Número CNJ */}
                    <div className="text-xs text-slate-500 mb-3 font-mono">{caso.id}</div>

                    {/* Rodapé do card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {caso.movimentacoes[0]?.data ?? '—'}
                      </div>
                      <span className={`
                        text-[10px] font-semibold uppercase tracking-wide transition-opacity
                        ${isFirst ? 'text-[#D4AF37] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}
                      `}>
                        Ver detalhes →
                      </span>
                    </div>

                    {/* Linha de destaque inferior (só no primeiro card) */}
                    {isFirst && (
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                        <p className="text-[10px] text-[#D4AF37]/70 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#D4AF37] inline-block" />
                          Última mov.: {caso.movimentacoes[0]?.descricao.slice(0, 40)}…
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Atividade Recente ──────────────────────────────────────────── */}
          <div>
            <h3 className="text-[#1A2B3C] mb-4">Atividade Recente</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="space-y-4">
                {atividadesRecentes.map((atividade, index) => (
                  <div key={index} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="mt-1 flex-shrink-0">
                      {getIconeAtividade(atividade.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-[#1A2B3C] mb-1">{atividade.descricao}</div>
                      <div className="text-xs text-slate-500 font-mono mb-1">{atividade.processo}</div>
                      <div className="text-xs text-slate-400">{atividade.tempo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
