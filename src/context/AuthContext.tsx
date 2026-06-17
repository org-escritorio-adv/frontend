import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  login as authLogin,
  logout as authLogout,
  getCurrentUser,
  type CurrentUser
} from '@/services/auth.service'
import { buscarMeuPerfil } from '@/services/equipe.service'

interface AuthContextData {
  isAuthenticated: boolean
  token: string | null
  user: CurrentUser | null
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissoes, setPermissoes] = useState<Record<string, boolean> | undefined>(undefined)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) setToken(storedToken)
    setIsLoading(false)
  }, [])

  // Carrega as permissões individuais (override por usuário) do backend
  // sempre que o token mudar — o JWT do Keycloak só traz a role, não as
  // permissões finas configuradas no Painel de Permissões.
  useEffect(() => {
    if (!token) {
      setPermissoes(undefined)
      return
    }
    let cancelado = false
    buscarMeuPerfil()
      .then(perfil => {
        if (!cancelado) setPermissoes(perfil.permissoes ?? {})
      })
      .catch(() => {
        if (!cancelado) setPermissoes(undefined)
      })
    return () => {
      cancelado = true
    }
  }, [token])

  // Mantém o estado sincronizado quando os tokens são alterados em outra aba
  // ou pelo interceptor do axios (refresh automático em caso de 401).
  useEffect(() => {
    function syncFromStorage() {
      setToken(localStorage.getItem('token'))
    }
    window.addEventListener('storage', syncFromStorage)
    return () => window.removeEventListener('storage', syncFromStorage)
  }, [])

  async function signIn(username: string, password: string) {
    await authLogin(username, password) // grava token/refresh_token no localStorage
    setToken(localStorage.getItem('token'))
  }

  async function signOut() {
    await authLogout() // remove tokens e encerra a sessão no Keycloak
    setToken(null)
  }

  const baseUser = token ? getCurrentUser() : null
  const user: CurrentUser | null = baseUser ? { ...baseUser, permissoes } : null

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!token, token, user, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
