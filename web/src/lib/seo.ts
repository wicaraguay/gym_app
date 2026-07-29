// SEO en runtime para la web publica.
//
// La app es una SPA: el HTML base (index.html) trae meta tags genericos que
// leen los bots que NO ejecutan JS (WhatsApp, Facebook). Aca, cuando cargan
// los datos reales del gimnasio, refinamos titulo/description/Open Graph y
// agregamos datos estructurados (schema.org) que Google si renderiza.

interface SeoInput {
  businessName?: string | null;
  description?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
}

const DEFAULT_DESC =
  'Gimnasio con planes, clases y entrenadores profesionales. Sumate y transforma tu entrenamiento.';

// Crea o actualiza un <meta> por su atributo (name u property).
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyPublicSeo(input: SeoInput) {
  const name = (input.businessName || 'Training Loja').trim();
  const description = (input.description || DEFAULT_DESC).trim();
  const title = `${name} · Gimnasio y entrenamiento funcional`;

  document.title = title;
  setMeta('name', 'description', description);

  setMeta('property', 'og:site_name', name);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);

  // Datos estructurados: le dice a Google "esto es un gimnasio local" con su
  // direccion y telefono → mejora el posicionamiento local y Google Maps.
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name,
    description,
    url: window.location.origin,
    image: `${window.location.origin}/site/inicio-1.jpg`,
  };
  if (input.address) ld.address = input.address;
  if (input.whatsapp) ld.telephone = input.whatsapp;
  if (input.email) ld.email = input.email;
  const sameAs = [input.instagram, input.facebook].filter(Boolean);
  if (sameAs.length) ld.sameAs = sameAs;

  let script = document.getElementById('ld-business');
  if (!script) {
    script = document.createElement('script');
    script.id = 'ld-business';
    (script as HTMLScriptElement).type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(ld);
}
