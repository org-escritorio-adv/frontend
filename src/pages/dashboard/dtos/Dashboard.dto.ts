export interface ResumoDashboard {
  totalProcessos: number
  processosAtivos: number
  tarefasAbertas: number
  prazosProximos: number
}

export interface AtividadeRecente {
  id: number
  descricao: string
  data: string
  processo_id: number
}
