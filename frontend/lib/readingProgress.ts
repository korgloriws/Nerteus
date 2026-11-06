const STORAGE_KEY = "nerteus.reading.v2";

/** Abaixo disso a visita não entra em nenhuma fileira. */
export const CONTINUE_MIN = 0.1;
/** A partir disso o post vai para "Leia novamente". */
export const COMPLETE_MIN = 0.9;

const MAX_ENTRIES = 40;

export type ReadingEntry = {
  id: number;
  slug: string;
  /** 0–1: quanto do percurso do artigo já foi rolado. 1 = fim do texto. */
  progress: number;
  /** 0–1: ponto do artigo em que o topo da tela estava. */
  resume: number;
  updatedAt: number;
};

export type ReadingBucket = "ignore" | "continue" | "again";

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function classifyProgress(progress: number): ReadingBucket {
  if (!Number.isFinite(progress) || progress < CONTINUE_MIN) return "ignore";
  if (progress >= COMPLETE_MIN) return "again";
  return "continue";
}

function isEntry(value: unknown): value is ReadingEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ReadingEntry>;
  return (
    typeof entry.id === "number" &&
    typeof entry.slug === "string" &&
    typeof entry.progress === "number" &&
    typeof entry.resume === "number" &&
    typeof entry.updatedAt === "number"
  );
}

export function readReadingHistory(): ReadingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getReadingEntry(postId: number): ReadingEntry | null {
  return readReadingHistory().find((entry) => entry.id === postId) ?? null;
}

function writeReadingHistory(entries: ReadingEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent("nerteus-reading"));
  } catch {
    // navegador sem storage ou cota cheia: a leitura segue sem histórico
  }
}

export function saveReadingEntry(entry: Omit<ReadingEntry, "updatedAt">) {
  const rest = readReadingHistory().filter((item) => item.id !== entry.id);
  if (classifyProgress(entry.progress) === "ignore") {
    writeReadingHistory(rest);
    return;
  }

  const next: ReadingEntry = {
    id: entry.id,
    slug: entry.slug,
    progress: clamp(entry.progress, 0, 1),
    resume: clamp(entry.resume, 0, 1),
    updatedAt: Date.now(),
  };
  writeReadingHistory([next, ...rest]);
}

export function measureArticle(article: HTMLElement) {
  const rect = article.getBoundingClientRect();
  const articleTop = window.scrollY + rect.top;
  const height = Math.max(article.offsetHeight, 1);
  const viewport = window.innerHeight;
  // 0 no começo do texto; 1 só quando o fim do artigo encosta no fim da tela.
  const scrollRange = height - viewport;
  let progress: number;
  if (scrollRange <= 48) {
    // O texto cabe na tela. Continua em "Continue lendo" até sair de vista.
    const passedArticle = rect.bottom <= 48;
    progress = passedArticle ? 1 : 0.45;
  } else {
    progress = clamp(-rect.top / scrollRange, 0, 1);
  }
  const resume = clamp((window.scrollY - articleTop) / height, 0, 1);
  return { progress, resume, articleTop, height };
}
