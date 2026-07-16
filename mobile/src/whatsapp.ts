// Arma el mensaje de WhatsApp segun el ESTADO de la membresia del cliente.
// Linking.openURL(wa.me...) solo PRE-LLENA el mensaje (no lo envia solo): el
// dueno lo revisa en WhatsApp y toca enviar. Textos centralizados aca.

export type ReminderKind =
  | 'saldo'
  | 'vencida'
  | 'por_vencer'
  | 'al_dia'
  | 'sin_membresia';

export interface ReminderInput {
  firstName: string;
  businessName?: string;
  saldoTotal: number;
  activeEndDate?: string | null;
  lastExpiredEndDate?: string | null;
  hasAnyMembership: boolean;
}

const DAY = 86400000;

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}

function fmt(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('es-EC') : '';
}

export function getReminderKind(i: ReminderInput): ReminderKind {
  if (i.saldoTotal > 0) return 'saldo';
  if (!i.activeEndDate && i.lastExpiredEndDate) return 'vencida';
  if (i.activeEndDate) return daysUntil(i.activeEndDate) <= 7 ? 'por_vencer' : 'al_dia';
  if (!i.hasAnyMembership) return 'sin_membresia';
  return 'al_dia';
}

export function reminderLabel(kind: ReminderKind): string {
  switch (kind) {
    case 'saldo':
      return 'Recordatorio de cobro';
    case 'vencida':
      return 'Invitacion a renovar';
    case 'por_vencer':
      return 'Aviso de vencimiento';
    case 'al_dia':
      return 'Saludo (al dia)';
    case 'sin_membresia':
      return 'Invitacion a inscribirse';
  }
}

export function buildReminderMessage(i: ReminderInput, kind: ReminderKind): string {
  const n = i.firstName;
  const gym = i.businessName?.trim() || 'el gimnasio';
  const saldo = i.saldoTotal.toFixed(2);
  const venceActiva = fmt(i.activeEndDate);
  const vencio = fmt(i.lastExpiredEndDate);

  switch (kind) {
    case 'saldo': {
      const extra = i.activeEndDate
        ? ` Tu membresia vence el ${venceActiva}.`
        : i.lastExpiredEndDate
          ? ` Tu membresia vencio el ${vencio}.`
          : '';
      return `Hola ${n}, te escribimos de ${gym}. Nos figura un saldo pendiente de $${saldo} en tu membresia.${extra} Podes abonarlo cuando pases por el gimnasio. Gracias!`;
    }
    case 'vencida':
      return `Hola ${n}, te escribimos de ${gym}. Tu membresia vencio el ${vencio}. Te esperamos para renovar y seguir entrenando!`;
    case 'por_vencer':
      return `Hola ${n}, te escribimos de ${gym}. Tu membresia vence el ${venceActiva}. Renovala para no cortar tu ritmo!`;
    case 'al_dia':
      return `Hola ${n}, te escribimos de ${gym}. Tu membresia esta al dia (vence el ${venceActiva}). Segui asi, te esperamos en la proxima clase!`;
    case 'sin_membresia':
      return `Hola ${n}, te escribimos de ${gym}. Te esperamos para arrancar a entrenar cuando quieras!`;
  }
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
