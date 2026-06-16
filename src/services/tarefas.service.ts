import { api } from './api'
import type { TarefaAPI } from '@/pages/kanban/dtos/TarefaListar.dto'

// Re-exporta o DTO para manter compatibilidade com os consumidores existentes
export type { TarefaAPI } from '@/pages/kanban/dtos/TarefaListar.dto'

export async function buscarTarefas(): Promise<TarefaAPI[]> {
  const response = await api.get('/tarefas/')
  return response.data
}

export async function atualizarTarefa(id: number, data: Partial<TarefaAPI>): Promise<TarefaAPI> {
  const response = await api.put(`/tarefas/${id}`, data)
  return response.data
}
