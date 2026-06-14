import { api } from './api';

export interface DataJudProcesso {
  numeroProcesso: string;
  tribunal: string;
  grau: string;
  dataAjuizamento: string;
  classeProcessual?: { codigo: number; nome: string };
  orgaoJulgador?: { codigo: number; nome: string; codigoMunicipioIBGE: number };
}

export interface DataJudConsultaResponse {
  numero_processo: string;
  tribunal: string;
  total: number;
  processos: DataJudProcesso[];
}

export interface DataJudConsultaRequest {
  numero_processo: string;
  tribunal?: string;
}

export interface DataJudImportarRequest {
  numero_processo: string;
  tribunal?: string;
  cliente_id?: number;
  advogado_id?: string;
}

export interface DataJudImportarResponse {
  processo_id: number;
  numero_cnj: string;
  tribunal: string;
  data_abertura: string;
  movimentacoes_importadas: number;
}

export type BuscarDataJudParams = {
  numero_processo?: string;
  cpf?: string;
  oab?: string;
  size?: number;
};

export async function consultarDataJud(
  payload: DataJudConsultaRequest
): Promise<DataJudConsultaResponse> {
  const { data } = await api.post('/datajud/consultar', payload);
  return data;
}

export async function importarDataJud(
  payload: DataJudImportarRequest
): Promise<DataJudImportarResponse> {
  const { data } = await api.post('/datajud/importar', payload);
  return data;
}

export async function buscarDataJud(
  tribunal: string,
  params: BuscarDataJudParams = {}
): Promise<DataJudConsultaResponse> {
  const { data } = await api.get(`/datajud/buscar/${tribunal}`, { params });
  return data;
}

export async function buscarRecentesDataJud(
  tribunal: string,
  size = 10
): Promise<DataJudConsultaResponse> {
  const { data } = await api.get(`/datajud/recentes/${tribunal}`, { params: { size } });
  return data;
}
