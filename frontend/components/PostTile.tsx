import Image from "next/image";
import Link from "next/link";
import { resolveColor } from "../lib/themeColor";

export type PostTileProps = {
  id: number;
  title: string;
  slug: string;
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
  created_at,
  weekday,
  onQuickView,
  className = "",
}: PostTileProps & PostTileExtra) {
  const color = resolveColor(tags, weekday);
  const Card = (
    <div
      className={`group relative w-full overflow-hidden rounded-xl bg-card shadow-md transition duration-200 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-2xl accent-${color.key} ${className}`}
    >
      <div className="media-frame media-frame--cover media-frame--crop">
        {hero_image ? (
          <Image
            src={hero_image}
            alt={title}
            fill
            loading="lazy"
            className="media-img transition duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 300px"
            unoptimized
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 accent-overlay-hero pointer-events-none opacity-70" />
        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end text-foreground gap-1.5">
          <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
          {created_at && (
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {new Date(created_at).toLocaleDateString("pt-BR")}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            {tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wide rounded-full px-2 py-[2px] accent-badge">
                {tag}
              </span>
            ))}
          </div>
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
        className="text-left block w-full"
      >
        {Card}
      </button>
    );
  }

  return (
    <Link href={`/posts/${slug}`} className="block w-full">
      {Card}
    </Link>
  );
}
