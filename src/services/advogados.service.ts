import { api } from './api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Advogado {
  id: number
  nome: string
  cargo: string
  especialidade: string | null
  oab: string | null
  email: string | null
  telefone: string | null
  foto_url: string | null
  bio: string | null
}

export interface CriarAdvogadoPayload {
  nome: string
  cargo: string
  especialidade?: string | null
  oab?: string | null
  email?: string | null
  telefone?: string | null
  foto_url?: string | null
  bio?: string | null
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function listarAdvogados(): Promise<Advogado[]> {
  const response = await api.get<Advogado[]>('/advogados/')
  return Array.isArray(response.data) ? response.data : []
}

export async function criarAdvogado(payload: CriarAdvogadoPayload): Promise<Advogado> {
  const response = await api.post<Advogado>('/advogados/', payload)
  return response.data
}

export async function atualizarAdvogado(
  id: number,
  payload: Partial<CriarAdvogadoPayload>
): Promise<Advogado> {
  const response = await api.patch<Advogado>(`/advogados/${id}`, payload)
  return response.data
}

export async function removerAdvogado(id: number): Promise<void> {
  await api.delete(`/advogados/${id}`)
}

export async function uploadFotoAdvogado(id: number, arquivo: File): Promise<Advogado> {
  const formData = new FormData()
  formData.append('file', arquivo)
  // O navegador define o Content-Type (com boundary) automaticamente para FormData.
  const response = await api.post<Advogado>(`/advogados/${id}/foto`, formData)
  return response.data
}
