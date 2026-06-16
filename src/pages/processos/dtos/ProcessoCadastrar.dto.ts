export interface CriarProcessoPayload {
  numero_cnj: string
  tribunal: string
  partes: string
  data_abertura: string
  status: string
  favorito: boolean
  cliente_id: number | null
  advogado_id: null
}

export interface AtualizarProcessoPayload {
  cliente_id?: number | null
  status?: string
  partes?: string
  tribunal?: string
}
