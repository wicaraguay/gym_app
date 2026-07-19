// Datos que alimentan la web publica (vienen de GET /site/public).
export interface PublicItem {
  title: string;
  desc: string;
  img?: string; // data URL (para las clases)
}

export interface PublicCoach {
  name: string;
  role: string;
  photo: string; // data URL (base64) o vacio
}

export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMonths: number;
  durationDays: number;
}

export interface PublicData {
  branding: {
    businessName: string;
    logoUrl: string | null;
    photoUrl: string | null;
    address: string | null;
    accentColor: string;
    whatsapp: string | null;
  };
  content: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    heroImage: string;
    classes: PublicItem[];
    features: PublicItem[];
    coaches: PublicCoach[];
    testimonial: string;
    testimonialAuthor: string;
    testimonialPhoto: string;
    mission: string;
    vision: string;
    aboutImage: string;
    missionImage: string;
    visionImage: string;
    scheduleText: string;
    email: string;
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  plans: PublicPlan[];
}

// Normaliza el numero de WhatsApp de Ecuador y arma el link wa.me.
export function waLink(whatsapp: string | null | undefined, msg: string): string | null {
  const digits = (whatsapp || '').replace(/\D/g, '');
  if (!digits) return null;
  const phone = digits.startsWith('0') ? '593' + digits.slice(1) : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
