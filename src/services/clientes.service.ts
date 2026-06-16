import { api } from './api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClienteCompleto {
  id: number
  nome_razao_social: string
  cpf_cnpj: string
  telefone: string | null
  email: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CriarClientePayload {
  nome_razao_social: string
  cpf_cnpj: string
  telefone?: string
  email?: string
}

export type TipoCliente = 'PF' | 'PJ'

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function inferirTipo(cpf_cnpj: string): TipoCliente {
  const digits = cpf_cnpj.replace(/\D/g, '')
  return digits.length <= 11 ? 'PF' : 'PJ'
}

export function formatarDocumento(cpf_cnpj: string): string {
  const digits = cpf_cnpj.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return cpf_cnpj
}

export function validarDocumento(cpf_cnpj: string): boolean {
  const digits = cpf_cnpj.replace(/\D/g, '')
  return digits.length === 11 || digits.length === 14
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function listarClientes(): Promise<ClienteCompleto[]> {
  const response = await api.get('/clientes/')
  const data = response.data
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export async function buscarClientePorId(id: number): Promise<ClienteCompleto> {
  const response = await api.get(`/clientes/${id}`)
  return response.data
}

export async function criarCliente(payload: CriarClientePayload): Promise<ClienteCompleto> {
  const response = await api.post('/clientes/', payload)
  return response.data
}
