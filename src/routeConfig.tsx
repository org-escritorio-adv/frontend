export const routePaths = {
  landing: '/',
  login: '/login',
  recoverPassword: '/recuperar-senha',
  resetPassword: '/tela-redefinicao',
  dashboard: '/dashboard',
  app: '/app',
  appCases: '/app/casos',
  appProcessos: '/app/processos',
  appCMS: '/app/cms',
  appEquipe: '/app/equipe',
  appAjustes: '/app/ajustes',
  appCaseDetails: (caseId: string) => `/app/caso/${caseId}`,
  legacyCase: (caseId: string) => `/caso/${caseId}`
} as const
