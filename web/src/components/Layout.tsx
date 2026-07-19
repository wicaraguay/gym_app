import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import {
  LayoutGrid,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Menu,
  X,
  Dumbbell,
  Shield,
  Globe,
  LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { onRefresh } from '../lib/events';
import { useAuth } from '../context/AuthContext';
import { applyAccent } from '../lib/theme';
import { DevCredit } from './DevCredit';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/admin/members', label: 'Clientes', icon: Users },
  { to: '/admin/plans', label: 'Planes', icon: CreditCard },
  { to: '/admin/team', label: 'Equipo', icon: Shield, adminOnly: true },
  { to: '/admin/sitio', label: 'Sitio web', icon: Globe, adminOnly: true },
  { to: '/admin/settings', label: 'Configuracion', icon: SettingsIcon },
];

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface Notif {
  type: 'cobro' | 'vencer';
  membershipId: string;
  memberId: string;
  memberName: string;
  balance?: number;
  daysSince?: number;
  daysLeft?: number;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logo, setLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('CrossFit');
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Cierra la campanita al clickear fuera de ella o al presionar Escape.
  // Usa un listener sobre document (no un backdrop) para no depender de
  // stacking contexts: el header tiene backdrop-blur y "atrapa" a los
  // elementos position:fixed, por eso un backdrop no cubre toda la pantalla.
  useEffect(() => {
    if (!bellOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBellOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [bellOpen]);

  const loadNotifs = () =>
    api
      .get('/dashboard/notifications')
      .then((r) => setNotifs(r.data))
      .catch(() => {});

  const loadSettings = () =>
    api
      .get('/settings')
      .then((r) => {
        setLogo(r.data.logoUrl || null);
        setBusinessName(r.data.businessName || 'CrossFit');
        if (r.data.accentColor) applyAccent(r.data.accentColor);
      })
      .catch(() => {});

  useEffect(() => {
    loadSettings();
    loadNotifs();
    // Refresco automatico cada 60s (respaldo para la campanita)
    const t = setInterval(loadNotifs, 60000);
    // Refresco inmediato cuando una pagina avisa que cambio algo compartido
    const off = onRefresh(() => {
      loadSettings();
      loadNotifs();
    });
    return () => {
      clearInterval(t);
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen overflow-hidden flex bg-body">
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-surface border-r border-line flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-line">
          {logo ? (
            <img
              src={logo}
              alt="logo"
              onError={() => setLogo(null)}
              className="h-9 max-w-[120px] object-contain"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
              <Dumbbell size={20} className="text-neon-cyan" />
            </div>
          )}
          <span className="font-bold text-white truncate">{businessName}</span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 mb-2">
            MENU
          </p>
          {NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN').map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
          <DevCredit className="text-center mt-3" />
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 z-10 bg-body/80 backdrop-blur border-b border-line flex items-center gap-4 px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu size={22} />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  loadNotifs();
                  setBellOpen((v) => !v);
                }}
                className="relative w-9 h-9 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Bell size={18} />
                {notifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                    {notifs.length}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-surface border border-line rounded-xl shadow-card z-30">
                  <div className="p-3 border-b border-line text-sm font-medium text-white">
                    Avisos
                  </div>
                    {notifs.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">
                        Nada pendiente por ahora.
                      </p>
                    ) : (
                      notifs.map((n) => {
                        const cobro = n.type === 'cobro';
                        return (
                          <button
                            key={`${n.type}-${n.membershipId}`}
                            onClick={() => {
                              setBellOpen(false);
                              navigate(`/admin/members/${n.memberId}`);
                            }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-line/40 border-l-2 transition-colors ${
                              cobro ? 'border-l-warning' : 'border-l-neon-cyan'
                            }`}
                          >
                            <p className="text-sm text-white truncate">
                              {n.memberName}
                            </p>
                            {cobro ? (
                              <p className="text-xs text-warning">
                                Debe ${(n.balance ?? 0).toFixed(2)} · hace{' '}
                                {n.daysSince} dias
                              </p>
                            ) : (
                              <p className="text-xs text-neon-cyan">
                                Vence en {n.daysLeft} dia
                                {n.daysLeft === 1 ? '' : 's'}
                              </p>
                            )}
                          </button>
                        );
                      })
                    )}
                </div>
              )}
            </div>
            <Link
              to="/admin/profile"
              title="Mi perfil"
              className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-cyan/60 flex items-center justify-center text-xs font-bold text-on-accent">
                {initials(user?.name)}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
          {/* Boundary por-pagina: si una pagina revienta, el error queda
              contenido aca (el menu y la campanita siguen vivos). Al navegar
              a otra ruta, resetKey cambia y el error se limpia solo. */}
          <ErrorBoundary boundary="pagina" resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
