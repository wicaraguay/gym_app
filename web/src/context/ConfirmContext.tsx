import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
  // Oculta el boton Cancelar: convierte el modal en una ventana de solo aviso.
  hideCancel?: boolean;
}

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<boolean>>(
  () => Promise.resolve(false),
);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ fn: Resolver } | null>(null);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setOpts(o);
        setResolver({ fn: resolve });
      }),
    [],
  );

  const close = useCallback(
    (value: boolean) => {
      resolver?.fn(value);
      setOpts(null);
      setResolver(null);
    },
    [resolver],
  );

  // Cerrar con Escape (equivale a Cancelar)
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts, close]);

  const danger = opts?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  danger
                    ? 'bg-danger/10 text-danger'
                    : 'bg-neon-cyan/10 text-neon-cyan'
                }`}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                {opts.title && (
                  <p className="font-semibold text-white mb-1">{opts.title}</p>
                )}
                <p className="text-sm text-slate-300 leading-relaxed">
                  {opts.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              {!opts.hideCancel && (
                <Button variant="ghost" size="sm" onClick={() => close(false)}>
                  {opts.cancelText || 'Cancelar'}
                </Button>
              )}
              <Button
                variant={danger ? 'danger' : 'primary'}
                size="sm"
                onClick={() => close(true)}
              >
                {opts.confirmText || 'Aceptar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = () => useContext(ConfirmContext);
