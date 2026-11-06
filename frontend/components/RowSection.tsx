"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { PostTile, type PostTileProps } from "./PostTile";

type RowSectionProps = {
  title: string;
  posts: PostTileProps[];
  emptyHint?: string;
  onQuickView?: (post: PostTileProps) => void;
  loadingSkeletonCount?: number;
  numbered?: boolean;
};

const tileWidth = "w-[46vw] max-w-[280px] shrink-0 sm:w-[240px] sm:max-w-none lg:w-[280px]";

function SkeletonTile() {
  return (
    <div className={tileWidth}>
      <div className="aspect-[2/1] animate-pulse rounded-[4px] bg-white/10" />
    </div>
  );
}

export function RowSection({ title, posts, emptyHint, onQuickView, loadingSkeletonCount = 0, numbered = false }: RowSectionProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const showSkeletons = !posts.length && loadingSkeletonCount > 0;

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 12);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, posts.length, showSkeletons]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  }

  if (!posts.length && !showSkeletons) {
    return null;
  }

  return (
    <section className="nf-row group/row relative min-w-0">
      <h2 className="px-4 text-base font-bold tracking-tight text-foreground sm:px-8 sm:text-lg lg:px-12">{title}</h2>
      <div className="relative mt-1.5 sm:mt-2">
        {canLeft ? (
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollByDir(-1)}
            className="absolute bottom-2 left-0 top-2 z-20 hidden w-10 items-center justify-center bg-gradient-to-r from-black/70 to-transparent text-white opacity-0 transition hover:from-black/80 group-hover/row:opacity-100 md:flex"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
        ) : null}
        {canRight ? (
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollByDir(1)}
            className="absolute bottom-2 right-0 top-2 z-20 hidden w-10 items-center justify-center bg-gradient-to-l from-black/70 to-transparent text-white opacity-0 transition hover:from-black/80 group-hover/row:opacity-100 md:flex"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        ) : null}
        <div
          ref={scrollerRef}
          className="nf-scroller flex gap-2 overflow-x-auto overscroll-x-contain px-4 py-2 sm:gap-2 sm:px-8 lg:px-12"
        >
          {showSkeletons
            ? Array.from({ length: loadingSkeletonCount }).map((_, idx) => <SkeletonTile key={idx} />)
            : posts.map((post, index) =>
                numbered ? (
                  <div key={post.id} className="nf-rank-item">
                    <span className="nf-rank" aria-hidden>
                      {index + 1}
                    </span>
                    <div className="nf-rank-poster">
                      <PostTile {...post} onQuickView={onQuickView ? () => onQuickView(post) : undefined} />
                    </div>
                  </div>
                ) : (
                  <div key={post.id} className={tileWidth}>
                    <PostTile {...post} onQuickView={onQuickView ? () => onQuickView(post) : undefined} />
                  </div>
                )
              )}
        </div>
      </div>
      {posts.length === 0 && emptyHint ? <p className="text-sm text-muted">{emptyHint}</p> : null}
    </section>
  );
}
