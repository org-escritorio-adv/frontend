import { useState, useEffect, useCallback } from 'react'
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
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Columns3,
  Building2,
  Globe
} from 'lucide-react'
import { criarUsuario, listarUsuarios, atualizarPermissoes } from '@/services/equipe.service'
import { useAuth } from '@/context/AuthContext'
import { canManageUsuarios } from '@/lib/rbac'

// ─── Types ────────────────────────────────────────────────────────────────────

type NivelAcesso = 'Admin' | 'Advogado' | 'Estagiário'
type StatusUsuario = 'Ativo' | 'Inativo' | 'Pendente'

interface Usuario {
  id: string
  nome: string
  email: string
  telefone: string | null
  nivel: NivelAcesso
  status: StatusUsuario
  avatar: string
  permissoes: Record<string, boolean>
}

// ─── Permissões padrão por perfil ─────────────────────────────────────────────

const permissoesPadrao: Record<NivelAcesso, Record<string, boolean>> = {
  Admin: {
    visualizarProcessos: true,
    criarProcessos: true,
    editarProcessos: true,
    excluirProcessos: true,
    criarClientes: true,
    editarPerfisSite: true,
    publicarConteudo: true,
    exportarDados: true,
    acessarPainelAdmin: true,
    gerenciarUsuarios: true
  },
  Advogado: {
    visualizarProcessos: true,
    criarProcessos: true,
    editarProcessos: true,
    excluirProcessos: false,
    criarClientes: true,
    editarPerfisSite: false,
    publicarConteudo: false,
    exportarDados: true,
    acessarPainelAdmin: false,
    gerenciarUsuarios: false
  },
  Estagiário: {
    visualizarProcessos: true,
    criarProcessos: false,
    editarProcessos: false,
    excluirProcessos: false,
    criarClientes: false,
    editarPerfisSite: false,
    publicarConteudo: false,
    exportarDados: false,
    acessarPainelAdmin: false,
    gerenciarUsuarios: false
  }
}

// ─── RBAC Badge ───────────────────────────────────────────────────────────────

const nivelConfig: Record<NivelAcesso, { badge: string; dot: string; icon: typeof Shield }> = {
  Admin: {
    badge: 'bg-[#1A2B3C] text-white',
    dot: 'bg-white',
    icon: Shield
  },
  Advogado: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: UserCheck
  },
  Estagiário: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Users
  }
}

function NivelBadge({ nivel }: { nivel: NivelAcesso }) {
  const cfg = nivelConfig[nivel]
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {nivel}
    </span>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<StatusUsuario, { badge: string; dot: string }> = {
  Ativo: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  Inativo: {
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400'
  },
  Pendente: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  }
}

function StatusBadge({ status }: { status: StatusUsuario }) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}
    >
      <span
        className={`w-1 h-1 rounded-full ${cfg.dot} ${status === 'Ativo' ? 'animate-pulse' : ''}`}
      />
      {status}
    </span>
  )
}

// ─── Bottom Sheet: Adicionar Usuário ──────────────────────────────────────────

function BottomSheetAdicionarUsuario({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
}) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    nivel: 'Advogado' as NivelAcesso
  })
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [showSenha, setShowSenha] = useState(false)

  const handleAdd = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      setErro('Preencha nome, e-mail e senha temporária.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await criarUsuario({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        perfil: form.nivel
      })
      setSalvo(true)
      onAdd()
      setTimeout(() => {
        onClose()
        setForm({ nome: '', email: '', senha: '', nivel: 'Advogado' })
        setSalvo(false)
      }, 900)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(msg || 'Erro ao criar usuário. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px] z-50" onClick={onClose} />

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
              <h4 className="text-[#1A2B3C] font-semibold text-sm">Adicionar Usuário</h4>
              <p className="text-[10px] text-slate-400">Convide um novo membro</p>
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
              onChange={e => setForm({ ...form, nome: e.target.value })}
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
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="nome@barcelostakaki.adv.br"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Senha temporária */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Senha Temporária
            </label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={form.senha}
                onChange={e => setForm({ ...form, senha: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
              />
              <button
                type="button"
                onClick={() => setShowSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              O usuário poderá redefinir a senha no primeiro acesso.
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
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Nível de Acesso
            </label>
            <div className="relative">
              <select
                value={form.nivel}
                onChange={e => setForm({ ...form, nivel: e.target.value as NivelAcesso })}
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
              ${salvo ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}
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
  )
}

// ─── Helper: mapeia perfil da API para NivelAcesso do frontend ────────────────

function perfilToNivel(perfil: string): NivelAcesso {
  const mapa: Record<string, NivelAcesso> = {
    admin: 'Admin',
    advogado: 'Advogado',
    estagiario: 'Estagiário',
    estagiário: 'Estagiário'
  }
  const chave = (perfil ?? '').trim().toLowerCase()
  return mapa[chave] ?? 'Advogado'
}

// ─── Grupos de permissões (igual ao desktop) ─────────────────────────────────

interface GrupoPermissao {
  titulo: string
  icone: typeof Eye
  cor: string
  itens: { key: string; label: string; desc: string; danger?: boolean; destaque?: boolean }[]
}

const gruposPermissao: GrupoPermissao[] = [
  {
    titulo: 'Processos', icone: Columns3, cor: 'text-blue-500',
    itens: [
      { key: 'visualizarProcessos', label: 'Visualizar processos', desc: 'Acesso de leitura a todos os processos e casos do escritório.' },
      { key: 'criarProcessos', label: 'Criar novos processos', desc: 'Permissão para abrir e cadastrar novos processos no sistema.' },
      { key: 'editarProcessos', label: 'Editar processos', desc: 'Modificar dados, partes, prazos e movimentações de processos.' },
      { key: 'excluirProcessos', label: 'Excluir processos', desc: 'Remoção permanente de processos. Ação irreversível.', danger: true, destaque: true }
    ]
  },
  {
    titulo: 'Clientes', icone: Building2, cor: 'text-emerald-500',
    itens: [
      { key: 'criarClientes', label: 'Criar novos clientes', desc: 'Permissão para cadastrar novos clientes no sistema.' }
    ]
  },
  {
    titulo: 'Site Institucional', icone: Globe, cor: 'text-purple-500',
    itens: [
      { key: 'editarPerfisSite', label: 'Editar perfis do site', desc: 'Atualizar fotos, bios e especialidades dos advogados no portal.', destaque: true },
      { key: 'publicarConteudo', label: 'Publicar conteúdo', desc: 'Criar e publicar artigos, notícias e atualizações institucionais.' }
    ]
  },
  {
    titulo: 'Sistema e Dados', icone: Settings2, cor: 'text-slate-500',
    itens: [
      { key: 'exportarDados', label: 'Exportar dados', desc: 'Baixar relatórios em CSV/PDF com dados de processos e clientes.' },
      { key: 'acessarPainelAdmin', label: 'Acessar painel admin', desc: 'Visualizar métricas, logs e configurações avançadas do sistema.', danger: true },
      { key: 'gerenciarUsuarios', label: 'Gerenciar usuários', desc: 'Adicionar, editar e remover membros da equipe e seus acessos.', danger: true }
    ]
  }
]

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, danger = false }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={e => { e.stopPropagation(); onChange(!checked) }}
      className={`relative inline-flex items-center w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${checked ? (danger ? 'bg-red-500' : 'bg-[#1A2B3C]') : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Bottom Sheet: Painel de Permissões ──────────────────────────────────────

function BottomSheetPermissoes({
  usuario,
  onClose,
  onSave
}: {
  usuario: Usuario | null
  onClose: () => void
  onSave: (id: string, perms: Record<string, boolean>) => void
}) {
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (usuario) { setPerms({ ...usuario.permissoes }); setSalvo(false); setErro('') }
  }, [usuario])

  const handleSalvar = async () => {
    if (!usuario) return
    setSalvando(true)
    setErro('')
    try {
      const atualizado = await atualizarPermissoes(usuario.id, perms)
      setSalvo(true)
      onSave(usuario.id, atualizado.permissoes)
      setTimeout(onClose, 900)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(msg || 'Erro ao salvar permissões.')
    } finally {
      setSalvando(false)
    }
  }

  if (!usuario) return null

  return (
    <>
      <div className="fixed inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{usuario.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[#1A2B3C] font-semibold text-sm">{usuario.nome}</h4>
                <NivelBadge nivel={usuario.nivel} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Painel de Permissões</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso estagiário */}
        {usuario.nivel === 'Estagiário' && (
          <div className="mx-5 mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Perfil Estagiário — Acesso Restrito</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Permissões críticas estão desativadas por padrão para este nível.</p>
            </div>
          </div>
        )}

        {/* Grupos de permissões */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {gruposPermissao.map(grupo => {
            const GIcon = grupo.icone
            return (
              <div key={grupo.titulo}>
                <div className="flex items-center gap-2 mb-2">
                  <GIcon className={`w-3.5 h-3.5 ${grupo.cor}`} />
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{grupo.titulo}</p>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-1">
                  {grupo.itens.map(item => {
                    const isOn = perms[item.key] ?? false
                    return (
                      <div
                        key={item.key}
                        onClick={() => setPerms(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                          item.destaque
                            ? isOn
                              ? item.danger ? 'bg-red-50 border border-red-100' : 'bg-[#1A2B3C]/5 border border-[#1A2B3C]/10'
                              : 'bg-slate-50 border border-gray-100'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {item.danger && <Lock className={`w-3 h-3 flex-shrink-0 ${isOn ? 'text-red-500' : 'text-slate-300'}`} />}
                            <p className={`text-xs font-medium ${item.danger && isOn ? 'text-red-700' : 'text-[#1A2B3C]'}`}>{item.label}</p>
                            {item.danger && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-wide">Crítico</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                        <ToggleSwitch checked={isOn} onChange={v => setPerms(prev => ({ ...prev, [item.key]: v }))} danger={item.danger} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-center gap-2 px-5 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{erro}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-slate-50/60 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando || salvo}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm disabled:opacity-80 ${salvo ? 'bg-emerald-500' : 'bg-[#1A2B3C] hover:bg-[#243447]'}`}
          >
            {salvo ? <><CheckCircle className="w-4 h-4" /> Salvo!</> : salvando ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando…</> : 'Salvar Permissões'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── EquipeMobile (tela principal) ────────────────────────────────────────────

export function EquipeMobile() {
  const { user } = useAuth()
  const podeGerenciar = canManageUsuarios(user)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [nivelModal, setNivelModal] = useState<Usuario | null>(null)

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true)
      const data = await listarUsuarios()
      setUsuarios(
        data.map(u => {
          const nivel = perfilToNivel(u.perfil)
          return {
            id: u.id,
            nome: u.nome,
            email: u.email,
            telefone: u.telefone,
            nivel,
            status: (['Ativo', 'Inativo', 'Pendente'].includes(u.status)
              ? u.status
              : 'Ativo') as StatusUsuario,
            avatar: u.avatar,
            permissoes: { ...permissoesPadrao[nivel] }
          }
        })
      )
    } catch {
      // mantém lista vazia em caso de erro de rede
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarUsuarios()
  }, [carregarUsuarios])

  const adicionarUsuario = () => {
    carregarUsuarios()
  }

  const handleSalvarPermissoes = (id: string, perms: Record<string, boolean>) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, permissoes: perms } : u))
    setNivelModal(null)
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalAtivos = usuarios.filter(u => u.status === 'Ativo').length
  const totalAdmins = usuarios.filter(u => u.nivel === 'Admin').length

  return (
    <>
      {/* Bottom Sheets */}
      <BottomSheetAdicionarUsuario
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onAdd={adicionarUsuario}
      />
      {nivelModal && (
        <BottomSheetPermissoes
          usuario={nivelModal}
          onClose={() => setNivelModal(null)}
          onSave={handleSalvarPermissoes}
        />
      )}

      <div className="min-h-screen bg-slate-50 px-4 py-6">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">Gestão de Equipe</h2>
          <p className="text-slate-500 text-sm">{usuarios.length} membros cadastrados</p>
        </div>

        {/* ── Estatísticas ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Total de Usuários', value: usuarios.length, icon: Users, color: 'text-[#1A2B3C]', bg: 'bg-[#1A2B3C]/8' },
            { label: 'Usuários Ativos', value: totalAtivos, icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Administradores', value: totalAdmins, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Níveis de Acesso', value: 3, icon: Settings2, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' }
          ].map(chip => {
            const Icon = chip.icon
            return (
              <div key={chip.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">{chip.label}</span>
                  <div className={`w-6 h-6 rounded-lg ${chip.bg} flex items-center justify-center`}>
                    <Icon className={`w-3 h-3 ${chip.color}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${chip.color}`}>{chip.value}</p>
              </div>
            )
          })}
        </div>


        {/* ── Botão Adicionar ────────────────────────────────────────────── */}
        {podeGerenciar && (
          <button
            onClick={() => setAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#1A2B3C] text-white rounded-xl hover:bg-[#243447] transition-colors shadow-sm text-sm font-medium mb-6"
          >
            <Plus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        )}

        {/* ── Lista de Usuários ──────────────────────────────────────────── */}
        {carregando && (
          <p className="text-center text-sm text-slate-400 py-8">Carregando usuários…</p>
        )}
        {!carregando && usuarios.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Nenhum usuário encontrado.</p>
        )}
        <div className="space-y-3">
          {!carregando &&
            usuarios.map(u => {
              const permAtivas = Object.values(u.permissoes).filter(Boolean).length
              const permTotal = Object.values(u.permissoes).length

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold">{u.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A2B3C] truncate">{u.nome}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <NivelBadge nivel={u.nivel} />
                          <StatusBadge status={u.status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="text-xs text-slate-600 truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="text-xs text-slate-600">{u.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${u.nivel === 'Admin' ? 'bg-[#1A2B3C]' : u.nivel === 'Advogado' ? 'bg-blue-400' : 'bg-amber-400'}`}
                          style={{ width: `${(permAtivas / permTotal) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{permAtivas}/{permTotal}</span>
                    </div>

                    {podeGerenciar && (
                      <button
                        onClick={() => setNivelModal(u)}
                        className="w-full flex items-center justify-center gap-2 mt-1 px-3 py-2 rounded-lg bg-[#1A2B3C] text-white text-xs font-medium hover:bg-[#243447] transition-colors"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        Permissões
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}
