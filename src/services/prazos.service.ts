import { api } from './api'
import type { CalcularPrazoResponse, PrazoCreate, PrazoAPI } from '@/pages/processos/dtos/Prazo.dto'

// Re-exporta os DTOs para manter compatibilidade com os consumidores existentes
export type { CalcularPrazoResponse, PrazoCreate, PrazoAPI } from '@/pages/processos/dtos/Prazo.dto'

export async function calcularDataPrazo(
  dataInicial: string,
  diasUteis: number
): Promise<CalcularPrazoResponse> {
  const response = await api.get<CalcularPrazoResponse>('/prazos/calcular-data', {
    params: {
      data_inicial: dataInicial,
      dias_uteis: diasUteis
    }
  })
  return response.data
}

export async function criarPrazo(payload: PrazoCreate): Promise<PrazoAPI> {
  const response = await api.post<PrazoAPI>('/prazos/', payload)
  return response.data
}
