"use client";

import Image from "next/image";
import Link from "next/link";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { resolveColor } from "../lib/themeColor";

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
      href={`/posts/${encodeURIComponent(slug)}`}
      className="nf-hero relative block overflow-hidden rounded-md bg-[#141414] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
    >
      <div className="relative aspect-[16/9] min-h-[220px] w-full sm:min-h-[320px]">
        {hero_image ? (
          <Image
            src={hero_image}
            alt={title}
            fill
            className="object-cover object-[center_20%]"
            sizes="(max-width: 768px) 100vw, 960px"
            unoptimized
            priority
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${color.gradient}`} />
        )}
        {/* Degradê só à esquerda — a arte à direita permanece visível */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent sm:from-black sm:via-black/55 sm:to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f1115] to-transparent" />

        <div className="absolute inset-0 flex items-end sm:items-center">
          <div className="relative w-full max-w-xl space-y-3 p-5 sm:space-y-4 sm:p-8 md:p-10">
            <h1 className="text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {summary ? (
              <p className="hidden max-w-md text-sm leading-relaxed text-white/85 line-clamp-3 sm:block sm:text-base">
                {summary}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-bold text-black">
                <PlayIcon className="h-5 w-5" />
                Leia
              </span>
              <span className="inline-flex items-center gap-2 rounded bg-[#6d6d6eb3] px-4 py-2 text-sm font-bold text-white">
                <InformationCircleIcon className="h-5 w-5" />
                Mais informações
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
