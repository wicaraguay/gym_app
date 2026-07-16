import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const noop = () => {};
const ToastContext = createContext<ToastApi>({
  success: noop,
  error: noop,
  info: noop,
});

const STYLES: Record<
  ToastKind,
  { icon: typeof CheckCircle2; border: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, border: 'border-success/40', iconColor: 'text-success' },
  error: { icon: AlertTriangle, border: 'border-danger/40', iconColor: 'text-danger' },
  info: { icon: Info, border: 'border-neon-cyan/40', iconColor: 'text-neon-cyan' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++counter.current;
      setToasts((list) => [...list, { id, kind, message }]);
      // Los errores duran un poco mas: son mas importantes de leer.
      window.setTimeout(() => remove(id), kind === 'error' ? 6000 : 4000);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const s = STYLES[t.kind];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border ${s.border} bg-surface px-3.5 py-3 shadow-card animate-fade-in`}
            >
              <Icon size={18} className={`${s.iconColor} shrink-0 mt-0.5`} />
              <p className="flex-1 text-sm leading-snug text-slate-100">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Cerrar"
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
