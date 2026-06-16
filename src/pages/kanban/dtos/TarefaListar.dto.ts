export interface TarefaAPI {
  id: number
  titulo: string
  descricao: string | null
  status: string
  processo_id: number | null
  responsavel_id: number | null
  created_at: string
  updated_at: string
}
