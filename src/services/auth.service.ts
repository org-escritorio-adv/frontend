import { api } from './api';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'escritorio-realm';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend-client';

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username,
        password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Credenciais inválidas');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

export async function forgotPassword(email: string): Promise<{ message: string; debug_token?: string }> {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function verifyResetToken(email: string, token: string): Promise<{ valid: boolean }> {
  const { data } = await api.post('/auth/verify-reset-token', { email, token });
  return data;
}

export async function resetPassword(email: string, token: string, nova_senha: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { email, token, nova_senha });
  return data;
}
