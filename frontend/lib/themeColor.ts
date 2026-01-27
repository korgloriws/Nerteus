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

export function resolveColor(tags?: string[]) {
  if (!tags || tags.length === 0) return DEFAULT_COLOR;
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (COLOR_MAP[key as keyof typeof COLOR_MAP]) {
      return COLOR_MAP[key as keyof typeof COLOR_MAP];
    }
  }
  return DEFAULT_COLOR;
}
