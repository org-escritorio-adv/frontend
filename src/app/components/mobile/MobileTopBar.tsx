import { useState } from "react";
import {
  Menu, Bell, User, X,
  LayoutDashboard, Briefcase, Search, FileText,
  Settings, LogOut, Scale, ChevronRight,
  Calendar, AlertTriangle, CheckCircle2, UserPlus,
  UserCircle, SlidersHorizontal, Check,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { AppLogo } from "../AppLogo";
import { routePaths } from "../../routeConfig";

// ── Dados mock ──────────────────────────────────────────────────────────────

type Notification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Nova movimentação processual",
    desc: "Audiência marcada para 15/05/2026 às 14h00",
    time: "2h atrás",
    unread: true,
    icon: Calendar,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    title: "Prazo se aproximando",
    desc: "Contestação deve ser enviada em 3 dias — Proc. 0007890…",
    time: "5h atrás",
    unread: true,
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: 3,
    title: "Sentença publicada",
    desc: "Resultado favorável ao cliente — Proc. 0005678…",
    time: "1 dia atrás",
    unread: false,
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: 4,
    title: "Novo lead recebido",
    desc: "Pedro Oliveira — Assessoria Empresarial",
    time: "2 dias atrás",
    unread: false,
    icon: UserPlus,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

// ── Componente ──────────────────────────────────────────────────────────────

export function MobileTopBar() {
  // Drawer lateral
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Dropdowns do header
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Notificações com estado local de leitura
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate(routePaths.login);
  };

  const navItems = [
    { path: routePaths.app,         icon: LayoutDashboard, label: "Dashboard"  },
    { path: routePaths.appCases,    icon: Briefcase,       label: "Meus Casos" },
    { path: routePaths.appPesquisa, icon: Search,          label: "Pesquisa"   },
    { path: routePaths.appCMS,      icon: FileText,        label: "CMS"        },
    { path: routePaths.appAjustes,  icon: Settings,        label: "Ajustes"    },
  ];

  const isActive = (path: string) =>
    path === routePaths.app
      ? location.pathname === routePaths.app || location.pathname === `${routePaths.app}/`
      : location.pathname.startsWith(path);

  // Fecha todos os painéis flutuantes
  const closeAll = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  // Marca todas as notificações como lidas
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  // Marca uma notificação como lida ao clicar
  const markRead = (id: number) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );

  return (
    <>
      {/* ── 1. Fixed Top Bar ──────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#1A2B3C] flex items-center px-4"
        style={{ boxShadow: "0 2px 12px rgba(26,43,60,0.45)" }}
      >
        {/* Hamburger */}
        <button
          onClick={() => { setDrawerOpen(true); closeAll(); }}
          className="w-10 h-10 -ml-1 flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10 active:bg-white/20 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo — absoluta e centralizada */}
        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none h-14">
          <AppLogo variant="light" size="sm" />
        </div>

        {/* Bell + Avatar */}
        <div className="ml-auto flex items-center gap-1">

          {/* ── Sino de Notificações ── */}
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Notificações"
            aria-expanded={notifOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-[#C5A059] rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* ── Avatar / Perfil ── */}
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center hover:bg-white/25 active:bg-white/35 transition-colors"
            aria-label="Perfil"
            aria-expanded={profileOpen}
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {/* ── 2. Backdrop transparente para fechar dropdowns ── */}
      {(notifOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={closeAll}
          aria-hidden="true"
        />
      )}

      {/* ── 3. Dropdown de Notificações ───────────────────── */}
      <div
        className={`fixed top-14 right-3 z-[60] w-[calc(100vw-24px)] max-w-sm
          bg-white rounded-2xl border border-slate-100 overflow-hidden
          transition-all duration-200 origin-top-right
          ${notifOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
          }`}
        style={{ boxShadow: "0 8px 32px rgba(26,43,60,0.18)" }}
      >
        {/* Cabeçalho do painel */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1A2B3C]" />
            <span className="text-sm font-semibold text-[#1A2B3C]">Notificações</span>
            {unreadCount > 0 && (
              <span className="bg-[#C5A059] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] text-[#C5A059] font-medium hover:text-[#b8923e] transition-colors"
            >
              <Check className="w-3 h-3" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                  n.unread ? "bg-blue-50/40 hover:bg-blue-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                {/* Ícone */}
                <div className={`w-9 h-9 rounded-xl ${n.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${n.iconColor}`} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-tight mb-0.5 ${n.unread ? "font-semibold text-[#1A2B3C]" : "font-medium text-slate-700"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug truncate">{n.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                </div>

                {/* Bolinha de não lida */}
                {n.unread && (
                  <span className="w-2 h-2 rounded-full bg-[#C5A059] flex-shrink-0 mt-1.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="border-t border-slate-100 px-4 py-2.5">
          <button
            onClick={closeAll}
            className="w-full text-xs text-center text-[#1A2B3C] font-medium py-1 hover:text-[#C5A059] transition-colors"
          >
            Ver todas as notificações
          </button>
        </div>
      </div>

      {/* ── 4. Dropdown de Perfil ─────────────────────────── */}
      <div
        className={`fixed top-14 right-3 z-[60] w-56
          bg-white rounded-2xl border border-slate-100 overflow-hidden
          transition-all duration-200 origin-top-right
          ${profileOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
          }`}
        style={{ boxShadow: "0 8px 32px rgba(26,43,60,0.18)" }}
      >
        {/* Cabeçalho com mini-perfil */}
        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-[#1A2B3C] leading-tight">Dr. Carlos Silva</p>
          <p className="text-[11px] text-slate-400 mt-0.5">silva@barcelostakaki.adv.br</p>
        </div>

        {/* Opções */}
        <div className="py-1">
          {[
            { icon: UserCircle,      label: "Meu Perfil",    red: false },
            { icon: SlidersHorizontal, label: "Preferências", red: false },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={closeAll}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              {label}
            </button>
          ))}

          <div className="h-px bg-slate-100 mx-4 my-1" />

          <button
            onClick={() => { closeAll(); handleLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sair da Conta
          </button>
        </div>
      </div>

      {/* ── 5. Backdrop do Drawer ─────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen
            ? "bg-black/50 backdrop-blur-[2px] pointer-events-auto"
            : "bg-transparent pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── 6. Side Drawer ────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[285px] bg-white flex flex-col
          transform transition-transform duration-300 ease-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ boxShadow: "4px 0 32px rgba(26,43,60,0.28)" }}
      >
        {/* Cabeçalho navy */}
        <div className="bg-[#1A2B3C] px-5 pt-12 pb-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <AppLogo variant="light" size="sm" />
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pill do usuário */}
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight truncate">Dr. Carlos Silva</p>
              <p className="text-white/55 text-[11px] truncate">silva@barcelostakaki.adv.br</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          </div>
        </div>

        {/* Itens de navegação */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navegação
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl mb-0.5 transition-all ${
                  active
                    ? "bg-[#1A2B3C] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? "bg-white/15" : "bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#D4AF37]" : "text-[#1A2B3C]"}`} />
                </div>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
              </Link>
            );
          })}

          <div className="h-px bg-slate-100 my-3 mx-2" />

          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Ferramentas
          </p>

          <button
            onClick={() => setDrawerOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl mb-0.5 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-[#1A2B3C]" />
            </div>
            <span className="text-sm font-medium">Calculadora de Prazos</span>
          </button>
        </div>

        {/* Rodapé do drawer */}
        <div className="flex-shrink-0 px-3 pt-3 pb-10 border-t border-slate-100">
          <button
            onClick={() => { setDrawerOpen(false); handleLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-medium">Sair da Conta</span>
          </button>
        </div>
      </aside>

    </>
  );
}
