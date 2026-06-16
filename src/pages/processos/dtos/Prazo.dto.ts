export interface CalcularPrazoResponse {
  data_inicial: string
  dias_uteis: number
  data_final: string
}

export interface PrazoCreate {
  titulo: string
  data_limite: string // ISO 8601 string
  processo_id: number
  status?: string
}

export interface PrazoAPI extends PrazoCreate {
  id: number
}
