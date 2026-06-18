import { api } from './api'
import type { ResumoDashboard, AtividadeRecente } from '@/pages/dashboard/dtos/Dashboard.dto'

export type { ResumoDashboard, AtividadeRecente } from '@/pages/dashboard/dtos/Dashboard.dto'

export async function buscarResumo(): Promise<ResumoDashboard> {
  const { data } = await api.get('/dashboard/resumo')
  return data.resumo
}

export async function buscarAtividades(): Promise<AtividadeRecente[]> {
  const { data } = await api.get('/dashboard/resumo')
  return data.atividades ?? []
}
