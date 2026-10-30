"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/24/solid";
import { resolveColor } from "../lib/themeColor";

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
};

type PostTileExtra = {
  onQuickView?: () => void;
  className?: string;
};

export function PostTile({
  slug,
  title,
  tags,
  hero_image,
  weekday,
  onQuickView,
  className = "",
}: PostTileProps & PostTileExtra) {
  const color = resolveColor(tags, weekday);

  const Card = (
    <article className={`w-full ${className}`}>
      <div className="nf-card relative overflow-hidden rounded-[4px] bg-[#141414] shadow-md transition duration-300 ease-out group-hover/tile:z-10 group-hover/tile:scale-[1.08] group-hover/tile:shadow-[0_12px_28px_rgba(0,0,0,0.65)]">
        <div className="relative aspect-video w-full">
          {hero_image ? (
            <Image
              src={hero_image}
              alt={title}
              fill
              loading="lazy"
              className="object-cover transition duration-300 ease-out group-hover/tile:brightness-90"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 240px"
              unoptimized
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover/tile:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-black/55 shadow-lg">
              <PlayIcon className="ml-0.5 h-5 w-5 text-white" />
            </span>
          </div>
        </div>
      </div>
      <h3 className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
        {title}
      </h3>
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

  return (
    <Link href={`/posts/${encodeURIComponent(slug)}`} className={wrapClass}>
      {Card}
    </Link>
  );
}
