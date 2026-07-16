// Validaciones de dominio, centralizadas (misma logica que la web).
// Cada funcion devuelve un mensaje de error (string) o null si el valor es valido.

export type ValidationError = string | null;

export function validateRequired(value: string, label = 'Este campo'): ValidationError {
  return value.trim() ? null : `${label} es obligatorio.`;
}

export function validateEmail(value: string, optional = false): ValidationError {
  const v = value.trim();
  if (!v) return optional ? null : 'El email es obligatorio.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(v) ? null : 'El email no tiene un formato valido.';
}

export function validatePhone(value: string, optional = true): ValidationError {
  const v = value.trim();
  if (!v) return optional ? null : 'El telefono es obligatorio.';
  const digits = v.replace(/[\s-]/g, '');
  return /^\+?\d{7,13}$/.test(digits)
    ? null
    : 'El telefono solo debe tener numeros (7 a 13 digitos).';
}

// Cedula ecuatoriana: 10 digitos + digito verificador (algoritmo oficial modulo 10).
export function validateCedula(value: string): ValidationError {
  const v = value.trim();
  if (!/^\d{10}$/.test(v)) return 'La cedula debe tener 10 digitos.';
  const prov = parseInt(v.slice(0, 2), 10);
  if (prov < 1 || (prov > 24 && prov !== 30)) return 'La cedula tiene una provincia invalida.';
  const d = v.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = d[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    sum += val;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === d[9] ? null : 'La cedula no es valida (digito verificador).';
}

// RUC: 13 digitos y termina en 001.
export function validateRuc(value: string): ValidationError {
  const v = value.trim();
  if (!/^\d{13}$/.test(v)) return 'El RUC debe tener 13 digitos.';
  if (!v.endsWith('001')) return 'El RUC debe terminar en 001.';
  return null;
}

// Alta rapida sin selector de tipo: acepta cedula (10) o RUC (13).
export function validateCedulaOrRuc(value: string): ValidationError {
  const v = value.trim();
  if (/^\d{10}$/.test(v)) return validateCedula(v);
  if (/^\d{13}$/.test(v)) return validateRuc(v);
  return 'Debe ser una cedula (10 digitos) o un RUC (13 digitos).';
}

// Dinero: numero positivo, con tope opcional (ej. el saldo pendiente).
export function validateAmount(
  value: string,
  opts: { max?: number; label?: string } = {},
): ValidationError {
  const label = opts.label ?? 'El monto';
  const v = value.trim();
  if (!v) return `${label} es obligatorio.`;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label} debe ser un numero valido.`;
  if (n <= 0) return `${label} debe ser mayor a 0.`;
  if (opts.max !== undefined && n > opts.max + 0.001)
    return `${label} no puede superar el saldo pendiente ($${opts.max.toFixed(2)}).`;
  return null;
}

export function validatePrice(value: string): ValidationError {
  const v = value.trim();
  if (!v) return 'El precio es obligatorio.';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'El precio debe ser un numero valido.';
  if (n <= 0) return 'El precio debe ser mayor a 0.';
  return null;
}

export const MIN_PASSWORD = 6;

export function validatePassword(value: string, min = MIN_PASSWORD): ValidationError {
  if (value.length < min) return `La contrasena debe tener al menos ${min} caracteres.`;
  return null;
}

export function validateDays(value: string, max = 365): ValidationError {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'Los dias deben ser mayor a 0.';
  if (n > max) return `Los dias no pueden superar ${max}.`;
  return null;
}

// Divide "nombre completo" en nombre + apellido. Exige al menos 2 palabras.
export function splitFullName(full: string): { firstName: string; lastName: string } | null {
  const tokens = full.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return null;
  const mid = Math.ceil(tokens.length / 2);
  return {
    firstName: tokens.slice(0, mid).join(' '),
    lastName: tokens.slice(mid).join(' '),
  };
}

export function firstError(...results: ValidationError[]): ValidationError {
  return results.find((r) => r !== null) ?? null;
}
