import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export async function initKeycloak() {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false
  });
  
  if (!authenticated) {
    console.error('Não foi possível autenticar');
    keycloak.login();
  }
  
  return authenticated;
}