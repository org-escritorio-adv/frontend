const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'escritorio-adv';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'backend-api';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function forgotPassword(email: string): Promise<{ message: string; debug_token?: string }> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Erro ao solicitar recuperação de senha.');
  return data;
}

export async function verifyResetToken(email: string, token: string): Promise<{ valid: boolean }> {
  const response = await fetch(`${API_URL}/auth/verify-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Token inválido ou expirado.');
  return data;
}

export async function resetPassword(email: string, token: string, nova_senha: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, nova_senha }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Erro ao redefinir senha.');
  return data;
}
