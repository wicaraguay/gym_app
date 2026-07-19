import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { InstallButton } from '../components/InstallButton';
import { DevCredit } from '../components/DevCredit';
import { applyAccent } from '../lib/theme';

interface Branding {
  businessName: string;
  logoUrl: string | null;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@crossfit.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);

  // Marca del negocio (endpoint PUBLICO, sin token). Si falla, quedan los
  // valores por defecto del login: nunca rompe la pantalla.
  useEffect(() => {
    api
      .get('/settings/public')
      .then((r) => {
        setBranding(r.data);
        if (r.data.accentColor) applyAccent(r.data.accentColor);
      })
      .catch(() => setBranding(null));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-body relative overflow-hidden">
      {/* glow decorativo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl shadow-card p-8 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 flex items-center justify-center overflow-hidden">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Dumbbell size={24} className="text-neon-cyan" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              {branding?.businessName ? (
                branding.businessName
              ) : (
                <>
                  <span className="text-neon-cyan">CROSS</span>
                  <span className="text-white">FIT</span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Panel de gestion</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Bienvenido</h2>
        <p className="text-sm text-slate-400 mb-6">
          Ingresa tus credenciales para continuar.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">
              Contrasena
            </label>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
            />
          </div>
          {error && (
            <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        {/* Ofrece instalar la app aca, en el login (antes de entrar). Solo se
            muestra si el navegador la puede instalar y aun no lo esta. */}
        <div className="mt-4">
          <InstallButton />
        </div>
      </div>

      {/* Credito del desarrollador */}
      <DevCredit className="absolute inset-x-0 bottom-4 text-center" />
    </div>
  );
}
