import { api } from './api';

export interface UsuarioAPI {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  perfil: string;
  status: string;
  avatar: string;
}

export async function buscarUsuarios(): Promise<UsuarioAPI[]> {
  const { data } = await api.get('/usuarios');
  return data;
}

export async function buscarUsuario(id: string): Promise<UsuarioAPI> {
  const { data } = await api.get(`/usuarios/${id}`);
  return data;
}
