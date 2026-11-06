export const WEEKDAYS = [
  { slug: "tech", aliases: ["tech", "segunda"], key: "mon", theme: "Tech", hex: "#2563eb" },
  { slug: "otaku", aliases: ["otaku", "terca"], key: "tue", theme: "Otaku", hex: "#eab308" },
  { slug: "games", aliases: ["games", "quarta"], key: "wed", theme: "Games", hex: "#16a34a" },
  { slug: "pop", aliases: ["pop", "quinta"], key: "thu", theme: "Pop", hex: "#f97316" },
  { slug: "basica", aliases: ["basica", "sexta"], key: "fri", theme: "Básica", hex: "#dc2626" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export function weekdayBySlug(slug: string): Weekday | null {
  const key = slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return WEEKDAYS.find((day) => day.slug === key || (day.aliases as readonly string[]).includes(key)) ?? null;
}

export function weekdaySectionTitle(day: Weekday) {
  return day.theme;
}
