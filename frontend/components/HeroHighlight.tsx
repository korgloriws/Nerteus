import Image from "next/image";
import Link from "next/link";
import { resolveColor } from "../lib/themeColor";
import type { CSSProperties } from "react";

type HeroProps = {
  title: string;
  slug: string;
  summary?: string | null;
  hero_image?: string | null;
  tags?: string[];
  weekday?: string | null;
};

export function HeroHighlight({ title, slug, summary, hero_image, tags, weekday }: HeroProps) {
  const color = resolveColor(tags, weekday);
  return (
    <Link
      href={`/posts/${slug}`}
      className={`relative block overflow-hidden rounded-3xl border border-border bg-card shadow-2xl accent-${color.key}`}
    >
      {hero_image ? (
        <div className="absolute inset-0">
          <Image
            src={hero_image}
            alt={title}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 768px) 100vw, 80vw"
            unoptimized
            priority
          />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-r ${color.gradient}`} />
      )}
      <div className="absolute inset-0 accent-overlay-hero" />
      <div className="absolute inset-0 hero-overlay" />
      <div className="relative p-8 md:p-10 max-w-2xl space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Em destaque</p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{title}</h1>
        <p className="text-base md:text-lg text-muted line-clamp-3">{summary || "Leia mais"}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs uppercase tracking-wide rounded-full border border-border/70 bg-card/60 px-3 py-1 text-foreground/80"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-foreground">
          Assistir leitura
          <span className="text-muted">→</span>
        </div>
      </div>
    </Link>
  );
}

