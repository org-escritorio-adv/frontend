import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, X, Briefcase, AlertTriangle, Clock, CheckCircle, Scale, Settings, LogOut, ChevronDown, Shield, Globe } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { PrazosCalculadoraModal } from './PrazosCalculadoraModal';

export interface AppNotification {
  id: string;
  type: 'novo_processo' | 'prazo' | 'atualizacao' | 'audiencia';
  title: string;
  description: string;
  time: string;
  processId: string;
  unread: boolean;
}

export const appNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'novo_processo',
    title: 'Novo processo atribuído a você',
    description: 'Defesa inicial – Processo Trabalhista 0098/2024 · Status: Em Andamento',
    time: '2 min atrás',
    processId: 'e1',
    unread: true,
  },
  {
    id: 'n2',
    type: 'prazo',
    title: 'Prazo se aproximando',
    description: 'Recurso de apelação – Caso nº 0045/2024 · Vence em 2 dias',
    time: '1 hora atrás',
    processId: 'b4',
    unread: true,
  },
  {
    id: 'n3',
    type: 'atualizacao',
    title: 'Movimentação processual',
    description: 'Homologação de acordo trabalhista · Nova decisão publicada',
    time: '3 horas atrás',
    processId: 'f1',
    unread: false,
  },
  {
    id: 'n4',
    type: 'audiencia',
    title: 'Audiência agendada',
    description: 'Negociação de acordo extrajudicial · 22/05/2026 às 14h00',
    time: '1 dia atrás',
    processId: 'e2',
    unread: false,
  },
];

const notifIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'novo_processo': return <Briefcase className="w-4 h-4 text-blue-500" />;
    case 'prazo':         return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'atualizacao':   return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'audiencia':     return <Clock className="w-4 h-4 text-purple-500" />;
  }
};

const notifBg = (type: AppNotification['type']) => {
  switch (type) {
    case 'novo_processo': return 'bg-blue-50';
    case 'prazo':         return 'bg-red-50';
    case 'atualizacao':   return 'bg-emerald-50';
    case 'audiencia':     return 'bg-purple-50';
  }
};

interface TopBarProps {
  onNotificationClick?: (processId: string) => void;
}

export function TopBar({ onNotificationClick }: TopBarProps) {
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(appNotifications);
  const [calcOpen, setCalcOpen] = useState(false);
  const panelRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  /* Close notification panel on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  /* Close profile menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleNotifClick = (notif: AppNotification) => {
    /* Mark as read */
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    setPanelOpen(false);
    onNotificationClick?.(notif.processId);
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm relative z-30">
      <div className="flex items-center">
        <AppLogo variant="dark" size="md" />
      </div>

      <div className="flex items-center gap-3">

        {/* ── Calculadora de Prazos ─────────────── */}
        <button
          onClick={() => setCalcOpen(true)}
          title="Calculadora de Prazos Processuais"
          className="relative w-10 h-10 rounded-lg bg-slate-100 hover:bg-[#1A2B3C] hover:text-white flex items-center justify-center transition-all group"
        >
          <Scale className="w-5 h-5 text-slate-600 group-hover:text-[#D4AF37] transition-colors" />
        </button>

        {/* ── Bell ─────────────────────────────────── */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="relative w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* ── Notification dropdown ─────────────── */}
          {panelOpen && (
            <div className="absolute right-0 top-12 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              style={{ animation: 'slideDownFade 0.18s ease' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1A2B3C]">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-[#C5A059] font-medium hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group ${notif.unread ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Icon pill */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${notifBg(notif.type)}`}>
                      {notifIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[12px] leading-snug ${notif.unread ? 'font-semibold text-[#1A2B3C]' : 'font-medium text-slate-600'}`}>
                          {notif.title}
                        </p>
                        {notif.unread && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                        {notif.description}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-5 py-2.5 text-center">
                <button className="text-[11px] text-[#C5A059] font-medium hover:underline">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── User profile ─────────────────────── */}
        <div className="relative" ref={profileRef}>

          {/* Gatilho */}
          <button
            onClick={() => { setProfileOpen((v) => !v); setPanelOpen(false); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150
              ${profileOpen
                ? 'bg-[#1A2B3C] shadow-md'
                : 'hover:bg-slate-100'
              }`}
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${profileOpen
                ? 'bg-white/20 ring-2 ring-white/40'
                : 'bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C]'
              }`}
            >
              <User className={`w-5 h-5 ${profileOpen ? 'text-white' : 'text-white'}`} />
            </div>

            {/* Nome + cargo */}
            <div className="text-left">
              <div className={`text-sm font-medium transition-colors ${profileOpen ? 'text-white' : 'text-[#1A2B3C]'}`}>
                Dr. Silva
              </div>
              <div className={`text-xs transition-colors ${profileOpen ? 'text-white/60' : 'text-slate-500'}`}>
                Advogado(a)
              </div>
            </div>

            {/* Chevron indicador */}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-all duration-200 flex-shrink-0
                ${profileOpen ? 'rotate-180 text-white/70' : 'text-slate-400'}`}
            />
          </button>

          {/* ── Dropdown Menu ───────────────────── */}
          {profileOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-[248px] bg-white rounded-2xl z-50 overflow-hidden"
              style={{
                boxShadow: '0 4px 6px -1px rgba(26,43,60,0.08), 0 16px 40px -4px rgba(26,43,60,0.18)',
                animation: 'slideDownFade 0.16s ease',
              }}
            >
              {/* ── Área de identificação ─────────── */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar grande */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B3C] leading-tight">Dr. Carlos Silva</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">silva@barcelostakaki.adv.br</p>
                    {/* Badge de perfil */}
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-[#1A2B3C]/8 rounded-full">
                      <Shield className="w-2.5 h-2.5 text-[#D4AF37]" />
                      <span className="text-[10px] font-semibold text-[#1A2B3C]">Admin</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mx-4" />

              {/* ── Opções de navegação ───────────── */}
              <div className="px-2 py-2">

                {/* Meu Perfil */}
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             text-[#1A2B3C] hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <User className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Meu Perfil</p>
                    <p className="text-[11px] text-slate-400">Dados pessoais e OAB</p>
                  </div>
                </button>

                {/* Preferências */}
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             text-[#1A2B3C] hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Settings className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Preferências</p>
                    <p className="text-[11px] text-slate-400">Notificações e aparência</p>
                  </div>
                </button>

                {/* Site Institucional */}
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             text-[#1A2B3C] hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1A2B3C]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Globe className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Site Institucional</p>
                    <p className="text-[11px] text-slate-400">Voltar para a página inicial</p>
                  </div>
                </button>
              </div>

              {/* Divider antes do logout */}
              <div className="h-px bg-gray-100 mx-4" />

              {/* Sair da Conta */}
              <div className="px-2 py-2">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                             hover:bg-red-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <LogOut className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#EF4444]">Sair da Conta</p>
                    <p className="text-[11px] text-red-400">Encerrar sessão atual</p>
                  </div>
                </button>
              </div>

              {/* Rodapé do menu */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-gray-100">
                <p className="text-[10px] text-slate-400 text-center">
                  Barcelos & Takaki v2.4.1 · Sessão segura 🔒
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Calculadora Modal ─────────────────────────────────────────────── */}
      <PrazosCalculadoraModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}