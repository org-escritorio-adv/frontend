import { useState } from 'react'
import { Moon, Download, Globe, Phone, Mail, MapPin, Shield } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { AppLogo } from '@/shared/components/layout/AppLogo'
import { useAuth } from '@/context/AuthContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { exportarCsvProcessos } from '@/services/processos.service'
import { canExportDados } from '@/lib/rbac'

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none ${checked ? 'bg-[#1A2B3C]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export function AjustesMobile() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useDarkMode()
  const podeExportar = canExportDados(user)

  const [exporting, setExporting] = useState(false)
  const handleExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    try { await exportarCsvProcessos() }
    catch { alert('Erro ao tentar baixar o arquivo CSV.') }
    finally { setExporting(false) }
  }

  const userName = user?.name ?? 'Usuário'
  const userEmail = user?.email ?? ''
  const userRole = user?.role === 'admin' ? 'Administrador' : user?.role === 'advogado' ? 'Advogado' : 'Estagiário'
  const iniciais = userName.split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0].toUpperCase()).join('')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── User Profile Card ─────────────────────────── */}
      <div
        className="bg-[#1A2B3C] px-4 pt-5 pb-8 rounded-b-[32px]"
        style={{ boxShadow: '0 8px 24px rgba(26,43,60,0.30)' }}
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-[#C5A059] flex-shrink-0">
            <AvatarFallback className="bg-[#C5A059] text-white text-lg">{iniciais}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold mb-0.5 truncate">{userName}</h2>
            <p className="text-white/60 text-xs truncate mb-1">{userEmail}</p>
            <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
              <Shield className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[11px] text-white/80">{userRole}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ── Aparência ─────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Aparência</p>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}>
            <div
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
              onClick={() => setDarkMode(!darkMode)}
            >
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Moon className="w-4 h-4 text-[#1A2B3C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A2B3C] leading-tight">Modo Escuro</p>
                <p className="text-xs text-slate-400 mt-0.5">Alterna entre tema claro e escuro</p>
              </div>
              <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
            </div>
          </div>
        </div>

        {/* ── Dados ─────────────────────────────────────── */}
        {podeExportar && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Dados</p>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}>
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                onClick={handleExportCsv}
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className={`w-4 h-4 text-[#1A2B3C] ${exporting ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2B3C] leading-tight">Exportação de dados</p>
                  <p className="text-xs text-slate-400 mt-0.5">Baixe um CSV com todos os processos cadastrados</p>
                </div>
                <span className="text-xs font-medium text-[#C5A059] flex-shrink-0">
                  {exporting ? 'Baixando...' : 'Exportar'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Preferências ──────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Preferências</p>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-[#1A2B3C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A2B3C] leading-tight">Idioma e fuso horário</p>
                <p className="text-xs text-slate-400 mt-0.5">Português (Brasil) · UTC−3 (Brasília)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Suporte Técnico ───────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Suporte Técnico</p>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}>
            {([
              { icon: Phone, text: '(61) 98765-4321' },
              { icon: Mail, text: 'suporte@barcelostakaki.adv.br' },
              { icon: MapPin, text: 'SCLN 203, Bloco B, Asa Norte — Brasília, DF' }
            ] as const).map(({ icon: Icon, text }, idx) => (
              <div key={text} className={`flex items-center gap-3 px-4 py-3.5 ${idx < 2 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#1A2B3C]" />
                </div>
                <p className="text-sm text-slate-600 flex-1 min-w-0 break-all">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── App Info ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center" style={{ boxShadow: '0 2px 8px rgba(26,43,60,0.06)' }}>
          <div className="flex items-center justify-center mb-3">
            <AppLogo variant="dark" size="md" />
          </div>
          <p className="text-xs text-slate-500 mb-1">Versão 2.4.1 (Build 2026.04.28)</p>
          <p className="text-[11px] text-slate-400">© 2026 Barcelos &amp; Takaki. Todos os direitos reservados.</p>
        </div>

      </div>
    </div>
  )
}
