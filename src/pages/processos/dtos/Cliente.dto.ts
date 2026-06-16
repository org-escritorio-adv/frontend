export interface ClienteAPI {
  id: number
  nome_razao_social: string
}

export interface ClienteCreate {
  nome_razao_social: string
  cpf_cnpj: string
  autorizacao_busca: boolean
}
