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
