import { MessageCircle } from 'lucide-react';
import { waLink } from './types';

// Boton flotante de WhatsApp, fijo en la esquina. Se oculta si no hay numero.
export function WhatsappFab({
  whatsapp,
  businessName,
}: {
  whatsapp: string | null;
  businessName: string;
}) {
  const link = waLink(whatsapp, `Hola ${businessName}, quiero informacion.`);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle size={26} />
    </a>
  );
}
