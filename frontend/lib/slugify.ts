/** Slug amigável a URL: minúsculas, hífens, sem acentos/espaços. */
export function slugify(value: string, fallback = "post"): string {
  const text = (value || "").trim();
  if (!text) return fallback;
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

/** Segmento de path seguro para /posts/[slug]. */
export function postPath(slug: string): string {
  return `/posts/${encodeURIComponent(slug)}`;
}
