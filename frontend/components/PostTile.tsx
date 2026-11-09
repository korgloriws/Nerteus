"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveColor } from "../lib/themeColor";
import { OpenBookIcon } from "./OpenBookIcon";

export type PostTileProps = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  tags?: string[];
  hero_image?: string | null;
  created_at?: string;
  weekday?: string | null;
  day_theme?: string | null;
  views?: number;
  /** 0–1. Entre 10% e 90% o card mostra a barra de onde a leitura parou. */
  progress?: number;
};

type PostTileExtra = {
  onQuickView?: () => void;
  className?: string;
  /** No celular o número do ranking ocupa a base do poster. */
  hideMobileCaption?: boolean;
};

export function PostTile({
  slug,
  title,
  tags,
  hero_image,
  weekday,
  progress,
  onQuickView,
  className = "",
  hideMobileCaption = false,
}: PostTileProps & PostTileExtra) {
  const color = resolveColor(tags, weekday);
  const showProgress = typeof progress === "number" && progress >= 0.1 && progress < 0.9;

  const Card = (
    <article className={`w-full ${className}`}>
      <div className="nf-card relative overflow-hidden rounded-[4px] bg-[#141414] shadow-md transition duration-300 ease-out sm:group-hover/tile:z-10 sm:group-hover/tile:scale-[1.06] sm:group-hover/tile:shadow-[0_12px_28px_rgba(0,0,0,0.65)]">
        <div className="nf-card-media relative aspect-[2/1] w-full">
          {hero_image ? (
            <Image
              src={hero_image}
              alt={title}
              fill
              loading="lazy"
              className="object-cover object-center transition duration-300 ease-out sm:group-hover/tile:brightness-90"
              sizes="(max-width: 640px) 46vw, 280px"
              unoptimized
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
          )}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-0 transition duration-200 sm:flex sm:group-hover/tile:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-black/55 text-white shadow-lg">
              <OpenBookIcon className="h-5 w-6" />
            </span>
          </div>
          <div className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2 pt-8 ${showProgress ? "pb-2.5" : "pb-1.5"} ${hideMobileCaption ? "hidden sm:block" : ""}`}>
            <h3 className="line-clamp-1 text-[11px] font-semibold leading-tight text-white sm:text-xs">{title}</h3>
          </div>
          {showProgress && (
            <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-white/25" aria-hidden>
              <div className="h-full bg-[#e50914]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
            </div>
          )}
        </div>
      </div>
    </article>
  );

  const wrapClass = "group/tile block w-full text-left outline-none";

  if (onQuickView) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onQuickView();
        }}
        className={wrapClass}
      >
        {Card}
      </button>
    );
  }

  const href =
    showProgress
      ? `/posts/${encodeURIComponent(slug)}?ler=1`
      : `/posts/${encodeURIComponent(slug)}`;

  return (
    <Link href={href} className={wrapClass}>
      {Card}
    </Link>
  );
}
