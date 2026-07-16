import { FormEvent, useEffect, useState } from 'react';
import {
  UserPlus,
  Power,
  Shield,
  User as UserIcon,
  KeyRound,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  validateEmail,
  validateRequired,
  validatePassword,
  firstError,
} from '../lib/validation';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useAlert } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FieldHint } from '../components/ui/FieldHint';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  cedula?: string | null;
  address?: string | null;
  role: 'ADMIN' | 'RECEPCIONISTA';
  active: boolean;
}

const EMPTY = {
  name: '',
  email: '',
  password: '',
  role: 'RECEPCIONISTA' as 'ADMIN' | 'RECEPCIONISTA',
};

const roleLabel = (r: string) =>
  r === 'ADMIN' ? 'Administrador' : 'Recepcionista';

export function Team() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const notify = useAlert();
  const toast = useToast();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    cedula: '',
    address: '',
    role: 'RECEPCIONISTA' as 'ADMIN' | 'RECEPCIONISTA',
  });

  const load = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const v = firstError(
      validateRequired(form.name, 'El nombre'),
      validateEmail(form.email),
      validatePassword(form.password),
    );
    if (v) {
      notify(v);
      return;
    }
    setBusy(true);
    try {
      await api.post('/users', {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      setForm(EMPTY);
      toast.success(`${roleLabel(form.role)} agregado correctamente.`);
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo crear el usuario');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u: TeamUser) => {
    if (u.active) {
      const yes = await confirm({
        title: 'Desactivar acceso',
        message: `Desactivar a ${u.name}? No podra iniciar sesion hasta que lo reactives.`,
        confirmText: 'Desactivar',
        tone: 'danger',
      });
      if (!yes) return;
    }
    try {
      await api.patch(`/users/${u.id}`, { active: !u.active });
      toast.success(u.active ? `${u.name} desactivado.` : `${u.name} activado.`);
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo actualizar');
    }
  };

  // Reset de contrasena por el ADMIN (para cuando el usuario la olvido).
  // No pide la actual: es una accion administrativa sobre otra cuenta.
  const saveReset = async (u: TeamUser) => {
    const v = validatePassword(newPass);
    if (v) {
      notify(v);
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/users/${u.id}`, { password: newPass });
      setResetId(null);
      setNewPass('');
      toast.success(`Contrasena de ${u.name} actualizada. Pasale la nueva clave.`);
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo cambiar la clave');
    } finally {
      setBusy(false);
    }
  };

  // Editar los datos de un usuario (accion del ADMIN sobre otra cuenta).
  const openEdit = (u: TeamUser) => {
    setResetId(null);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      cedula: u.cedula || '',
      address: u.address || '',
      role: u.role,
    });
    setEditId(editId === u.id ? null : u.id);
  };

  const saveEdit = async (u: TeamUser) => {
    const v = firstError(
      validateRequired(editForm.name, 'El nombre'),
      validateEmail(editForm.email),
    );
    if (v) {
      notify(v);
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/users/${u.id}`, {
        ...editForm,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      });
      setEditId(null);
      toast.success(`Datos de ${editForm.name} actualizados.`);
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };

  // Eliminar definitivamente. El backend lo bloquea si la persona ya
  // registro pagos (romperia el historial) o si es el unico admin.
  const remove = async (u: TeamUser) => {
    const yes = await confirm({
      title: 'Eliminar usuario',
      message: `Eliminar a ${u.name} definitivamente? Esta accion no se puede deshacer. Si solo queres quitarle el acceso, mejor desactivalo.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!yes) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success(`${u.name} fue eliminado.`);
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Equipo</h1>
        <p className="text-slate-400 text-sm">
          Personas con acceso al sistema y sus permisos
        </p>
      </div>

      {/* Agregar persona */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={16} className="text-neon-cyan" />
          <p className="text-sm font-medium text-white">Agregar persona</p>
        </div>
        <form
          onSubmit={onCreate}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Input
            placeholder="Nombre y apellido"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div>
            <Input
              placeholder="Email (para ingresar)"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <FieldHint
              value={form.email}
              validate={(v) => validateEmail(v)}
              ok="Email valido."
            />
          </div>
          <div>
            <PasswordInput
              placeholder="Contrasena (min. 6)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <FieldHint
              value={form.password}
              validate={(v) => validatePassword(v)}
              ok="Contrasena valida."
              hint="Minimo 6 caracteres."
            />
          </div>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as typeof form.role })
            }
            className="px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 focus:border-neon-cyan focus:outline-none"
          >
            <option value="RECEPCIONISTA">Recepcionista (ayudante)</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={busy}>
              <UserPlus size={16} /> {busy ? 'Agregando...' : 'Agregar al equipo'}
            </Button>
          </div>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          El <span className="text-slate-300">recepcionista</span> puede
          registrar clientes, cobrar e inscribir en planes, pero NO borra ni
          cambia precios, configuracion o congelamientos masivos.
        </p>
      </Card>

      {/* Lista del equipo */}
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {users.map((u) => {
            const isMe = u.id === user?.id;
            const admin = u.role === 'ADMIN';
            return (
              <li key={u.id} className="px-4 sm:px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      admin
                        ? 'bg-neon-cyan/10 text-neon-cyan'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {admin ? <Shield size={18} /> : <UserIcon size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate flex items-center gap-2">
                      <span className="truncate">{u.name}</span>
                      {isMe && (
                        <span className="text-[10px] text-slate-500">(vos)</span>
                      )}
                      {!u.active && <Badge color="neutral">Inactivo</Badge>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <Badge color={admin ? 'cyan' : 'neutral'}>
                    {roleLabel(u.role)}
                  </Badge>
                </div>

                {!isMe && (
                  <div className="flex flex-wrap gap-2 mt-3 sm:pl-[52px]">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      <Pencil size={14} /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResetId(resetId === u.id ? null : u.id);
                        setEditId(null);
                        setNewPass('');
                      }}
                    >
                      <KeyRound size={14} /> Clave
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(u)}
                    >
                      <Power size={14} /> {u.active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => remove(u)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </Button>
                  </div>
                )}

                {/* Editar datos del usuario (admin) */}
                {editId === u.id && (
                  <div className="mt-3 sm:pl-[52px] grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Nombre"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div>
                      <Input
                        placeholder="Email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                      <FieldHint
                        value={editForm.email}
                        validate={(v) => validateEmail(v)}
                        ok="Email valido."
                      />
                    </div>
                    <Input
                      placeholder="Cedula"
                      value={editForm.cedula}
                      onChange={(e) => setEditForm({ ...editForm, cedula: e.target.value })}
                    />
                    <Input
                      placeholder="Direccion"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value as typeof editForm.role })
                      }
                      className="px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 focus:border-neon-cyan focus:outline-none"
                    >
                      <option value="RECEPCIONISTA">Recepcionista</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button size="sm" onClick={() => saveEdit(u)} disabled={busy}>
                        {busy ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Panel de reset de clave (admin, sin pedir la actual) */}
                {resetId === u.id && (
                  <div className="mt-3 sm:pl-[52px] flex flex-col sm:flex-row sm:items-start gap-2">
                    <div className="w-full sm:max-w-xs">
                      <PasswordInput
                        placeholder={`Nueva clave para ${u.name} (min. 6)`}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                      />
                      <FieldHint
                        value={newPass}
                        validate={(v) => validatePassword(v)}
                        ok="Clave valida."
                        hint="Minimo 6 caracteres."
                      />
                    </div>
                    <Button size="sm" onClick={() => saveReset(u)} disabled={busy}>
                      {busy ? 'Guardando...' : 'Guardar clave'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
