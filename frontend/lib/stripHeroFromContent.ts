/**
 * Remove do HTML do post qualquer <img> que seja a mesma da capa (hero_image),
 * para a capa não aparecer de novo no corpo da leitura.
 * Também adiciona loading="lazy" nas imagens restantes para performance.
 */
export function stripHeroFromContent(content: string, heroImage?: string | null): string {
  if (!content) return content;

  const hero = heroImage?.trim() || "";

  let cleaned = content.replace(/<img\b([^>]*)>/gi, (tag, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!srcMatch) return tag;
    const src = srcMatch[2].trim();

    if (hero) {
      if (src === hero) return "";
      if (hero.startsWith("data:") && src.startsWith("data:") && hero.length > 64 && src.length > 64) {
        if (src.slice(0, 200) === hero.slice(0, 200) && src.length === hero.length) return "";
      }
    }

    if (/\bloading\s*=/i.test(attrs)) {
      return tag;
    }
    return `<img${attrs} loading="lazy">`;
  });

  cleaned = cleaned
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br/>");

  return cleaned;
}
