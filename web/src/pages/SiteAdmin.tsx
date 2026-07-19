import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import {
  Image,
  Dumbbell,
  Star,
  Users,
  Info,
  Phone,
  Inbox,
  Save,
  Plus,
  Trash2,
  Mail,
  Check,
  ImagePlus,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import { emitRefresh } from '../lib/events';
import { compressImage } from '../lib/compressImage';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAlert, useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

interface Item {
  title: string;
  desc: string;
  img?: string; // data URL (clases)
}

interface Coach {
  name: string;
  role: string;
  photo: string; // data URL
}

interface SiteForm {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImage: string;
  classes: Item[];
  features: Item[];
  coaches: Coach[];
  testimonial: string;
  testimonialAuthor: string;
  testimonialPhoto: string;
  mission: string;
  vision: string;
  aboutImage: string;
  missionImage: string;
  visionImage: string;
  scheduleText: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string; // vive en Settings
}

interface Message {
  id: string;
  name: string;
  contact: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TEXTAREA =
  'w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 placeholder:text-slate-500 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/40 transition-all';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-200 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

// Editor de una lista de { title, desc } (clases, features).
function ListEditor({
  items,
  setItems,
  titlePh,
  descPh,
}: {
  items: Item[];
  setItems: (v: Item[]) => void;
  titlePh: string;
  descPh: string;
}) {
  const update = (i: number, k: keyof Item, v: string) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={it.title}
            placeholder={titlePh}
            onChange={(e) => update(i, 'title', e.target.value)}
            className="sm:w-1/3"
          />
          <Input
            value={it.desc}
            placeholder={descPh}
            onChange={(e) => update(i, 'desc', e.target.value)}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            className="shrink-0 text-slate-500 hover:text-danger px-2"
            aria-label="Quitar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { title: '', desc: '' }])}
        className="inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:underline"
      >
        <Plus size={15} /> Agregar
      </button>
    </div>
  );
}

// Editor de coachs: foto (subida + comprimida), nombre y rol.
function CoachEditor({
  items,
  setItems,
}: {
  items: Coach[];
  setItems: (v: Coach[]) => void;
}) {
  const update = (i: number, k: keyof Coach, v: string) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const pickPhoto =
    (i: number) => async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        update(i, 'photo', await compressImage(file, { maxSize: 400 }));
      } catch {
        /* ignora si la compresion falla */
      }
      e.target.value = '';
    };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="shrink-0 text-center">
            {it.photo ? (
              <img
                src={it.photo}
                alt=""
                className="w-16 h-16 object-cover rounded-xl border border-line"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl border border-dashed border-line flex items-center justify-center text-slate-600">
                <ImagePlus size={18} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={pickPhoto(i)}
              className="hidden"
              id={`coach-photo-${i}`}
            />
            <label
              htmlFor={`coach-photo-${i}`}
              className="text-[11px] text-neon-cyan cursor-pointer block mt-1"
            >
              Foto
            </label>
          </div>
          <div className="flex-1 space-y-2">
            <Input
              value={it.name}
              placeholder="Nombre"
              onChange={(e) => update(i, 'name', e.target.value)}
            />
            <Input
              value={it.role}
              placeholder="Rol (ej. Coach de Crossfit)"
              onChange={(e) => update(i, 'role', e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            className="text-slate-500 hover:text-danger px-1 mt-1"
            aria-label="Quitar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { name: '', role: '', photo: '' }])}
        className="inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:underline"
      >
        <Plus size={15} /> Agregar coach
      </button>
    </div>
  );
}

// Campo de imagen reutilizable: sube (comprimida), previsualiza y quita.
function ImageField({
  label,
  value,
  onChange,
  maxSize = 1000,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxSize?: number;
  wide?: boolean;
}) {
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onChange(await compressImage(file, { maxSize }));
    } catch {
      /* ignora si falla la compresion */
    }
    e.target.value = '';
  };
  const box = wide ? 'w-40 h-24' : 'w-24 h-24';
  return (
    <div>
      <p className="text-sm font-medium text-slate-200 mb-2">{label}</p>
      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className={`${box} object-cover rounded-xl border border-line`}
          />
        ) : (
          <div
            className={`${box} rounded-xl border border-dashed border-line flex items-center justify-center text-slate-600`}
          >
            <ImagePlus size={22} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <input
            type="file"
            accept="image/*"
            onChange={pick}
            className="text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-slate-300"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-[11px] text-danger hover:underline w-fit"
            >
              <Trash2 size={12} /> Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Editor de clases: foto (comprimida) + nombre + descripcion.
function ClassEditor({
  items,
  setItems,
}: {
  items: Item[];
  setItems: (v: Item[]) => void;
}) {
  const update = (i: number, k: keyof Item, v: string) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const pickImg = (i: number) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      update(i, 'img', await compressImage(file, { maxSize: 900 }));
    } catch {
      /* ignora */
    }
    e.target.value = '';
  };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="shrink-0 text-center">
            {it.img ? (
              <img
                src={it.img}
                alt=""
                className="w-20 h-16 object-cover rounded-xl border border-line"
              />
            ) : (
              <div className="w-20 h-16 rounded-xl border border-dashed border-line flex items-center justify-center text-slate-600">
                <ImagePlus size={16} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={pickImg(i)}
              className="hidden"
              id={`class-img-${i}`}
            />
            <label
              htmlFor={`class-img-${i}`}
              className="text-[11px] text-neon-cyan cursor-pointer block mt-1"
            >
              Foto
            </label>
          </div>
          <div className="flex-1 space-y-2">
            <Input
              value={it.title}
              placeholder="Nombre (ej. Crossfit)"
              onChange={(e) => update(i, 'title', e.target.value)}
            />
            <Input
              value={it.desc}
              placeholder="Descripcion breve"
              onChange={(e) => update(i, 'desc', e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            className="text-slate-500 hover:text-danger px-1 mt-1"
            aria-label="Quitar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { title: '', desc: '', img: '' }])}
        className="inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:underline"
      >
        <Plus size={15} /> Agregar clase
      </button>
    </div>
  );
}

export function SiteAdmin() {
  const notify = useAlert();
  const confirm = useConfirm();
  const toast = useToast();
  const [tab, setTab] = useState<
    | 'portada'
    | 'clases'
    | 'ventajas'
    | 'coachs'
    | 'nosotros'
    | 'contacto'
    | 'mensajes'
  >('portada');
  const [form, setForm] = useState<SiteForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const set = <K extends keyof SiteForm>(k: K, v: SiteForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const loadContent = () =>
    api.get('/site/public').then((r) => {
      const c = r.data.content || {};
      setForm({
        heroTitle: c.heroTitle || '',
        heroSubtitle: c.heroSubtitle || '',
        heroCtaText: c.heroCtaText || '',
        heroImage: c.heroImage || '',
        classes: Array.isArray(c.classes) ? c.classes : [],
        features: Array.isArray(c.features) ? c.features : [],
        coaches: Array.isArray(c.coaches) ? c.coaches : [],
        testimonial: c.testimonial || '',
        testimonialAuthor: c.testimonialAuthor || '',
        testimonialPhoto: c.testimonialPhoto || '',
        mission: c.mission || '',
        vision: c.vision || '',
        aboutImage: c.aboutImage || '',
        missionImage: c.missionImage || '',
        visionImage: c.visionImage || '',
        scheduleText: c.scheduleText || '',
        email: c.email || '',
        instagram: c.instagram || '',
        facebook: c.facebook || '',
        tiktok: c.tiktok || '',
        whatsapp: r.data.branding?.whatsapp || '',
      });
    });

  const loadMessages = () =>
    api.get('/site/messages').then((r) => setMessages(r.data)).catch(() => {});

  useEffect(() => {
    loadContent();
    loadMessages();
  }, []);

  const onSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { whatsapp, ...content } = form;
      await api.patch('/site', content);
      await api.patch('/settings', { whatsapp: whatsapp.trim() });
      emitRefresh();
      toast.success('Sitio actualizado');
    } catch (e: any) {
      notify(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  // Abre el sitio publico con los cambios ACTUALES (sin guardar) via un borrador
  // en localStorage. El sitio, en modo ?preview=1, lo lee y lo muestra.
  const preview = () => {
    if (!form) return;
    const { whatsapp, ...content } = form;
    try {
      localStorage.setItem('site_preview', JSON.stringify({ content, whatsapp }));
      window.open('/?preview=1', '_blank');
    } catch {
      notify(
        'Las imagenes son muy pesadas para la vista previa. Guarda los cambios y abri el sitio directamente.',
      );
    }
  };

  const markRead = async (m: Message) => {
    if (m.read) return;
    await api.patch(`/site/messages/${m.id}`).catch(() => {});
    loadMessages();
  };

  const removeMessage = async (m: Message) => {
    const ok = await confirm({
      title: 'Eliminar mensaje',
      message: `Eliminar el mensaje de ${m.name}?`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    await api.delete(`/site/messages/${m.id}`).catch(() => {});
    loadMessages();
    toast.success('Mensaje eliminado');
  };

  const unread = messages.filter((m) => !m.read).length;

  if (!form) return <p className="text-slate-400">Cargando...</p>;

  const TABS = [
    { key: 'portada' as const, label: 'Portada', icon: Image },
    { key: 'clases' as const, label: 'Clases', icon: Dumbbell },
    { key: 'ventajas' as const, label: 'Ventajas', icon: Star },
    { key: 'coachs' as const, label: 'Coachs', icon: Users },
    { key: 'nosotros' as const, label: 'Nosotros', icon: Info },
    { key: 'contacto' as const, label: 'Contacto', icon: Phone },
    { key: 'mensajes' as const, label: 'Mensajes', icon: Inbox },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Sitio web</h1>
        <p className="text-slate-400 text-sm">
          El contenido de tu pagina publica y los mensajes de contacto.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-surface border border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-all ${
              tab === t.key
                ? 'bg-neon-cyan/10 text-neon-cyan font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon size={16} /> {t.label}
            {t.key === 'mensajes' && unread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ---------- PORTADA ---------- */}
      {tab === 'portada' && (
        <Card className="p-5 space-y-4">
          <p className="font-semibold text-white">Portada (Hero)</p>
          <Field label="Titulo principal">
            <Input
              value={form.heroTitle}
              onChange={(e) => set('heroTitle', e.target.value)}
              placeholder="Entrena. Supera. Transforma."
            />
          </Field>
          <Field label="Subtitulo / frase">
            <textarea
              className={TEXTAREA}
              rows={2}
              value={form.heroSubtitle}
              onChange={(e) => set('heroSubtitle', e.target.value)}
              placeholder="El mejor gimnasio de la ciudad, con equipamiento de ultima generacion."
            />
          </Field>
          <Field label="Texto del boton">
            <Input
              value={form.heroCtaText}
              onChange={(e) => set('heroCtaText', e.target.value)}
              placeholder="Unite ahora"
            />
          </Field>
          <ImageField
            label="Imagen de fondo del hero"
            value={form.heroImage}
            onChange={(v) => set('heroImage', v)}
            maxSize={1400}
            wide
          />
          <p className="text-xs text-slate-500">
            Si no cargas una, se usa la foto del local (Configuracion) o una por
            defecto.
          </p>
        </Card>
      )}

      {/* ---------- CLASES ---------- */}
      {tab === 'clases' && (
        <Card className="p-5 space-y-3">
          <p className="font-semibold text-white">Clases / Servicios</p>
          <p className="text-xs text-slate-500 -mt-1">
            Las primeras 4 se muestran en el Inicio con su foto.
          </p>
          <ClassEditor items={form.classes} setItems={(v) => set('classes', v)} />
        </Card>
      )}

      {/* ---------- VENTAJAS ---------- */}
      {tab === 'ventajas' && (
        <Card className="p-5 space-y-3">
          <p className="font-semibold text-white">Por que elegirnos</p>
          <ListEditor
            items={form.features}
            setItems={(v) => set('features', v)}
            titlePh="Titulo (ej. Entrenadores)"
            descPh="Descripcion breve"
          />
        </Card>
      )}

      {/* ---------- COACHS ---------- */}
      {tab === 'coachs' && (
        <Card className="p-5 space-y-3">
          <p className="font-semibold text-white">Nuestros coachs</p>
          <p className="text-xs text-slate-500 -mt-1">
            Foto, nombre y rol de cada entrenador. Se muestran en el Inicio.
          </p>
          <CoachEditor
            items={form.coaches}
            setItems={(v) => set('coaches', v)}
          />
        </Card>
      )}

      {/* ---------- NOSOTROS ---------- */}
      {tab === 'nosotros' && (
        <Card className="p-5 space-y-4">
          <p className="font-semibold text-white">Sobre nosotros</p>
          <ImageField
            label="Imagen del hero (portada de Nosotros)"
            value={form.aboutImage}
            onChange={(v) => set('aboutImage', v)}
            maxSize={1400}
            wide
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <Field label="Mision">
                <textarea
                  className={TEXTAREA}
                  rows={4}
                  value={form.mission}
                  onChange={(e) => set('mission', e.target.value)}
                />
              </Field>
              <ImageField
                label="Imagen de la mision"
                value={form.missionImage}
                onChange={(v) => set('missionImage', v)}
                maxSize={1000}
                wide
              />
            </div>
            <div className="space-y-4">
              <Field label="Vision">
                <textarea
                  className={TEXTAREA}
                  rows={4}
                  value={form.vision}
                  onChange={(e) => set('vision', e.target.value)}
                />
              </Field>
              <ImageField
                label="Imagen de la vision"
                value={form.visionImage}
                onChange={(v) => set('visionImage', v)}
                maxSize={1000}
                wide
              />
            </div>
          </div>
          <Field label="Testimonio">
            <textarea
              className={TEXTAREA}
              rows={2}
              value={form.testimonial}
              onChange={(e) => set('testimonial', e.target.value)}
              placeholder='"Cambio mi vida..." '
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Autor del testimonio">
              <Input
                value={form.testimonialAuthor}
                onChange={(e) => set('testimonialAuthor', e.target.value)}
                placeholder="Maria G."
              />
            </Field>
            <ImageField
              label="Foto del testimonio"
              value={form.testimonialPhoto}
              onChange={(v) => set('testimonialPhoto', v)}
              maxSize={500}
            />
          </div>
        </Card>
      )}

      {/* ---------- CONTACTO ---------- */}
      {tab === 'contacto' && (
        <Card className="p-5 space-y-4">
          <p className="font-semibold text-white">Contacto y redes</p>
          <Field label="WhatsApp del negocio (para el boton flotante)">
            <Input
              value={form.whatsapp}
              inputMode="numeric"
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="0999999999"
            />
          </Field>
          <Field label="Horarios">
            <textarea
              className={TEXTAREA}
              rows={2}
              value={form.scheduleText}
              onChange={(e) => set('scheduleText', e.target.value)}
              placeholder="Lun a Vie 6:00-22:00 · Sab 8:00-14:00"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="hola@gimnasio.com"
              />
            </Field>
            <Field label="Instagram">
              <Input
                value={form.instagram}
                onChange={(e) => set('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={form.facebook}
                onChange={(e) => set('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </Field>
            <Field label="TikTok">
              <Input
                value={form.tiktok}
                onChange={(e) => set('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@..."
              />
            </Field>
          </div>
        </Card>
      )}

      {/* Guardar / Vista previa: visible en cualquier subseccion de contenido */}
      {tab !== 'mensajes' && (
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 rounded-2xl border border-line bg-surface p-4">
          <Button
            variant="ghost"
            onClick={preview}
            className="w-full sm:w-auto px-6"
          >
            <Eye size={16} /> Vista previa
          </Button>
          <Button onClick={onSave} className="w-full sm:w-auto px-6" disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar sitio'}
          </Button>
        </div>
      )}

      {/* ---------- MENSAJES ---------- */}
      {tab === 'mensajes' && (
        <Card className="p-2 sm:p-3">
          {messages.length === 0 ? (
            <p className="p-6 text-center text-slate-500 text-sm">
              Todavia no hay mensajes de contacto.
            </p>
          ) : (
            <div className="divide-y divide-line/60">
              {messages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => markRead(m)}
                  className={`p-3 sm:p-4 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors ${
                    m.read ? '' : 'bg-neon-cyan/5'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      m.read
                        ? 'bg-surface-2 text-slate-500'
                        : 'bg-neon-cyan/10 text-neon-cyan'
                    }`}
                  >
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {m.name}
                      </p>
                      {!m.read && (
                        <span className="w-2 h-2 rounded-full bg-neon-cyan shrink-0" />
                      )}
                      <span className="ml-auto text-[11px] text-slate-500 shrink-0">
                        {new Date(m.createdAt).toLocaleDateString('es-EC')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{m.contact}</p>
                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap break-words">
                      {m.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!m.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(m);
                        }}
                        title="Marcar leido"
                        className="text-slate-500 hover:text-success p-1"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMessage(m);
                      }}
                      title="Eliminar"
                      className="text-slate-500 hover:text-danger p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
