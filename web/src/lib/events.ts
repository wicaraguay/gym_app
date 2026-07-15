// Mini bus de eventos para refrescar en el acto las partes COMPARTIDAS de la
// UI (menu lateral, campanita) cuando una pagina hace un cambio. Evita tener
// que refrescar el navegador para ver el logo/nombre nuevo o que la campanita
// suelte a un cliente al que le acabas de cobrar.
const APP_REFRESH = 'app:refresh';

export const emitRefresh = () => window.dispatchEvent(new Event(APP_REFRESH));

export const onRefresh = (fn: () => void) => {
  window.addEventListener(APP_REFRESH, fn);
  return () => window.removeEventListener(APP_REFRESH, fn);
};
