import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import { Building2, User, ImagePlus, Save, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { emitRefresh } from '../lib/events';
import { compressImage } from '../lib/compressImage';
import { validateCedulaOrRuc } from '../lib/validation';
import { FieldHint } from '../components/ui/FieldHint';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

// Peso aproximado de un data URL base64, en KB.
function dataUrlKb(dataUrl: string): number {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4 / 1024);
}

// Selector de imagen reutilizable: preview, subir (comprimida), quitar y peso.
function ImagePicker({
  label,
  value,
  wide,
  isAdmin,
  onPick,
  onRemove,
}: {
  label: string;
  value: string;
  wide?: boolean;
  isAdmin: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const dims = wide ? 'h-20 w-32' : 'h-20 w-20';
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {value ? (
        <img
          src={value}
          alt={label}
          className={`${dims} object-cover rounded-xl border border-line bg-surface-2 mb-2`}
        />
      ) : (
        <div
          className={`${dims} rounded-xl border border-dashed border-line flex items-center justify-center text-slate-600 mb-2`}
        >
          <ImagePlus size={22} />
        </div>
      )}
      {isAdmin && (
        <div className="flex flex-col gap-1.5">
          <input
            type="file"
            accept="image/*"
            onChange={onPick}
            className="text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-slate-300"
          />
          {value && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">≈ {dataUrlKb(value)} KB</span>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 text-[11px] text-danger hover:underline"
              >
                <Trash2 size={12} /> Quitar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-neon-cyan" />
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  help,
  children,
  className = '',
}: {
  label: string;
  help?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-slate-200 mb-1 block">
        {label}
      </label>
      {children}
      {help && <p className="text-xs text-slate-500 mt-1">{help}</p>}
    </div>
  );
}

interface Form {
  businessName: string;
  ownerName: string;
  ruc: string;
  address: string;
  logoUrl: string;
  photoUrl: string;
}

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => {
      const d = r.data;
      setForm({
        businessName: d.businessName || '',
        ownerName: d.ownerName || '',
        ruc: d.ruc || '',
        address: d.address || '',
        logoUrl: d.logoUrl || '',
        photoUrl: d.photoUrl || '',
      });
    });
  }, []);

  const set = (k: keyof Form, v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const readImage =
    (key: 'logoUrl' | 'photoUrl') =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // El logo se ve chico (max 512px basta); la foto del local un poco mas.
      const maxSize = key === 'logoUrl' ? 512 : 900;
      try {
        set(key, await compressImage(file, { maxSize }));
      } catch {
        // Si la compresion falla, guarda el original sin bloquear al usuario.
        const reader = new FileReader();
        reader.onload = () => set(key, reader.result as string);
        reader.readAsDataURL(file);
      }
      // Permite volver a elegir el MISMO archivo despues de quitarlo.
      e.target.value = '';
    };

  const onSave = async () => {
    if (!form) return;
    setSaved(false);
    // El RUC/cedula del negocio es opcional, pero si se carga debe ser valido.
    if (form.ruc.trim()) {
      const v = validateCedulaOrRuc(form.ruc);
      if (v) {
        setError(v);
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      await api.patch('/settings', {
        ...form,
        businessName: form.businessName.trim(),
        ownerName: form.ownerName.trim(),
        ruc: form.ruc.trim(),
        address: form.address.trim(),
      });
      setSaved(true);
      emitRefresh(); // el menu lateral toma el logo/nombre nuevo al instante
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Configuracion
        </h1>
        <p className="text-slate-400 text-sm">Los datos de tu gimnasio.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {/* Tu gimnasio */}
        <Card className="p-5">
          <SectionHeader
            icon={Building2}
            title="Tu gimnasio"
            subtitle="Logo y foto que se muestran en la app"
          />
          <div className="flex flex-wrap gap-6 mb-5">
            <ImagePicker
              label="Logo"
              value={form.logoUrl}
              isAdmin={isAdmin}
              onPick={readImage('logoUrl')}
              onRemove={() => set('logoUrl', '')}
            />
            <ImagePicker
              label="Foto del local"
              value={form.photoUrl}
              wide
              isAdmin={isAdmin}
              onPick={readImage('photoUrl')}
              onRemove={() => set('photoUrl', '')}
            />
          </div>
          <p className="text-xs text-slate-500 -mt-2 mb-1">
            Las imagenes se optimizan solas al subirlas (mas livianas). Podes
            quitarlas o reemplazarlas cuando quieras.
          </p>
        </Card>

        {/* Datos del negocio */}
        <Card className="p-5">
          <SectionHeader
            icon={User}
            title="Datos del negocio"
            subtitle="Informacion basica (opcional)"
          />
          <div className="grid gap-4">
            <FieldRow
              label="Nombre del gimnasio"
              help="Como lo conocen tus clientes. Ejemplo: CrossFit Miraflores."
            >
              <Input
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
                disabled={!isAdmin}
                placeholder="CrossFit Miraflores"
              />
            </FieldRow>
            <FieldRow label="Nombre del titular (dueño)">
              <Input
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
                disabled={!isAdmin}
                placeholder="Juan Perez"
              />
            </FieldRow>
            <FieldRow label="RUC / Cedula">
              <Input
                value={form.ruc}
                onChange={(e) => set('ruc', e.target.value)}
                disabled={!isAdmin}
                inputMode="numeric"
                placeholder="1712345678001"
              />
              <FieldHint
                value={form.ruc}
                validate={(v) => validateCedulaOrRuc(v)}
                ok="Numero valido."
                hint="Cedula (10) o RUC (13). Opcional."
              />
            </FieldRow>
            <FieldRow label="Direccion">
              <Input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                disabled={!isAdmin}
                placeholder="Av. Principal y Secundaria"
              />
            </FieldRow>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="text-sm">
          {error ? (
            <span className="text-danger font-medium">{error}</span>
          ) : saved ? (
            <span className="inline-flex items-center gap-1.5 text-success font-medium">
              <CheckCircle2 size={16} /> Cambios guardados
            </span>
          ) : (
            <span className="text-slate-400">
              {isAdmin
                ? 'Revisa los datos y guarda los cambios cuando estes listo.'
                : 'Solo el administrador puede editar la configuracion.'}
            </span>
          )}
        </div>
        {isAdmin && (
          <Button onClick={onSave} className="w-full sm:w-auto px-6" disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
      </div>
    </div>
  );
}
