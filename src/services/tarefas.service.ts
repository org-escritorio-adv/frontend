import { api } from './api';

export interface TarefaAPI {
  id: number;
  titulo: string;
  descricao: string | null;
  status: string;
  processo_id: number | null;
  responsavel_id: number | null;
  created_at: string;
  updated_at: string;
}

export async function buscarTarefas(): Promise<TarefaAPI[]> {
  const response = await api.get('/tarefas');
  return response.data;
}

export async function atualizarTarefa(id: number, data: Partial<TarefaAPI>): Promise<TarefaAPI> {
  const response = await api.put(`/tarefas/${id}`, data);
  return response.data;
}
