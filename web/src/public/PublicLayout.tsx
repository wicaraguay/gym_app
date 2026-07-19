import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { applyAccent } from '../lib/theme';
import { DevCredit } from '../components/DevCredit';
import { WhatsappFab } from './WhatsappFab';
import { PublicData } from './types';

// TikTok no viene en lucide: icono en SVG.
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12V9.66a5.7 5.7 0 0 0-.78-.05 5.69 5.69 0 1 0 5.69 5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.25-1.48z" />
    </svg>
  );
}

// Shell de la web PUBLICA (diseno neon minimalista). Trae todo el contenido
// (GET /site/public), lo comparte via Outlet context, aplica el color de acento
// y arma header + footer + boton flotante de WhatsApp.
export function PublicLayout() {
  const [data, setData] = useState<PublicData | null>(null);
  const isPreview =
    new URLSearchParams(window.location.search).get('preview') === '1';

  useEffect(() => {
    api
      .get('/site/public')
      .then((r) => {
        let d = r.data;
        // En modo vista previa, pisamos el contenido con el borrador sin guardar.
        if (isPreview) {
          try {
            const draft = JSON.parse(
              localStorage.getItem('site_preview') || 'null',
            );
            if (draft) {
              d = {
                ...d,
                content: { ...d.content, ...draft.content },
                branding: {
                  ...d.branding,
                  whatsapp: draft.whatsapp ?? d.branding.whatsapp,
                },
              };
            }
          } catch {
            /* si el borrador falla, se muestra lo guardado */
          }
        }
        setData(d);
        if (d.branding?.accentColor) applyAccent(d.branding.accentColor);
        if (d.branding?.businessName) document.title = d.branding.businessName;
      })
      .catch(() => setData(null));
  }, [isPreview]);

  const location = useLocation();

  // Reveal al scrollear: cada <section> aparece con fade + slide al entrar en
  // pantalla. Se re-arma al cambiar de pagina. useLayoutEffect evita el parpadeo.
  useLayoutEffect(() => {
    if (!data) return;
    const sections = Array.from(document.querySelectorAll('main section'));
    sections.forEach((s) => s.classList.add('reveal'));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal-in');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [data, location.pathname]);

  const nav = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/sobre-nosotros', label: 'Nosotros', end: false },
    { to: '/contacto', label: 'Contacto', end: false },
  ];

  const brand = data?.branding;
  const name = brand?.businessName || 'GYM';
  const content = data?.content;
  const year = new Date().getFullYear();

  // Enlaces del footer (genericos por ahora; el dueno los cambia mas adelante).
  const footerLinks = [
    { label: 'Inicio', to: '/' },
    { label: 'Nosotros', to: '/sobre-nosotros' },
    { label: 'Contacto', to: '/contacto' },
    { label: 'Privacidad', to: '#' },
    { label: 'Terminos', to: '#' },
  ];

  return (
    <div className="min-h-screen bg-body text-slate-200 flex flex-col font-sans">
      {isPreview && (
        <div className="bg-neon-cyan text-on-accent text-center py-2 font-mono text-[11px] uppercase tracking-widest font-bold">
          Vista previa · cambios sin guardar
        </div>
      )}
      <header className="sticky top-0 z-50 w-full bg-body/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {brand?.logoUrl && (
              <img
                src={brand.logoUrl}
                alt="logo"
                className="h-8 w-8 object-cover"
              />
            )}
            <span className="font-display italic font-black text-xl uppercase tracking-tighter text-white">
              {name}
            </span>
          </Link>

          <nav className="hidden md:flex gap-7">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `font-mono text-xs uppercase tracking-widest transition-colors ${
                    isActive ? 'text-neon-cyan' : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/login"
            className="bg-neon-cyan text-on-accent font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:brightness-110 active:scale-95 transition-all"
          >
            Ingresar
          </Link>
        </div>
        {/* Nav movil */}
        <nav className="md:hidden flex items-center justify-center gap-5 border-t border-white/10 py-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `font-mono text-[11px] uppercase tracking-widest ${
                  isActive ? 'text-neon-cyan' : 'text-slate-400'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        {data ? (
          <Outlet context={data} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-40 text-center text-slate-600 font-mono uppercase text-sm tracking-widest">
            Cargando...
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-surface/40 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid gap-10 md:grid-cols-3 md:items-start">
            {/* Marca + frase */}
            <div className="text-center md:text-left">
              <span className="font-display italic font-black text-2xl uppercase tracking-tighter text-white">
                {name}
              </span>
              <p className="text-slate-500 text-sm mt-3 max-w-xs mx-auto md:mx-0">
                Tu espacio para entrenar, superarte y alcanzar tus objetivos.
              </p>
              {brand?.address && (
                <p className="font-mono text-[11px] text-slate-600 uppercase tracking-wider mt-3">
                  {brand.address}
                </p>
              )}
            </div>

            {/* Enlaces */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {footerLinks.map((l) =>
                l.to.startsWith('#') ? (
                  <a
                    key={l.label}
                    href={l.to}
                    className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-neon-cyan transition-colors"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-neon-cyan transition-colors"
                  >
                    {l.label}
                  </Link>
                ),
              )}
            </nav>

            {/* Redes */}
            <div className="flex items-center justify-center md:justify-end gap-3">
              {content?.instagram && (
                <a
                  href={content.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 flex items-center justify-center border border-white/15 text-slate-400 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                >
                  <Instagram size={18} />
                </a>
              )}
              {content?.facebook && (
                <a
                  href={content.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 flex items-center justify-center border border-white/15 text-slate-400 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                >
                  <Facebook size={18} />
                </a>
              )}
              {content?.tiktok && (
                <a
                  href={content.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="w-11 h-11 flex items-center justify-center border border-white/15 text-slate-400 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                >
                  <TikTokIcon size={18} />
                </a>
              )}
              {content?.email && (
                <a
                  href={`mailto:${content.email}`}
                  aria-label="Email"
                  className="w-11 h-11 flex items-center justify-center border border-white/15 text-slate-400 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                >
                  <Mail size={18} />
                </a>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            <p className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              © {year} {name}. Todos los derechos reservados.
            </p>
            <DevCredit />
          </div>
        </div>
      </footer>

      <WhatsappFab whatsapp={brand?.whatsapp ?? null} businessName={name} />
    </div>
  );
}
