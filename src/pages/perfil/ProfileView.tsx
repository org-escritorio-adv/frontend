import { useState, useEffect } from 'react'
import {
  Mail,
  Phone,
  Award,
  Building2,
  Calendar,
  Shield,
  Edit3,
  Check,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { buscarMeuPerfil, atualizarMeuPerfil, type MeuPerfil } from '@/services/equipe.service'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  advogado: 'Advogado(a)',
  estagiario: 'Estagiário(a)'
}

// ─── Campo editável ────────────────────────────────────────────────────────────

function CampoEditavel({
  icon: Icon,
  label,
  value,
  placeholder,
  editavel,
  onChange
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  placeholder?: string
  editavel: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <div className="flex items-center gap-3 flex-shrink-0 w-40">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      {editavel ? (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? `Digite o ${label.toLowerCase()}…`}
          className="flex-1 text-sm text-[#1A2B3C] border border-[#D4AF37]/60 rounded-lg px-3 py-1.5
                     focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]
                     placeholder-slate-300 transition"
        />
      ) : (
        <p className="flex-1 text-sm font-medium text-[#1A2B3C] text-right truncate">
          {value || <span className="text-slate-300 font-normal italic">Não informado</span>}
        </p>
      )}
    </div>
  )
}

// ─── Campo somente leitura ─────────────────────────────────────────────────────

function CampoLeitura({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3 flex-shrink-0 w-40">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="flex-1 text-sm font-medium text-[#1A2B3C] text-right truncate">
        {value || <span className="text-slate-300 font-normal italic">—</span>}
      </p>
    </div>
  )
}

// ─── ProfileView ───────────────────────────────────────────────────────────────

export function ProfileView() {
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  // Form local (espelha os campos editáveis)
  const [form, setForm] = useState({ nome: '', telefone: '', oab: '' })

  useEffect(() => {
    buscarMeuPerfil()
      .then(data => {
        setPerfil(data)
        setForm({ nome: data.nome, telefone: data.telefone ?? '', oab: data.oab ?? '' })
      })
      .catch(() => setErro('Não foi possível carregar o perfil.'))
      .finally(() => setCarregando(false))
  }, [])

  const iniciarEdicao = () => {
    if (!perfil) return
    setForm({ nome: perfil.nome, telefone: perfil.telefone ?? '', oab: perfil.oab ?? '' })
    setSalvo(false)
    setErro('')
    setEditando(true)
  }

  const cancelarEdicao = () => {
    setEditando(false)
    setErro('')
  }

  const salvar = async () => {
    if (!form.nome.trim()) {
      setErro('O nome não pode ficar em branco.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const atualizado = await atualizarMeuPerfil({
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || undefined,
        oab: form.oab.trim() || undefined
      })
      setPerfil(atualizado)
      setSalvo(true)
      setEditando(false)
      setTimeout(() => setSalvo(false), 3000)
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // ── Loading / erro ────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{erro || 'Perfil não encontrado.'}</p>
        </div>
      </div>
    )
  }

  const nomeExibido = editando ? form.nome : perfil.nome
  const initials =
    nomeExibido
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'US'

  const roleLabel = ROLE_LABELS[perfil.perfil] ?? 'Usuário'

  const dataMembro = perfil.created_at
    ? new Date(perfil.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[#1A2B3C] text-xl font-semibold">Meu Perfil</h2>

        {!editando ? (
          <button
            onClick={iniciarEdicao}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar perfil
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelarEdicao}
              disabled={salvando}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors shadow-sm disabled:opacity-70"
            >
              {salvando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-sm mb-8">Dados pessoais e informações profissionais.</p>

      {/* Feedback de sucesso */}
      {salvo && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">Perfil atualizado com sucesso!</p>
        </div>
      )}

      {/* Feedback de erro */}
      {erro && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{erro}</p>
        </div>
      )}

      {/* Header card com avatar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1A2B3C] to-[#2A3B4C] flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white text-2xl font-bold tracking-wide">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editando ? (
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder="Seu nome completo"
                className="w-full text-lg font-semibold text-[#1A2B3C] border-b-2 border-[#D4AF37] bg-transparent
                           focus:outline-none pb-0.5 mb-1 placeholder-slate-300"
              />
            ) : (
              <h3 className="text-lg font-semibold text-[#1A2B3C] truncate">{perfil.nome}</h3>
            )}
            <p className="text-slate-500 text-sm truncate">{perfil.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1A2B3C]/8 rounded-full">
                <Shield className="w-3 h-3 text-[#D4AF37]" />
                <span className="text-xs font-semibold text-[#1A2B3C]">{roleLabel}</span>
              </span>
              {editando && (
                <span className="text-[10px] text-slate-400 italic">
                  * O perfil de acesso é gerenciado pelo administrador
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campos de informação */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {/* E-mail — somente leitura (gerenciado pelo Keycloak) */}
        <CampoLeitura icon={Mail} label="E-mail" value={perfil.email} />

        {/* Telefone — editável */}
        <CampoEditavel
          icon={Phone}
          label="Telefone"
          value={form.telefone}
          placeholder="(61) 99999-0000"
          editavel={editando}
          onChange={v => setForm({ ...form, telefone: v })}
        />

        {/* OAB — editável */}
        <CampoEditavel
          icon={Award}
          label="OAB"
          value={form.oab}
          placeholder="Ex: DF 12.345"
          editavel={editando}
          onChange={v => setForm({ ...form, oab: v })}
        />

        {/* Escritório — fixo */}
        <CampoLeitura icon={Building2} label="Escritório" value="Barcelos & Takaki Advogados" />

        {/* Membro desde — vem do banco */}
        <CampoLeitura icon={Calendar} label="Membro desde" value={dataMembro} />
      </div>

      <p className="text-center text-[11px] text-slate-300 mt-8">
        Barcelos & Takaki v2.4.1 · Sessão segura
      </p>
    </div>
  )
}
