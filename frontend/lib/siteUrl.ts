const CANONICAL_SITE = "https://nerteus.com";

/**
 * URL pública do site. Nunca devolve IP/localhost em contexto de SEO
 * (robots/sitemap/canonical) — isso quebrava o robots.txt na VPS.
 */
export function getPublicSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
  if (raw.includes("nerteus.com")) return raw;
  return CANONICAL_SITE;
}
