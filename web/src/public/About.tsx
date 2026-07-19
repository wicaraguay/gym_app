import { useOutletContext, Link } from 'react-router-dom';
import { PublicData, waLink } from './types';

export function About() {
  const { branding: b, content: c } = useOutletContext<PublicData>();
  const name = b.businessName || 'GYM';
  const cta = waLink(b.whatsapp, `Hola ${name}, quiero sumarme!`) || undefined;

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[68vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={c.aboutImage || b.photoUrl || '/site/nosotros-1.jpg'}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-body/20 via-body/40 to-body/90" />
        </div>
        <div className="relative z-10 text-center px-4 sm:px-6">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-neon-cyan mb-4 block">
            {name}
          </span>
          <h1 className="font-display font-black uppercase text-4xl sm:text-6xl md:text-7xl text-white leading-none mb-6">
            Redefiniendo tu <span className="text-neon-cyan">potencial</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            No solo entrenamos cuerpos: forjamos disciplina. En {name} el
            rendimiento se encuentra con el acompanamiento y el detalle.
          </p>
        </div>
      </section>

      {/* ===== MISION / VISION (bento zigzag) ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Mision (texto) */}
          <div className="md:col-span-7 bg-surface-2 border-t-2 border-neon-cyan p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <h2 className="font-display font-black uppercase text-3xl text-white mb-6">
                Nuestra Mision
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {c.mission ||
                  `Brindar un espacio de entrenamiento de primer nivel, con acompanamiento experto y disciplina, para que cada persona alcance su mejor version.`}
              </p>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <span className="w-12 h-0.5 bg-neon-cyan" />
              <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
                Precision
              </span>
            </div>
          </div>

          {/* Imagen */}
          <div className="md:col-span-5 min-h-[240px] overflow-hidden">
            <img
              src={c.missionImage || '/site/nosotros-2.jpg'}
              alt=""
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>

          {/* Imagen */}
          <div className="md:col-span-5 min-h-[240px] overflow-hidden">
            <img
              src={c.visionImage || '/site/nosotros-3.jpg'}
              alt=""
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>

          {/* Vision (texto) */}
          <div className="md:col-span-7 bg-surface-2 border-t-2 border-neon-cyan p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <h2 className="font-display font-black uppercase text-3xl text-white mb-6 md:text-right">
                Nuestra Vision
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap md:text-right">
                {c.vision ||
                  'Ser el gimnasio de referencia de la comunidad, donde la motivacion y los resultados reales conviven, con un equipo enfocado en el alto rendimiento.'}
              </p>
            </div>
            <div className="mt-10 flex items-center gap-4 md:self-end">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
                Rendimiento
              </span>
              <span className="w-12 h-0.5 bg-neon-cyan" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-white/10 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display font-black uppercase text-4xl sm:text-6xl text-white mb-10">
            Tu turno de <span className="text-neon-cyan">rendir</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={cta}
              target={cta ? '_blank' : undefined}
              rel="noreferrer"
              className="bg-neon-cyan text-on-accent font-mono text-xs font-extrabold uppercase tracking-widest px-10 py-4 hover:brightness-110 transition-all"
            >
              {c.heroCtaText || 'Unite ahora'}
            </a>
            <Link
              to="/contacto"
              className="border-2 border-white/70 text-white font-mono text-xs font-extrabold uppercase tracking-widest px-10 py-4 hover:bg-white hover:text-body transition-all"
            >
              Contactanos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
