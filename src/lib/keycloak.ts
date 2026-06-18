import Keycloak from 'keycloak-js'

const isDocker = window.location.hostname === 'frontend'
const kcUrl = isDocker ? 'http://host.docker.internal:8080' : import.meta.env.VITE_KEYCLOAK_URL
console.error("DEBUG KEYCLOAK INIT: hostname=", window.location.hostname, "isDocker=", isDocker, "kcUrl=", kcUrl)
export const keycloak = new Keycloak({
  url: kcUrl,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID
})

export async function initKeycloak() {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false
  })

  if (!authenticated) {
    console.error('Não foi possível autenticar')
    keycloak.login()
  }

  return authenticated
}
