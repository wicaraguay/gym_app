import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initErrorTracking } from './lib/reportError';
import { initPwaInstall } from './lib/pwaInstall';
import { applyAccent, cachedAccent } from './lib/theme';
import './index.css';

// Aplica el color de acento cacheado ANTES de renderizar (evita parpadeo).
// Login y Layout lo refrescan con el valor real del backend al cargar.
applyAccent(cachedAccent());

// Arranca el envio remoto de errores (solo si hay VITE_SENTRY_DSN).
initErrorTracking();

// Captura el evento de instalacion de la PWA temprano (para no perderlo). El
// boton "Instalar app" solo se muestra dentro del admin (ver Layout).
initPwaInstall();

// Registra el service worker de la PWA (instalable en Android/iOS). Solo en
// produccion: en dev interferiria con el hot-reload de Vite.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary boundary="app" fullscreen>
      <BrowserRouter>
        <AuthProvider>
          <ConfirmProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ConfirmProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
