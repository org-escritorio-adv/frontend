import { api } from './api';

export interface ResumoDashboard {
  totalProcessos: number;
  processosAtivos: number;
  tarefasAbertas: number;
  prazosProximos: number;
}

export interface AtividadeRecente {
  id: number;
  descricao: string;
  data: string;
  processo_id: number;
}

export async function buscarResumo(): Promise<ResumoDashboard> {
  const [processosRes, tarefasRes, prazosRes] = await Promise.all([
    api.get('/processos'),
    api.get('/tarefas'),
    api.get('/prazos'),
  ]);

  const processos: { status: string }[] = processosRes.data;
  const tarefas: { status: string }[] = tarefasRes.data;
  const prazos: { status: string; data_limite: string }[] = prazosRes.data;

  const hoje = new Date();
  const em7Dias = new Date(hoje);
  em7Dias.setDate(hoje.getDate() + 7);

  return {
    totalProcessos: processos.length,
    processosAtivos: processos.filter((p) => p.status === 'ativo').length,
    tarefasAbertas: tarefas.filter((t) => t.status === 'aberta').length,
    prazosProximos: prazos.filter((p) => {
      const limite = new Date(p.data_limite);
      return p.status === 'pendente' && limite >= hoje && limite <= em7Dias;
    }).length,
  };
}

export async function buscarAtividades(): Promise<AtividadeRecente[]> {
  const { data } = await api.get('/movimentacoes');
  return data as AtividadeRecente[];
}
