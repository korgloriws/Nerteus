import Image from "next/image";
import Link from "next/link";
import { resolveColor } from "../lib/themeColor";
import type { CSSProperties } from "react";

export type PostTileProps = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  tags?: string[];
  hero_image?: string | null;
  created_at?: string;
  weekday?: string | null;
};

type PostTileExtra = {
  onQuickView?: () => void;
};

export function PostTile({ slug, title, summary, tags, hero_image, created_at, weekday, onQuickView }: PostTileProps & PostTileExtra) {
  const color = resolveColor(tags, weekday);
  const Card = (
    <div
      className={`group relative h-52 min-w-[260px] max-w-[320px] overflow-hidden rounded-xl bg-card shadow-md transition duration-200 hover:scale-[1.05] hover:-translate-y-1 hover:shadow-2xl accent-${color.key}`}
    >
      <div className="absolute inset-0">
        {hero_image ? (
          <Image
            src={hero_image}
            alt={title}
            fill
            loading="lazy"
            className="object-cover transition duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 240px, 280px"
            unoptimized
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none" />
      <div className="absolute inset-0 accent-overlay-hero pointer-events-none opacity-70" />
      <div className="relative h-full w-full p-4 flex flex-col justify-end text-foreground gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
          {created_at && (
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {new Date(created_at).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-wide rounded-full px-2 py-[2px] accent-badge">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (onQuickView) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onQuickView();
        }}
        className="text-left"
      >
        {Card}
      </button>
    );
  }

  return (
    <Link href={`/posts/${slug}`} className="block">
      {Card}
    </Link>
  );
}

