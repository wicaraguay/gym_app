import { Link } from 'react-router-dom';
import { LucideIcon, SearchX, ShieldAlert, Home, ArrowLeft } from 'lucide-react';

type Accent = 'cyan' | 'warning' | 'danger';

interface Props {
  code: string;
  title: string;
  message: string;
  icon: LucideIcon;
  accent?: Accent;
}

const ACCENT: Record<Accent, { text: string; bg: string; border: string }> = {
  cyan: { text: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/30' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  danger: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
};

// Pagina de estado reutilizable (404, 403, y lo que venga). On-brand.
export function StatusPage({ code, title, message, icon: Icon, accent = 'cyan' }: Props) {
  const c = ACCENT[accent];
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border ${c.bg} ${c.border} ${c.text}`}
        >
          <Icon size={30} />
        </div>
        <p className={`text-5xl font-black tracking-tight ${c.text}`}>{code}</p>
        <h1 className="mt-3 text-xl font-bold text-white">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-400">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-neon-cyan px-4 py-2.5 text-sm font-medium text-body transition-all hover:brightness-110"
          >
            <Home size={16} /> Volver al inicio
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            <ArrowLeft size={16} /> Volver atras
          </button>
        </div>
      </div>
    </div>
  );
}

// Caso: la URL no existe.
export function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Pagina no encontrada"
      message="La direccion que intentaste abrir no existe o fue movida. Revisa el enlace o volve al inicio."
      icon={SearchX}
      accent="cyan"
    />
  );
}

// Caso: la URL existe pero no tenes permiso (ej. recepcionista en seccion de admin).
export function Forbidden() {
  return (
    <StatusPage
      code="403"
      title="Acceso denegado"
      message="Esta seccion es solo para administradores. Si necesitas entrar, pedile acceso al dueno de la cuenta."
      icon={ShieldAlert}
      accent="warning"
    />
  );
}
