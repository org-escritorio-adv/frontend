import { api } from './api'

export interface DataJudProcesso {
  numeroProcesso: string
  tribunal: string | null
  grau: string | null
  dataAjuizamento: string | null
  dataHoraUltimaAtualizacao: string | null
  classe: { nome?: string; [key: string]: any } | null
  assuntos: Array<{ nome?: string; [key: string]: any }>
  orgaoJulgador: { nome?: string; [key: string]: any } | null
  partes: Array<{ nome?: string; tipo?: string; polo?: string; [key: string]: any }>
  movimentos: Array<{ nome?: string; dataHora?: string; [key: string]: any }>
  nivelSigilo: number | null
}

export interface DataJudConsultaResponse {
  numero_processo: string
  tribunal: string
  total: number
  processos: DataJudProcesso[]
}

export interface DataJudImportarResponse {
  processo_id: number
  numero_cnj: string
  tribunal: string | null
  data_abertura: string | null
  movimentacoes_importadas: number
}

export async function consultarDataJud(
  numeroCnj: string,
  tribunal: string
): Promise<DataJudConsultaResponse> {
  const response = await api.post('/datajud/consultar', {
    numero_processo: numeroCnj,
    tribunal
  })
  return response.data
}

export async function importarDataJud(
  numeroCnj: string,
  tribunal: string,
  clienteId?: number | null
): Promise<DataJudImportarResponse> {
  const response = await api.post('/datajud/importar', {
    numero_processo: numeroCnj,
    tribunal,
    cliente_id: clienteId ?? null,
    advogado_id: null
  })
  return response.data
}

export interface DataJudSincronizarResponse {
  total_processos: number
  sincronizados_com_sucesso: number
  falhas: number
  ultima_sincronizacao: string // timestamp ISO retornado pelo backend
}

export async function sincronizarTodosProcessos(): Promise<DataJudSincronizarResponse> {
  const response = await api.post('/datajud/sincronizar-todos')
  return response.data
}