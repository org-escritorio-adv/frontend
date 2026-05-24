import { useState, useEffect } from "react";
import {
  Search, RefreshCw, Plus, Eye, ChevronRight,
  Scale, Calendar, FileText, AlertCircle, Archive,
  Hash, Building2, Clock, ArrowUpRight, Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

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

const statusConfig: Record<StatusProcesso, { label: string; dot: string; badge: string }> = {
  "Ativo":      { label: "Ativo",       dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  "Arquivado":  { label: "Arquivado",   dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600"   },
  "Em Recurso": { label: "Em Recurso",  dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700"   },
  "Suspenso":   { label: "Suspenso",    dot: "bg-red-400",     badge: "bg-red-100 text-red-600"       },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface ProcessosJusbrasilProps {
  onViewProcess: (id: string) => void;
}

export function ProcessosJusbrasil({ onViewProcess }: ProcessosJusbrasilProps) {
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // API State
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [clientes, setClientes] = useState<{ id: number; nome_razao_social: string }[]>([]);
  const [clientesMap, setClientesMap] = useState<Record<number, string>>({});
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  // Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [manualForm, setManualForm] = useState({
    numero_cnj: "",
    tribunal: "",
    partes: "",
    data_abertura: "",
    status: "ativo",
    cliente_id: "",
  });

  // Fetch data
  const fetchClientes = async () => {
    setLoadingClientes(true);
    try {
      const res = await fetch("http://localhost:8000/clientes/");
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
        const map: Record<number, string> = {};
        data.forEach((c: any) => {
          map[c.id] = c.nome_razao_social;
        });
        setClientesMap(map);
        return map;
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoadingClientes(false);
    }
    return {};
  };

  const fetchProcessos = async (currClientesMap?: Record<number, string>) => {
    const activeMap = currClientesMap || clientesMap;
    try {
      const res = await fetch("http://localhost:8000/processos/");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((p: any) => ({
          id: String(p.id),
          cnj: p.numero_cnj,
          cliente: p.cliente_id ? (activeMap[p.cliente_id] || `Cliente #${p.cliente_id}`) : "Sem Cliente",
          parteContraria: p.partes || "Não informada",
          tribunal: p.tribunal,
          vara: "Vara Única",
          ultimaMovimentacao: p.movimentacoes && p.movimentacoes.length > 0 
            ? { 
                data: new Date(p.movimentacoes[0].data).toLocaleDateString("pt-BR"), 
                descricao: p.movimentacoes[0].descricao 
              } 
            : { data: "-", descricao: "Sem movimentações" },
          status: p.status === "ativo" ? "Ativo" : (p.status === "arquivado" ? "Arquivado" : "Ativo"),
          valorCausa: "R$ 0,00",
          casoVinculado: "-",
        }));
        setProcessos(mapped);
      }
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
    }
  };

  const loadData = async () => {
    const map = await fetchClientes();
    await fetchProcessos(map);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isManualModalOpen) {
      fetchClientes();
      setManualForm({
        numero_cnj: "",
        tribunal: "",
        partes: "",
        data_abertura: "",
        status: "ativo",
        cliente_id: "",
      });
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isManualModalOpen]);

  // CNJ Validation (checks for exactly 20 digits)
  const validarCNJ = (cnj: string) => {
    const clean = cnj.replace(/\D/g, "");
    return clean.length === 20;
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!manualForm.numero_cnj || !manualForm.tribunal || !manualForm.partes || !manualForm.data_abertura) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!validarCNJ(manualForm.numero_cnj)) {
      setErrorMsg("O Número CNJ deve conter exatamente 20 dígitos numéricos.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        numero_cnj: manualForm.numero_cnj,
        tribunal: manualForm.tribunal,
        partes: manualForm.partes,
        data_abertura: new Date(manualForm.data_abertura).toISOString(),
        status: manualForm.status,
        favorito: false,
        cliente_id: manualForm.cliente_id ? parseInt(manualForm.cliente_id) : null,
        advogado_id: null,
      };

      const res = await fetch("http://localhost:8000/processos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg("Processo cadastrado com sucesso!");
        loadData();
        setTimeout(() => {
          setIsManualModalOpen(false);
        }, 1200);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Erro ao cadastrar processo.");
      }
    } catch (error) {
      setErrorMsg("Erro de conexão com o servidor.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const totalAtivos = processos.filter((p) => p.status === "Ativo").length;
  const totalArquivados = processos.filter((p) => p.status === "Arquivado").length;
  const totalRecurso = processos.filter((p) => p.status === "Em Recurso").length;

  // ── Search filter ──────────────────────────────────────────────────────────
  const filtered = processos.filter((p) => {
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
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Title */}
          <div>
            <h2 className="text-[#1A2B3C] text-xl font-semibold">Processos Judiciais</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Integração Jusbrasil · {processos.length} processos vinculados
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin text-[#D4AF37]" : ""}`} />
              {syncing ? "Sincronizando…" : "Sincronizar Jusbrasil"}
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Processo Manual
            </button>
          </div>
        </div>

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número CNJ ou nome da parte…"
            className="w-full h-[44px] pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
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
      </div>

      {/* ── Stats chips ──────────────────────────────────────────────────────── */}
      <div className="px-8 py-3 flex items-center gap-3 border-b border-gray-100 bg-white/70">
        {[
          { label: "Total",       value: processos.length, icon: Scale,   color: "text-[#1A2B3C]", bg: "bg-slate-100" },
          { label: "Ativos",      value: totalAtivos,          icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Arquivados",  value: totalArquivados,      icon: Archive,  color: "text-slate-500",  bg: "bg-slate-100" },
          { label: "Em Recurso",  value: totalRecurso,         icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((chip) => {
          const Icon = chip.icon;
          return (
            <div key={chip.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${chip.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${chip.color}`} />
              <span className={`text-xs font-semibold ${chip.color}`}>{chip.value}</span>
              <span className="text-xs text-slate-500">{chip.label}</span>
            </div>
          );
        })}

        <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          Última sincronização: 27/04/2026 às 09:14
        </div>
      </div>

      {/* ── Data Grid ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[minmax(200px,1fr)_minmax(180px,1.2fr)_minmax(160px,1fr)_minmax(200px,1.2fr)_100px_120px] px-5 py-3 bg-slate-50 border-b border-gray-100">
            {[
              { label: "Número CNJ",           icon: Hash        },
              { label: "Cliente / Parte",       icon: Scale       },
              { label: "Tribunal",              icon: Building2   },
              { label: "Última Movimentação",   icon: Calendar    },
              { label: "Status",                icon: null        },
              { label: "",                      icon: null        },
            ].map((col, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {col.icon && <col.icon className="w-3 h-3 text-slate-400" />}
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Search className="w-10 h-10 text-slate-300" />
              <p className="text-slate-500 text-sm">Nenhum processo encontrado.</p>
              {query && (
                <button onClick={() => setQuery("")} className="text-[#D4AF37] text-sm hover:underline">
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            filtered.map((proc, index) => {
              const cfg = statusConfig[proc.status] || statusConfig["Ativo"];
              const isFirst = index === 0;
              const isHovered = hoveredRow === proc.id;

              return (
                <div
                  key={proc.id}
                  onClick={() => onViewProcess(proc.id)}
                  onMouseEnter={() => setHoveredRow(proc.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    grid grid-cols-[minmax(200px,1fr)_minmax(180px,1.2fr)_minmax(160px,1fr)_minmax(200px,1.2fr)_100px_120px]
                    px-5 py-4 cursor-pointer transition-all duration-150 relative
                    ${index < filtered.length - 1 ? "border-b border-gray-50" : ""}
                    ${isHovered ? "bg-slate-50/80" : "bg-white"}
                  `}
                >
                  {/* Hover left accent */}
                  {isHovered && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4AF37] rounded-r-full" />
                  )}

                  {/* Número CNJ */}
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="font-mono text-[13px] text-[#1A2B3C] font-medium tracking-tight truncate">
                      {proc.cnj}
                    </span>
                    {isFirst && (
                      <span className="text-[10px] text-[#D4AF37] font-medium mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block" />
                        Mais recente
                      </span>
                    )}
                  </div>

                  {/* Cliente / Parte */}
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-sm font-semibold text-[#1A2B3C] truncate">{proc.cliente}</span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">× {proc.parteContraria}</span>
                  </div>

                  {/* Tribunal */}
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-sm font-semibold text-[#1A2B3C]">{proc.tribunal}</span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">{proc.vara}</span>
                  </div>

                  {/* Última Movimentação */}
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-xs font-medium text-slate-600">{proc.ultimaMovimentacao.data}</span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">
                      {proc.ultimaMovimentacao.descricao}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${proc.status === "Ativo" ? "animate-pulse" : ""}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Ver Detalhes */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewProcess(proc.id); }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isHovered
                          ? "bg-[#1A2B3C] text-white shadow-sm"
                          : "text-slate-400 hover:text-[#1A2B3C]"
                        }
                      `}
                      title="Ver Detalhes do Processo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isHovered ? "Abrir" : "Detalhes"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-slate-400">
            Exibindo {filtered.length} de {processos.length} processos
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
            Clique em qualquer linha para ver os detalhes completos
          </div>
        </div>
      </div>

      {/* ─── MODAL DE CADASTRO MANUAL ─── */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-slate-100 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1A2B3C]">
              Cadastrar Processo Manualmente
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Insira os dados do processo que não está indexado na API automatizada.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateManual} className="space-y-4 mt-2">
            
            {/* Número CNJ */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Número CNJ (20 dígitos) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 0001234-56.2024.8.26.0100"
                value={manualForm.numero_cnj}
                onChange={(e) => setManualForm({ ...manualForm, numero_cnj: e.target.value })}
                className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
              />
            </div>

            {/* Tribunal & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tribunal *
                </label>
                <select
                  required
                  value={manualForm.tribunal}
                  onChange={(e) => setManualForm({ ...manualForm, tribunal: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                >
                  <option value="">Selecione...</option>
                  <option value="TJSP">TJSP</option>
                  <option value="TJDFT">TJDFT</option>
                  <option value="TJRJ">TJRJ</option>
                  <option value="TJMG">TJMG</option>
                  <option value="TRF1">TRF1</option>
                  <option value="STJ">STJ</option>
                  <option value="TST">TST</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status *
                </label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                >
                  <option value="ativo">Ativo</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>
            </div>

            {/* Partes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Partes (Autor vs. Réu) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João Silva vs. Empresa Alpha S/A"
                value={manualForm.partes}
                onChange={(e) => setManualForm({ ...manualForm, partes: e.target.value })}
                className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
              />
            </div>

            {/* Data de Início & Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Data de Início *
                </label>
                <input
                  type="date"
                  required
                  value={manualForm.data_abertura}
                  onChange={(e) => setManualForm({ ...manualForm, data_abertura: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Cliente Vinculado
                </label>
                <select
                  value={manualForm.cliente_id}
                  onChange={(e) => setManualForm({ ...manualForm, cliente_id: e.target.value })}
                  className="h-[40px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition"
                  disabled={loadingClientes}
                >
                  <option value="">Nenhum</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome_razao_social}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-2.5">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="text-xs text-emerald-500 font-medium bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                {successMsg}
              </div>
            )}

            {/* Actions */}
            <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
              >
                {submitting ? "Cadastrando..." : "Cadastrar"}
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
