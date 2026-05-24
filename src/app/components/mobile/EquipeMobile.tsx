import { useState } from "react";
import {
  Plus,
  Users,
  Shield,
  UserCheck,
  BadgeCheck,
  Mail,
  Phone,
  ChevronRight,
  X,
  Edit,
  ChevronDown,
  Settings2,
  CheckCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NivelAcesso = "Admin" | "Advogado" | "Estagiário";
type StatusUsuario = "Ativo" | "Inativo" | "Pendente";

interface Usuario {
  id: number;
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
    visualizarProcessos: true,
    criarProcessos: true,
    editarProcessos: true,
    excluirProcessos: true,
    editarPerfisSite: true,
    publicarConteudo: true,
    exportarDados: true,
    acessarPainelAdmin: true,
    gerenciarUsuarios: true,
  },
  Advogado: {
    visualizarProcessos: true,
    criarProcessos: true,
    editarProcessos: true,
    excluirProcessos: false,
    editarPerfisSite: false,
    publicarConteudo: false,
    exportarDados: true,
    acessarPainelAdmin: false,
    gerenciarUsuarios: false,
  },
  Estagiário: {
    visualizarProcessos: true,
    criarProcessos: false,
    editarProcessos: false,
    excluirProcessos: false,
    editarPerfisSite: false,
    publicarConteudo: false,
    exportarDados: false,
    acessarPainelAdmin: false,
    gerenciarUsuarios: false,
  },
};

// ─── RBAC Badge ───────────────────────────────────────────────────────────────

const nivelConfig: Record<
  NivelAcesso,
  { badge: string; dot: string; icon: typeof Shield }
> = {
  Admin: {
    badge: "bg-[#1A2B3C] text-white",
    dot: "bg-white",
    icon: Shield,
  },
  Advogado: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: UserCheck,
  },
  Estagiário: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: Users,
  },
};

function NivelBadge({ nivel }: { nivel: NivelAcesso }) {
  const cfg = nivelConfig[nivel];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {nivel}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<StatusUsuario, { badge: string; dot: string }> = {
  Ativo: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Inativo: {
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
  Pendente: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
};

function StatusBadge({ status }: { status: StatusUsuario }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}
    >
      <span
        className={`w-1 h-1 rounded-full ${cfg.dot} ${status === "Ativo" ? "animate-pulse" : ""}`}
      />
      {status}
    </span>
  );
}

// ─── Bottom Sheet: Adicionar Usuário ──────────────────────────────────────────

function BottomSheetAdicionarUsuario({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (u: Omit<Usuario, "id">) => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    nivel: "Advogado" as NivelAcesso,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const handleAdd = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSalvo(true);
      onAdd({
        nome: form.nome || "Novo Usuário",
        email: form.email || "novo@barcelostakaki.adv.br",
        telefone: form.telefone || "(61) 99999-0000",
        nivel: form.nivel,
        status: "Pendente",
        avatar: "",
        permissoes: { ...permissoesPadrao[form.nivel] },
      });
      setTimeout(() => {
        onClose();
        setForm({ nome: "", email: "", telefone: "", nivel: "Advogado" });
        setSalvo(false);
      }, 900);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A2B3C]/8 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#1A2B3C]" />
            </div>
            <div>
              <h4 className="text-[#1A2B3C] font-semibold text-sm">
                Adicionar Usuário
              </h4>
              <p className="text-[10px] text-slate-400">
                Convide um novo membro
              </p>
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
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Nome */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Edit className="w-2.5 h-2.5" /> Nome Completo
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Dr. João Silva"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mail className="w-2.5 h-2.5" /> E-mail Institucional
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nome@barcelostakaki.adv.br"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Phone className="w-2.5 h-2.5" /> Telefone
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(61) 9XXXX-XXXX"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Nível de Acesso */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Nível de Acesso
            </label>
            <div className="relative">
              <select
                value={form.nivel}
                onChange={(e) =>
                  setForm({ ...form, nivel: e.target.value as NivelAcesso })
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition appearance-none bg-white"
              >
                <option value="Admin">Admin — Acesso total</option>
                <option value="Advogado">Advogado — Acesso padrão</option>
                <option value="Estagiário">Estagiário — Somente leitura</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-slate-600 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={salvando || salvo}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm
              ${salvo ? "bg-emerald-500" : "bg-[#1A2B3C] hover:bg-[#243447]"}
              disabled:opacity-80
            `}
          >
            {salvo ? (
              <>
                <CheckCircle className="w-4 h-4" /> Adicionado!
              </>
            ) : salvando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Adicionar
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── EquipeMobile (tela principal) ────────────────────────────────────────────

export function EquipeMobile() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: 1,
      nome: "Dr. Carlos Silva",
      email: "carlos.silva@barcelostakaki.adv.br",
      telefone: "(61) 98765-4321",
      nivel: "Admin",
      status: "Ativo",
      avatar: "CS",
      permissoes: { ...permissoesPadrao["Admin"] },
    },
    {
      id: 2,
      nome: "Dra. Ana Costa",
      email: "ana.costa@barcelostakaki.adv.br",
      telefone: "(61) 97654-3210",
      nivel: "Advogado",
      status: "Ativo",
      avatar: "AC",
      permissoes: { ...permissoesPadrao["Advogado"] },
    },
    {
      id: 3,
      nome: "Pedro Lima",
      email: "pedro.lima@barcelostakaki.adv.br",
      telefone: "(61) 96543-2109",
      nivel: "Estagiário",
      status: "Pendente",
      avatar: "PL",
      permissoes: { ...permissoesPadrao["Estagiário"] },
    },
  ]);

  const [addModal, setAddModal] = useState(false);

  const adicionarUsuario = (novoU: Omit<Usuario, "id">) => {
    setUsuarios((prev) => [...prev, { ...novoU, id: Date.now() }]);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalAtivos = usuarios.filter((u) => u.status === "Ativo").length;
  const totalAdmins = usuarios.filter((u) => u.nivel === "Admin").length;

  return (
    <>
      {/* Bottom Sheet */}
      <BottomSheetAdicionarUsuario
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onAdd={adicionarUsuario}
      />

      <div className="min-h-screen bg-slate-50 px-4 py-6">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">
            Gestão de Equipe
          </h2>
          <p className="text-slate-500 text-sm">
            {usuarios.length} membros cadastrados
          </p>
        </div>

        {/* ── Estatísticas ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Total",
              value: usuarios.length,
              icon: Users,
              color: "text-[#1A2B3C]",
              bg: "bg-[#1A2B3C]/8",
            },
            {
              label: "Ativos",
              value: totalAtivos,
              icon: BadgeCheck,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Admins",
              value: totalAdmins,
              icon: Shield,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <div
                key={chip.label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {chip.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-lg ${chip.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-3 h-3 ${chip.color}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${chip.color}`}>
                  {chip.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Botão Adicionar ────────────────────────────────────────────── */}
        <button
          onClick={() => setAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#1A2B3C] text-white rounded-xl hover:bg-[#243447] transition-colors shadow-sm text-sm font-medium mb-6"
        >
          <Plus className="w-4 h-4" />
          Adicionar Usuário
        </button>

        {/* ── Lista de Usuários ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {usuarios.map((u) => {
            const permAtivas = Object.values(u.permissoes).filter(Boolean)
              .length;
            const permTotal = Object.values(u.permissoes).length;

            return (
              <div
                key={u.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {u.avatar}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2B3C] truncate">
                        {u.nome}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <NivelBadge nivel={u.nivel} />
                        <StatusBadge status={u.status} />
                      </div>
                    </div>
                  </div>
                  <button className="flex-shrink-0 text-slate-300 hover:text-[#1A2B3C] transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Detalhes */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {/* E-mail */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-600 truncate">
                      {u.email}
                    </span>
                  </div>
                  {/* Telefone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-600">{u.telefone}</span>
                  </div>
                  {/* Permissões */}
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            u.nivel === "Admin"
                              ? "bg-[#1A2B3C]"
                              : u.nivel === "Advogado"
                                ? "bg-blue-400"
                                : "bg-amber-400"
                          }`}
                          style={{
                            width: `${(permAtivas / permTotal) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {permAtivas}/{permTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
