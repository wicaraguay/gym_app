import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { reportError } from '../lib/reportError';

interface Props {
  children: ReactNode;
  /** Etiqueta para saber DONDE revento (ej. "app", "pagina"). */
  boundary?: string;
  /** Si este valor cambia, se limpia el error (ej. la ruta actual). */
  resetKey?: string | number;
  /** true = fallback a pantalla completa; false = compacto dentro del layout. */
  fullscreen?: boolean;
}

interface State {
  error: Error | null;
}

// Los error boundaries DEBEN ser class components: React solo expone
// getDerivedStateFromError / componentDidCatch en clases, no en hooks.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      boundary: this.props.boundary,
      componentStack: info.componentStack ?? undefined,
    });
  }

  componentDidUpdate(prev: Props) {
    // Al navegar a otra ruta (cambia resetKey) se limpia el error solo.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const card = (
      <div className="max-w-md w-full rounded-2xl border border-danger/30 bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-white">Algo salio mal</h2>
        <p className="mt-1 text-sm text-slate-400">
          Ocurrio un error inesperado en esta seccion. Tus datos estan a salvo.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 rounded-xl bg-neon-cyan px-4 py-2.5 text-sm font-medium text-body transition-all hover:brightness-110"
          >
            <RotateCcw size={16} /> Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            Recargar la app
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-body/60 p-3 text-left text-xs text-danger/80">
            {error.message}
          </pre>
        )}
      </div>
    );

    if (this.props.fullscreen) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-body p-4">
          {card}
        </div>
      );
    }
    return <div className="flex justify-center py-10 px-4">{card}</div>;
  }
}
