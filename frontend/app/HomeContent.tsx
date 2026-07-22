"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { HeroCarousel } from "../components/HeroCarousel";
import { PostModal } from "../components/PostModal";
import { RowSection } from "../components/RowSection";
import type { PostTileProps } from "../components/PostTile";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { humanizeTag, normalizeTagKey, preferAccentedLabel } from "../lib/tagLabels";

type Props = {
  posts: (PostTileProps & { created_at: string; views?: number; weekday?: string | null; day_theme?: string | null })[];
};

const WEEKDAY_SECTION: Record<string, string> = {
  mon: "Segunda · Tech",
  tue: "Terça · Otaku",
  wed: "Quarta · Games",
  thu: "Quinta · Pop",
  fri: "Sexta · Básica",
};

function groupSections(posts: (PostTileProps & { created_at: string; views?: number; weekday?: string | null; day_theme?: string | null })[]) {
  const sorted = [...posts].sort((a, b) => {
    const av = a.views ?? 0;
    const bv = b.views ?? 0;
    if (av !== bv) return bv - av;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const hero = sorted.slice(0, 5);

  const now = Date.now();
  const last30 = now - 30 * 24 * 60 * 60 * 1000;
  const monthTop = sorted.filter((p) => new Date(p.created_at).getTime() >= last30);
  const top10Month = (monthTop.length ? monthTop : sorted).slice(0, 10);
  const topTrending = sorted.slice(0, 15);
  const mostViewed = [...sorted].filter((p) => (p.views ?? 0) > 0).slice(0, 10);

  const tagBuckets: Record<string, { labels: string[]; posts: typeof sorted }> = {};
  for (const post of sorted) {
    (post.tags || []).forEach((tag) => {
      const key = normalizeTagKey(tag);
      if (!key) return;
      if (!tagBuckets[key]) tagBuckets[key] = { labels: [], posts: [] };
      tagBuckets[key].labels.push(tag);
      // evita duplicar o mesmo post na mesma seção
      if (!tagBuckets[key].posts.some((p) => p.id === post.id)) {
        tagBuckets[key].posts.push(post);
      }
    });
  }

  const weekdayBuckets: Record<string, typeof sorted> = {};
  for (const post of sorted) {
    const day = (post.weekday || "").toLowerCase();
    if (!day || !WEEKDAY_SECTION[day]) continue;
    if (!weekdayBuckets[day]) weekdayBuckets[day] = [];
    weekdayBuckets[day].push(post);
  }

  const sections: { title: string; posts: typeof sorted }[] = [];

  if (topTrending.length) sections.push({ title: "Em alta agora", posts: topTrending });
  if (mostViewed.length) sections.push({ title: "Mais vistos", posts: mostViewed });
  if (top10Month.length) sections.push({ title: "Top 10 do mês", posts: top10Month });
  if (sorted.length) sections.push({ title: "Em destaque", posts: sorted.slice(0, 20) });

  // Seções por dia da semana (quando houver posts)
  Object.entries(WEEKDAY_SECTION).forEach(([day, title]) => {
    const list = weekdayBuckets[day];
    if (list?.length) sections.push({ title, posts: list.slice(0, 20) });
  });

  // Seções por tag: aparece a partir de 1 post (cria o subtema ao publicar)
  Object.entries(tagBuckets)
    .map(([key, bucket]) => {
      const newest = Math.max(...bucket.posts.map((p) => new Date(p.created_at).getTime()));
      const score = bucket.posts.length * 1_000_000 + newest;
      return {
        key,
        score,
        label: preferAccentedLabel(bucket.labels) || humanizeTag(key),
        posts: bucket.posts,
      };
    })
    .sort((a, b) => b.score - a.score)
    .forEach((item) => {
      sections.push({
        title: item.label,
        posts: item.posts.slice(0, 20),
      });
    });

  if (!sections.length) {
    sections.push({ title: "Novidades", posts: sorted.slice(0, 15) });
  }

  return { hero, sections, all: sorted };
}

export function HomeContent({ posts }: Props) {
  const { hero, sections, all } = groupSections(posts);
  const [selected, setSelected] = useState<PostTileProps | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleSections, setVisibleSections] = useState(5);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const filtered = useMemo(() => {
    const normalized = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (query.trim().length < 2) return [];
    return all.filter((p) => {
      const q = normalized(query.trim());
      const inTitle = normalized(p.title).includes(q);
      const inSummary = normalized(p.summary || "").includes(q);
      const inTags = (p.tags || []).some((t) => normalized(t).includes(q));
      return inTitle || inSummary || inTags;
    });
  }, [all, query]);

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

  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) {
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => setSearchLoading(false), 200);
    return () => clearTimeout(t);
  }, [query, searchOpen]);

  return (
    <>
      <main className="space-y-8 sm:space-y-10 text-foreground min-w-0">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Streaming de posts</p>
              <h1 className="fluid-h1 font-bold">Nerteus</h1>
              <p className="text-sm text-muted">Curadoria dinâmica da cultura nerd</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 relative flex-wrap justify-start sm:justify-end">
              <div
                className={`flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1 transition-all duration-200 ${
                  searchOpen ? "w-full sm:w-64 md:w-80" : "w-10 justify-center"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen((v) => !v);
                    if (searchOpen) setQuery("");
                  }}
                  className="p-1 rounded-full hover:bg-border/60"
                  aria-label="Buscar"
                  title="Buscar"
                >
                  {searchOpen ? (
                    <XMarkIcon className="h-5 w-5 text-foreground" />
                  ) : (
                    <MagnifyingGlassIcon className="h-5 w-5 text-foreground" />
                  )}
                </button>
                {searchOpen && (
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted"
                    placeholder="Buscar por título, tag ou tema..."
                  />
                )}
              </div>
              {searchOpen && query.trim().length >= 2 && (
                <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-12 w-full sm:w-[min(500px,90vw)] max-h-[min(420px,60vh)] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl z-20">
                  {searchLoading && (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-3 animate-pulse rounded-xl bg-border/20 p-3">
                          <div className="h-16 w-24 rounded-lg bg-border/50" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 bg-border/60 rounded" />
                            <div className="h-3 w-1/2 bg-border/50 rounded" />
                            <div className="flex gap-2">
                              <div className="h-3 w-10 bg-border/40 rounded-full" />
                              <div className="h-3 w-10 bg-border/40 rounded-full" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchLoading && filtered.length === 0 && (
                    <div className="px-4 py-3 text-sm text-muted">Nenhum resultado</div>
                  )}
                  {!searchLoading &&
                    filtered.slice(0, 12).map((item) => (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setSearchOpen(false);
                          setQuery("");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-border/40 transition flex items-center gap-3"
                      >
                        <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-border/40">
                          {item.hero_image ? (
                            <Image src={item.hero_image} alt={item.title} fill className="object-cover" sizes="96px" unoptimized />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-border/40 to-card" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</span>
                          <span className="text-xs text-muted line-clamp-2">{item.summary || "Sem resumo."}</span>
                          <div className="flex flex-wrap gap-1">
                            {(item.tags || []).slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] uppercase tracking-wide rounded-full bg-border/40 px-2 py-[2px] text-muted"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
              <a
                href="/loja"
                className="text-sm font-semibold text-foreground bg-card border border-border hover:bg-border/40 rounded-full px-4 py-2"
              >
                Loja
              </a>
              <a
                href="/admin"
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full px-4 py-2 shadow"
              >
                Área do editor
              </a>
            </div>
          </div>
          {hero.length ? (
            <HeroCarousel posts={hero} />
          ) : (
            <div className="rounded-3xl border border-dashed border-[#1f2430] bg-[#161922] p-8 text-[#c1c5d0]">
              Nenhum post ainda. Crie o primeiro na área do editor.
            </div>
          )}
        </section>

        <section className="space-y-8">
          {sections.slice(0, visibleSections).map((section) => (
            <RowSection key={section.title} title={section.title} posts={section.posts} onQuickView={setSelected} />
          ))}
          <div ref={loadMoreRef} className="h-1 w-full" />
          {sections.length === 0 && (
            <RowSection
              title="Novidades"
              posts={all}
              emptyHint="Nenhum post ainda. Use a área do editor para publicar."
              onQuickView={setSelected}
            />
          )}
        </section>
      </main>

      <PostModal post={selected} onClose={() => setSelected(null)} />
    </>
  );
}

