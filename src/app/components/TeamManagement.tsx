import { useState, useEffect, useCallback } from 'react';
import {
  X, Plus, Settings2, Edit, Trash2, Shield, UserCheck,
  Users, CheckCircle, AlertTriangle, Lock, Eye, EyeOff,
  FileEdit, Globe, Download, Columns3, ChevronDown,
  Mail, Phone, BadgeCheck, UserX,
} from 'lucide-react';
import { criarUsuario, listarUsuarios } from '../../services/equipe.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type NivelAcesso = 'Admin' | 'Advogado' | 'Estagiário';
type StatusUsuario = 'Ativo' | 'Inativo' | 'Pendente';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  nivel: NivelAcesso;
  status: StatusUsuario;
  avatar: string;
  permissoes: Record<string, boolean>;
}

// ─── Permissões padrão por perfil ─────────────────────────────────────────────

const permissoesPadrao: Record<NivelAcesso, Record<string, boolean>> = {
  Admin: {
    visualizarProcessos:   true,
    criarProcessos:        true,
    editarProcessos:       true,
    excluirProcessos:      true,
    editarPerfisSite:      true,
    publicarConteudo:      true,
    exportarDados:         true,
    acessarPainelAdmin:    true,
    gerenciarUsuarios:     true,
  },
  Advogado: {
    visualizarProcessos:   true,
    criarProcessos:        true,
    editarProcessos:       true,
    excluirProcessos:      false,
    editarPerfisSite:      false,
    publicarConteudo:      false,
    exportarDados:         true,
    acessarPainelAdmin:    false,
    gerenciarUsuarios:     false,
  },
  Estagiário: {
    visualizarProcessos:   true,
    criarProcessos:        false,
    editarProcessos:       false,
    excluirProcessos:      false,
    editarPerfisSite:      false,
    publicarConteudo:      false,
    exportarDados:         false,
    acessarPainelAdmin:    false,
    gerenciarUsuarios:     false,
  },
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  danger = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex items-center w-11 h-6 rounded-full flex-shrink-0
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${checked
          ? danger
            ? 'bg-red-500 focus:ring-red-300'
            : 'bg-[#1A2B3C] focus:ring-[#D4AF37]/40'
          : 'bg-slate-200 focus:ring-slate-300'
        }
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

// ─── RBAC Badge ──────────────────────────────────────────────────────────────

const nivelConfig: Record<NivelAcesso, { badge: string; dot: string; icon: typeof Shield }> = {
  Admin:      { badge: 'bg-[#1A2B3C] text-white',                  dot: 'bg-white',          icon: Shield     },
  Advogado:   { badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500',       icon: UserCheck  },
  Estagiário: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500',  icon: Users      },
};

function NivelBadge({ nivel }: { nivel: NivelAcesso }) {
  const cfg  = nivelConfig[nivel];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <Icon className="w-3 h-3" />
      {nivel}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<StatusUsuario, { badge: string; dot: string }> = {
  Ativo:    { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Inativo:  { badge: 'bg-slate-100   text-slate-500   border-slate-200',   dot: 'bg-slate-400'   },
  Pendente: { badge: 'bg-amber-100   text-amber-700   border-amber-200',   dot: 'bg-amber-500'   },
};

function StatusBadge({ status }: { status: StatusUsuario }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'Ativo' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function ModalBase({
  isOpen, onClose, children, maxWidth = 'max-w-lg',
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
      <div className="absolute inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl z-10 overflow-hidden`}
        style={{ boxShadow: '0 24px 64px rgba(26,43,60,0.22)', maxHeight: '90vh' }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Modal: Permissões ────────────────────────────────────────────────────────

interface GrupoPermissao {
  titulo: string;
  icone: typeof Eye;
  cor: string;
  itens: {
    key: string;
    label: string;
    desc: string;
    danger?: boolean;
    destaque?: boolean;
  }[];
}

const gruposPermissao: GrupoPermissao[] = [
  {
    titulo: 'Processos',
    icone: Columns3,
    cor: 'text-blue-500',
    itens: [
      { key: 'visualizarProcessos', label: 'Visualizar processos', desc: 'Acesso de leitura a todos os processos e casos do escritório.' },
      { key: 'criarProcessos',      label: 'Criar novos processos', desc: 'Permissão para abrir e cadastrar novos processos no sistema.' },
      { key: 'editarProcessos',     label: 'Editar processos', desc: 'Modificar dados, partes, prazos e movimentações de processos.' },
      { key: 'excluirProcessos',    label: 'Excluir processos', desc: 'Remoção permanente de processos. Ação irreversível.', danger: true, destaque: true },
    ],
  },
  {
    titulo: 'Site Institucional',
    icone: Globe,
    cor: 'text-purple-500',
    itens: [
      { key: 'editarPerfisSite',  label: 'Editar perfis do site', desc: 'Atualizar fotos, bios e especialidades dos advogados no portal.', destaque: true },
      { key: 'publicarConteudo', label: 'Publicar conteúdo',    desc: 'Criar e publicar artigos, notícias e atualizações institucionais.' },
    ],
  },
  {
    titulo: 'Sistema e Dados',
    icone: Settings2,
    cor: 'text-slate-500',
    itens: [
      { key: 'exportarDados',      label: 'Exportar dados',            desc: 'Baixar relatórios em CSV/PDF com dados de processos e clientes.' },
      { key: 'acessarPainelAdmin', label: 'Acessar painel admin',      desc: 'Visualizar métricas, logs e configurações avançadas do sistema.', danger: true },
      { key: 'gerenciarUsuarios',  label: 'Gerenciar usuários',        desc: 'Adicionar, editar e remover membros da equipe e seus acessos.', danger: true },
    ],
  },
];

function ModalPermissoes({
  isOpen,
  usuario,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onSave: (id: string, permissoes: Record<string, boolean>) => void;
}) {
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);
  const [salvo,    setSalvo]    = useState(false);

  useEffect(() => {
    if (usuario) { setPerms({ ...usuario.permissoes }); setSalvo(false); }
  }, [usuario, isOpen]);

  const toggle = (key: string) =>
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSalvar = () => {
    if (!usuario) return;
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSalvo(true);
      onSave(usuario.id, perms);
      setTimeout(onClose, 900);
    }, 700);
  };

  if (!usuario) return null;

  const cfg = nivelConfig[usuario.nivel];
  const Icon = cfg.icon;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-[520px]">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-sm font-bold">
              {usuario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[#1A2B3C] font-semibold">{usuario.nome}</h4>
              <NivelBadge nivel={usuario.nivel} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Painel de Permissões</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Aviso de perfil */}
      {usuario.nivel === 'Estagiário' && (
        <div className="mx-6 mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Perfil Estagiário — Acesso Restrito</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Permissões críticas estão desativadas por padrão para este nível. Ative individualmente com cautela.
            </p>
          </div>
        </div>
      )}

      {/* Grupos de permissões com scroll */}
      <div className="overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: '50vh' }}>
        {gruposPermissao.map((grupo) => {
          const GIcon = grupo.icone;
          return (
            <div key={grupo.titulo}>
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2 mb-3">
                <GIcon className={`w-4 h-4 ${grupo.cor}`} />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {grupo.titulo}
                </p>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-1">
                {grupo.itens.map((item) => {
                  const isOn    = perms[item.key] ?? false;
                  const isDest  = item.destaque;
                  const isDng   = item.danger;

                  return (
                    <div
                      key={item.key}
                      onClick={() => toggle(item.key)}
                      className={`
                        flex items-center justify-between gap-4 px-4 py-3 rounded-xl cursor-pointer
                        transition-all duration-150 group
                        ${isDest
                          ? isOn
                            ? isDng
                              ? 'bg-red-50 border border-red-100'
                              : 'bg-[#1A2B3C]/5 border border-[#1A2B3C]/10'
                            : 'bg-slate-50 border border-gray-100'
                          : 'hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isDng && <Lock className={`w-3 h-3 flex-shrink-0 ${isOn ? 'text-red-500' : 'text-slate-300'}`} />}
                          <p className={`text-sm font-medium ${isDng && isOn ? 'text-red-700' : 'text-[#1A2B3C]'}`}>
                            {item.label}
                          </p>
                          {isDng && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-wide">
                              Crítico
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                      <ToggleSwitch
                        checked={isOn}
                        onChange={(v) => setPerms((prev) => ({ ...prev, [item.key]: v }))}
                        danger={isDng}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex-shrink-0">
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
            <><Shield className="w-4 h-4" /> Salvar Permissões</>
          )}
        </button>
      </div>
    </ModalBase>
  );
}

// ─── Modal: Adicionar Usuário ─────────────────────────────────────────────────

function ModalAdicionarUsuario({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', nivel: 'Advogado' as NivelAcesso });
  const [salvando,  setSalvando]  = useState(false);
  const [salvo,     setSalvo]     = useState(false);
  const [erro,      setErro]      = useState('');
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ nome: '', email: '', senha: '', nivel: 'Advogado' });
      setSalvo(false);
      setErro('');
      setShowSenha(false);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      setErro('Preencha nome, e-mail e senha temporária.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await criarUsuario({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        perfil: form.nivel,
      });
      setSalvo(true);
      onAdd();
      setTimeout(onClose, 900);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErro(msg || 'Erro ao criar usuário. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-[460px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A2B3C]/8 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#1A2B3C]" />
          </div>
          <div>
            <h4 className="text-[#1A2B3C] font-semibold">Adicionar Usuário</h4>
            <p className="text-xs text-slate-400">Convide um novo membro para a equipe</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulário */}
      <div className="px-6 py-5 space-y-4">
        {/* Nome */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Edit className="w-3 h-3" /> Nome Completo
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: Dr. João Silva"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
          />
        </div>

        {/* E-mail */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> E-mail Institucional
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="nome@barcelostakaki.adv.br"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
          />
        </div>

        {/* Senha temporária */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Senha Temporária
          </label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
            <button
              type="button"
              onClick={() => setShowSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            O usuário poderá redefinir a senha usando o fluxo de recuperação de conta.
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{erro}</p>
          </div>
        )}

        {/* Nível de Acesso */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Nível de Acesso
          </label>
          <div className="relative">
            <select
              value={form.nivel}
              onChange={(e) => setForm({ ...form, nivel: e.target.value as NivelAcesso })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition appearance-none bg-white"
            >
              <option value="Admin">Admin — Acesso total ao sistema</option>
              <option value="Advogado">Advogado — Acesso padrão de advogado</option>
              <option value="Estagiário">Estagiário — Acesso restrito (somente leitura)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {/* Preview das permissões padrão */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(permissoesPadrao[form.nivel])
              .filter(([, v]) => v)
              .slice(0, 5)
              .map(([k]) => (
                <span key={k} className="text-[10px] px-2 py-0.5 bg-[#1A2B3C]/8 text-[#1A2B3C] rounded-full">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            {Object.values(permissoesPadrao[form.nivel]).filter(Boolean).length > 5 && (
              <span className="text-[10px] text-slate-400">
                +{Object.values(permissoesPadrao[form.nivel]).filter(Boolean).length - 5} mais
              </span>
            )}
          </div>
        </div>
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
          onClick={handleAdd}
          disabled={salvando || salvo}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm
            ${salvo ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}
            disabled:opacity-80
          `}
        >
          {salvo ? (
            <><CheckCircle className="w-4 h-4" /> Adicionado!</>
          ) : salvando ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Adicionando…</>
          ) : (
            <><Plus className="w-4 h-4" /> Adicionar Usuário</>
          )}
        </button>
      </div>
    </ModalBase>
  );
}

// ─── Helper: mapeia perfil da API para NivelAcesso do frontend ────────────────

function perfilToNivel(perfil: string): NivelAcesso {
  const mapa: Record<string, NivelAcesso> = {
    Admin: 'Admin',
    Advogado: 'Advogado',
    'Estagiário': 'Estagiário',
    Estagiario: 'Estagiário',
  };
  return mapa[perfil] ?? 'Advogado';
}

// ─── TeamManagement (tela principal) ─────────────────────────────────────────

export function TeamManagement() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [permModal, setPermModal] = useState<{ isOpen: boolean; usuario: Usuario | null }>({ isOpen: false, usuario: null });
  const [addModal, setAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      const data = await listarUsuarios();
      setUsuarios(data.map((u) => {
        const nivel = perfilToNivel(u.perfil);
        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          telefone: u.telefone,
          nivel,
          status: (['Ativo', 'Inativo', 'Pendente'].includes(u.status) ? u.status : 'Ativo') as StatusUsuario,
          avatar: u.avatar,
          permissoes: { ...permissoesPadrao[nivel] },
        };
      }));
    } catch {
      // mantém lista vazia em caso de erro de rede
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarUsuarios(); }, [carregarUsuarios]);

  const abrirPermissoes = (u: Usuario) => setPermModal({ isOpen: true, usuario: u });
  const fecharPermissoes = () => setPermModal({ isOpen: false, usuario: null });

  const salvarPermissoes = (id: string, perms: Record<string, boolean>) => {
    setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, permissoes: perms } : u));
  };

  const adicionarUsuario = () => {
    carregarUsuarios();
  };

  const removerUsuario = (id: string) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    setConfirmDelete(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalAtivos = usuarios.filter((u) => u.status === 'Ativo').length;
  const totalAdmins = usuarios.filter((u) => u.nivel === 'Admin').length;

  return (
    <>
      {/* ── Modais ──────────────────────────────────────────────────────────── */}
      <ModalPermissoes
        isOpen={permModal.isOpen}
        usuario={permModal.usuario}
        onClose={fecharPermissoes}
        onSave={salvarPermissoes}
      />
      <ModalAdicionarUsuario
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onAdd={adicionarUsuario}
      />

      {/* Modal de confirmação de exclusão */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px]" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl z-10 p-6" style={{ boxShadow: '0 24px 64px rgba(26,43,60,0.22)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-[#1A2B3C] font-semibold">Remover Usuário</h4>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Tem certeza que deseja remover <strong>{usuarios.find((u) => u.id === confirmDelete)?.nome}</strong> do sistema?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => removerUsuario(confirmDelete)} className="flex-1 py-2.5 rounded-lg bg-red-500 text-sm text-white font-medium hover:bg-red-600 transition-colors">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Página ──��───────────────────────────────────────────────────────── */}
      <div className="p-8 max-w-7xl mx-auto">

        {/* ── Cabeçalho ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[#1A2B3C] mb-1">Gestão de Usuários e Permissões</h2>
            <p className="text-slate-500 text-sm">
              Controle de acesso baseado em perfis (RBAC) — {usuarios.length} membros cadastrados
            </p>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A2B3C] text-white rounded-xl hover:bg-[#243447] transition-colors shadow-sm text-sm font-medium flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        </div>

        {/* ── Chips de estatísticas ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total de Usuários', value: usuarios.length, icon: Users,     color: 'text-[#1A2B3C]', bg: 'bg-[#1A2B3C]/8' },
            { label: 'Usuários Ativos',   value: totalAtivos,     icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Administradores',   value: totalAdmins,     icon: Shield,    color: 'text-blue-600',   bg: 'bg-blue-50'    },
            { label: 'Níveis de Acesso',  value: 3,              icon: Lock,      color: 'text-amber-600',  bg: 'bg-amber-50'   },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <div key={chip.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">{chip.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${chip.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${chip.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-semibold ${chip.color}`}>{chip.value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Tabela de Usuários ───────────────────────────���───────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Topo da tabela */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[#1A2B3C] text-sm font-semibold">Membros da Equipe</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              Clique em <Settings2 className="w-3 h-3 inline mx-0.5" /> para editar permissões
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  {['Nome', 'E-mail', 'Nível de Acesso', 'Status', 'Permissões', 'Ações'].map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {carregando ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      Carregando usuários…
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : null}
                {!carregando && usuarios.map((u) => {
                  const isHov = hoveredRow === u.id;
                  const permAtivas = Object.values(u.permissoes).filter(Boolean).length;
                  const permTotal  = Object.values(u.permissoes).length;

                  return (
                    <tr
                      key={u.id}
                      onMouseEnter={() => setHoveredRow(u.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`transition-colors duration-150 ${isHov ? 'bg-slate-50/80' : 'bg-white'}`}
                    >
                      {/* Nome */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white text-xs font-bold">{u.avatar}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1A2B3C]">{u.nome}</p>
                            <p className="text-xs text-slate-400">{u.telefone}</p>
                          </div>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          <span className="text-sm text-slate-600">{u.email}</span>
                        </div>
                      </td>

                      {/* Nível de Acesso */}
                      <td className="px-6 py-4">
                        <NivelBadge nivel={u.nivel} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={u.status} />
                      </td>

                      {/* Permissões (mini barra de progresso) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                u.nivel === 'Admin' ? 'bg-[#1A2B3C]' :
                                u.nivel === 'Advogado' ? 'bg-blue-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${(permAtivas / permTotal) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {permAtivas}/{permTotal}
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Botão de permissões (engrenagem) */}
                          <button
                            onClick={() => abrirPermissoes(u)}
                            title="Editar Permissões"
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                              ${isHov
                                ? 'bg-[#1A2B3C] text-white shadow-sm'
                                : 'text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-100'
                              }
                            `}
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            Permissões
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => setConfirmDelete(u.id)}
                            title="Remover Usuário"
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela */}
          <div className="px-6 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {usuarios.length} usuários · {totalAtivos} ativos
            </span>
            <span className="text-xs text-slate-400">
              Atualizado em 27/04/2026
            </span>
          </div>
        </div>

        {/* Legenda de perfis RBAC */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            Referência de Perfis de Acesso (RBAC)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['Admin', 'Advogado', 'Estagiário'] as NivelAcesso[]).map((nivel) => {
              const cfg       = nivelConfig[nivel];
              const Icon      = cfg.icon;
              const qtdPerms  = Object.values(permissoesPadrao[nivel]).filter(Boolean).length;
              const descMap: Record<NivelAcesso, string> = {
                Admin:      'Acesso irrestrito a todas as funcionalidades e configurações do sistema.',
                Advogado:   'Pode criar e editar processos. Sem acesso a exclusão ou painel admin.',
                Estagiário: 'Apenas visualização. Não pode criar, editar nem excluir dados.',
              };
              return (
                <div key={nivel} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${nivel === 'Admin' ? 'bg-[#1A2B3C]' : nivel === 'Advogado' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    <Icon className={`w-4 h-4 ${nivel === 'Admin' ? 'text-white' : nivel === 'Advogado' ? 'text-blue-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <NivelBadge nivel={nivel} />
                      <span className="text-[10px] text-slate-400">{qtdPerms} permissões</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{descMap[nivel]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}