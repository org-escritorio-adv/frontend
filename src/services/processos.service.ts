import { api } from "./api";

// tipos da API
export interface ClienteAPI {
  id: number;
  nome_razao_social: string;
}

interface MovimentacaoAPI {
  data: string;
  descricao: string;
}

export interface ProcessoAPI {
  id: number;
  numero_cnj: string;
  tribunal: string;
  partes: string | null;
  status: string;
  cliente_id: number | null;
  movimentacoes: MovimentacaoAPI[];
}

export async function buscarProcessosRaw(): Promise<ProcessoAPI[]> {
  const response = await api.get("/processos");
  return response.data;
}

export interface CriarProcessoPayload {
  numero_cnj: string;
  tribunal: string;
  partes: string;
  data_abertura: string;
  status: string;
  favorito: boolean;
  cliente_id: number | null;
  advogado_id: null;
}

export interface Processo {
  id: string;
  cnj: string;
  cliente: string;
  parteContraria: string;
  tribunal: string;
  vara: string;
  ultimaMovimentacao: { data: string; descricao: string };
  status: "Ativo" | "Arquivado" | "Em Recurso" | "Suspenso";
  valorCausa: string;
  casoVinculado: string;
}

export interface ClienteCreate {
  nome_razao_social: string;
  cpf_cnpj: string;
  autorizacao_busca: boolean;
}

// funções
export async function criarCliente(dados: ClienteCreate): Promise<ClienteAPI> {
  const response = await api.post("/clientes/", dados);
  return response.data;
}

export async function buscarClientes(): Promise<ClienteAPI[]> {
  const response = await api.get("/clientes");
  const data = response.data;
  
  // garante que sempre retorna array
  if (Array.isArray(data)) {
    return data;}

  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}

export async function buscarProcessos(
  clientesMap: Record<number, string>
): Promise<Processo[]> {
  const response = await api.get("/processos");
  const data: ProcessoAPI[] = response.data;

  return data.map((p) => ({
    id: String(p.id),
    cnj: p.numero_cnj,
    cliente: p.cliente_id
      ? (clientesMap[p.cliente_id] ?? `Cliente #${p.cliente_id}`)
      : "Sem Cliente",
    parteContraria: p.partes ?? "Não informada",
    tribunal: p.tribunal,
    vara: "Vara Única",
    ultimaMovimentacao:
      p.movimentacoes?.length > 0
        ? {
            data: new Date(p.movimentacoes[0].data).toLocaleDateString("pt-BR"),
            descricao: p.movimentacoes[0].descricao,
          }
        : { data: "-", descricao: "Sem movimentações" },
    status: p.status === "arquivado" ? "Arquivado" : "Ativo",
    valorCausa: "R$ 0,00",
    casoVinculado: "-",
  }));
}

export async function criarProcesso(payload: CriarProcessoPayload): Promise<void> {
  await api.post("/processos", payload);
}

export async function exportarPdfProcesso(processoId: string): Promise<void> {
  const response = await api.get(`/processos/${processoId}/exportar-pdf`, {
    responseType: "blob",
  });
  
  // Create a blob URL and trigger download
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Processo_${processoId}.pdf`);
  document.body.appendChild(link);
  link.click();
  
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function exportarCsvProcessos(): Promise<void> {
  const response = await api.get("/processos/exportar-csv", {
    responseType: "blob",
  });
  
  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "processos.csv");
  document.body.appendChild(link);
  link.click();
  
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}