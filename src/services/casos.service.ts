import { api } from './api'
import type { PrazoAPI, TarefaAPI, ProcessoDetalhadoAPI } from '@/pages/casos/dtos/CasoDetalhe.dto'

// Re-exporta os DTOs para manter compatibilidade com os consumidores existentes
export type {
  MovimentacaoAPI,
  PrazoAPI,
  TarefaAPI,
  ProcessoDetalhadoAPI
} from '@/pages/casos/dtos/CasoDetalhe.dto'

export async function buscarProcesso(id: number): Promise<ProcessoDetalhadoAPI> {
  const { data } = await api.get(`/processos/${id}`)
  return data
}

export async function buscarPrazosDoProcesso(processo_id: number): Promise<PrazoAPI[]> {
  const { data } = await api.get('/prazos/')
  return (data as PrazoAPI[]).filter(p => p.processo_id === processo_id)
}

export async function buscarTarefasDoProcesso(processo_id: number): Promise<TarefaAPI[]> {
  const { data } = await api.get('/tarefas/')
  return (data as TarefaAPI[]).filter(t => t.processo_id === processo_id)
}
