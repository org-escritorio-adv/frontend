import { api } from './api'
import type { UsuarioAPI, MeuPerfil } from '@/pages/equipe/dtos/MembroListar.dto'
import type { NovoUsuario, AtualizacaoPerfil } from '@/pages/equipe/dtos/MembroCadastrar.dto'

// Re-exporta os DTOs para manter compatibilidade com os consumidores existentes
export type { UsuarioAPI, MeuPerfil } from '@/pages/equipe/dtos/MembroListar.dto'
export type { NovoUsuario, AtualizacaoPerfil } from '@/pages/equipe/dtos/MembroCadastrar.dto'

export async function listarUsuarios(): Promise<UsuarioAPI[]> {
  const response = await api.get<UsuarioAPI[]>('/usuarios/')
  return response.data
}

export async function criarUsuario(dados: NovoUsuario): Promise<void> {
  await api.post('/usuarios/', dados)
}

export async function buscarMeuPerfil(): Promise<MeuPerfil> {
  const response = await api.get<MeuPerfil>('/usuarios/me')
  return response.data
}

export async function atualizarMeuPerfil(dados: AtualizacaoPerfil): Promise<MeuPerfil> {
  const response = await api.patch<MeuPerfil>('/usuarios/me', dados)
  return response.data
}

export async function excluirUsuario(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`)
}

export async function atualizarPermissoes(
  id: string,
  permissoes: Record<string, boolean>
): Promise<UsuarioAPI> {
  const response = await api.patch<UsuarioAPI>(`/usuarios/${id}/permissoes`, { permissoes })
  return response.data
}
