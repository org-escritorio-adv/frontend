import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { routePaths } from '@/routeConfig'
import {
  Heart,
  Scale,
  Briefcase,
  Building2,
  Home,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronRight,
  Target,
  Eye,
  Sparkles,
  Send,
  Calendar,
  ArrowRight,
  FileText,
  CheckCircle
} from 'lucide-react'
import imgLawyer1 from 'figma:asset/a7e6d94e594d35091b59bec3936bae889629478e.png'
import imgLawyer2 from 'figma:asset/06f1466dcaf261268bcf5b48e2f367be33965c0f.png'
const imgLogo = '/logo.png'

// ─── Shared style helpers ────────────────────────────────────────────────────
const montserrat = { fontFamily: "'Montserrat', sans-serif" } as React.CSSProperties
const playfair = { fontFamily: "'Playfair Display', serif" } as React.CSSProperties
const ebGaramond = { fontFamily: "'EB Garamond', serif" } as React.CSSProperties

// ─── Data ────────────────────────────────────────────────────────────────────
const serviceAreas = [
  {
    id: 1,
    Icon: Heart,
    title: 'Direito de Família',
    desc: 'Divórcio, guarda de filhos, pensão alimentícia, reconhecimento de paternidade e planejamento sucessório.'
  },
  {
    id: 2,
    Icon: Scale,
    title: 'Direito Civil',
    desc: 'Contratos, indenizações por danos morais e materiais, responsabilidade civil e cobranças.'
  },
  {
    id: 3,
    Icon: Briefcase,
    title: 'Direito Trabalhista',
    desc: 'Contencioso trabalhista completo, na defesa de empresas e na representação de trabalhadores.'
  },
  {
    id: 4,
    Icon: Building2,
    title: 'Direito Administrativo',
    desc: 'Assessoria em processos administrativos, licitações, contratos públicos e ações contra o poder público.'
  },
  {
    id: 5,
    Icon: Home,
    title: 'Direito Imobiliário',
    desc: 'Regularização de imóveis, revisão contratual, disputas possessórias e ações dominiais.'
  },
  {
    id: 6,
    Icon: Receipt,
    title: 'Direito Tributário',
    desc: 'Demandas judiciais e administrativas tributárias, planejamento fiscal e defesa em execuções.'
  }
]

const missionValues = [
  {
    id: 'missao',
    Icon: Target,
    title: 'Missão',
    text: 'Prestar serviços jurídicos de excelência, protegendo os interesses de nossos clientes e alcançando resultados consistentes por meio de estratégia, rigor técnico e atuação comprometida.'
  },
  {
    id: 'visao',
    Icon: Eye,
    title: 'Visão',
    text: 'Ser reconhecido como escritório de referência, pautado pela excelência, inovação e alto nível de satisfação de nossos clientes em todas as áreas de atuação.'
  },
  {
    id: 'valores',
    Icon: Sparkles,
    title: 'Valores',
    text: 'Integridade, excelência, foco no cliente, inovação, responsabilidade e respeito — princípios que orientam cada decisão e cada relacionamento construído ao longo do tempo.'
  }
]

const stats = [
  { num: '5+', label: 'Anos de Excelência', sub: 'Atendendo clientes com brio.' },
  { num: '100+', label: 'Casos Atendidos', sub: 'Confiança construída com resultados.' },
  { num: 'DF', label: 'Presença Nacional', sub: 'Atendendo casos por todo o Brasil.' }
]

// ─── Section: Navbar ─────────────────────────────────────────────────────────
function Navbar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = [
    { label: 'Serviços', href: '#servicos' },
    { label: 'Nossa Missão', href: '#missao' },
    { label: 'Equipe', href: '#equipe' },
    { label: 'Contato', href: '#contato' }
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(18,18,18,0.97)'
          : 'linear-gradient(to bottom, rgba(18,18,18,0.9), transparent)',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(197,160,89,0.15)' : 'none'
      }}
    >
      <div className="max-w-[1216px] mx-auto px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <img src={imgLogo} alt="Barcelos & Takaki" className="h-9 w-auto object-contain" />
          <div style={montserrat}>
            <p className="text-[#f5f5f5] text-[14px] leading-none" style={{ fontWeight: 600 }}>
              Barcelos &amp; Takaki
            </p>
            <p
              className="text-[#c5a059] text-[11px] leading-none mt-0.5"
              style={{ fontWeight: 400 }}
            >
              Advocacia
            </p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="text-[#f5f5f5] text-[14px] hover:text-[#c5a059] transition-colors"
              style={montserrat}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to={routePaths.login}
            className="h-[40px] px-5 rounded-[10px] text-[#f5f5f5] text-[14px] border border-[rgba(197,160,89,0.4)] hover:border-[#c5a059] hover:text-[#c5a059] transition-all flex items-center"
            style={montserrat}
          >
            Área do Advogado
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-[#f5f5f5]" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-[#121212] border-t border-[rgba(197,160,89,0.15)] px-8 py-4 flex flex-col gap-4">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[#f5f5f5] text-[16px]"
              style={montserrat}
            >
              {l.label}
            </a>
          ))}
          <Link
            to={routePaths.login}
            className="text-[#c5a059] text-[16px]"
            style={montserrat}
            onClick={() => setOpen(false)}
          >
            Área do Advogado →
          </Link>
        </div>
      )}
    </header>
  )
}

// ─── Section: Hero ───────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          'linear-gradient(155.129deg, #121212 0%, #141414 12.5%, #161616 25%, #181818 37.5%, #1a1a1a 50%, #181818 62.5%, #161616 75%, #141414 87.5%, #121212 100%)'
      }}
    >
      {/* Decorative blurs */}
      <div className="absolute top-[80px] right-[200px] w-[384px] h-[384px] rounded-full bg-[#c5a059] opacity-5 blur-[64px]" />
      <div className="absolute top-[449px] left-[80px] w-[384px] h-[384px] rounded-full bg-[#c5a059] opacity-5 blur-[64px]" />

      <div className="relative max-w-[1216px] mx-auto px-8 pt-28 pb-20 w-full">
        <div className="max-w-[660px]">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="w-8 h-px bg-[#c5a059]" />
            <span className="text-[#c5a059] text-[13px]" style={montserrat}>
              Escritório de Advocacia · Brasília, DF
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-[#f5f5f5] mb-2 leading-[1.1]"
            style={{ ...ebGaramond, fontSize: 'clamp(48px,5vw,72px)', fontWeight: 500 }}
          >
            Defendemos o que
            <br />
            mais importa
          </h1>
          <h1
            className="mb-8 leading-[1.1]"
            style={{
              ...ebGaramond,
              fontSize: 'clamp(48px,5vw,72px)',
              fontWeight: 500,
              fontStyle: 'italic',
              color: '#c5a059'
            }}
          >
            para você
          </h1>

          {/* Subtitle */}
          <p
            className="text-[#f5f5f5] text-[18px] leading-[1.8] mb-10 max-w-[562px] text-justify"
            style={montserrat}
          >
            Soluções jurídicas estratégicas com rigor técnico, ética inabalável e compromisso com os
            resultados do cliente.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <a
              href="#contato"
              className="h-[56px] px-8 bg-[#c5a059] rounded-[10px] text-[#121212] text-[16px] flex items-center gap-2 hover:bg-[#b8903f] transition-colors shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]"
              style={{ ...montserrat, fontWeight: 500 }}
            >
              <Calendar className="w-5 h-5" />
              Agendar Consulta Inicial
            </a>
            <a
              href="#servicos"
              className="h-[56px] px-6 rounded-[10px] text-[#c5a059] text-[16px] flex items-center gap-2 hover:bg-[rgba(197,160,89,0.08)] transition-colors border border-[rgba(197,160,89,0.3)]"
              style={montserrat}
            >
              Conheça o escritório
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Nossos Serviços Jurídicos ──────────────────────────────────────
function ServicosSection() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section id="servicos" className="bg-[#f5f5f5] py-24 relative overflow-hidden">
      <div className="max-w-[1216px] mx-auto px-8">
        {/* Heading */}
        <div className="text-center mb-5">
          <h2
            className="text-[#121212] text-[48px] leading-[48px]"
            style={{ ...playfair, fontWeight: 500 }}
          >
            Nossos Serviços Jurídicos
          </h2>
        </div>
        <p
          className="text-[#4a5565] text-[18px] leading-[28px] text-center max-w-[672px] mx-auto mb-16"
          style={montserrat}
        >
          O escritório atua de forma abrangente nas principais áreas do Direito, com forte vocação
          para o contencioso estratégico e orientação preventiva voltada à proteção dos interesses
          do cliente.
        </p>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {serviceAreas.map(area => {
            const Icon = area.Icon
            return (
              <div
                key={area.id}
                className="bg-white rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] overflow-hidden relative group hover:shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.12)] transition-shadow"
              >
                {/* Gold top accent */}
                <div className="absolute top-0 left-0 h-[4px] w-0 bg-[#c5a059] group-hover:w-full transition-all duration-500" />

                <div className="p-8">
                  {/* Icon box */}
                  <div className="w-[64px] h-[64px] bg-[#1b2539] rounded-[10px] flex items-center justify-center mb-8">
                    <Icon className="w-8 h-8 text-[#c5a059]" strokeWidth={1.5} />
                  </div>

                  <h3
                    className="text-[#1b2539] text-[24px] leading-[32px] mb-4"
                    style={{ ...playfair, fontWeight: 500 }}
                  >
                    {area.title}
                  </h3>
                  <p className="text-[#4a5565] text-[16px] leading-[26px]" style={montserrat}>
                    {area.desc}
                  </p>

                  <a
                    href="#contato"
                    className="mt-6 flex items-center gap-1 text-[#c5a059] text-[14px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Solicitar consulta <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Decorative watermark icon */}
                <div className="absolute bottom-4 right-4 opacity-5">
                  <Icon className="w-24 h-24 text-[#c5a059]" strokeWidth={1} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-[#4a5565] text-[16px] leading-[24px] mb-4" style={montserrat}>
            Não encontrou sua necessidade específica? Atuamos em diversas áreas do Direito.
          </p>
          <a
            href="#analisar-caso"
            className="inline-flex items-center gap-2 h-[52px] px-8 border-2 border-[#121212] rounded-[10px] text-[#121212] text-[16px] hover:bg-[#121212] hover:text-[#f5f5f5] transition-colors"
            style={{ ...montserrat, fontWeight: 500 }}
          >
            <FileText className="w-5 h-5" />
            Enviar meu Caso para Análise
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Enviar Caso para Análise ───────────────────────────────────────
function AnalisarCasoSection() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', area: '', descricao: '' })
  const [submitted, setSubmitted] = useState(false)

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputCls =
    'w-full h-[50px] bg-white rounded-[10px] border border-[#d1d5dc] px-4 text-[16px] text-[#121212] placeholder-[rgba(10,10,10,0.4)] outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition'

  return (
    <section id="analisar-caso" className="bg-white py-24">
      <div className="max-w-[1216px] mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2
            className="text-[#121212] text-[48px] leading-[48px] mb-4"
            style={{ ...playfair, fontWeight: 500 }}
          >
            Envie seu Caso para Análise
          </h2>
          <p
            className="text-[#4a5565] text-[18px] leading-[28px] max-w-[600px] mx-auto"
            style={montserrat}
          >
            Preencha o formulário abaixo e nossa equipe jurídica analisará seu caso e entrará em
            contato em até 24 horas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-[960px] mx-auto">
          {/* Form */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                <div className="w-16 h-16 bg-[#c5a059]/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[#c5a059]" />
                </div>
                <h3 className="text-[#1b2539] text-[24px]" style={{ ...playfair, fontWeight: 500 }}>
                  Caso enviado!
                </h3>
                <p
                  className="text-[#4a5565] text-[16px] text-center leading-relaxed"
                  style={montserrat}
                >
                  Nossa equipe analisará seu caso e retornará o contato em até 24 horas.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-[#c5a059] text-[14px] underline"
                  style={montserrat}
                >
                  Enviar outro caso
                </button>
              </div>
            ) : (
              <form onSubmit={handle} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Nome Completo *
                  </label>
                  <input
                    required
                    className={inputCls}
                    placeholder="João Silva"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-[#364153] text-[14px]"
                      style={{ ...montserrat, fontWeight: 500 }}
                    >
                      E-mail *
                    </label>
                    <input
                      required
                      type="email"
                      className={inputCls}
                      placeholder="joao@email.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-[#364153] text-[14px]"
                      style={{ ...montserrat, fontWeight: 500 }}
                    >
                      Telefone *
                    </label>
                    <input
                      required
                      className={inputCls}
                      placeholder="(61) 9XXXX-XXXX"
                      value={form.telefone}
                      onChange={e => setForm({ ...form, telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Área do Direito *
                  </label>
                  <select
                    required
                    className="w-full h-[50px] bg-white rounded-[10px] border border-[#d1d5dc] px-4 text-[16px] text-[#121212] outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition"
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                  >
                    <option value="">Selecione a área...</option>
                    <option>Direito de Família</option>
                    <option>Direito Civil</option>
                    <option>Direito Trabalhista</option>
                    <option>Direito Administrativo</option>
                    <option>Direito Imobiliário</option>
                    <option>Direito Tributário</option>
                    <option>Outra área</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Descreva brevemente seu caso *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-white rounded-[10px] border border-[#d1d5dc] px-4 py-3 text-[16px] text-[#121212] placeholder-[rgba(10,10,10,0.4)] outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition resize-none"
                    placeholder="Explique de forma breve sua demanda/caso."
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="h-[56px] w-full bg-[#c5a059] rounded-[10px] text-[#121212] text-[16px] flex items-center justify-center gap-2 hover:bg-[#b8903f] transition-colors shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                  style={{ ...montserrat, fontWeight: 500 }}
                >
                  <Send className="w-5 h-5" />
                  Enviar para Análise
                </button>

                <p className="text-[#6a7282] text-[12px] text-center" style={montserrat}>
                  Ao enviar, você concorda com nossa política de privacidade e termos de uso.
                </p>
              </form>
            )}
          </div>

          {/* Benefits panel */}
          <div className="bg-[#1b2539] rounded-[10px] p-10 flex flex-col justify-between shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div>
              <div className="w-16 h-16 bg-[#c5a059] rounded-full flex items-center justify-center mb-6">
                <img src={imgLogo} alt="Logo" className="h-8 w-auto object-contain" />
              </div>
              <h3
                className="text-[#f5f5f5] text-[28px] leading-tight mb-4"
                style={{ ...playfair, fontWeight: 500 }}
              >
                Análise gratuita
                <br />
                do seu caso
              </h3>
              <p
                className="text-[#f5f5f5] text-[16px] leading-relaxed opacity-80 mb-8"
                style={montserrat}
              >
                Nossa equipe de advogados especializados avaliará seu caso sem compromisso e
                indicará o melhor caminho jurídico.
              </p>
              <ul className="flex flex-col gap-4">
                {[
                  'Resposta em até 24 horas',
                  'Sigilo e confidencialidade garantidos',
                  'Equipe especializada por área',
                  'Sem compromisso inicial'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c5a059]/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-[#c5a059]" />
                    </div>
                    <span className="text-[#f5f5f5] text-[15px] opacity-80" style={montserrat}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decorative bars */}
            <div className="mt-8 flex flex-col gap-2">
              <div className="h-[8px] w-[96px] bg-[#c5a059] opacity-30 rounded-full" />
              <div className="h-[8px] w-[64px] bg-[#c5a059] opacity-20 rounded-full" />
              <div className="h-[8px] w-[80px] bg-[#c5a059] opacity-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Nossa Missão ───────────────────────────────────────────────────
function MissaoSection() {
  return (
    <section id="missao" className="bg-[#1b2539] py-24 overflow-hidden">
      <div className="max-w-[1216px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left – dark panel with logo */}
          <div className="relative">
            <div
              className="rounded-[10px] h-[580px] flex items-center justify-center overflow-hidden shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] relative"
              style={{
                background:
                  'linear-gradient(128.66deg, #121212 0%, #151515 22%, #1a1a1a 55%, #242424 88%, #2a2a2a 100%)'
              }}
            >
              {/* Decorative borders */}
              <div className="absolute top-8 right-8 w-24 h-24 border-2 border-[#c5a059] opacity-20 rounded-[10px]" />
              <div className="absolute bottom-16 left-8 w-32 h-32 border-2 border-[#c5a059] opacity-10 rounded-full" />

              {/* Logo + decoration */}
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-[#c5a059] rounded-full flex items-center justify-center shadow-[0px_20px_25px_0px_rgba(0,0,0,0.3)]">
                  <img src={imgLogo} alt="Logo" className="h-16 w-auto object-contain" />
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <div className="h-[8px] w-[96px] bg-[#c5a059] opacity-30 rounded-full" />
                  <div className="h-[8px] w-[64px] bg-[#c5a059] opacity-20 rounded-full" />
                  <div className="h-[8px] w-[80px] bg-[#c5a059] opacity-10 rounded-full" />
                </div>
              </div>

              {/* 10+ badge */}
              <div className="absolute bottom-8 right-8 bg-[#c5a059] rounded-[10px] px-6 py-4 shadow-[0px_20px_25px_0px_rgba(0,0,0,0.2)]">
                <p
                  className="text-[#121212] text-[36px] leading-none"
                  style={{ ...playfair, fontWeight: 400 }}
                >
                  10+
                </p>
                <p className="text-[#121212] text-[14px]" style={montserrat}>
                  Anos de Excelência
                </p>
              </div>
            </div>
          </div>

          {/* Right – mission text */}
          <div>
            <h2
              className="mb-4 text-[48px] leading-[48px]"
              style={{ ...playfair, fontWeight: 500 }}
            >
              <span className="text-[#f5f5f5]">Nossa</span>{' '}
              <span className="text-[#c5a059]">Missão</span>
            </h2>
            <div className="w-24 h-[4px] bg-[#c5a059] mb-8 rounded-full" />
            <p
              className="text-[#f5f5f5] text-[18px] leading-[29px] text-justify mb-6"
              style={montserrat}
            >
              Barcelos &amp; Takaki foi fundado com base no princípio de que uma atuação jurídica de
              excelência vai além do domínio técnico do Direito. Ela exige visão estratégica,
              capacidade analítica e compromisso absoluto com os interesses de cada cliente.
            </p>
            <p
              className="text-[#f5f5f5] text-[18px] leading-[26px] text-justify mb-10"
              style={montserrat}
            >
              Nosso escritório atua de forma personalizada, atendendo pessoas físicas e jurídicas em
              diferentes áreas do Direito. Aliamos solidez jurídica tradicional a uma abordagem
              moderna orientada a resultados.
            </p>

            {/* Values */}
            <div className="flex flex-col gap-5">
              {missionValues.map(v => {
                const Icon = v.Icon
                return (
                  <div
                    key={v.id}
                    className="bg-[#f5f5f5] rounded-[10px] px-6 py-5 flex gap-4 items-start"
                  >
                    <div className="w-12 h-12 bg-[#1b2539] rounded-[10px] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#c5a059]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4
                        className="text-[#1b2539] text-[20px] leading-[28px] mb-1"
                        style={{ ...playfair, fontWeight: 500 }}
                      >
                        {v.title}
                      </h4>
                      <p
                        className="text-[#4a5565] text-[15px] leading-[26px] text-justify"
                        style={montserrat}
                      >
                        {v.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Equipe ─────────────────────────────────────────────────────────
const teamMembers = [
  {
    id: 1,
    img: imgLawyer1,
    name: 'Dr. Gabriel Barcelos',
    role: 'Advogado',
    specialty: 'Administrativo e Compliance',
    oab: 'OAB/DF 79.287',
    email: 'gbcsilva8@gmail.com',
    phone: '(61) 98190-0501',
    bio: 'Advogado com formação em Direito e Engenharia (UnB), especialista em Direito Administrativo, Tributário e Compliance. Atua em consultoria estratégica e contencioso, com foco em infraestrutura, licitações e gestão de riscos regulatórios.'
  },
  {
    id: 2,
    img: imgLawyer2,
    name: 'Dr. Lucas Takaki',
    role: 'Advogado',
    specialty: 'Direito Público e Digital',
    oab: 'OAB/DF 69.901',
    email: 'adv.lucastakaki@gmail.com',
    phone: '(61) 98226-5931',
    bio: 'Advogado especialista em Direito Público e Digital (LGPD/IA), com foco em contencioso estratégico e elaboração normativa. Une experiência na AGU a soluções jurídicas de alta complexidade voltadas à segurança e inovação.'
  }
]

function EquipeSection() {
  return (
    <section id="equipe" className="bg-[#f5f5f5] py-24">
      <div className="max-w-[1216px] mx-auto px-8">
        {/* Heading */}
        <div className="text-center mb-4">
          <h2
            className="text-[#121212] text-[48px] leading-[48px]"
            style={{ ...playfair, fontWeight: 500 }}
          >
            Conheça nossa equipe
          </h2>
        </div>
        <p
          className="text-[#4a5565] text-[18px] leading-[28px] text-center max-w-[616px] mx-auto mb-16"
          style={montserrat}
        >
          Profissionais qualificados e comprometidos em oferecer atendimento jurídico estratégico,
          ético e eficiente para cada cliente.
        </p>

        <div className="flex flex-wrap justify-center gap-10">
          {teamMembers.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] overflow-hidden w-full max-w-[384px]"
            >
              {/* Photo */}
              <div className="bg-[#1b2539] h-[320px] relative overflow-hidden">
                {/* Decorative borders */}
                <div className="absolute top-4 right-[76px] w-16 h-16 border-2 border-[#c5a059] opacity-30 rounded-full z-10" />
                <div className="absolute top-[256px] left-4 w-12 h-12 border-2 border-[#c5a059] opacity-20 rounded-[10px] z-10" />

                {/* Photo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[162px] h-[162px] rounded-full overflow-hidden ring-4 ring-[#c5a059]/30">
                    <img
                      src={m.img}
                      alt={m.name}
                      className="w-full h-full object-cover object-top scale-125"
                    />
                  </div>
                </div>

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(0deg, rgba(18,18,18,0.8) 0%, rgba(0,0,0,0) 50%)'
                  }}
                />
              </div>

              {/* Info */}
              <div className="p-6 relative">
                <h3
                  className="text-[#212e46] text-[24px] leading-[32px] mb-1"
                  style={{ ...playfair, fontWeight: 500 }}
                >
                  {m.name}
                </h3>
                <p className="text-[#c5a059] text-[16px] leading-[24px] mb-1" style={montserrat}>
                  {m.role}
                </p>
                <p className="text-[#4a5565] text-[14px] leading-[20px]" style={montserrat}>
                  {m.specialty}
                </p>

                {/* OAB divider */}
                <div className="border-b border-[#e5e7eb] mt-3 mb-3 pb-3">
                  <p className="text-[#6a7282] text-[12px]" style={montserrat}>
                    {m.oab}
                  </p>
                </div>

                {/* Bio */}
                <p className="text-[#4a5565] text-[12px] leading-[22px] mb-4" style={montserrat}>
                  {m.bio}
                </p>

                {/* Contact */}
                <div className="flex flex-col gap-2">
                  <div
                    className="flex items-center gap-2 text-[#c5a059] text-[12px]"
                    style={montserrat}
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{m.email}</span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-[#c5a059] text-[12px]"
                    style={montserrat}
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>+55 {m.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Stats ──────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="bg-[#1b2539] py-16 overflow-hidden relative">
      <div className="absolute top-0 left-[388px] w-[384px] h-[384px] rounded-full bg-[#c5a059] opacity-5 blur-[64px]" />
      <div className="absolute top-[-68px] left-[779px] w-[384px] h-[384px] rounded-full bg-[#c5a059] opacity-5 blur-[64px]" />

      <div className="max-w-[1216px] mx-auto px-8 relative">
        <div className="flex flex-wrap justify-center gap-16">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-center text-center w-[220px]">
              <div className="w-16 h-16 bg-[#c5a059] rounded-full flex items-center justify-center mb-5 shadow-[0px_10px_15px_0px_rgba(0,0,0,0.2)]">
                <Scale className="w-8 h-8 text-[#121212]" strokeWidth={1.5} />
              </div>
              <p
                className="text-[#c5a059] text-[48px] leading-[48px]"
                style={{ ...playfair, fontWeight: 400 }}
              >
                {s.num}
              </p>
              <p className="text-[#f5f5f5] text-[18px] leading-[28px] mt-1" style={montserrat}>
                {s.label}
              </p>
              <p
                className="text-[#f5f5f5] text-[14px] leading-[20px] opacity-70 mt-1"
                style={montserrat}
              >
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Agendar Consulta + Contato ─────────────────────────────────────
function ContatoSection() {
  const [msgForm, setMsgForm] = useState({ nome: '', email: '', telefone: '', mensagem: '' })
  const [msgSent, setMsgSent] = useState(false)

  const handleMsg = (e: React.FormEvent) => {
    e.preventDefault()
    setMsgSent(true)
  }

  const inputCls =
    'w-full h-[50px] bg-white rounded-[10px] border border-[#d1d5dc] px-4 text-[16px] text-[#121212] placeholder-[rgba(10,10,10,0.4)] outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition'

  return (
    <section id="contato" className="bg-[#f5f5f5] py-24">
      <div className="max-w-[1216px] mx-auto px-8">
        {/* Section header */}
        <div className="text-center mb-4">
          <h2
            className="text-[#121212] text-[48px] leading-[48px]"
            style={{ ...playfair, fontWeight: 500 }}
          >
            Entre em contato
          </h2>
        </div>
        <p
          className="text-[#4a5565] text-[18px] leading-[28px] text-center max-w-[625px] mx-auto mb-14"
          style={montserrat}
        >
          Pronto para discutir sua situação jurídica? Entre em contato conosco e agende um
          atendimento personalizado.
        </p>

        {/* Agendar consulta highlight banner */}
        <div
          className="rounded-[10px] p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.15)]"
          style={{ background: 'linear-gradient(135deg, #1b2539 0%, #212e46 100%)' }}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#c5a059] rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-7 h-7 text-[#121212]" />
            </div>
            <div>
              <h3
                className="text-[#f5f5f5] text-[22px] leading-tight"
                style={{ ...playfair, fontWeight: 500 }}
              >
                Agende sua Consulta Inicial
              </h3>
              <p className="text-[#f5f5f5] text-[15px] opacity-75 mt-1" style={montserrat}>
                Consulta gratuita de 30 minutos — sem compromisso.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a
              href="tel:+556198190-0501"
              className="h-[48px] px-6 bg-[#c5a059] rounded-[10px] text-[#121212] text-[15px] flex items-center gap-2 hover:bg-[#b8903f] transition-colors whitespace-nowrap"
              style={{ ...montserrat, fontWeight: 500 }}
            >
              <Phone className="w-4 h-4" />
              (61) 98190-0501
            </a>
            <a
              href="https://wa.me/556198226-5931"
              target="_blank"
              rel="noreferrer"
              className="h-[48px] px-6 border-2 border-[#c5a059] rounded-[10px] text-[#c5a059] text-[15px] flex items-center gap-2 hover:bg-[#c5a059] hover:text-[#121212] transition-colors whitespace-nowrap"
              style={{ ...montserrat, fontWeight: 500 }}
            >
              WhatsApp (61) 98226-5931
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Message form */}
          <div>
            <h3
              className="text-[#121212] text-[24px] leading-[32px] mb-6"
              style={{ ...playfair, fontWeight: 500 }}
            >
              Nos mande uma mensagem!
            </h3>

            {msgSent ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <CheckCircle className="w-12 h-12 text-[#c5a059]" />
                <p className="text-[#1b2539] text-[18px]" style={{ ...playfair, fontWeight: 500 }}>
                  Mensagem enviada!
                </p>
                <p className="text-[#4a5565] text-[15px] text-center" style={montserrat}>
                  Retornaremos o contato em até 24 horas.
                </p>
                <button
                  onClick={() => setMsgSent(false)}
                  className="text-[#c5a059] text-[14px] underline"
                  style={montserrat}
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleMsg} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Nome Completo *
                  </label>
                  <input
                    required
                    className={inputCls}
                    placeholder="João Silva"
                    value={msgForm.nome}
                    onChange={e => setMsgForm({ ...msgForm, nome: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    E-mail *
                  </label>
                  <input
                    required
                    type="email"
                    className={inputCls}
                    placeholder="joao.silva@email.com"
                    value={msgForm.email}
                    onChange={e => setMsgForm({ ...msgForm, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Número de Telefone *
                  </label>
                  <input
                    required
                    className={inputCls}
                    placeholder="+55 (61) 98765-4321"
                    value={msgForm.telefone}
                    onChange={e => setMsgForm({ ...msgForm, telefone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[#364153] text-[14px]"
                    style={{ ...montserrat, fontWeight: 500 }}
                  >
                    Breve descrição do caso *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-white rounded-[10px] border border-[#d1d5dc] px-4 py-3 text-[16px] text-[#121212] placeholder-[rgba(10,10,10,0.4)] outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition resize-none"
                    placeholder="Explique de forma breve sua demanda/caso."
                    value={msgForm.mensagem}
                    onChange={e => setMsgForm({ ...msgForm, mensagem: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="h-[56px] bg-[#c5a059] rounded-[10px] text-[#121212] text-[16px] flex items-center justify-center gap-2 hover:bg-[#b8903f] transition-colors shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                  style={{ ...montserrat, fontWeight: 500 }}
                >
                  <Send className="w-5 h-5" />
                  Enviar
                </button>
                <p className="text-[#6a7282] text-[12px] text-center" style={montserrat}>
                  Ao enviar este formulário, você concorda com nossa política de privacidade e
                  termos de uso.
                </p>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div>
            <h3
              className="text-[#121212] text-[24px] leading-[32px] mb-6"
              style={{ ...playfair, fontWeight: 500 }}
            >
              Canais de Atendimento
            </h3>

            <div className="flex flex-col gap-5 mb-8">
              {[
                {
                  Icon: Phone,
                  label: 'Dr. Gabriel Barcelos',
                  value: '+55 (61) 98190-0501',
                  href: 'tel:+556198190-0501'
                },
                {
                  Icon: Phone,
                  label: 'Dr. Lucas Takaki',
                  value: '+55 (61) 98226-5931',
                  href: 'tel:+556198226-5931'
                },
                {
                  Icon: Mail,
                  label: 'E-mail',
                  value: 'adv.lucastakaki@gmail.com',
                  href: 'mailto:adv.lucastakaki@gmail.com'
                },
                {
                  Icon: MapPin,
                  label: 'Endereço',
                  value: 'Brasília, DF — Atendimento também por videoconferência',
                  href: '#'
                }
              ].map(c => {
                const Icon = c.Icon
                return (
                  <a
                    key={c.label}
                    href={c.href}
                    className="flex items-start gap-4 p-4 bg-white rounded-[10px] border border-[#e5e7eb] hover:border-[#c5a059] transition-colors group shadow-sm"
                  >
                    <div className="w-10 h-10 bg-[#1b2539] rounded-[10px] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#c5a059]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[#6a7282] text-[12px] mb-0.5" style={montserrat}>
                        {c.label}
                      </p>
                      <p
                        className="text-[#1b2539] text-[15px] group-hover:text-[#c5a059] transition-colors"
                        style={{ ...montserrat, fontWeight: 500 }}
                      >
                        {c.value}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>

            {/* Map/Logo placeholder */}
            <div
              className="rounded-[10px] h-[180px] flex items-center justify-center overflow-hidden shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]"
              style={{
                background: 'linear-gradient(128.66deg, #121212 0%, #1a1a1a 55%, #2a2a2a 100%)'
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <img src={imgLogo} alt="Logo" className="h-16 w-auto object-contain opacity-80" />
                <p className="text-[#c5a059] text-[13px]" style={montserrat}>
                  Barcelos &amp; Takaki Advocacia
                </p>
                <p className="text-[#f5f5f5] text-[12px] opacity-50" style={montserrat}>
                  Brasília, DF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Footer ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#121212] py-14 border-t border-[rgba(197,160,89,0.15)]">
      <div className="max-w-[1216px] mx-auto px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={imgLogo} alt="Logo" className="h-10 w-auto object-contain" />
              <div>
                <p
                  className="text-[#f5f5f5] text-[16px]"
                  style={{ ...montserrat, fontWeight: 600 }}
                >
                  Barcelos &amp; Takaki
                </p>
                <p className="text-[#c5a059] text-[12px]" style={montserrat}>
                  Advocacia
                </p>
              </div>
            </div>
            <p className="text-[#6a7282] text-[14px] leading-relaxed" style={montserrat}>
              Escritório especializado em direito estratégico, comprometido com resultados éticos e
              eficientes para cada cliente.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4
              className="text-[#f5f5f5] text-[16px] mb-4"
              style={{ ...montserrat, fontWeight: 500 }}
            >
              Navegação
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                ['Nossos Serviços', '#servicos'],
                ['Nossa Missão', '#missao'],
                ['Nossa Equipe', '#equipe'],
                ['Enviar Caso', '#analisar-caso'],
                ['Contato', '#contato'],
                ['Área do Advogado', routePaths.login]
              ].map(([label, href]) => (
                <li key={label}>
                  {href.startsWith('/') ? (
                    <Link
                      to={href}
                      className="text-[#6a7282] text-[14px] hover:text-[#c5a059] transition-colors"
                      style={montserrat}
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      className="text-[#6a7282] text-[14px] hover:text-[#c5a059] transition-colors"
                      style={montserrat}
                    >
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-[#f5f5f5] text-[16px] mb-4"
              style={{ ...montserrat, fontWeight: 500 }}
            >
              Contato
            </h4>
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-2 text-[#6a7282] text-[14px]"
                style={montserrat}
              >
                <Phone className="w-4 h-4 text-[#c5a059] flex-shrink-0" />
                (61) 98190-0501
              </div>
              <div
                className="flex items-center gap-2 text-[#6a7282] text-[14px]"
                style={montserrat}
              >
                <Phone className="w-4 h-4 text-[#c5a059] flex-shrink-0" />
                (61) 98226-5931
              </div>
              <div
                className="flex items-center gap-2 text-[#6a7282] text-[14px]"
                style={montserrat}
              >
                <MapPin className="w-4 h-4 text-[#c5a059] flex-shrink-0" />
                Brasília, DF
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.08)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Bottom logo */}
          <div className="flex items-center gap-2 opacity-60">
            <img src={imgLogo} alt="B&T" className="h-7 w-auto object-contain" />
          </div>
          <p className="text-[#4a5565] text-[13px]" style={montserrat}>
            © 2026 Barcelos &amp; Takaki Advocacia. Todos os direitos reservados.
          </p>
          <div className="flex gap-5">
            {['Política de Privacidade', 'Termos de Uso'].map(l => (
              <a
                key={l}
                href="#"
                className="text-[#4a5565] text-[12px] hover:text-[#c5a059] transition-colors"
                style={montserrat}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Root export ─────────────────────────────────────────────────────────────
export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <Navbar open={menuOpen} setOpen={setMenuOpen} />
      <HeroSection />
      <ServicosSection />
      <AnalisarCasoSection />
      <MissaoSection />
      <EquipeSection />
      <StatsSection />
      <ContatoSection />
      <Footer />
    </div>
  )
}
