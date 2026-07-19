import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { useAlert } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { PublicData } from './types';

const FIELD =
  'w-full bg-transparent border-0 border-b-2 border-white/20 px-0 py-3 text-white placeholder:text-slate-500 focus:border-neon-cyan focus:outline-none focus:ring-0 transition-colors';

const SUBJECTS = [
  'Consulta general',
  'Planes / Membresias',
  'Entrenamiento personal',
  'Otro',
];

export function Contact() {
  const { branding: b, content: c } = useOutletContext<PublicData>();
  const notify = useAlert();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    contact: '',
    subject: SUBJECTS[0],
    message: '',
  });
  const [sending, setSending] = useState(false);

  const mapSrc = b.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(b.address)}&output=embed`
    : null;

  const submit = async () => {
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      notify('Completa tu nombre, un contacto y el mensaje.');
      return;
    }
    setSending(true);
    try {
      await api.post('/site/contact', {
        name: form.name.trim(),
        contact: form.contact.trim(),
        message: `[${form.subject}] ${form.message.trim()}`,
      });
      setForm({ name: '', contact: '', subject: SUBJECTS[0], message: '' });
      toast.success('Mensaje enviado. Te contactamos pronto.');
    } catch (e: any) {
      notify(
        e.response?.status === 429
          ? 'Enviaste varios mensajes. Espera un momento e intenta de nuevo.'
          : e.response?.data?.message || 'No se pudo enviar el mensaje.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-16 pb-24">
      {/* ===== HERO ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <div className="border-l-4 border-neon-cyan pl-6">
          <h1 className="font-display font-black uppercase text-4xl sm:text-6xl text-white leading-none mb-3">
            Contacto
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
            Conecta con nuestro equipo
          </p>
        </div>
      </section>

      {/* ===== BENTO: FORM + INFO ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form */}
        <div className="md:col-span-7 bg-surface border-t-2 border-neon-cyan p-6 sm:p-10">
          <h2 className="font-display font-black uppercase text-2xl sm:text-3xl text-white mb-10">
            Envianos un mensaje
          </h2>
          <div className="space-y-8">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-widest text-slate-400 block mb-1">
                Nombre completo
              </label>
              <input
                className={FIELD}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-widest text-slate-400 block mb-1">
                Email o telefono
              </label>
              <input
                className={FIELD}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-widest text-neon-cyan block mb-1">
                Tipo de consulta
              </label>
              <select
                className={`${FIELD} appearance-none`}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} className="bg-surface-2 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-widest text-slate-400 block mb-1">
                Tu mensaje
              </label>
              <textarea
                className={FIELD}
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button
              onClick={submit}
              disabled={sending}
              className="w-full bg-neon-cyan text-on-accent font-mono text-xs font-extrabold uppercase tracking-[0.2em] py-6 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {sending ? 'Enviando...' : 'Iniciar contacto'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-5 space-y-6">
          {/* Sede + horarios */}
          <div className="bg-surface-2 border-t-2 border-neon-cyan/40 p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-5">
              <MapPin size={26} className="text-neon-cyan shrink-0" />
              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-neon-cyan mb-1">
                  Nuestra sede
                </h3>
                <p className="text-slate-200 leading-relaxed">
                  {b.address || 'Carga tu direccion en el panel.'}
                </p>
              </div>
            </div>
            {c.scheduleText && (
              <div className="border-t border-white/10 pt-4 font-mono text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                {c.scheduleText}
              </div>
            )}
          </div>

          {/* Mapa */}
          {mapSrc && (
            <div className="relative border border-white/15 overflow-hidden">
              <iframe
                title="Mapa"
                src={mapSrc}
                className="w-full h-56 grayscale contrast-125 opacity-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white">
                  Aca estamos
                </span>
              </div>
            </div>
          )}

          {/* Contacto rapido */}
          <div className="grid grid-cols-2 gap-3">
            {b.whatsapp && (
              <div className="bg-surface border-l-2 border-neon-cyan/40 p-5">
                <Phone size={18} className="text-neon-cyan mb-4" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  WhatsApp
                </div>
                <div className="text-sm text-white font-bold">{b.whatsapp}</div>
              </div>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="bg-surface border-l-2 border-neon-cyan/40 p-5 hover:border-neon-cyan transition-colors"
              >
                <Mail size={18} className="text-neon-cyan mb-4" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Email
                </div>
                <div className="text-sm text-white font-bold break-words">
                  {c.email}
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
