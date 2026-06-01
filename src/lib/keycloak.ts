import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'escritorio-adv',
  clientId: 'backend-api'
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

