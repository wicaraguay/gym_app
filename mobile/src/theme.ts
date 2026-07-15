// Mismos colores que la web (tema oscuro disciplinado: cyan = acento,
// verde/ambar/rojo = estados).
export const C = {
  body: '#080b12',
  surface: '#111725',
  surface2: '#1a2231',
  line: '#232d42',
  text: '#ffffff',
  textMuted: '#94a3b8',
  textFaint: '#64748b',
  cyan: '#00E5FF',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Estado -> color (misma logica que la web)
export function stateColor(opts: {
  active?: boolean;
  expired?: boolean;
  owes?: boolean;
}): string {
  if (opts.active === false) return C.textFaint;
  if (opts.expired) return C.danger;
  if (opts.owes) return C.warning;
  return C.success;
}
