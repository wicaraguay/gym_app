// Aplica el color de acento del gimnasio en runtime, pisando la variable CSS
// --accent (que Tailwind usa para todo lo "neon-cyan"). Asi cada gimnasio pinta
// la administracion con el color de su marca, sin recompilar.

export const DEFAULT_ACCENT = '#00E5FF';
const STORAGE_KEY = 'accentColor';

// "#00E5FF" -> "0 229 255"  (formato que espera rgb(var(--accent) / alpha)).
export function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// Solo pinta el acento en el documento (vista previa en vivo), SIN cachear.
// Sirve para previsualizar en Configuracion sin persistir un color no guardado.
// Ademas calcula el color de CONTRASTE (--accent-contrast): texto negro sobre
// acentos claros, blanco sobre acentos oscuros, para que lo que va encima del
// acento (botones, etc.) siempre se lea.
export function setAccentVar(hex: string) {
  const triplet = hexToRgbTriplet(hex);
  if (!triplet) return;
  const root = document.documentElement;
  root.style.setProperty('--accent', triplet);
  const [r, g, b] = triplet.split(' ').map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000; // brillo percibido
  root.style.setProperty(
    '--accent-contrast',
    brightness > 150 ? '0 0 0' : '255 255 255',
  );
}

// Setea el acento Y lo cachea (para valores CONFIRMADOS: backend o cache).
// Evita el parpadeo al recargar.
export function applyAccent(hex: string) {
  if (!hexToRgbTriplet(hex)) return;
  setAccentVar(hex);
  try {
    localStorage.setItem(STORAGE_KEY, hex);
  } catch {
    /* localStorage no disponible: no pasa nada, se usa el default */
  }
}

// Ultimo acento conocido (cache local); si no hay, el default.
export function cachedAccent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}
