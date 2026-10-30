const COLOR_MAP = {
  tecnologia: { gradient: "from-sky-600 via-blue-600 to-indigo-700", hex: "#2563eb", key: "tech" },
  tech: { gradient: "from-sky-600 via-blue-600 to-indigo-700", hex: "#2563eb", key: "tech" },
  animes: { gradient: "from-yellow-400 via-amber-400 to-orange-400", hex: "#f59e0b", key: "anime" },
  anime: { gradient: "from-yellow-400 via-amber-400 to-orange-400", hex: "#f59e0b", key: "anime" },
  games: { gradient: "from-emerald-500 via-green-600 to-teal-600", hex: "#16a34a", key: "games" },
  jogos: { gradient: "from-emerald-500 via-green-600 to-teal-600", hex: "#16a34a", key: "games" },
  "cultura-pop": { gradient: "from-orange-500 via-amber-500 to-yellow-500", hex: "#f97316", key: "pop" },
  pop: { gradient: "from-orange-500 via-amber-500 to-yellow-500", hex: "#f97316", key: "pop" },
  ciencia: { gradient: "from-rose-600 via-red-600 to-orange-600", hex: "#dc2626", key: "science" },
  ciência: { gradient: "from-rose-600 via-red-600 to-orange-600", hex: "#dc2626", key: "science" },
  conhecimento: { gradient: "from-rose-600 via-red-600 to-orange-600", hex: "#dc2626", key: "science" },
} as const;

const DEFAULT_COLOR = { gradient: "from-indigo-600 via-purple-600 to-indigo-700", hex: "#6366f1", key: "default" };

// Cores fixas por dia da semana: segunda=azul, terça=amarelo, quarta=verde,
// quinta=laranja, sexta=vermelho. Aceita chaves em inglês (mon..fri) e em
// português (segunda..sexta) para robustez.
const WEEKDAY_COLOR = {
  mon: { gradient: "from-sky-500 via-blue-600 to-blue-700", hex: "#2563eb", key: "mon" },
  tue: { gradient: "from-yellow-300 via-yellow-400 to-amber-500", hex: "#eab308", key: "tue" },
  wed: { gradient: "from-emerald-500 via-green-600 to-green-700", hex: "#16a34a", key: "wed" },
  thu: { gradient: "from-orange-400 via-orange-500 to-orange-600", hex: "#f97316", key: "thu" },
  fri: { gradient: "from-rose-500 via-red-600 to-red-700", hex: "#dc2626", key: "fri" },
} as const;

const WEEKDAY_ALIASES: Record<string, keyof typeof WEEKDAY_COLOR> = {
  mon: "mon", monday: "mon", segunda: "mon", "segunda-feira": "mon", seg: "mon",
  tue: "tue", tuesday: "tue", terca: "tue", "terça": "tue", "terca-feira": "tue", "terça-feira": "tue", ter: "tue",
  wed: "wed", wednesday: "wed", quarta: "wed", "quarta-feira": "wed", qua: "wed",
  thu: "thu", thursday: "thu", quinta: "thu", "quinta-feira": "thu", qui: "thu",
  fri: "fri", friday: "fri", sexta: "fri", "sexta-feira": "fri", sex: "fri",
};

export function resolveWeekdayColor(weekday?: string | null) {
  if (!weekday) return null;
  const alias = WEEKDAY_ALIASES[weekday.toLowerCase().trim()];
  return alias ? WEEKDAY_COLOR[alias] : null;
}

export function resolveColor(tags?: string[], weekday?: string | null) {
  const weekdayColor = resolveWeekdayColor(weekday);
  if (weekdayColor) return weekdayColor;
  if (!tags || tags.length === 0) return DEFAULT_COLOR;
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (COLOR_MAP[key as keyof typeof COLOR_MAP]) {
      return COLOR_MAP[key as keyof typeof COLOR_MAP];
    }
  }
  return DEFAULT_COLOR;
}
