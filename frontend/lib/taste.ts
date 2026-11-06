import { normalizeTagKey } from "./tagLabels";

const STORAGE_KEY = "nerteus.taste.v1";

/** Lista padrão. O registro aceita outros ids para novas listas. */
export const MINHA_LISTA = "minha-lista";

export type Reaction = "like" | "dislike";

export type TasteEntry = {
  id: number;
  slug: string;
  reaction: Reaction | null;
  lists: string[];
  updatedAt: number;
};

export type TasteSignals = {
  id: number;
  tags?: string[] | null;
  weekday?: string | null;
};

const MAX_ENTRIES = 200;

function isEntry(value: unknown): value is TasteEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<TasteEntry>;
  return (
    typeof entry.id === "number" &&
    typeof entry.slug === "string" &&
    (entry.reaction === "like" || entry.reaction === "dislike" || entry.reaction === null) &&
    Array.isArray(entry.lists) &&
    typeof entry.updatedAt === "number"
  );
}

export function readTaste(): TasteEntry[] {
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

export function getTasteEntry(postId: number): TasteEntry | null {
  return readTaste().find((entry) => entry.id === postId) ?? null;
}

function writeTaste(entries: TasteEntry[]) {
  const kept = entries
    .filter((entry) => entry.reaction || entry.lists.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
    window.dispatchEvent(new CustomEvent("nerteus-taste"));
  } catch {
    // sem storage: o gosto fica só nesta visita
  }
}

function upsert(postId: number, slug: string, patch: (current: TasteEntry) => TasteEntry) {
  const current = readTaste();
  const existing = current.find((entry) => entry.id === postId);
  const base: TasteEntry = existing || {
    id: postId,
    slug,
    reaction: null,
    lists: [],
    updatedAt: Date.now(),
  };
  const next = patch({ ...base, slug, lists: [...base.lists] });
  next.updatedAt = Date.now();
  writeTaste([next, ...current.filter((entry) => entry.id !== postId)]);
}

export function setReaction(postId: number, slug: string, reaction: Reaction) {
  upsert(postId, slug, (entry) => ({
    ...entry,
    reaction: entry.reaction === reaction ? null : reaction,
  }));
}

export function toggleList(postId: number, slug: string, listId = MINHA_LISTA) {
  upsert(postId, slug, (entry) => {
    const has = entry.lists.includes(listId);
    return {
      ...entry,
      lists: has ? entry.lists.filter((id) => id !== listId) : [...entry.lists, listId],
    };
  });
}

export function postsInList<T extends { id: number }>(posts: T[], entries: TasteEntry[], listId = MINHA_LISTA) {
  const order = entries.filter((entry) => entry.lists.includes(listId));
  const found: T[] = [];
  for (const entry of order) {
    const post = posts.find((item) => item.id === entry.id);
    if (post) found.push(post);
  }
  return found;
}

function addCount(map: Map<string, number>, key: string, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

/**
 * Posts ainda sem reação. Tags curtidas sobem o post; tags que só
 * aparecem em dislikes descem. Sem nenhum like, não há recomendação.
 */
export function recommendFromTaste<T extends TasteSignals>(posts: T[], entries: TasteEntry[], limit = 15): T[] {
  const byId = new Map(posts.map((post) => [post.id, post]));
  const liked = entries.filter((entry) => entry.reaction === "like");
  if (!liked.length) return [];

  const likeTags = new Map<string, number>();
  const dislikeTags = new Map<string, number>();
  const likeDays = new Map<string, number>();
  const reacted = new Set<number>();

  for (const entry of entries) {
    if (entry.reaction) reacted.add(entry.id);
    const source = byId.get(entry.id);
    if (!source || !entry.reaction) continue;
    const tags = entry.reaction === "like" ? likeTags : dislikeTags;
    for (const tag of source.tags || []) addCount(tags, normalizeTagKey(tag));
    if (entry.reaction === "like" && source.weekday) addCount(likeDays, source.weekday.toLowerCase());
  }

  const ranked = posts
    .map((post) => {
      if (reacted.has(post.id)) return { post, score: 0 };
      let score = 0;
      for (const tag of post.tags || []) {
        const key = normalizeTagKey(tag);
        const liked = likeTags.get(key) || 0;
        score += liked * 2;
        if (!liked) score -= dislikeTags.get(key) || 0;
      }
      if (score > 0 && post.weekday && likeDays.has(post.weekday.toLowerCase())) score += 1;
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit).map((item) => item.post);
}
