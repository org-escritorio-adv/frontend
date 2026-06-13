import axios, { AxiosError } from "axios";
import { keycloak } from "../lib/keycloak";
import { InternalAxiosRequestConfig } from "axios";

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'escritorio-adv';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'backend-api';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (keycloak.authenticated) {
    // Fluxo keycloak-js (redirect): renova o token se necessário
    await keycloak.updateToken(30).catch(() => keycloak.login());
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  } else {
    // Fluxo direto (auth.service.ts): usa o token armazenado no localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor de resposta: tenta renovar o token automaticamente em caso de 401
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken || isRefreshing) {
        // Sem refresh token disponível — redireciona para login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        isRefreshing = true;
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          refresh_token: refreshToken,
        });
        const resp = await fetch(
          `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params },
        );

        if (!resp.ok) throw new Error('Refresh falhou');

        const data = await resp.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Reenvia a requisição original com o novo token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
