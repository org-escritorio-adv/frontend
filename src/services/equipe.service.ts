import { api } from './api';

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
}

export interface UsuarioAPI {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  status: string;
  avatar: string;
  telefone: string;
  permissoes: Record<string, boolean>;
}

export async function listarUsuarios(): Promise<UsuarioAPI[]> {
  const response = await api.get<UsuarioAPI[]>('/usuarios/');
  return response.data;
}

export async function criarUsuario(dados: NovoUsuario): Promise<void> {
  await api.post('/usuarios/', dados);
}
