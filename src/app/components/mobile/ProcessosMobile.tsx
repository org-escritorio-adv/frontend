import { useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Scale,
  Calendar,
  FileText,
  AlertCircle,
  Archive,
  Hash,
  Building2,
  Clock,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusProcesso = "Ativo" | "Arquivado" | "Em Recurso" | "Suspenso";

interface Processo {
  id: string;
  cnj: string;
  cliente: string;
  parteContraria: string;
  tribunal: string;
  vara: string;
  ultimaMovimentacao: { data: string; descricao: string };
  status: StatusProcesso;
  valorCausa: string;
  casoVinculado: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const processosData: Processo[] = [
  {
    id: "p1",
    cnj: "0001234-56.2024.8.26.0100",
    cliente: "Silva & Associates Ltda.",
    parteContraria: "Estado de São Paulo",
    tribunal: "TJSP",
    vara: "1ª Vara Cível de São Paulo",
    ultimaMovimentacao: {
      data: "03/04/2026",
      descricao: "Decisão interlocutória – Perícia deferida",
    },
    status: "Ativo",
    valorCausa: "R$ 2.450.000,00",
    casoVinculado: "Elaboração de Contrato Social – Fusão Alpha Corp.",
  },
  {
    id: "p2",
    cnj: "0045678-23.2024.5.10.0001",
    cliente: "João Santos",
    parteContraria: "Empresa Beta S.A.",
    tribunal: "TRT 10ª Região",
    vara: "3ª Vara do Trabalho de Brasília",
    ultimaMovimentacao: {
      data: "28/03/2026",
      descricao: "Audiência de instrução – Sem acordo",
    },
    status: "Ativo",
    valorCausa: "R$ 87.500,00",
    casoVinculado: "Ação Trabalhista – Cliente João Santos",
  },
  {
    id: "p3",
    cnj: "0078901-45.2023.8.07.0002",
    cliente: "Grupo Alfa Ltda.",
    parteContraria: "Instituto Nacional do Seguro Social",
    tribunal: "TJDFT",
    vara: "2ª Vara Previdenciária de Brasília",
    ultimaMovimentacao: {
      data: "15/01/2026",
      descricao: "Acórdão publicado – Trânsito em julgado",
    },
    status: "Arquivado",
    valorCausa: "R$ 340.000,00",
    casoVinculado:
      "Assessoria Jurídica em Licitação Pública – Pregão 05/2024",
  },
  {
    id: "p4",
    cnj: "0023456-78.2024.8.07.0003",
    cliente: "Digital Tech Ltda.",
    parteContraria: "Fazenda Nacional",
    tribunal: "STJ",
    vara: "2ª Turma – Direito Público",
    ultimaMovimentacao: {
      data: "20/04/2026",
      descricao: "Recurso especial protocolado",
    },
    status: "Em Recurso",
    valorCausa: "R$ 1.200.000,00",
    casoVinculado: "Consultoria LGPD – Empresa Digital Tech Ltda.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<
  StatusProcesso,
  { label: string; dot: string; badge: string }
> = {
  Ativo: {
    label: "Ativo",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  Arquivado: {
    label: "Arquivado",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
  "Em Recurso": {
    label: "Em Recurso",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  Suspenso: {
    label: "Suspenso",
    dot: "bg-red-400",
    badge: "bg-red-100 text-red-600",
  },
};

const totalAtivos = processosData.filter((p) => p.status === "Ativo").length;
const totalArquivados = processosData.filter(
  (p) => p.status === "Arquivado"
).length;
const totalRecurso = processosData.filter(
  (p) => p.status === "Em Recurso"
).length;

// ─── Component ───────────────────────────────────────────────────────────────

export function ProcessosMobile() {
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  // ── Search filter ──────────────────────────────────────────────────────────
  const filtered = processosData.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.cnj.includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      p.parteContraria.toLowerCase().includes(q) ||
      p.tribunal.toLowerCase().includes(q)
    );
  });

  // ── Sync animation ─────────────────────────────────────────────────────────
  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2200);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      {/* ── Cabeçalho ────────────────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">
          Processos Judiciais
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-slate-500 text-sm">
            Base de Dados Local · Processos já salvos e monitorados pelo escritório
          </p>
        </div>
      </div>

      {/* ── Botões de ação ───────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${syncing ? "animate-spin text-[#D4AF37]" : ""}`}
          />
          {syncing ? "Sincronizando…" : "Sincronizar"}
        </button>

        <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* ── Busca ────────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar na base local por número CNJ ou parte..."
          className="w-full h-[44px] pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5 rounded bg-slate-200"
          >
            limpar
          </button>
        )}
      </div>

      {/* ── Estatísticas ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          {
            label: "Total",
            value: processosData.length,
            icon: Scale,
            color: "text-[#1A2B3C]",
            bg: "bg-slate-100",
          },
          {
            label: "Ativos",
            value: totalAtivos,
            icon: FileText,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Arquiv.",
            value: totalArquivados,
            icon: Archive,
            color: "text-slate-500",
            bg: "bg-slate-100",
          },
          {
            label: "Recurso",
            value: totalRecurso,
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((chip) => {
          const Icon = chip.icon;
          return (
            <div
              key={chip.label}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg ${chip.bg}`}
            >
              <Icon className={`w-3.5 h-3.5 ${chip.color} mb-0.5`} />
              <span className={`text-base font-bold ${chip.color}`}>
                {chip.value}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                {chip.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Última sincronização ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mb-4">
        <Clock className="w-3 h-3" />
        Última sincronização: 27/04/2026 às 09:14
      </div>

      {/* ── Lista de Processos ────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
            <Search className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 text-sm">
              Nenhum processo encontrado para "{query}"
            </p>
            <button
              onClick={() => setQuery("")}
              className="text-[#D4AF37] text-sm hover:underline"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          filtered.map((proc) => {
            const cfg = statusConfig[proc.status];
            const isDestaque = proc.id === "p1";

            return (
              <div
                key={proc.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden"
              >
                {/* Accent bar para processo destacado */}
                {isDestaque && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A059]" />
                )}

                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {/* CNJ */}
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-xs text-[#1A2B3C] font-medium tracking-tight truncate">
                        {proc.cnj}
                      </span>
                    </div>
                    {/* Cliente */}
                    <p className="text-sm font-semibold text-[#1A2B3C] truncate">
                      {proc.cliente}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      × {proc.parteContraria}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge} ml-2`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${cfg.dot} ${proc.status === "Ativo" ? "animate-pulse" : ""}`}
                    />
                    {cfg.label}
                  </span>
                </div>

                {/* Detalhes */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {/* Tribunal */}
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A2B3C]">
                        {proc.tribunal}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {proc.vara}
                      </p>
                    </div>
                  </div>

                  {/* Última movimentação */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-600">
                        {proc.ultimaMovimentacao.data}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {proc.ultimaMovimentacao.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Botão Ver Detalhes */}
                  <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#1A2B3C] transition-colors mt-3 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Ver Detalhes</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Badge de destaque */}
                {isDestaque && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wide flex items-center gap-1 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                      <span className="w-1 h-1 rounded-full bg-[#D4AF37] inline-block" />
                      Destacado
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">
          Exibindo {filtered.length} de {processosData.length} processos
        </p>
      </div>
    </div>
  );
}