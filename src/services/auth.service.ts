import { api } from './api'

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080'
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'escritorio-adv'
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'backend-api'

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: CLIENT_ID,
      username,
      password
    })
  })

  // ---- Bloco de Isolamento e Debug do Código 1 injetado aqui ----
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Keycloak URL usada:', `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`);
    console.error('Status:', response.status);
    console.error('Resposta:', errorBody);
    throw new Error('Credenciais inválidas');
  }
  // -------------------------------------------------------------

  const data = await response.json()
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')

  if (refreshToken) {
    try {
      await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          refresh_token: refreshToken
        })
      })
    } catch {
      // ignora erro de rede — tokens locais serão removidos de qualquer forma
    }
  }

  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

export async function forgotPassword(
  email: string
): Promise<{ message: string; debug_token?: string }> {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function verifyResetToken(email: string, token: string): Promise<{ valid: boolean }> {
  const { data } = await api.post('/auth/verify-reset-token', { email, token })
  return data
}

export async function resetPassword(
  email: string,
  token: string,
  nova_senha: string
): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { email, token, nova_senha })
  return data
}

export interface CurrentUser {
  name: string
  email: string
  role: 'admin' | 'advogado' | 'estagiario'
}

export function getCurrentUser(): CurrentUser | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const roles: string[] = payload.realm_access?.roles ?? []
    const role =
      (['admin', 'advogado', 'estagiario'] as const).find(r => roles.includes(r)) ?? 'advogado'
    return {
      name: payload.name || payload.preferred_username || 'Usuário',
      email: payload.email || '',
      role
    }
  } catch {
    return null
  }
}