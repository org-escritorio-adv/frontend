import Keycloak from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';

const keycloak = new Keycloak({
  url: keycloakUrl, 
  realm: 'escritorio-realm',
  clientId: 'frontend-client',
});

export default keycloak;