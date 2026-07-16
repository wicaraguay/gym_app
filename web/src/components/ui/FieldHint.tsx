import { ValidationError } from '../../lib/validation';

interface Props {
  /** Valor actual del campo. */
  value: string;
  /** Validador: devuelve mensaje de error o null si es valido. */
  validate: (v: string) => ValidationError;
  /** Texto verde cuando el valor es valido (opcional). */
  ok?: string;
  /** Texto gris cuando el campo esta vacio (opcional). */
  hint?: string;
}

// Feedback en vivo debajo de un campo:
//   vacio  -> pista gris (si se pasa `hint`)
//   invalido -> mensaje en ROJO
//   valido -> mensaje en VERDE (si se pasa `ok`)
export function FieldHint({ value, validate, ok, hint }: Props) {
  const v = value.trim();
  if (!v) {
    return hint ? <p className="text-slate-500 text-xs mt-1">{hint}</p> : null;
  }
  const err = validate(value);
  if (err) {
    return <p className="text-danger text-xs mt-1">{err}</p>;
  }
  return ok ? <p className="text-success text-xs mt-1">{ok}</p> : null;
}
