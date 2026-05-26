import { useState } from "react";
import { Search, Filter, Building2, Users, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router";

const filters = [
  { id: "processo", label: "Nº do Processo", icon: FileText },
  { id: "cliente",  label: "Cliente",         icon: Users   },
  { id: "cpf",      label: "CPF / CNPJ",      icon: FileText },
];

const searchResults = [
  {
    id: "1",
    number: "0001234-56.2024.8.26.0100",
    status: "Em Andamento",
    statusColor: "bg-blue-500",
    tribunal: "TJSP – 1ª Vara Cível",
    parts: { autor: "João da Silva",   reu: "Empresa ABC Ltda"  },
    lastUpdate: "16/04/2026",
  },
  {
    id: "2",
    number: "0007890-12.2024.8.26.0200",
    status: "Aguardando Julgamento",
    statusColor: "bg-yellow-500",
    tribunal: "TJSP – 3ª Vara Cível",
    parts: { autor: "Maria Oliveira",  reu: "Banco XYZ S.A."   },
    lastUpdate: "14/04/2026",
  },
  {
    id: "3",
    number: "0005678-90.2024.8.26.0300",
    status: "Finalizado",
    statusColor: "bg-green-500",
    tribunal: "TJSP – 2ª Vara Cível",
    parts: { autor: "Empresa XYZ Ltda", reu: "Fornecedor DEF"  },
    lastUpdate: "10/04/2026",
  },
  {
    id: "4",
    number: "0009876-54.2024.8.26.0400",
    status: "Em Andamento",
    statusColor: "bg-blue-500",
    tribunal: "TJSP – 5ª Vara Trabalhista",
    parts: { autor: "Pedro Santos",    reu: "Indústria GHI S.A." },
    lastUpdate: "15/04/2026",
  },
];

export function PesquisaMobile() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [apiStatus] = useState<"online" | "offline">("online");

  const filtered = searchResults.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      r.number.includes(q) ||
      r.parts.autor.toLowerCase().includes(q) ||
      r.parts.reu.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Search Hero ──────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 pt-4 pb-3"
        style={{ boxShadow: "0 1px 6px rgba(26,43,60,0.05)" }}>

        {/* Search bar — full width, 48px touch target */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Número, cliente, CPF/CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1A2B3C] placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#1A2B3C]/20 focus:border-[#1A2B3C]/40 transition-all"
          />
        </div>

        {/* API Status pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
            apiStatus === "online"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              apiStatus === "online" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          API Jusbrasil:&nbsp;
          <strong>{apiStatus === "online" ? "Online" : "Offline"}</strong>
          {apiStatus === "online" && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
        </div>
      </div>

      {/* ── Filter chips ─────────────────────────────── */}
      <div className="px-4 mt-3 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => {
            const Icon = f.icon;
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(active ? null : f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap text-sm font-medium border transition-all ${
                  active
                    ? "bg-[#1A2B3C] text-white border-[#1A2B3C] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#1A2B3C]/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Results header ───────────────────────────── */}
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-xs font-semibold text-slate-500">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 hover:border-[#1A2B3C]/40 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </button>
      </div>

      {/* ── Result cards ─────────────────────────────── */}
      <div className="px-4 pb-6 space-y-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            onClick={() => navigate(`/app/caso/${r.id}`)}
            className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:scale-[0.99] transition-all"
            style={{ boxShadow: "0 2px 10px rgba(26,43,60,0.07)" }}
          >
            {/* Status */}
            <div className="flex items-center justify-between mb-3">
              <Badge className={`${r.statusColor} text-white border-0 text-xs`}>
                {r.status}
              </Badge>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>

            {/* Number */}
            <p className="font-mono text-sm font-semibold text-[#1A2B3C] mb-3">
              {r.number}
            </p>

            {/* Tribunal */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{r.tribunal}</span>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Autor</p>
                <p className="text-xs font-medium text-slate-800 truncate">{r.parts.autor}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Réu</p>
                <p className="text-xs font-medium text-slate-800 truncate">{r.parts.reu}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <Users className="w-3 h-3" />
              Atualização: {r.lastUpdate}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-14">
            <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhum resultado para "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
