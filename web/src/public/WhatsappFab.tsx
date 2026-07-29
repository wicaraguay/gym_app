import { waLink } from './types';

// Logo OFICIAL de WhatsApp (glifo) — se reconoce al instante, a diferencia de
// una burbuja de chat generica.
function WhatsappGlyph({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.944c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 00-3.48-8.4z" />
    </svg>
  );
}

// Boton flotante de WhatsApp, fijo en la esquina inferior derecha. Toma el
// numero de la configuracion del negocio (Settings.whatsapp). Se oculta si no
// hay numero cargado.
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
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-3"
    >
      {/* Etiqueta que aparece al pasar el mouse (en desktop) */}
      <span className="hidden md:block max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-[#25D366] text-white text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100 group-hover:px-4 group-hover:py-2">
        Escribinos
      </span>

      <span className="relative flex h-16 w-16 items-center justify-center">
        {/* Anillo pulsante para llamar la atencion */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-40" />
        {/* Boton solido */}
        <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition-transform group-hover:scale-105 group-active:scale-95">
          <WhatsappGlyph size={32} />
        </span>
      </span>
    </a>
  );
}
