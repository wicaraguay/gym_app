import * as Sentry from '@sentry/react';

// Punto UNICO de captura de errores de la app.
//  - Siempre registra en consola (util en desarrollo).
//  - Si hay un DSN configurado (VITE_SENTRY_DSN), ademas lo envia a TU
//    tablero privado de Sentry. Sin DSN, Sentry queda apagado y esto sigue
//    funcionando igual (solo consola). Ningun otro archivo necesita cambiar.

export interface ErrorContext {
  /** Nombre del boundary que atrapo el error (ej. "app", "pagina"). */
  boundary?: string;
  /** Stack de componentes de React (de componentDidCatch). */
  componentStack?: string;
}

// Se llama UNA vez, al arrancar la app (desde main.tsx).
export function initErrorTracking(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return; // sin DSN -> Sentry apagado, solo consola.

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Solo nos interesan los errores, no metricas de performance:
    // mas liviano y no consume la cuota gratis en trazas.
    tracesSampleRate: 0,
  });
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const where = context.boundary ? `[${context.boundary}]` : '';
  console.error(`[app-error]${where}`, error);
  if (context.componentStack) {
    console.error('[app-error] componentStack:', context.componentStack);
  }

  // Si Sentry no fue inicializado (sin DSN), captureException es un no-op
  // seguro: no lanza ni rompe nada.
  Sentry.captureException(error, {
    tags: { boundary: context.boundary ?? 'desconocido' },
  });
}
