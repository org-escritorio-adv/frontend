import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, CalendarCheck, CalendarX, Scale, Search, X, CheckCircle2, ChevronDown, AlertTriangle, Loader2, Info, Clock4, Briefcase, Zap, Link2, XCircle, CalendarClock, BookmarkCheck } from 'lucide-react';
import { calcularDataPrazo, criarPrazo, PrazoCreate } from '../../services/prazos.service';
import { buscarProcessosRaw, ProcessoAPI } from '../../services/processos.service';

// ─── Feriados ─────────────────────────────────────────────────────────────────

const FERIADOS_NACIONAIS = new Set([
  '2026-01-01',
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho  ← chave para o cálculo padrão
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // N.S. Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-12-25', // Natal
]);

const FERIADOS_TJDFT = new Set([
  ...FERIADOS_NACIONAIS,
  '2026-12-08', // N.S. da Conceição (DF)
  '2027-01-01',
]);

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const isFeriado = (d: Date, useTJDFT: boolean) =>
  useTJDFT ? FERIADOS_TJDFT.has(toKey(d)) : FERIADOS_NACIONAIS.has(toKey(d));

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// ─── Tipo de prazo ────────────────────────────────────────────────────────────

interface TipoPrazo {
  id: string;
  label: string;
  dias: number;
  art?: string;
}

const TIPOS_PRAZO: TipoPrazo[] = [
  { id: 'contestacao',     label: 'Contestação',                    dias: 15, art: 'CPC Art. 335'   },
  { id: 'apelacao',        label: 'Recurso de Apelação',            dias: 15, art: 'CPC Art. 1003'  },
  { id: 'resp_rext',       label: 'REsp / RE',                      dias: 15, art: 'CPC Art. 1003'  },
  { id: 'embargos_decl',   label: 'Embargos de Declaração',         dias: 5,  art: 'CPC Art. 1023'  },
  { id: 'impugnacao',      label: 'Impugnação ao Cumprimento',      dias: 15, art: 'CPC Art. 525'   },
  { id: 'agravo_regimental', label: 'Agravo Regimental',            dias: 15, art: 'CPC Art. 1021'  },
  { id: 'ms',              label: 'Mandado de Segurança',           dias: 120, art: 'Lei 12.016/09' },
  { id: 'personalizado',   label: 'Prazo Personalizado…',           dias: 0                          },
];

// ─── Cálculo ──────────────────────────────────────────────────────────────────

interface Resultado {
  dataFatal: Date;
  fdsSemana: number;
  feriados: number;
  diasCorridos: number;
  diasUteisContados: number;
  urgente: boolean;         // < 5 dias úteis restantes
  critico: boolean;         // ≤ 2 dias úteis restantes
}

const HOJE = new Date(2026, 3, 28); // 28/04/2026 – data de referência do sistema

function calcular(
  baseDate: Date,
  dias: number,
  apenasUteis: boolean,
  comFeriados: boolean,
): Resultado {
  // ── Avança um dia da publicação (publicação não conta) ─────────────────────
  let current = addDays(baseDate, 1);
  let counted = 0;
  let fdsSemana = 0;
  let feriadosDiasUtil = 0;

  if (dias === 0) {
    // prazo personalizado sem valor → retorna base + 1
    return {
      dataFatal: current,
      fdsSemana: 0,
      feriados: 0,
      diasCorridos: 1,
      diasUteisContados: 0,
      urgente: false,
      critico: false,
    };
  }

  if (apenasUteis) {
    // Conta N dias úteis
    while (counted < dias) {
      const fim_semana = isWeekend(current);
      const feriado    = isFeriado(current, comFeriados);

      if (fim_semana) {
        if (current.getDay() === 6) fdsSemana++; // cada sábado = 1 fds
      } else if (feriado) {
        feriadosDiasUtil++;
      } else {
        counted++;
      }
      if (counted < dias) current = addDays(current, 1);
    }
  } else {
    // Conta N dias corridos e avança se cair em não-útil
    current = addDays(baseDate, dias);
    while (isWeekend(current) || isFeriado(current, comFeriados)) {
      current = addDays(current, 1);
    }

    // Conta fds e feriados dentro do intervalo (informativo)
    let tmp = addDays(baseDate, 1);
    while (tmp <= current) {
      if (isWeekend(tmp)) {
        if (tmp.getDay() === 6) fdsSemana++;
      } else if (isFeriado(tmp, comFeriados)) {
        feriadosDiasUtil++;
      }
      tmp = addDays(tmp, 1);
    }
  }

  const diasCorridos = Math.round((current.getTime() - baseDate.getTime()) / 86_400_000);

  // Dias úteis restantes até a data fatal
  let restantes = 0;
  let tmp2 = addDays(HOJE, 1);
  while (tmp2 <= current) {
    if (!isWeekend(tmp2) && !isFeriado(tmp2, comFeriados)) restantes++;
    tmp2 = addDays(tmp2, 1);
  }

  return {
    dataFatal:         current,
    fdsSemana,
    feriados:          feriadosDiasUtil,
    diasCorridos,
    diasUteisContados: counted,
    urgente:           restantes <= 5,
    critico:           restantes <= 2,
  };
}

// ─── Formatação ───────────────────────────────────────────────────────────────

const fmt = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

const fmtShort = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Processos mock para autocomplete ────────────────────────────────────────

// ─── Processos da API para autocomplete ───────────────────────────────────────
// Removidos os mocks de processos para buscar do backend.

const TIPO_COLORS: Record<string, string> = {
  Cível:          'bg-blue-100 text-blue-700',
  Trabalhista:    'bg-orange-100 text-orange-700',
  Previdenciário: 'bg-purple-100 text-purple-700',
  Tributário:     'bg-green-100 text-green-700',
  Família:        'bg-pink-100 text-pink-700',
  Consumidor:     'bg-teal-100 text-teal-700',
};

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-[#D4AF37]/30 text-[#1A2B3C] rounded px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface PrazosCalculadoraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrazosCalculadoraModal({ isOpen, onClose }: PrazosCalculadoraModalProps) {
  // ── estado do formulário ──────────────────────────────────────────────────
  const [dataBase,     setDataBase]     = useState('2026-04-28');   // hoje → 15 úteis → mai/2026
  const [tipoPrazoId,  setTipoPrazoId]  = useState('contestacao');
  const [diasCustom,   setDiasCustom]   = useState(30);
  const [apenasUteis,  setApenasUteis]  = useState(true);
  const [comFeriados,  setComFeriados]  = useState(true);

  const [processosApi, setProcessosApi] = useState<ProcessoAPI[]>([]);
  const [processoBusca,      setProcessoBusca]      = useState('');
  const [processoSelecionado, setProcessoSelecionado] = useState<ProcessoAPI | null>(null);
  const [dropdownAberto,     setDropdownAberto]     = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      buscarProcessosRaw().then(setProcessosApi).catch(console.error);
    }
  }, [isOpen]);

  const processosFiltrados = processosApi.filter((p) => {
    const q = processoBusca.toLowerCase();
    const partes = p.partes || '';
    return p.numero_cnj.toLowerCase().includes(q) || partes.toLowerCase().includes(q) || p.tribunal.toLowerCase().includes(q);
  });

  // fecha dropdown ao clicar fora
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selecionarProcesso = (p: ProcessoAPI) => {
    setProcessoSelecionado(p);
    setProcessoBusca('');
    setDropdownAberto(false);
  };

  const limparProcesso = () => {
    setProcessoSelecionado(null);
    setProcessoBusca('');
  };

  // ── resultado calculado ───────────────────────────────────────────────────
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [calculando, setCalculando] = useState(false);

  // ── salvamento ────────────────────────────────────────────────────────────
  const [salvando, setSalvando] = useState(false);
  const [salvo,    setSalvo]    = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tipoPrazo = TIPOS_PRAZO.find((t) => t.id === tipoPrazoId) ?? TIPOS_PRAZO[0];
  const diasEfetivos = tipoPrazo.id === 'personalizado' ? diasCustom : tipoPrazo.dias;

  // ── recalcula sempre que o formulário muda ────────────────────────────────
  const recalcular = useCallback(async () => {
    if (!dataBase) { setResultado(null); return; }
    const base = new Date(dataBase + 'T12:00:00');
    if (isNaN(base.getTime())) { setResultado(null); return; }

    setCalculando(true);
    try {
      const resLocal = calcular(base, diasEfetivos, apenasUteis, comFeriados);

      if (apenasUteis && diasEfetivos > 0) {
        const apiRes = await calcularDataPrazo(base.toISOString(), diasEfetivos);
        const dataFinalBackend = new Date(apiRes.data_final);
        resLocal.dataFatal = dataFinalBackend;
        resLocal.diasCorridos = Math.round((dataFinalBackend.getTime() - base.getTime()) / 86_400_000);
      }

      setResultado(resLocal);
    } catch (error) {
      console.error("Erro ao calcular prazo na API:", error);
      setResultado(calcular(base, diasEfetivos, apenasUteis, comFeriados));
    } finally {
      setCalculando(false);
    }
  }, [dataBase, diasEfetivos, apenasUteis, comFeriados]);

  useEffect(() => { recalcular(); }, [recalcular]);
  useEffect(() => {
    if (isOpen) { 
      setSalvo(false); 
      setSalvando(false); 
      setProcessoSelecionado(null);
      setProcessoBusca('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // ESC fecha
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Garante que o portal só renderize no lado cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;

  // ── nota de desconto ──────────────────────────────────────────────────────
  const gerarNota = () => {
    if (!resultado) return null;
    const { fdsSemana, feriados } = resultado;
    const partes: string[] = [];
    if (fdsSemana > 0) partes.push(`${fdsSemana} ${fdsSemana === 1 ? 'final de semana' : 'finais de semana'}`);
    if (feriados > 0)  partes.push(`${feriados} ${feriados === 1 ? 'feriado' : 'feriados'}`);
    if (partes.length === 0) return 'Nenhum feriado ou final de semana neste intervalo.';
    return `Foram descontados ${partes.join(' e ')}.`;
  };

  const nota = gerarNota();

  // ── urgência ──────────────────────────────────────────────────────────────
  const corUrgencia = resultado?.critico
    ? { ring: 'border-red-300 bg-red-50',     text: 'text-red-600',     badge: 'bg-red-100 text-red-700',     icon: <CalendarX className="w-4 h-4 text-red-500" /> }
    : resultado?.urgente
    ? { ring: 'border-amber-300 bg-amber-50', text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> }
    : { ring: 'border-[#1A2B3C]/20 bg-[#1A2B3C]/5', text: 'text-[#1A2B3C]', badge: 'bg-[#1A2B3C]/10 text-[#1A2B3C]', icon: <CalendarCheck className="w-4 h-4 text-[#1A2B3C]" /> };

  const handleSalvar = async () => {
    if (!processoSelecionado) {
      setErrorMsg('Para salvar um prazo, selecione um processo na lista.');
      return;
    }
    if (!resultado?.dataFatal) return;

    setErrorMsg('');
    setSalvando(true);
    
    try {
      const payload: PrazoCreate = {
        titulo: `${tipoPrazo.label} - ${processoSelecionado.partes?.substring(0, 20) || 'Prazo'}`,
        data_limite: resultado.dataFatal.toISOString(),
        processo_id: processoSelecionado.id,
      };
      
      await criarPrazo(payload);
      
      setSalvo(true); 
      setTimeout(onClose, 900);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar prazo. Verifique a conexão com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(26,43,60,0.25)', maxHeight: '92vh' }}
      >

        {/* ── Cabeçalho ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#1A2B3C] to-[#243447] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h4 className="text-white font-semibold leading-tight">
                Calculadora de Prazos Processuais
              </h4>
              <p className="text-white/50 text-xs mt-0.5">
                Novo CPC · TJDFT / Brasília · {fmtShort(HOJE)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Formulário ──────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 space-y-5 overflow-y-auto flex-1">

          {/* ── NOVO: Vincular ao Processo ────────────────────────────── */}
          <div ref={autocompleteRef} className="relative">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Vincular ao Processo
              </span>
            </label>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Campo — estado: selecionado */}
            {processoSelecionado ? (
              <div className="flex items-center gap-3 px-4 py-3 border-2 border-[#1A2B3C]/30 bg-[#1A2B3C]/5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-[#1A2B3C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2B3C] truncate font-mono tracking-tight">
                    {processoSelecionado.numero_cnj}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{processoSelecionado.partes || 'Sem partes'} · {processoSelecionado.tribunal}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-slate-100 text-slate-600 uppercase tracking-wider`}>
                  {processoSelecionado.status}
                </span>
                <button
                  onClick={limparProcesso}
                  className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remover vínculo"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Campo — estado: busca */
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={processoBusca}
                  onChange={(e) => { setProcessoBusca(e.target.value); setDropdownAberto(true); }}
                  onFocus={() => setDropdownAberto(true)}
                  placeholder="0001234-56.2024.8.26.0100 — Silva & Associados"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A2B3C]
                             placeholder:text-slate-300 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
                />
              </div>
            )}

            {/* Aviso de recomendação */}
            {!processoSelecionado && (
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                Selecione um processo para poder <strong className="text-slate-500">Salvar</strong> a data no sistema.
              </p>
            )}

            {/* Dropdown de resultados */}
            {dropdownAberto && !processoSelecionado && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden"
                   style={{ boxShadow: '0 8px 32px rgba(26,43,60,0.14)' }}>
                {/* Cabeçalho do dropdown */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {processoBusca ? `${processosFiltrados.length} resultado(s)` : 'Processos recentes'}
                  </span>
                  {processoBusca && processosFiltrados.length === 0 && (
                    <span className="text-[11px] text-red-500">Nenhum processo encontrado</span>
                  )}
                </div>

                {/* Lista de resultados */}
                <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-50">
                  {processosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selecionarProcesso(p)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#1A2B3C]/5 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1A2B3C] transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A2B3C] font-mono tracking-tight truncate">
                          {highlightMatch(p.numero_cnj, processoBusca)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {p.partes ? highlightMatch(p.partes, processoBusca) : 'Sem partes'} · {p.tribunal}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Rodapé do dropdown */}
                <div className="px-4 py-2 border-t border-gray-100 bg-slate-50/80">
                  <p className="text-[10px] text-slate-400">
                    Digite o número do processo ou nome da parte para filtrar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Divisor visual sutil ─────────────────────────────────── */}
          <div className="flex items-center gap-3 -my-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] text-slate-300 uppercase tracking-widest">Configurações do Prazo</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Data da publicação */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-[#D4AF37]" />
                Data da Publicação / Intimação
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dataBase}
                onChange={(e) => setDataBase(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A2B3C] bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]
                           transition cursor-pointer"
              />
            </div>
          </div>

          {/* Tipo de prazo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Clock4 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Selecione o Prazo
              </span>
            </label>
            <div className="relative">
              <select
                value={tipoPrazoId}
                onChange={(e) => setTipoPrazoId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A2B3C] bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]
                           transition appearance-none cursor-pointer"
              >
                {TIPOS_PRAZO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}{t.dias > 0 ? ` (${t.dias} dias)` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Referência legal + prazo personalizado */}
            <div className="flex items-center justify-between mt-2">
              {tipoPrazo.art && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Info className="w-3 h-3" />
                  {tipoPrazo.art}
                </span>
              )}
              {tipoPrazoId === 'personalizado' && (
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={diasCustom}
                    onChange={(e) => setDiasCustom(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center text-[#1A2B3C]
                               focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                  />
                  <span className="text-xs text-slate-500">dias</span>
                </div>
              )}
            </div>
          </div>

          {/* Checkboxes ─ Filtros e Configurações */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
              Filtros e Configurações
            </p>
            <div className="space-y-3">
              {[
                {
                  id:      'uteis',
                  checked: apenasUteis,
                  toggle:  () => setApenasUteis((v) => !v),
                  label:   'Contar apenas dias úteis (Novo CPC)',
                  desc:    'Art. 219 do CPC/2015 — exclui sábados, domingos e feriados da contagem.',
                },
                {
                  id:      'feriados',
                  checked: comFeriados,
                  toggle:  () => setComFeriados((v) => !v),
                  label:   'Considerar feriados locais (TJDFT / Brasília)',
                  desc:    'Inclui feriados do DF como N.S. da Conceição (08/12) e Dia do Servidor.',
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-colors group"
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.toggle}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all
                        ${item.checked
                          ? 'bg-[#1A2B3C] border-[#1A2B3C]'
                          : 'bg-white border-gray-300 group-hover:border-[#1A2B3C]/40'
                        }`}
                    >
                      {item.checked && (
                        <svg viewBox="0 0 10 8" className="w-3 h-3 fill-none stroke-white stroke-[2]">
                          <path d="M1 4l2.5 3L9 1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2B3C]">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Card de Resultado ────────────────────────────────────── */}
          {calculando ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-gray-100 bg-slate-50">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-500">Calculando prazo no servidor...</p>
            </div>
          ) : resultado && (
            <div className={`rounded-2xl border-2 p-5 transition-all ${corUrgencia.ring}`}>

              {/* Topo do card */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {corUrgencia.icon}
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Data Fatal
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${corUrgencia.badge}`}>
                  {resultado.critico && <AlertTriangle className="w-3 h-3" />}
                  {tipoPrazo.id !== 'personalizado' ? tipoPrazo.label : `${diasCustom} dias`}
                </span>
              </div>

              {/* Data fatal em destaque */}
              <div className="mb-3">
                <p className={`text-[28px] font-bold leading-none tracking-tight ${corUrgencia.text}`}>
                  {fmt(resultado.dataFatal)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {fmtShort(resultado.dataFatal)} · {resultado.diasCorridos} dias corridos
                  {apenasUteis && resultado.diasUteisContados > 0 && ` · ${resultado.diasUteisContados} dias úteis`}
                </p>
              </div>

              {/* Separador */}
              <div className="border-t border-current/10 my-3" />

              {/* Nota de desconto */}
              <div className="flex items-start gap-2">
                {nota && nota.includes('Nenhum') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-xs text-slate-500 leading-relaxed">{nota}</p>
              </div>

              {/* Mini chips de breakdown */}
              {(resultado.fdsSemana > 0 || resultado.feriados > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {resultado.fdsSemana > 0 && (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-white/80 rounded-lg border border-current/10 text-slate-500">
                      📅 {resultado.fdsSemana} {resultado.fdsSemana === 1 ? 'fim de semana' : 'fins de semana'}
                    </span>
                  )}
                  {resultado.feriados > 0 && (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-white/80 rounded-lg border border-current/10 text-slate-500">
                      🎌 {resultado.feriados} {resultado.feriados === 1 ? 'feriado' : 'feriados'}
                    </span>
                  )}
                </div>
              )}

              {/* Alerta de urgência */}
              {(resultado.urgente || resultado.critico) && (
                <div className={`flex items-center gap-2 mt-3 p-2.5 rounded-lg ${resultado.critico ? 'bg-red-100' : 'bg-amber-100'}`}>
                  <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${resultado.critico ? 'text-red-500' : 'text-amber-500'}`} />
                  <p className={`text-xs font-semibold ${resultado.critico ? 'text-red-700' : 'text-amber-700'}`}>
                    {resultado.critico
                      ? 'PRAZO CRÍTICO — Providências imediatas necessárias!'
                      : 'Atenção: prazo se aproximando — verifique as diligências pendentes.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Aviso legal */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 pb-1">
            <Scale className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#D4AF37]" />
            <p>
              Este cálculo é uma estimativa com base nas configurações selecionadas.
              Sempre verifique os feriados forenses do TJDFT e eventuais suspensões de prazo antes de protocolar.
            </p>
          </div>
        </div>

        {/* ── Rodapé ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50/70 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSalvar}
            disabled={!resultado || !processoSelecionado || salvando || salvo}
            title={!processoSelecionado ? 'Selecione um processo para salvar o prazo' : ''}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white
              transition-all shadow-sm
              ${salvo
                ? 'bg-emerald-500'
                : !processoSelecionado
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-[#1A2B3C] hover:bg-[#243447] hover:shadow-md'
              }
            `}
          >
            {salvo ? (
              <><CheckCircle2 className="w-4 h-4" /> Prazo Salvo!</>
            ) : salvando ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando…</>
            ) : (
              <><BookmarkCheck className="w-4 h-4" />
                {processoSelecionado
                  ? `Salvar em ${processoSelecionado.numero_cnj.slice(0, 14)}…`
                  : 'Selecione um Processo'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}