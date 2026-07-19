import { useOutletContext } from 'react-router-dom';
import { Activity, ShieldCheck, Rocket, Quote, ArrowRight, User } from 'lucide-react';
import { PublicData, PublicItem, PublicCoach, waLink } from './types';

// Fotos por defecto de coachs (del diseño) si el dueno aun no cargo los suyos.
const COACH_FALLBACK: PublicCoach[] = [
  { name: 'Coach', role: 'Entrenador', photo: '/site/nosotros-4.jpg' },
  { name: 'Coach', role: 'Entrenadora', photo: '/site/nosotros-5.jpg' },
  { name: 'Coach', role: 'Entrenador', photo: '/site/nosotros-6.jpg' },
];

// Grilla "bento": 4 mosaicos (ancho/angosto/angosto/ancho) con imagenes fijas
// del diseño; el titulo/desc los pone el dueno (content.classes).
const TILES = [
  { img: '/site/inicio-2.jpg', span: 'md:col-span-8', fall: 'Entrenamiento funcional' },
  { img: '/site/inicio-3.jpg', span: 'md:col-span-4', fall: 'Musculacion' },
  { img: '/site/inicio-4.jpg', span: 'md:col-span-4', fall: 'Movilidad' },
  { img: '/site/inicio-5.jpg', span: 'md:col-span-8', fall: 'Cardio' },
];

const FEATURE_ICONS = [Activity, ShieldCheck, Rocket];
const FEATURE_FALL: PublicItem[] = [
  { title: 'Entrenadores expertos', desc: 'Acompanamiento profesional en cada sesion.' },
  { title: 'Equipamiento completo', desc: 'Maquinas y espacio pensados para rendir.' },
  { title: 'Resultados reales', desc: 'Planes a tu medida para lograr tus objetivos.' },
];

export function Home() {
  const { branding: b, content: c } = useOutletContext<PublicData>();
  const coaches = c.coaches.length > 0 ? c.coaches : COACH_FALLBACK;
  const name = b.businessName || 'GYM';
  const cta = waLink(b.whatsapp, `Hola ${name}, quiero sumarme!`) || undefined;

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={c.heroImage || b.photoUrl || '/site/inicio-1.jpg'}
            alt=""
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-body/90 via-body/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-body/60 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon-cyan mb-5">
              {name}
            </p>
            <h1 className="font-display font-black uppercase leading-[0.95] text-5xl sm:text-7xl text-white">
              {c.heroTitle || (
                <>
                  Forja tu <span className="italic text-neon-cyan">cuerpo</span>,
                  supera tus limites
                </>
              )}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              {c.heroSubtitle ||
                'Sumate y lleva tu entrenamiento al siguiente nivel con nosotros.'}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href={cta}
                target={cta ? '_blank' : undefined}
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-neon-cyan text-on-accent font-mono text-xs font-extrabold uppercase tracking-widest px-8 py-4 hover:brightness-110 transition-all"
              >
                {c.heroCtaText || 'Unite ahora'} <ArrowRight size={16} />
              </a>
              <a
                href="#clases"
                className="inline-flex items-center border-2 border-white/70 text-white font-mono text-xs font-extrabold uppercase tracking-widest px-8 py-4 hover:bg-white hover:text-body transition-all"
              >
                Ver clases
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CLASES (bento) ===== */}
      <section id="clases" className="py-20 sm:py-28 px-4 sm:px-6 bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-neon-cyan block mb-3">
              Entrenamiento
            </span>
            <h2 className="font-display font-black uppercase text-3xl sm:text-5xl text-white">
              Nuestras clases
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            {TILES.map((t, i) => {
              const item = c.classes[i];
              return (
                <div
                  key={i}
                  className={`${t.span} group relative overflow-hidden bg-surface min-h-[220px] md:min-h-[290px]`}
                >
                  <img
                    src={item?.img || t.img}
                    alt=""
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="font-display font-bold uppercase text-2xl text-white">
                      {item?.title || t.fall}
                    </h3>
                    {(item?.desc || '') && (
                      <p className="text-sm text-slate-300 mt-1 max-w-sm">
                        {item?.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== POR QUE ELEGIRNOS ===== */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-black uppercase text-3xl sm:text-5xl text-white mb-4">
              Por que {name}
            </h2>
            <div className="w-20 h-1 bg-neon-cyan mx-auto" />
          </div>
          <div className="grid gap-12 md:grid-cols-3">
            {[0, 1, 2].map((i) => {
              const f = c.features[i] || FEATURE_FALL[i];
              const Icon = FEATURE_ICONS[i];
              return (
                <div key={i} className="text-center group">
                  <div className="w-20 h-20 bg-surface-2 border border-white/5 flex items-center justify-center mx-auto mb-6 text-neon-cyan group-hover:border-neon-cyan/50 transition-all">
                    <Icon size={30} />
                  </div>
                  <h4 className="font-display font-bold uppercase text-xl text-white mb-2">
                    {f.title}
                  </h4>
                  <p className="text-slate-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== NUESTROS COACHS ===== */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-neon-cyan block mb-3">
              El equipo
            </span>
            <h2 className="font-display font-black uppercase text-3xl sm:text-5xl text-white">
              Nuestros coachs
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {coaches.map((co, i) => (
              <div
                key={i}
                className="group relative overflow-hidden bg-surface border border-white/10 aspect-[3/4] w-full sm:w-72 lg:w-80"
              >
                {co.photo ? (
                  <img
                    src={co.photo}
                    alt=""
                    className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <User size={64} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="font-display font-bold uppercase text-xl text-white">
                    {co.name || 'Coach'}
                  </p>
                  {co.role && (
                    <p className="font-mono text-xs uppercase tracking-wider text-neon-cyan mt-0.5">
                      {co.role}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIO ===== */}
      {c.testimonial && (
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto border-t-2 border-neon-cyan bg-surface/60 backdrop-blur p-10 sm:p-16">
            <Quote size={48} className="text-neon-cyan mb-6" />
            <blockquote className="font-display font-bold uppercase italic text-2xl sm:text-3xl text-white leading-tight">
              {c.testimonial}
            </blockquote>
            {c.testimonialAuthor && (
              <div className="flex items-center gap-4 mt-8">
                <img
                  src={c.testimonialPhoto || '/site/inicio-6.jpg'}
                  alt=""
                  className="w-14 h-14 object-cover border border-neon-cyan/50"
                />
                <p className="font-mono text-sm uppercase tracking-wider text-neon-cyan">
                  {c.testimonialAuthor}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== CTA FINAL ===== */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center border border-white/10 bg-surface p-12 sm:p-16 relative">
          <div className="absolute -top-3 -left-3 w-10 h-10 border-t-2 border-l-2 border-neon-cyan" />
          <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-2 border-r-2 border-neon-cyan" />
          <h3 className="font-display font-black uppercase text-3xl sm:text-4xl text-white mb-4">
            Tu momento es ahora
          </h3>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Escribinos y arranca hoy mismo tu entrenamiento en {name}.
          </p>
          <a
            href={cta}
            target={cta ? '_blank' : undefined}
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-neon-cyan text-on-accent font-mono text-xs font-extrabold uppercase tracking-widest px-8 py-4 hover:brightness-110 transition-all"
          >
            {c.heroCtaText || 'Unite ahora'} <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
