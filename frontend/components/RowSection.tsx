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
};

function SkeletonTile() {
  return (
    <div className="w-[42vw] max-w-[240px] shrink-0 sm:w-[220px]">
      <div className="aspect-video animate-pulse rounded-[4px] bg-white/10" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/10" />
    </div>
  );
}

export function RowSection({ title, posts, emptyHint, onQuickView, loadingSkeletonCount = 0 }: RowSectionProps) {
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
    <section className="group/row relative min-w-0 space-y-2">
      <h2 className="px-1 text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
      <div className="relative">
        {canLeft ? (
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-0 z-20 hidden h-[calc(100%-1.75rem)] w-10 items-center justify-center bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover/row:opacity-100 md:flex"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
        ) : null}
        {canRight ? (
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-0 z-20 hidden h-[calc(100%-1.75rem)] w-10 items-center justify-center bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover/row:opacity-100 md:flex"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        ) : null}
        <div
          ref={scrollerRef}
          className="nf-scroller -mx-3 flex gap-2 overflow-x-auto overscroll-x-contain px-3 py-3 sm:mx-0 sm:px-0"
        >
          {showSkeletons
            ? Array.from({ length: loadingSkeletonCount }).map((_, idx) => <SkeletonTile key={idx} />)
            : posts.map((post) => (
                <div key={post.id} className="w-[42vw] max-w-[240px] shrink-0 sm:w-[220px]">
                  <PostTile {...post} onQuickView={onQuickView ? () => onQuickView(post) : undefined} />
                </div>
              ))}
        </div>
      </div>
      {posts.length === 0 && emptyHint ? <p className="text-sm text-muted">{emptyHint}</p> : null}
    </section>
  );
}
