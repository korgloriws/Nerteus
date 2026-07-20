/** Títulos amigáveis para tags conhecidas (com acentuação correta). */
export const SPECIAL_TAG_TITLES: Record<string, string> = {
  "top-10": "Top 10 mais lidos",
  chuva: "Para dias chuvosos",
  banheiro: "Leituras de banheiro",
  "leitura-rapida": "Leitura rápida",
  "leitura-densa": "Leitura densa",
  tecnologia: "Tecnologia",
  tech: "Tecnologia",
  anime: "Animes",
  animes: "Animes",
  manga: "Mangá",
  mangas: "Mangá",
  mangá: "Mangá",
  games: "Games",
  jogos: "Games",
  otaku: "Otaku",
  ciencia: "Ciência",
  ciência: "Ciência",
  "cultura-pop": "Cultura pop",
  pop: "Cultura pop",
  "analise-psicologica": "Análise psicológica",
  "analise psicológica": "Análise psicológica",
};

/** Chave estável para agrupar variantes (sem acento, minúscula). */
export function normalizeTagKey(tag: string) {
  const key = tag
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  const aliases: Record<string, string> = {
    animes: "anime",
    mangas: "manga",
    tech: "tecnologia",
    jogos: "games",
    games: "games",
    ciencia: "ciencia",
    pop: "cultura-pop",
    "cultura-pop": "cultura-pop",
  };
  return aliases[key] || key;
}

/**
 * Title case em pt-BR sem quebrar acentos.
 * Evita o bug de `\b\w` (JS não trata "ó" como letra → "PsicolóGica").
 */
export function titleCasePt(text: string) {
  return text
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase("pt-BR");
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

/** Prefere rótulo com acentos; aplica title case pt-BR. */
export function humanizeTag(tag: string) {
  const key = normalizeTagKey(tag);
  const known =
    SPECIAL_TAG_TITLES[key] ||
    SPECIAL_TAG_TITLES[tag.toLowerCase()] ||
    SPECIAL_TAG_TITLES[tag.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];

  if (known) return known;
  return titleCasePt(tag);
}

/** Entre várias grafias da mesma tag, escolhe a que tem acento / melhor forma. */
export function preferAccentedLabel(candidates: string[]) {
  if (!candidates.length) return "";
  const scored = candidates.map((raw) => {
    const label = humanizeTag(raw);
    const hasAccent = /[àáâãäéêíóôõöúçÀÁÂÃÄÉÊÍÓÔÕÖÚÇ]/i.test(raw) || /[àáâãäéêíóôõöúç]/i.test(label);
    return { label, score: (hasAccent ? 1000 : 0) + label.length };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].label;
}
