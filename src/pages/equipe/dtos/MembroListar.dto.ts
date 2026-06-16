export interface UsuarioAPI {
  id: string
  nome: string
  email: string
  perfil: string
  status: string
  avatar: string
  telefone: string | null
  oab: string | null
  permissoes: Record<string, boolean>
  created_at: string | null
  updated_at: string | null
}

export interface MeuPerfil {
  id: string
  nome: string
  email: string
  perfil: string
  telefone: string | null
  oab: string | null
  status: string | null
  avatar: string | null
  created_at: string | null
  updated_at: string | null
}
