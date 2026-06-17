import { useEffect } from 'react'
import {
  X,
  Phone,
  Scale,
  Calendar,
  AlertCircle,
  Clock,
  Star,
  ExternalLink,
  Briefcase
} from 'lucide-react'
import type { ClienteAPI, ProcessoAPI } from '@/services/processos.service'

interface ClienteDetailPanelProps {
  cliente: ClienteAPI | null
  processos: ProcessoAPI[]
  isOpen: boolean
  onClose: () => void
  onViewProcesso: (id: string) => void
}

export function ClienteDetailPanel({
  cliente,
  processos,
  isOpen,
  onClose,
  onViewProcesso
}: ClienteDetailPanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !cliente) return null

  const ativos = processos.filter(p => p.status === 'ativo' || p.status === 'Ativo').length
  const arquivados = processos.filter(p => p.status === 'arquivado' || p.status === 'Arquivado').length

  return (
    <>
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 transition-all duration-300
          ${isOpen ? 'bg-[#1A2B3C]/40 backdrop-blur-[1px] pointer-events-auto' : 'bg-transparent pointer-events-none'}
        `}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed top-0 right-0 h-full z-50 w-[450px] max-w-[100vw]
          bg-white shadow-2xl rounded-l-2xl flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ boxShadow: '-8px 0 40px rgba(26,43,60,0.18), -2px 0 12px rgba(26,43,60,0.08)' }}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-gray-100 bg-slate-50 rounded-tl-2xl">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-2">
              <UserIcon className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Visão 360 do Cliente
              </span>
            </div>
            <h3 className="text-[#1A2B3C] text-lg font-bold leading-snug truncate">
              {cliente.nome_razao_social}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {cliente.cpf_cnpj}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A2B3C] hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Processos Ativos</p>
              <p className="text-2xl font-bold text-emerald-700">{ativos}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Arquivados</p>
              <p className="text-2xl font-bold text-slate-700">{arquivados}</p>
            </div>
          </div>

          <div className="mx-6 border-t border-gray-100" />

          {/* Contato */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Contato e Dados
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Telefone / Celular</p>
                  <p className="text-sm font-medium text-[#1A2B3C]">{cliente.telefone || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Tipo / Perfil</p>
                  <p className="text-sm font-medium text-[#1A2B3C]">
                    {cliente.cpf_cnpj?.length > 14 ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-6 border-t border-gray-100" />

          {/* Processos Atrelados */}
          <div className="px-6 py-5 pb-8">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Processos do Cliente ({processos.length})
            </p>
            {processos.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                Nenhum processo vinculado a este cliente.
              </div>
            ) : (
              <div className="space-y-3">
                {processos.map(proc => (
                  <div
                    key={proc.id}
                    onClick={() => {
                      onClose()
                      onViewProcesso(String(proc.id))
                    }}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#D4AF37]/50 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {proc.numero_cnj}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                        ${proc.status?.toLowerCase() === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {proc.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1A2B3C] mb-1 group-hover:text-[#D4AF37] transition-colors">
                      {proc.tribunal || 'Tribunal não informado'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      Partes: {proc.partes || 'Não informadas'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
