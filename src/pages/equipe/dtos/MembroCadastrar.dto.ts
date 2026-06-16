export interface NovoUsuario {
  nome: string
  email: string
  senha: string
  perfil: string
}

export interface AtualizacaoPerfil {
  nome?: string
  email?: string
  telefone?: string
  oab?: string
}
