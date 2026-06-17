import type { CurrentUser } from '@/services/auth.service'

export type Role = CurrentUser['role']

type RbacUser = Pick<CurrentUser, 'role'> & { permissoes?: CurrentUser['permissoes'] }

/** Checa uma permissão individual (override por usuário, definido no Painel de
 * Permissões); cai para `fallback` (regra padrão por role) quando o usuário
 * não tem essa chave em `permissoes`. */
function checar(user: RbacUser | null | undefined, chave: string, fallback: boolean): boolean {
  const valor = user?.permissoes?.[chave]
  return valor !== undefined ? valor : fallback
}

export function canCreateProcessos(user?: RbacUser | null): boolean {
  return checar(user, 'criarProcessos', user?.role === 'admin' || user?.role === 'advogado')
}

export function canEditProcessos(user?: RbacUser | null): boolean {
  return checar(user, 'editarProcessos', user?.role === 'admin' || user?.role === 'advogado')
}

export function canCreateClientes(user?: RbacUser | null): boolean {
  return checar(user, 'criarClientes', user?.role === 'admin' || user?.role === 'advogado')
}

export function canExportDados(user?: RbacUser | null): boolean {
  return checar(user, 'exportarDados', user?.role === 'admin' || user?.role === 'advogado')
}

export function canDeleteProcessos(user?: RbacUser | null): boolean {
  return checar(user, 'excluirProcessos', user?.role === 'admin' || user?.role === 'advogado')
}

/** Sem nenhuma permissão de escrita sobre processos — só visualização. */
export function isReadOnly(user?: RbacUser | null): boolean {
  return !canCreateProcessos(user) && !canEditProcessos(user) && !canDeleteProcessos(user)
}

/** CMS (site institucional) é exclusivo do admin por padrão — advogado e estagiário
 * só têm acesso se a permissão "editarPerfisSite" ou "publicarConteudo" for ativada. */
export function canAccessCMS(user?: RbacUser | null): boolean {
  if (user?.role === 'admin') return true
  return checar(user, 'editarPerfisSite', false) || checar(user, 'publicarConteudo', false)
}

/** Listagem de clientes (/clientes/) é restrita a admin e advogado no backend. */
export function canViewClientes(user?: RbacUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'advogado'
}

/** Gestão de usuários (/usuarios/) é exclusiva do admin no backend. */
export function canManageUsuarios(user?: RbacUser | null): boolean {
  return checar(user, 'gerenciarUsuarios', user?.role === 'admin')
}
