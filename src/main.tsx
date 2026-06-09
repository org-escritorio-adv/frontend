import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.tsx';
import keycloak from './keycloak';
import './styles/index.css';

keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (authenticated) {
    localStorage.setItem('token', keycloak.token || '');
    
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}).catch((err) => {
  console.error("Erro ao autenticar no Keycloak", err);
});