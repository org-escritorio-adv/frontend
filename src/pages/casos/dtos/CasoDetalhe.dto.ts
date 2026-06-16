export interface MovimentacaoAPI {
  id: number
  data: string
  descricao: string
  processo_id: number
}

export interface PrazoAPI {
  id: number
  titulo: string
  data_limite: string
  status: string
  processo_id: number
}

export interface TarefaAPI {
  id: number
  titulo: string
  descricao: string | null
  status: string
  processo_id: number | null
  responsavel_id: string | null
}

export interface ProcessoDetalhadoAPI {
  id: number
  numero_cnj: string
  tribunal: string
  partes: string | null
  data_abertura: string | null
  status: string
  favorito: boolean
  cliente_id: number | null
  advogado_id: string | null
  movimentacoes: MovimentacaoAPI[]
}
