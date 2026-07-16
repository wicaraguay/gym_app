import { FormEvent, useEffect, useState } from 'react';
import { User as UserIcon, KeyRound, Save, Shield } from 'lucide-react';
import { api } from '../lib/api';
import {
  validateEmail,
  validateRequired,
  validatePassword,
  firstError,
} from '../lib/validation';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FieldHint } from '../components/ui/FieldHint';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    cedula: '',
    address: '',
  });
  const [pw, setPw] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwOk, setPwOk] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/users/me').then((r) =>
      setForm({
        name: r.data.name || '',
        email: r.data.email || '',
        cedula: r.data.cedula || '',
        address: r.data.address || '',
      }),
    );
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setOkMsg('');
    const v = firstError(validateRequired(form.name, 'El nombre'), validateEmail(form.email));
    if (v) {
      setErr(v);
      return;
    }
    setErr('');
    setSavingProfile(true);
    try {
      await api.patch('/users/me', {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      setOkMsg('Datos guardados.');
      await refreshUser(); // el header toma el nombre nuevo al instante
    } catch (e: any) {
      setErr(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwOk('');
    const v = firstError(
      validateRequired(pw.currentPassword, 'La contrasena actual'),
      validatePassword(pw.newPassword),
      pw.newPassword !== pw.confirm ? 'Las contrasenas nuevas no coinciden.' : null,
    );
    if (v) {
      setPwErr(v);
      return;
    }
    setPwErr('');
    setSavingPw(true);
    try {
      await api.patch('/users/me/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwOk('Contrasena actualizada correctamente.');
    } catch (e: any) {
      setPwErr(e.response?.data?.message || 'No se pudo cambiar');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Mi perfil</h1>
        <p className="text-slate-400 text-sm">
          Tus datos y tu contrasena de acceso
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* Mis datos */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon size={16} className="text-neon-cyan" />
            <p className="text-sm font-medium text-white">Mis datos</p>
            <Badge color={user?.role === 'ADMIN' ? 'cyan' : 'neutral'}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
            </Badge>
          </div>
          <form onSubmit={saveProfile} className="grid gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Nombre completo
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Cedula</label>
              <Input
                value={form.cedula}
                inputMode="numeric"
                placeholder="1712345678"
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Correo (con el que ingresas)
              </label>
              <Input
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <FieldHint
                value={form.email}
                validate={(v) => validateEmail(v)}
                ok="Email valido."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Direccion
              </label>
              <Input
                value={form.address}
                placeholder="Av. Principal y Secundaria"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            {err && <p className="text-danger text-sm">{err}</p>}
            {okMsg && <p className="text-success text-sm">{okMsg}</p>}
            <div>
              <Button type="submit" className="w-full sm:w-auto px-6" disabled={savingProfile}>
                <Save size={16} /> {savingProfile ? 'Guardando...' : 'Guardar datos'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Cambiar contrasena */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-neon-cyan" />
            <p className="text-sm font-medium text-white">Cambiar contrasena</p>
          </div>
          <form onSubmit={changePassword} className="grid gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Contrasena actual
              </label>
              <PasswordInput
                value={pw.currentPassword}
                onChange={(e) =>
                  setPw({ ...pw, currentPassword: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Nueva contrasena (min. 6)
              </label>
              <PasswordInput
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                required
              />
              <FieldHint
                value={pw.newPassword}
                validate={(v) => validatePassword(v)}
                ok="Contrasena valida."
                hint="Minimo 6 caracteres."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Repetir nueva contrasena
              </label>
              <PasswordInput
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                required
              />
              <FieldHint
                value={pw.confirm}
                validate={(v) => (v === pw.newPassword ? null : 'Las contrasenas no coinciden.')}
                ok="Coincide."
              />
            </div>
            {pwErr && <p className="text-danger text-sm">{pwErr}</p>}
            {pwOk && <p className="text-success text-sm">{pwOk}</p>}
            <div>
              <Button type="submit" className="w-full sm:w-auto px-6" disabled={savingPw}>
                <Shield size={16} /> {savingPw ? 'Actualizando...' : 'Actualizar contrasena'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
