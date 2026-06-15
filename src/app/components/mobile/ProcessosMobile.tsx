import { useState, useEffect } from "react";
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
  X,
  ChevronDown,
} from "lucide-react";
import {
  buscarClientes,
  buscarProcessos,
  criarProcesso,
  type Processo,
  type ClienteAPI,
  type CriarProcessoPayload,
} from "../../../services/processos.service";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusProcesso = "Ativo" | "Arquivado" | "Em Recurso" | "Suspenso";

const statusConfig: Record<StatusProcesso, { label: string; dot: string; badge: string }> = {
  Ativo:       { label: "Ativo",      dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  Arquivado:   { label: "Arquivado",  dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600"    },
  "Em Recurso":{ label: "Em Recurso", dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700"    },
  Suspenso:    { label: "Suspenso",   dot: "bg-red-400",     badge: "bg-red-100 text-red-600"        },
};

const TRIBUNAIS = ["TJSP", "TJDFT", "TJRJ", "TJMG", "TRF1", "STJ", "TST"];

// ─── Component ───────────────────────────────────────────────────────────────

export function ProcessosMobile() {
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  // API State
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [clientesMap, setClientesMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    numero_cnj: "",
    tribunal: "",
    partes: "",
    data_abertura: "",
    status: "ativo",
    cliente_id: "",
  });

  const fetchClientes = async () => {
    setLoadingClientes(true);
    try {
      const data = await buscarClientes();
      setClientes(data);
      const map: Record<number, string> = {};
      data.forEach((c) => { map[c.id] = c.nome_razao_social; });
      setClientesMap(map);
      return map;
    } catch {
      return {};
    } finally {
      setLoadingClientes(false);
    }
  };

  const fetchProcessos = async (currMap?: Record<number, string>) => {
    const activeMap = currMap ?? clientesMap;
    try {
      const mapped = await buscarProcessos(activeMap);
      setProcessos(mapped);
      setErrorApi("");
    } catch {
      setErrorApi("Erro ao carregar processos. Verifique sua conexão.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    const map = await fetchClientes();
    await fetchProcessos(map);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (modalOpen) {
      setForm({ numero_cnj: "", tribunal: "", partes: "", data_abertura: "", status: "ativo", cliente_id: "" });
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [modalOpen]);

  const validarCNJ = (cnj: string) => cnj.replace(/\D/g, "").length === 20;

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.numero_cnj || !form.tribunal || !form.partes || !form.data_abertura) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!validarCNJ(form.numero_cnj)) {
      setErrorMsg("O Número CNJ deve conter exatamente 20 dígitos numéricos.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CriarProcessoPayload = {
        numero_cnj: form.numero_cnj,
        tribunal: form.tribunal,
        partes: form.partes,
        data_abertura: new Date(form.data_abertura).toISOString(),
        status: form.status,
        favorito: false,
        cliente_id: form.cliente_id ? parseInt(form.cliente_id) : null,
        advogado_id: null,
      };
      await criarProcesso(payload);
      setSuccessMsg("Processo cadastrado com sucesso!");
      loadData();
      setTimeout(() => setModalOpen(false), 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.detail;
      setErrorMsg(msg || "Erro ao cadastrar processo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    loadData().finally(() => setSyncing(false));
  };

  // Stats
  const totalAtivos    = processos.filter((p) => p.status === "Ativo").length;
  const totalArquivados = processos.filter((p) => p.status === "Arquivado").length;
  const totalRecurso   = processos.filter((p) => p.status === "Em Recurso").length;

  const filtered = processos.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.cnj.includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      p.parteContraria.toLowerCase().includes(q) ||
      p.tribunal.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">

      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-[#1A2B3C] text-xl font-bold mb-1">
          Processos Judiciais
        </h2>
        <p className="text-slate-500 text-sm">
          Integração DataJud · {processos.length} processos vinculados
        </p>
      </div>

      {/* ── Botões de ação ────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin text-[#D4AF37]" : ""}`} />
          {syncing ? "Sincronizando…" : "Sincronizar"}
        </button>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A2B3C] text-sm text-white hover:bg-[#243447] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* ── Busca ─────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por número CNJ ou parte…"
          className="w-full h-[44px] pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs px-2 py-0.5 rounded bg-slate-200"
          >
            limpar
          </button>
        )}
      </div>

      {/* ── Estatísticas ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total",   value: processos.length, icon: Scale,       color: "text-[#1A2B3C]",   bg: "bg-slate-100"  },
          { label: "Ativos",  value: totalAtivos,      icon: FileText,    color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Arquiv.", value: totalArquivados,  icon: Archive,     color: "text-slate-500",   bg: "bg-slate-100"  },
          { label: "Recurso", value: totalRecurso,     icon: AlertCircle, color: "text-amber-600",   bg: "bg-amber-50"   },
        ].map((chip) => {
          const Icon = chip.icon;
          return (
            <div key={chip.label} className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg ${chip.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${chip.color} mb-0.5`} />
              <span className={`text-base font-bold ${chip.color}`}>{chip.value}</span>
              <span className="text-[9px] text-slate-500 font-medium">{chip.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Última sincronização ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mb-4">
        <Clock className="w-3 h-3" />
        Última sincronização: agora
      </div>

      {/* ── Erro de API ────────────────────────────────────────────── */}
      {errorApi && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {errorApi}
        </div>
      )}

      {/* ── Lista de Processos ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
              <Search className="w-10 h-10 text-slate-300" />
              <p className="text-slate-500 text-sm text-center">
                {query ? `Nenhum processo encontrado para "${query}"` : "Nenhum processo cadastrado."}
              </p>
              {query && (
                <button onClick={() => setQuery("")} className="text-[#D4AF37] text-sm hover:underline">
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            filtered.map((proc, index) => {
              const cfg = statusConfig[proc.status] ?? statusConfig["Ativo"];
              const isDestaque = index === 0;

              return (
                <div
                  key={proc.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden"
                >
                  {isDestaque && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A059]" />
                  )}

                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="font-mono text-xs text-[#1A2B3C] font-medium tracking-tight truncate">
                          {proc.cnj}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#1A2B3C] truncate">{proc.cliente}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">× {proc.parteContraria}</p>
                    </div>

                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge} ml-2`}>
                      <span className={`w-1 h-1 rounded-full ${cfg.dot} ${proc.status === "Ativo" ? "animate-pulse" : ""}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Detalhes */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1A2B3C]">{proc.tribunal}</p>
                        <p className="text-[10px] text-slate-400 truncate">{proc.vara}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-600">{proc.ultimaMovimentacao.data}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{proc.ultimaMovimentacao.descricao}</p>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#1A2B3C] transition-colors mt-3 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Ver Detalhes</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {isDestaque && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wide flex items-center gap-1 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                        <span className="w-1 h-1 rounded-full bg-[#D4AF37] inline-block" />
                        Mais recente
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Exibindo {filtered.length} de {processos.length} processos
          </p>
        </div>
      )}

      {/* ─── MODAL DE CADASTRO MANUAL (Bottom Sheet) ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setModalOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#1A2B3C]">Cadastrar Processo</h3>
                <p className="text-xs text-slate-400 mt-0.5">Preencha os dados do processo</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <form onSubmit={handleCreateManual} className="space-y-4">

                {/* Número CNJ */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Número CNJ (20 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 0001234-56.2024.8.26.0100"
                    value={form.numero_cnj}
                    onChange={(e) => setForm({ ...form, numero_cnj: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                {/* Tribunal */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tribunal *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.tribunal}
                      onChange={(e) => setForm({ ...form, tribunal: e.target.value })}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {TRIBUNAIS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="arquivado">Arquivado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                    value={form.partes}
                    onChange={(e) => setForm({ ...form, partes: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] placeholder-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition"
                  />
                </div>

                {/* Data de Início */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.data_abertura}
                    onChange={(e) => setForm({ ...form, data_abertura: e.target.value })}
                    className="h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none transition"
                  />
                </div>

                {/* Cliente Vinculado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Cliente Vinculado
                  </label>
                  <div className="relative">
                    <select
                      value={form.cliente_id}
                      onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                      disabled={loadingClientes}
                      className="w-full h-[44px] px-3 border border-slate-200 rounded-lg text-sm text-[#1A2B3C] focus:border-[#D4AF37] outline-none bg-white transition appearance-none disabled:opacity-60"
                    >
                      <option value="">Nenhum</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg p-3">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-xs text-emerald-500 font-medium bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    {successMsg}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2 pb-safe">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-[44px] text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-lg transition disabled:opacity-60"
                  >
                    {submitting ? "Cadastrando..." : "Cadastrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
