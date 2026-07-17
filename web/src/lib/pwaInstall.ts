// Logica de instalacion de la PWA.
//
// El navegador dispara 'beforeinstallprompt' UNA vez y temprano (a veces antes
// de que el usuario entre al admin). Por eso lo capturamos GLOBALMENTE aca
// (initPwaInstall se llama en main.tsx) y guardamos el evento. El BOTON de
// "Instalar app" se muestra SOLO dentro del admin (ver InstallButton, montado
// en el Layout): si en el futuro se agrega un sitio publico por fuera del
// Layout, ese sitio NO mostrara el boton.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function initPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Evita el mini-banner automatico del navegador: usamos nuestro propio boton.
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function subscribeInstall(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Hay un prompt de instalacion disponible (Android / Chrome de escritorio).
export function canInstall(): boolean {
  return deferred !== null;
}

// Dispara el instalador nativo. Devuelve true si el usuario acepto.
export async function runInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome === 'accepted';
}

// La app ya corre instalada (standalone): no hay que ofrecer instalarla.
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// iOS/Safari no soporta 'beforeinstallprompt': se instala a mano (Compartir ->
// Anadir a inicio). Detectamos iOS para mostrar esas instrucciones.
export function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}
