import { useState, useEffect } from 'react';
import {
  X, RefreshCw, CheckCircle, Bell, Shield,
  Link2, Download, Globe, Clock, Wifi,
  WifiOff, ChevronRight, AlertCircle, Zap,
} from 'lucide-react';

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex items-center w-11 h-6 rounded-full
        transition-colors duration-200 flex-shrink-0
        focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-[#1A2B3C]' : 'bg-slate-200'}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md
          transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─── Modal base wrapper ───────────────────────────────────────────────────────

function ModalBase({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop 40% */}
      <div
        className="absolute inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Painel */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl z-10 overflow-hidden`}
        style={{ boxShadow: '0 24px 64px rgba(26,43,60,0.22)' }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Modal: Notificações por E-mail ──────────────────────────────────────────

interface OpcoesNotificacao {
  alertasPrazos: boolean;
  novasMovimentacoes: boolean;
  relatoriosSemanais: boolean;
  atualizacoesSistema: boolean;
}

function ModalNotificacoes({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [opcoes, setOpcoes] = useState<OpcoesNotificacao>({
    alertasPrazos:       true,
    novasMovimentacoes:  true,
    relatoriosSemanais:  false,
    atualizacoesSistema: true,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo,    setSalvo]    = useState(false);

  const toggle = (key: keyof OpcoesNotificacao) =>
    setOpcoes((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSalvar = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSalvo(true);
      setTimeout(onClose, 900);
    }, 700);
  };

  const itens: { key: keyof OpcoesNotificacao; label: string; desc: string; badge?: string }[] = [
    {
      key:   'alertasPrazos',
      label: 'Alertas de Prazos',
      desc:  'Receba um e-mail quando um prazo processual estiver próximo do vencimento.',
      badge: 'Urgente',
    },
    {
      key:   'novasMovimentacoes',
      label: 'Novas Movimentações',
      desc:  'Notificação automática a cada nova movimentação detectada via DataJud.',
    },
    {
      key:   'relatoriosSemanais',
      label: 'Relatórios Semanais',
      desc:  'Resumo consolidado enviado toda segunda-feira com status dos processos ativos.',
    },
    {
      key:   'atualizacoesSistema',
      label: 'Atualizações do Sistema',
      desc:  'Avisos sobre manutenções programadas e novos recursos do Barcelos & Takaki.',
    },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A2B3C]/8 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#1A2B3C]" />
          </div>
          <div>
            <h4 className="text-[#1A2B3C] font-semibold">Notificações por E-mail</h4>
            <p className="text-xs text-slate-400">Personalize quais alertas deseja receber</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toggles */}
      <div className="px-6 py-2 divide-y divide-gray-50">
        {itens.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-4 gap-4 cursor-pointer group"
            onClick={() => toggle(item.key)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#1A2B3C] group-hover:text-[#1A2B3C]">
                  {item.label}
                </p>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
            <ToggleSwitch
              checked={opcoes[item.key]}
              onChange={(v) => setOpcoes((prev) => ({ ...prev, [item.key]: v }))}
            />
          </div>
        ))}
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
          onClick={handleSalvar}
          disabled={salvando || salvo}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm
            ${salvo ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}
            disabled:opacity-80
          `}
        >
          {salvo ? (
            <><CheckCircle className="w-4 h-4" /> Salvo!</>
          ) : salvando ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando…</>
          ) : (
            <>Salvar Preferências</>
          )}
        </button>
      </div>
    </ModalBase>
  );
}

// ─── Modal: Integração API ──────────────────────────────────────────────

function ModalDataJud({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [sincronizando,    setSincronizando]    = useState(false);
  const [ultimaSync,       setUltimaSync]       = useState('Hoje às 08:00');
  const [sincronizacoes,   setSincronizacoes]   = useState(47);
  const [syncStatus,       setSyncStatus]       = useState<'idle' | 'syncing' | 'done'>('idle');

  const handleSincronizar = () => {
    if (sincronizando) return;
    setSincronizando(true);
    setSyncStatus('syncing');
    setTimeout(() => {
      const agora = new Date();
      setUltimaSync(
        `Hoje às ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
      );
      setSincronizacoes((n) => n + 3);
      setSincronizando(false);
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2200);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-[440px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A2B3C]/8 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-[#1A2B3C]" />
          </div>
          <div>
            <h4 className="text-[#1A2B3C] font-semibold">Integração DataJud</h4>
            <p className="text-xs text-slate-400">Status da API e controles de sincronização</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Status da conexão */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">API Conectada</p>
              <p className="text-xs text-emerald-500">Sincronização automática ativa</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Última Sync</span>
            </div>
            <p className="text-sm font-semibold text-[#1A2B3C]">{ultimaSync}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Processos</span>
            </div>
            <p className="text-sm font-semibold text-[#1A2B3C]">{sincronizacoes} sincronizados</p>
          </div>
        </div>

        {/* Chave de API (mascarada) */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Chave de API</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-gray-100">
            <span className="flex-1 font-mono text-sm text-slate-500 tracking-widest">••••••••••••••••••••••••</span>
            <button className="text-xs text-[#D4AF37] font-medium hover:underline flex-shrink-0">
              Renovar
            </button>
          </div>
        </div>

        {/* Feedback do status de sync */}
        {syncStatus === 'done' && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Sincronização concluída! {sincronizacoes} processos atualizados.
            </p>
          </div>
        )}

        {/* Botão Sincronizar Agora */}
        <button
          onClick={handleSincronizar}
          disabled={sincronizando}
          className={`
            w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm
            ${sincronizando
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-[#1A2B3C] text-white hover:bg-[#243447] hover:shadow-md'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
          {sincronizando ? 'Sincronizando com DataJud…' : 'Sincronizar Agora'}
        </button>

        {/* Aviso */}
        <div className="flex items-start gap-2 text-[11px] text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>A sincronização manual pode levar até 30 segundos dependendo do número de processos. O sistema também sincroniza automaticamente a cada 6 horas.</p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Fechar
        </button>
      </div>
    </ModalBase>
  );
}

// ─── SettingsView (principal) ─────────────────────────────────────────────────

type ModalAberto = 'notificacoes' | 'datajud' | null;

export function SettingsView() {
  const [hoveredRow,   setHoveredRow]   = useState<string | null>(null);
  const [modalAberto,  setModalAberto]  = useState<ModalAberto>(null);

  const fecharModal = () => setModalAberto(null);

  // ── Itens de configuração ──────────────────────────────────────────────────
  const itens: {
    id: string;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    modal: ModalAberto;
    badge?: { text: string; color: string };
  }[] = [
    {
      id:    'notificacoes',
      label: 'Notificações por e-mail',
      desc:  'Receba alertas de prazos e movimentações',
      icon:  Bell,
      modal: 'notificacoes',
    },
    {
      id:    'autenticacao',
      label: 'Autenticação em dois fatores',
      desc:  'Adicione uma camada extra de segurança',
      icon:  Shield,
      modal: null,
      badge: { text: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
    },
    {
      id:    'datajud',
      label: 'Integração DataJud',
      desc:  'API conectada · Sincronização automática ativa',
      icon:  Link2,
      modal: 'datajud',
      badge: { text: 'Conectado', color: 'bg-blue-100 text-blue-700' },
    },
    {
      id:    'exportacao',
      label: 'Exportação de dados',
      desc:  'Baixe um arquivo CSV com todos os seus processos',
      icon:  Download,
      modal: null,
    },
    {
      id:    'idioma',
      label: 'Idioma e fuso horário',
      desc:  'Português (Brasil) · UTC−3 (Brasília)',
      icon:  Globe,
      modal: null,
    },
  ];

  return (
    <>
      {/* ── Modais ──────────────────────────────────────────────────────────── */}
      <ModalNotificacoes
        isOpen={modalAberto === 'notificacoes'}
        onClose={fecharModal}
      />
      <ModalDataJud
        isOpen={modalAberto === 'datajud'}
        onClose={fecharModal}
      />

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <div className="p-8 max-w-2xl mx-auto">

        <h2 className="text-[#1A2B3C] text-xl font-semibold mb-2">Ajustes</h2>
        <p className="text-slate-500 text-sm mb-8">Gerencie as preferências do sistema.</p>

        {/* Card principal de configurações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {itens.map((item) => {
            const Icon     = item.icon;
            const isHov    = hoveredRow === item.id;
            const hasModal = item.modal !== null;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => hasModal && setModalAberto(item.modal)}
                className={`
                  flex items-center justify-between px-6 py-4
                  transition-colors duration-150 select-none
                  ${hasModal ? 'cursor-pointer' : 'cursor-default'}
                  ${isHov ? 'bg-[#F8F9FA]' : 'bg-white'}
                `}
              >
                {/* Ícone + texto */}
                <div className="flex items-center gap-4">
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    transition-colors duration-150
                    ${isHov ? 'bg-[#1A2B3C]/8' : 'bg-slate-50'}
                  `}>
                    <Icon className={`w-4 h-4 transition-colors duration-150 ${isHov ? 'text-[#1A2B3C]' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium transition-colors duration-150 ${isHov ? 'text-[#1A2B3C]' : 'text-[#1A2B3C]'}`}>
                        {item.label}
                      </p>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badge.color}`}>
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                {/* Ação à direita */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span
                    className={`
                      text-xs font-medium transition-all duration-150
                      ${hasModal
                        ? isHov
                          ? 'text-[#C5A059] underline underline-offset-2'
                          : 'text-[#C5A059]'
                        : 'text-slate-300'
                      }
                    `}
                  >
                    {hasModal ? 'Configurar' : 'Em breve'}
                  </span>
                  {hasModal && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-all duration-150 ${
                        isHov ? 'text-[#C5A059] translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Card de Suporte Técnico */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#1A2B3C] mb-4">Suporte Técnico</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>📞 <span className="font-medium">(61) 98765-4321</span></p>
            <p>📧 <span className="font-medium">suporte@barcelostakaki.adv.br</span></p>
            <p>📍 <span className="font-medium">SCLN 203, Bloco B, Asa Norte — Brasília, DF</span></p>
          </div>
        </div>

        {/* Versão do sistema */}
        <p className="text-center text-[11px] text-slate-300 mt-6">
          Barcelos & Takaki v2.4.1 · Build 2026.04.27 · Ambiente de Produção
        </p>
      </div>
    </>
  );
}