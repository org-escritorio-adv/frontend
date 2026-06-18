import { useState } from 'react'
import { Download, Globe, ChevronRight, Moon } from 'lucide-react'
import { exportarCsvProcessos } from '@/services/processos.service'
import { canExportDados } from '@/lib/rbac'
import { useAuth } from '@/context/AuthContext'
import { useDarkMode } from '@/hooks/useDarkMode'

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled = false
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
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
  )
}

// ─── SettingsView (principal) ─────────────────────────────────────────────────

export function SettingsView() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useDarkMode()
  const { user } = useAuth()
  const podeExportar = canExportDados(user)

  // ── Exportação de dados ────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const handleExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    try {
      await exportarCsvProcessos()
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao tentar baixar o arquivo CSV.')
    } finally {
      setExporting(false)
    }
  }

  // ── Itens de configuração ──────────────────────────────────────────────────
  const itens: {
    id: string
    label: string
    desc: string
    icon: React.ComponentType<{ className?: string }>
    onClick?: () => void
    actionLabel?: string
    badge?: { text: string; color: string }
  }[] = [
    ...(podeExportar
      ? [
          {
            id: 'exportacao',
            label: 'Exportação de dados',
            desc: 'Baixe um arquivo CSV com todos os processos cadastrados',
            icon: Download,
            onClick: handleExportCsv,
            actionLabel: exporting ? 'Baixando...' : 'Exportar'
          }
        ]
      : []),
    {
      id: 'idioma',
      label: 'Idioma e fuso horário',
      desc: 'Português (Brasil) · UTC−3 (Brasília)',
      icon: Globe
    }
  ]

  return (
    <>
      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-[#1A2B3C] text-xl font-semibold mb-2">Ajustes</h2>
        <p className="text-slate-500 text-sm mb-8">Gerencie as preferências do sistema.</p>

        {/* Card de Aparência */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div
            className={`flex items-center justify-between px-6 py-4 transition-colors duration-150 cursor-pointer select-none
              ${hoveredRow === 'darkmode' ? 'bg-[#F8F9FA]' : 'bg-white'}`}
            onMouseEnter={() => setHoveredRow('darkmode')}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() => setDarkMode(!darkMode)}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150
                ${hoveredRow === 'darkmode' ? 'bg-[#1A2B3C]/8' : 'bg-slate-50'}`}
              >
                <Moon
                  className={`w-4 h-4 transition-colors duration-150 ${hoveredRow === 'darkmode' ? 'text-[#1A2B3C]' : 'text-slate-400'}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A2B3C]">Modo escuro</p>
                <p className="text-xs text-slate-500 mt-0.5">Alterna entre tema claro e escuro</p>
              </div>
            </div>
            <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
          </div>
        </div>

        {/* Card principal de configurações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {itens.map(item => {
            const Icon = item.icon
            const isHov = hoveredRow === item.id
            const isClickable = !!item.onClick

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => {
                  if (item.onClick) item.onClick()
                }}
                className={`
                  flex items-center justify-between px-6 py-4
                  transition-colors duration-150 select-none
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  ${isHov ? 'bg-[#F8F9FA]' : 'bg-white'}
                `}
              >
                {/* Ícone + texto */}
                <div className="flex items-center gap-4">
                  <div
                    className={`
                    w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    transition-colors duration-150
                    ${isHov ? 'bg-[#1A2B3C]/8' : 'bg-slate-50'}
                  `}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors duration-150 ${isHov ? 'text-[#1A2B3C]' : 'text-slate-400'}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1A2B3C] transition-colors duration-150">
                        {item.label}
                      </p>
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badge.color}`}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                {/* Ação à direita */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {item.actionLabel && (
                    <span
                      className={`
                      text-xs font-medium transition-all duration-150
                      ${
                        isClickable
                          ? isHov
                            ? 'text-[#C5A059] underline underline-offset-2'
                            : 'text-[#C5A059]'
                          : 'text-slate-300'
                      }
                    `}
                    >
                      {item.actionLabel}
                    </span>
                  )}
                  {isClickable && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-all duration-150 ${
                        isHov ? 'text-[#C5A059] translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Card de Suporte Técnico */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#1A2B3C] mb-4">Suporte Técnico</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              📞 <span className="font-medium">(38) 99168-0612</span>
            </p>
            <p>
              📧 <span className="font-medium">julia.takaki@gmail.com</span>
            </p>
            <p>
              📍 <span className="font-medium">Brasília, DF</span>
            </p>
          </div>
        </div>

        {/* Versão do sistema */}
        <p className="text-center text-[11px] text-slate-300 mt-6">
          Barcelos & Takaki v2.4.1 · Build 2026.04.27 · Ambiente de Produção
        </p>
      </div>
    </>
  )
}
