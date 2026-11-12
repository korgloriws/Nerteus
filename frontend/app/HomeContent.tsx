"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HeroCarousel } from "../components/HeroCarousel";
import { RowSection } from "../components/RowSection";
import type { PostTileProps } from "../components/PostTile";
import { humanizeTag, normalizeTagKey, preferAccentedLabel } from "../lib/tagLabels";
import { classifyProgress, readReadingHistory, type ReadingEntry } from "../lib/readingProgress";
import { postsInList, readTaste, recommendFromTaste, type TasteEntry } from "../lib/taste";
import { WEEKDAYS, weekdaySectionTitle } from "../lib/weekdays";
import {
  hourSeed,
  popularityWeight,
  sortByNewest,
  sortByTrending,
  sortByViewsDesc,
  takeUnique,
  weightedSample,
} from "../lib/homeRanking";

export type PostCardData = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  tags?: string[];
  cover_url?: string | null;
  created_at: string;
  views?: number;
  weekday?: string | null;
  day_theme?: string | null;
};

type Props = {
  posts: PostCardData[];
};

function cardToTileProps(card: PostCardData): PostTileProps & { created_at: string; views?: number; weekday?: string | null; day_theme?: string | null } {
  return {
    id: card.id,
    title: card.title,
    slug: card.slug,
    summary: card.summary,
    tags: card.tags,
    hero_image: card.cover_url,
    created_at: card.created_at,
    views: card.views,
    weekday: card.weekday,
    day_theme: card.day_theme,
  };
}

const WEEKDAY_SECTION: Record<string, string> = Object.fromEntries(
  WEEKDAYS.map((day) => [day.key, weekdaySectionTitle(day)])
);

type TileData = PostTileProps & { created_at: string; views?: number; weekday?: string | null; day_theme?: string | null };

function groupSections(cards: PostCardData[]) {
  const posts = cards.map(cardToTileProps);
  const seed = hourSeed();
  const byViews = sortByViewsDesc(posts);
  const byTrending = sortByTrending(posts);

  // Hero: o que está acelerando (não o Top 10 puro)
  const hero = takeUnique([byTrending, byViews], 5);

  const now = Date.now();
  const last30 = now - 30 * 24 * 60 * 60 * 1000;

  // Top 10: ranking duro all-time (única faixa “oficial” por views absolutas)
  const top10 = byViews.filter((p) => (p.views ?? 0) > 0).slice(0, 10);

  // Em alta: velocidade (views/idade) — ordem diferente do Top 10
  const trending = byTrending
    .filter((p) => (p.views ?? 0) > 0 || ageDaysSafe(p.created_at) <= 21)
    .slice(0, 15);

  // Top do mês: só criados nos últimos 30 dias, por views
  const top10Month = sortByViewsDesc(
    posts.filter((p) => new Date(p.created_at).getTime() >= last30)
  ).slice(0, 10);

  // Novos: só ordem de publicação (mais recente → mais antigo)
  const newest = sortByNewest(posts).slice(0, 18);

  // Em destaque: amostragem estilo stream — popular tem mais chance,
  // mas não copia a ordem do Top 10 (tira os 3 primeiros do pool)
  const highlightPool = posts.filter((p) => !top10.slice(0, 3).some((t) => t.id === p.id));
  const featured = weightedSample(
    highlightPool.length ? highlightPool : posts,
    popularityWeight,
    16,
    seed + 17
  );

  // Faixa extra: “vale a pena” — amostragem só entre quem já tem tração
  const withTraction = posts.filter((p) => (p.views ?? 0) >= 2);
  const worthIt = weightedSample(withTraction, popularityWeight, 12, seed + 91);

  const tagBuckets: Record<string, { labels: string[]; posts: TileData[] }> = {};
  for (const post of byTrending) {
    (post.tags || []).forEach((tag) => {
      const key = normalizeTagKey(tag);
      if (!key) return;
      if (!tagBuckets[key]) tagBuckets[key] = { labels: [], posts: [] };
      tagBuckets[key].labels.push(tag);
      if (!tagBuckets[key].posts.some((p) => p.id === post.id)) {
        tagBuckets[key].posts.push(post);
      }
    });
  }

  const weekdayBuckets: Record<string, TileData[]> = {};
  for (const post of byTrending) {
    const day = (post.weekday || "").toLowerCase();
    if (!day || !WEEKDAY_SECTION[day]) continue;
    if (!weekdayBuckets[day]) weekdayBuckets[day] = [];
    weekdayBuckets[day].push(post);
  }

  const sections: { title: string; posts: TileData[] }[] = [];

  if (trending.length) sections.push({ title: "Em alta agora", posts: trending });
  if (top10.length) sections.push({ title: "Top 10", posts: top10 });
  if (featured.length) sections.push({ title: "Em destaque", posts: featured });
  if (newest.length) sections.push({ title: "Novos posts", posts: newest });
  if (top10Month.length >= 3) sections.push({ title: "Top 10 do mês", posts: top10Month });
  if (worthIt.length >= 4) sections.push({ title: "Em alta entre leitores", posts: worthIt });

  Object.entries(WEEKDAY_SECTION).forEach(([day, title], index) => {
    const list = weekdayBuckets[day];
    if (!list?.length) return;
    // dentro da faixa: amostra ponderada (sucesso aparece mais)
    const sampled = weightedSample(list, popularityWeight, Math.min(16, list.length), seed + 200 + index);
    sections.push({ title, posts: sampled.length ? sampled : list.slice(0, 16) });
  });

  const MIN_POSTS_FOR_TAG_ROW = 5;
  Object.entries(tagBuckets)
    .filter(([, bucket]) => bucket.posts.length >= MIN_POSTS_FOR_TAG_ROW)
    .map(([key, bucket], index) => {
      const sampled = weightedSample(
        bucket.posts,
        popularityWeight,
        Math.min(16, bucket.posts.length),
        seed + 400 + index
      );
      const traction = bucket.posts.reduce((s, p) => s + (p.views ?? 0), 0);
      return {
        key,
        score: traction * 1_000 + bucket.posts.length,
        label: preferAccentedLabel(bucket.labels) || humanizeTag(key),
        posts: sampled,
      };
    })
    .sort((a, b) => b.score - a.score)
    .forEach((item) => {
      sections.push({ title: item.label, posts: item.posts });
    });

  if (!sections.length) {
    sections.push({ title: "Novidades", posts: byViews.slice(0, 15) });
  }

  return { hero, sections, all: byViews };
}

function ageDaysSafe(createdAt: string) {
  return Math.max(1, (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}

export function HomeContent({ posts }: Props) {
  const { hero, sections, all } = groupSections(posts);
  const [visibleSections, setVisibleSections] = useState(5);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [history, setHistory] = useState<ReadingEntry[]>([]);
  const [taste, setTaste] = useState<TasteEntry[]>([]);

  useEffect(() => {
    const load = () => setHistory(readReadingHistory());
    load();
    window.addEventListener("nerteus-reading", load);
    window.addEventListener("pageshow", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("nerteus-reading", load);
      window.removeEventListener("pageshow", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  useEffect(() => {
    const load = () => setTaste(readTaste());
    load();
    window.addEventListener("nerteus-taste", load);
    window.addEventListener("pageshow", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("nerteus-taste", load);
      window.removeEventListener("pageshow", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  const personalRows = useMemo(() => {
    const continueReading: (PostTileProps & { progress: number })[] = [];
    const readAgain: PostTileProps[] = [];

    for (const entry of history) {
      const post = all.find((item) => item.id === entry.id) || all.find((item) => item.slug === entry.slug);
      if (!post) continue;
      const bucket = classifyProgress(entry.progress);
      if (bucket === "continue" && continueReading.length < 15) {
        continueReading.push({ ...post, progress: entry.progress });
      } else if (bucket === "again" && readAgain.length < 15) {
        readAgain.push(post);
      }
    }

    return { continueReading, readAgain };
  }, [history, all]);

  const savedPosts = useMemo(() => postsInList(all, taste).slice(0, 15), [all, taste]);
  const recommended = useMemo(() => recommendFromTaste(all, taste), [all, taste]);

  useEffect(() => {
    setVisibleSections(Math.min(5, sections.length));
  }, [sections.length]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleSections((prev) => Math.min(sections.length, prev + 3));
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [sections.length]);

  return (
    <>
      <main className="min-w-0 text-foreground">
        <h1 className="sr-only">Nerteus</h1>
        {hero.length ? (
          <HeroCarousel posts={hero} />
        ) : (
          <div className="mx-4 rounded-3xl border border-dashed border-[#1f2430] bg-[#161922] p-8 text-[#c1c5d0] sm:mx-8">
            Nenhum post ainda. Crie o primeiro na área do editor.
          </div>
        )}

        <section className="space-y-6 pt-3 sm:space-y-8 sm:pt-5">
          <RowSection title="Continue lendo" posts={personalRows.continueReading} />
          <RowSection title="Leia novamente" posts={personalRows.readAgain} />
          <RowSection title="Minha lista" posts={savedPosts} />
          <RowSection title="Recomendados para você" posts={recommended} />
          {sections.slice(0, visibleSections).map((section) => (
            <RowSection
              key={section.title}
              title={section.title}
              posts={section.posts}
              numbered={section.title === "Top 10" || section.title === "Top 10 do mês"}
            />
          ))}
          <div ref={loadMoreRef} className="h-1 w-full" />
          {sections.length === 0 && (
            <RowSection
              title="Novidades"
              posts={all}
              emptyHint="Nenhum post ainda. Use a área do editor para publicar."
            />
          )}
        </section>
      </main>
    </>
  );
}

