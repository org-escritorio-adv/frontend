export interface MovimentacaoAPI {
  data: string
  descricao: string
}

export interface ProcessoAPI {
  id: number
  numero_cnj: string
  tribunal: string
  partes: string | null
  status: string
  cliente_id: number | null
  favorito: boolean
  data_abertura?: string | null
  movimentacoes: MovimentacaoAPI[]
}

/** Modelo de visualização usado pela tela de Processos. */
export interface Processo {
  id: string
  cnj: string
  clienteId: number | null
  cliente: string
  parteContraria: string
  tribunal: string
  vara: string
  ultimaMovimentacao: { data: string; descricao: string }
  status: 'Ativo' | 'Arquivado' | 'Em Recurso' | 'Suspenso'
  favorito: boolean
  valorCausa: string
  casoVinculado: string
}
