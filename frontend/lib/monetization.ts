/** Configuração central de Analytics, AdSense e consentimento (LGPD). */

export const CONSENT_STORAGE_KEY = "nerteus.consent.v1";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  ads: boolean;
  updatedAt: number;
};

export function getMonetizationConfig() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "nerteuscontato@gmail.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nerteus.com";

  return {
    siteUrl,
    contactEmail,
    gaId,
    gtmId,
    adsenseClient,
    analyticsEnabled: Boolean(gaId || gtmId),
    adsEnabled: Boolean(adsenseClient),
  };
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.ads !== "boolean") return null;
    return {
      necessary: true,
      analytics: parsed.analytics,
      ads: parsed.ads,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(next: Omit<ConsentState, "necessary" | "updatedAt">) {
  const value: ConsentState = {
    necessary: true,
    analytics: next.analytics,
    ads: next.ads,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("nerteus-consent", { detail: value }));
  } catch {
    // sem storage: scripts não sobem
  }
  return value;
}

export const LEGAL_LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/cookies", label: "Cookies" },
  { href: "/termos", label: "Termos" },
  { href: "/etica", label: "Ética editorial" },
] as const;
