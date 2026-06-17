import { api } from './api'

export interface NotificacaoAPI {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  link: string | null
  lida: boolean
  usuario_id: number | null
  created_at: string | null
}

export async function buscarNotificacoes(apenasNaoLidas = false): Promise<NotificacaoAPI[]> {
  const response = await api.get('/notificacoes/', {
    params: { apenas_nao_lidas: apenasNaoLidas }
  })
  return response.data
}

export async function contarNaoLidas(): Promise<number> {
  const response = await api.get('/notificacoes/nao-lidas/contagem')
  return response.data.nao_lidas
}

export async function marcarComoLida(id: number): Promise<void> {
  await api.patch(`/notificacoes/${id}/marcar-lida`)
}

export async function marcarTodasComoLidas(): Promise<void> {
  await api.patch('/notificacoes/marcar-todas-lidas')
}