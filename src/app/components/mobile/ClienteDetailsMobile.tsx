import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft, User, Building2, Phone, Mail,
  Scale, Briefcase, FileText, Hash, Upload,
  Calendar, AlertCircle,
} from "lucide-react";
import {
  buscarClientePorId,
  inferirTipo,
  formatarDocumento,
  type ClienteCompleto,
} from "../../../services/clientes.service";
import { api } from "../../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProcessoVinculado {
  id: number;
  numero_cnj: string;
  tribunal: string;
  status: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClienteDetailsMobile() {
  const { clienteId } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<ClienteCompleto | null>(null);
  const [processos, setProcessos] = useState<ProcessoVinculado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clienteId) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [clienteData, processosData] = await Promise.all([
          buscarClientePorId(Number(clienteId)),
          api.get("/processos").then((r) => {
            const data: any[] = Array.isArray(r.data) ? r.data : r.data?.results ?? [];
            return data.filter((p) => p.cliente_id === Number(clienteId));
          }),
        ]);
        setCliente(clienteData);
        setProcessos(processosData);
      } catch {
        setError("Não foi possível carregar os dados do cliente.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [clienteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-6" />
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="h-14 bg-slate-100 rounded-xl mb-4" />
          <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 gap-3">
        <AlertCircle className="w-10 h-10 text-red-300" />
        <p className="text-slate-500 text-sm text-center">{error || "Cliente não encontrado."}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#D4AF37] text-sm hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const tipo = inferirTipo(cliente.cpf_cnpj);
  const isPJ = tipo === "PJ";

  const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
    ativo:     { label: "Ativo",      badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    arquivado: { label: "Arquivado",  badge: "bg-slate-100 text-slate-600",     dot: "bg-slate-400"   },
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">

      {/* ── Topo ────────────────────────────────────────────────── */}
      <div className="bg-[#1A2B3C] px-4 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Clientes
        </button>

        {/* Avatar + Nome */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isPJ ? "bg-blue-500/20" : "bg-emerald-500/20"
          }`}>
            {isPJ
              ? <Building2 className="w-7 h-7 text-blue-300" />
              : <User className="w-7 h-7 text-emerald-300" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isPJ ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {tipo}
              </span>
            </div>
            <h1 className="text-white font-bold text-lg leading-tight truncate">
              {cliente.nome_razao_social}
            </h1>
            <p className="text-white/50 text-xs font-mono mt-0.5">
              {formatarDocumento(cliente.cpf_cnpj)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* ── Dados de Contato ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dados de Contato
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              {
                icon: Hash,
                label: "CPF / CNPJ",
                value: formatarDocumento(cliente.cpf_cnpj),
                mono: true,
              },
              {
                icon: Mail,
                label: "E-mail",
                value: cliente.email || "Não informado",
                muted: !cliente.email,
              },
              {
                icon: Phone,
                label: "Telefone",
                value: cliente.telefone || "Não informado",
                muted: !cliente.telefone,
              },
              {
                icon: Calendar,
                label: "Cadastrado em",
                value: cliente.created_at
                  ? new Date(cliente.created_at).toLocaleDateString("pt-BR")
                  : "—",
                muted: !cliente.created_at,
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#1A2B3C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                      {row.label}
                    </p>
                    <p className={`text-sm mt-0.5 truncate ${
                      row.muted ? "text-slate-300 italic" : "text-[#1A2B3C] font-medium"
                    } ${row.mono ? "font-mono" : ""}`}>
                      {row.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Processos Vinculados ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Processos Judiciais
            </h2>
            <span className="text-xs font-bold text-[#1A2B3C] bg-slate-100 px-2 py-0.5 rounded-full">
              {processos.length}
            </span>
          </div>

          {processos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Scale className="w-8 h-8 text-slate-200" />
              <p className="text-xs text-slate-400">Nenhum processo vinculado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {processos.map((proc) => {
                const cfg = statusConfig[proc.status] ?? statusConfig["ativo"];
                return (
                  <div key={proc.id} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2B3C]/5 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-3.5 h-3.5 text-[#1A2B3C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium text-[#1A2B3C] truncate">
                        {proc.numero_cnj}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{proc.tribunal}</p>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Casos Kanban ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Demandas Internas (Casos)
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Briefcase className="w-8 h-8 text-slate-200" />
            <p className="text-xs text-slate-400">Nenhum caso vinculado.</p>
          </div>
        </div>

        {/* ── Termo de Autorização ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Compliance — Termo de Autorização
            </h2>
          </div>
          <div className="px-4 py-5">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Faça o upload do Termo de Autorização assinado pelo cliente para permitir
              consultas por CPF/CNPJ em conformidade com a LGPD.
            </p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-6 px-4 cursor-pointer hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-colors">
              <Upload className="w-6 h-6 text-slate-300" />
              <span className="text-xs text-slate-400 text-center">
                Toque para selecionar o arquivo
              </span>
              <span className="text-[10px] text-slate-300">PDF, JPG ou PNG · Máx. 10 MB</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
