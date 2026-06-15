import { api } from './api';

export interface CalcularPrazoResponse {
  data_inicial: string;
  dias_uteis: number;
  data_final: string;
}

export async function calcularDataPrazo(dataInicial: string, diasUteis: number): Promise<CalcularPrazoResponse> {
  const response = await api.get<CalcularPrazoResponse>('/prazos/calcular-data', {
    params: {
      data_inicial: dataInicial,
      dias_uteis: diasUteis,
    },
  });
  return response.data;
}

export interface PrazoCreate {
  titulo: string;
  data_limite: string; // ISO 8601 string
  processo_id: number;
  status?: string;
}

export interface PrazoAPI extends PrazoCreate {
  id: number;
}

export async function criarPrazo(payload: PrazoCreate): Promise<PrazoAPI> {
  const response = await api.post<PrazoAPI>('/prazos/', payload);
  return response.data;
}
