import { Search, Filter, Download, Eye, AlertCircle, CheckCircle, Hash, User, Building2, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusProcesso = 'Ativo' | 'Em Análise' | 'Concluído';

interface Resultado {
  numeroProcesso: string;
  cliente: string;
  cpfCnpj: string;
  status: StatusProcesso;
  tribunal: string;
  partes: string;
  ultimaMovimentacao: string;
}

interface Sugestao {
  tipo: 'CNPJ' | 'Processo';
  label: string;   // full display string (without type prefix)
  valor: string;   // value to fill in input
  icone: typeof Hash;
}

// ─── Auto-complete suggestions (hardcoded for "12" simulation) ────────────────

const SUGESTOES: Sugestao[] = [
  {
    tipo: 'CNPJ',
    label: '12.345.678/0001-90 — Silva & Associates Ltda.',
    valor: '12.345.678/0001-90',
    icone: Building2,
  },
  {
    tipo: 'Processo',
    label: '0001234-56.2024.8.26.0100',
    valor: '0001234-56.2024.8.26.0100',
    icone: FileText,
  },
  {
    tipo: 'Processo',
    label: '0007890-12.2023.8.26.0577',
    valor: '0007890-12.2023.8.26.0577',
    icone: FileText,
  },
];

// ─── Highlight helper ─────────────────────────────────────────────────────────
// Wraps every occurrence of `query` inside `text` with a <strong>.

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts  = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="text-[#1A2B3C] font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<StatusProcesso, { dot: string; badge: string }> = {
  'Ativo':      { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Em Análise': { dot: 'bg-amber-500',   badge: 'bg-amber-100   text-amber-700   border-amber-200'   },
  'Concluído':  { dot: 'bg-slate-400',   badge: 'bg-slate-100   text-slate-600   border-slate-200'   },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchView() {
  const [apiStatus,      setApiStatus]      = useState<'online' | 'offline'>('online');
  // Pre-populated with "12" to simulate the autocomplete in action
  const [searchQuery,    setSearchQuery]    = useState('12');
  const [filterType,     setFilterType]     = useState('processo');
  const [showDropdown,   setShowDropdown]   = useState(true);
  const [hoveredSugestao, setHoveredSugestao] = useState<number | null>(null);

  const inputRef      = useRef<HTMLInputElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);

  // ── Results data ────────────────────────────────────────────────────────────
  const resultados: Resultado[] = [
    {
      numeroProcesso: '0001234-56.2024.8.26.0100',
      cliente:        'Silva & Associates Ltda.',
      cpfCnpj:        '12.345.678/0001-90',
      status:         'Ativo',
      tribunal:       'TJSP – 1ª Vara Cível',
      partes:         'Silva & Associates Ltda. × Estado de São Paulo',
      ultimaMovimentacao: '03/04/2026',
    },
    {
      numeroProcesso: '0007890-12.2023.8.26.0577',
      cliente:        'Costa Indústrias S.A.',
      cpfCnpj:        '98.765.432/0001-12',
      status:         'Em Análise',
      tribunal:       'TJRJ – 2ª Vara Empresarial',
      partes:         'Costa Indústrias S.A. × Receita Federal',
      ultimaMovimentacao: '01/04/2026',
    },
    {
      numeroProcesso: '0003456-78.2024.5.02.0038',
      cliente:        'Maria Oliveira',
      cpfCnpj:        '123.456.789-00',
      status:         'Concluído',
      tribunal:       'TRT2 – 15ª Vara do Trabalho',
      partes:         'Maria Oliveira × Tech Corp Ltda.',
      ultimaMovimentacao: '28/03/2026',
    },
    {
      numeroProcesso: '0009012-34.2024.8.26.0602',
      cliente:        'Santos Corporation Ltda.',
      cpfCnpj:        '11.222.333/0001-44',
      status:         'Ativo',
      tribunal:       'TJSP – 3ª Vara Cível',
      partes:         'Santos Corp × Município de Sorocaba',
      ultimaMovimentacao: '04/04/2026',
    },
  ];

  // ── Compute which suggestions are relevant ──────────────────────────────────
  const sugestoesFiltradas = searchQuery.trim()
    ? SUGESTOES.filter((s) =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.valor.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // ── Close dropdown when clicking outside ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current   && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Select a suggestion ─────────────────────────────────────────────────────
  const handleSelectSugestao = (s: Sugestao) => {
    setSearchQuery(s.valor);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // ── Placeholder by filter type ──────────────────────────────────────────────
  const placeholderMap: Record<string, string> = {
    processo:  'Buscar por número do processo…',
    cliente:   'Buscar por nome do cliente…',
    cpfcnpj:   'Buscar por CPF ou CNPJ…',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* ── Título ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-[#1A2B3C] mb-2">Busca Global Jusbrasil</h2>
        <p className="text-slate-600">Consulte a base nacional de tribunais para localizar e importar novos processos</p>
      </div>

      {/* ── Banner status API ───────────────────────────────────────────────── */}
      <div
        className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          apiStatus === 'online'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        {apiStatus === 'online' ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        )}
        <span className={`text-sm ${apiStatus === 'online' ? 'text-green-700' : 'text-red-700'}`}>
          Status da API Jusbrasil:{' '}
          <strong>{apiStatus === 'online' ? 'Online' : 'Offline'}</strong>
          {apiStatus === 'online' && (
            <span className="ml-2 text-green-500">· Sincronização automática ativa</span>
          )}
        </span>
      </div>

      {/* ── Barra de Pesquisa ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">

          {/* Seletor de tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
          >
            <option value="processo">Buscar no Jusbrasil por:</option>
            <option value="cliente">Nome do Cliente</option>
            <option value="cpfcnpj">CPF / CNPJ</option>
          </select>

          {/* ── Campo de busca + Dropdown Auto-Complete ─────────────────────── */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={placeholderMap[filterType]}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm transition"
            />

            {/* ── Dropdown de Sugestões ─────────────────────────────────────── */}
            {showDropdown && sugestoesFiltradas.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                style={{ boxShadow: '0 8px 24px rgba(26,43,60,0.12), 0 2px 8px rgba(26,43,60,0.06)' }}
              >
                {/* Cabeçalho do dropdown */}
                <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex items-center gap-2">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    Sugestões para &quot;{searchQuery}&quot;
                  </span>
                </div>

                {/* Itens de sugestão */}
                {sugestoesFiltradas.map((s, i) => {
                  const Icone = s.icone;
                  const isHov = hoveredSugestao === i;
                  const isLast = i === sugestoesFiltradas.length - 1;

                  return (
                    <button
                      key={i}
                      onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                      onClick={() => handleSelectSugestao(s)}
                      onMouseEnter={() => setHoveredSugestao(i)}
                      onMouseLeave={() => setHoveredSugestao(null)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                        ${!isLast ? 'border-b border-gray-50' : ''}
                        ${isHov ? 'bg-[#1A2B3C]/[0.04]' : 'bg-white'}
                      `}
                    >
                      {/* Ícone + tipo */}
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                        ${isHov ? 'bg-[#D4AF37]/20' : 'bg-slate-100'}
                      `}>
                        <Icone className={`w-4 h-4 ${isHov ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex flex-col min-w-0">
                        {/* Badge de tipo */}
                        <span className={`
                          text-[10px] font-semibold uppercase tracking-wider mb-0.5
                          ${s.tipo === 'CNPJ' ? 'text-blue-500' : 'text-purple-500'}
                        `}>
                          {s.tipo}
                        </span>
                        {/* Texto com highlight */}
                        <span className="text-sm text-slate-600 font-mono truncate">
                          <HighlightMatch text={s.label} query={searchQuery} />
                        </span>
                      </div>

                      {/* Hint de ação */}
                      {isHov && (
                        <span className="ml-auto flex-shrink-0 text-[11px] text-slate-400 pr-1">
                          pressione ↵
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Rodapé do dropdown */}
                <div className="px-4 py-2 bg-slate-50 border-t border-gray-100">
                  <span className="text-[11px] text-slate-400">
                    {sugestoesFiltradas.length} sugestões encontradas
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botão Pesquisar */}
          <button
            onClick={() => setShowDropdown(false)}
            className="px-6 py-3 bg-[#1A2B3C] text-white rounded-lg hover:bg-[#243447] transition-colors flex items-center gap-2 text-sm"
          >
            <Search className="w-5 h-5" />
            Pesquisar
          </button>
        </div>

        {/* Filtros Avançados */}
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </button>
        </div>
      </div>

      {/* ── Tabela de Resultados ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-[#1A2B3C]">Resultados da API Jusbrasil</h3>
          <span className="text-sm text-slate-500">{resultados.length} processos encontrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                {[
                  'Número do Processo',
                  'Cliente',
                  'CPF / CNPJ',
                  'Status',
                  'Tribunal',
                  'Partes',
                  'Ações',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-[11px] text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resultados.map((r) => {
                const cfg = statusConfig[r.status];
                return (
                  <tr key={r.numeroProcesso} className="hover:bg-slate-50/80 transition-colors group">

                    {/* Número do Processo */}
                    <td className="px-6 py-4 text-sm font-mono text-[#1A2B3C] whitespace-nowrap">
                      {r.numeroProcesso}
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.cliente}</td>

                    {/* CPF/CNPJ */}
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 whitespace-nowrap">{r.cpfCnpj}</td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-medium ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${r.status === 'Ativo' ? 'animate-pulse' : ''}`} />
                        {r.status}
                      </span>
                    </td>

                    {/* Tribunal */}
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{r.tribunal}</td>

                    {/* Partes */}
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-[220px] truncate">{r.partes}</td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C]" />
                        </button>
                        <button
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Exportar"
                        >
                          <Download className="w-4 h-4 text-slate-500 group-hover:text-[#1A2B3C]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer da tabela */}
        <div className="px-6 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Exibindo {resultados.length} resultados · Página 1 de 1
          </span>
          <span className="text-xs text-slate-400">
            Última atualização: 27/04/2026 às 09:14
          </span>
        </div>
      </div>
    </div>
  );
}