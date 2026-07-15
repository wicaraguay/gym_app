// Comprime una imagen EN EL NAVEGADOR antes de guardarla.
// La redimensiona al lado maximo indicado y la re-encoda con calidad
// reducida usando un <canvas>. Devuelve un data URL (base64) mucho mas
// liviano que el archivo original (tipico: 2 MB -> ~30-80 KB).
//
// Usa WebP por defecto: comprime muy bien y CONSERVA transparencia (clave
// para logos con fondo transparente; JPEG los pintaria de negro). Si el
// navegador no soporta WebP en canvas, cae solo a PNG (sigue redimensionado).

export interface CompressOptions {
  /** Lado maximo (px). La imagen se escala manteniendo proporcion. */
  maxSize?: number;
  /** Calidad 0..1 (solo aplica a formatos con perdida como WebP/JPEG). */
  quality?: number;
  /** Formato de salida. */
  mime?: 'image/webp' | 'image/jpeg' | 'image/png';
}

function loadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
    img.src = src;
  });
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<string> {
  const { maxSize = 512, quality = 0.82, mime = 'image/webp' } = opts;

  const original = await loadFile(file);
  const img = await loadImage(original);

  // Escala manteniendo proporcion; nunca agranda imagenes ya chicas.
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original; // sin canvas disponible: devuelve el original
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL(mime, quality);

  // Si comprimir NO ayudo (caso raro con imagenes muy chicas), usa lo mas
  // liviano entre el resultado y el original.
  return out.length < original.length ? out : original;
}
