/**
 * Ranking / amostragem da home no estilo streaming:
 * - Top 10: ordem fixa por views (o que “ganhou”)
 * - Em alta: velocidade (views / idade)
 * - Em destaque: amostragem ponderada — posts mais vistos têm mais chance,
 *   mas a ordem muda e entra exploração (não copia o Top 10)
 */

export type RankablePost = {
  id: number;
  created_at: string;
  views?: number;
};

function ageDays(createdAt: string) {
  return Math.max(1, (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}

/** PRNG estável (mesma hora UTC → mesma ordem na home). */
export function hourSeed(now = Date.now()) {
  return Math.floor(now / (60 * 60 * 1000));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function trendingScore(post: RankablePost) {
  const views = Math.max(0, post.views ?? 0);
  // posts novos com tração sobem; velhos só com muitas views
  return (views + 0.5) / Math.pow(ageDays(post.created_at), 0.75);
}

/** Peso de “o que funciona”: views com curva suave + leve bônus de frescor. */
export function popularityWeight(post: RankablePost) {
  const views = Math.max(0, post.views ?? 0);
  const fresh = 1 / Math.pow(ageDays(post.created_at), 0.25);
  // +1 evita peso 0; ^1.15 faz os líderes dominarem sem monopolizar 100%
  return Math.pow(views + 1, 1.15) * fresh;
}

/**
 * Amostragem sem reposição proporcional ao peso (roleta).
 * Quem tem mais views aparece mais vezes “no topo” das faixas amostradas.
 */
export function weightedSample<T extends RankablePost>(
  items: T[],
  weightFn: (item: T) => number,
  count: number,
  seed: number
): T[] {
  if (!items.length || count <= 0) return [];
  const rand = mulberry32(seed);
  const pool = items.map((item) => ({ item, weight: Math.max(0.0001, weightFn(item)) }));
  const picked: T[] = [];
  const n = Math.min(count, pool.length);

  for (let i = 0; i < n; i++) {
    const total = pool.reduce((sum, row) => sum + row.weight, 0);
    let cursor = rand() * total;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      cursor -= pool[j].weight;
      if (cursor <= 0) {
        idx = j;
        break;
      }
      idx = j;
    }
    picked.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return picked;
}

export function sortByViewsDesc<T extends RankablePost>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const av = a.views ?? 0;
    const bv = b.views ?? 0;
    if (av !== bv) return bv - av;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function sortByTrending<T extends RankablePost>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const diff = trendingScore(b) - trendingScore(a);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Novos com leve boost do que já está performando. */
export function sortNewWithTraction<T extends RankablePost>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const score = (p: RankablePost) => {
      const age = ageDays(p.created_at);
      const views = p.views ?? 0;
      // prioriza recentes; views recentes empurram para frente
      return -age * 10 + Math.log1p(views) * 2;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function takeUnique<T extends { id: number }>(rows: T[][], limit: number): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const row of rows) {
    for (const item of row) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
