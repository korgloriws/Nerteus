"use client";

import Image from "next/image";
import Link from "next/link";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { OpenBookIcon } from "./OpenBookIcon";
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
  const introHref = `/posts/${encodeURIComponent(slug)}`;
  const readHref = `${introHref}?ler=1`;

  return (
    <section className="group nf-hero relative overflow-hidden bg-[#141414]">
      <div className="relative h-[52vh] min-h-[340px] max-h-[440px] w-full sm:aspect-[2.2/1] sm:h-auto sm:max-h-[520px] sm:min-h-0">
        <Link href={introHref} className="absolute inset-0" aria-label={`${title} — mais informações`}>
          {hero_image ? (
            <Image
              src={hero_image}
              alt={title}
              fill
              className="object-cover object-[center_22%] sm:object-[center_20%]"
              sizes="(max-width: 768px) 100vw, 960px"
              unoptimized
              priority
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-r ${color.gradient}`} />
          )}
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10 sm:hidden" />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black via-black/55 to-transparent sm:block" />
        <div className="nf-hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-28" />

        <div className="absolute inset-0 flex items-end sm:items-center">
          <div className="relative w-full max-w-xl space-y-3 px-4 pb-8 sm:space-y-4 sm:px-8 sm:pb-10 lg:px-12">
            <Link href={introHref} className="block">
              <h1 className="text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-4xl md:text-5xl">
                {title}
              </h1>
            </Link>
            {summary ? (
              <p className="line-clamp-2 max-w-md text-sm leading-relaxed text-white/85 sm:line-clamp-3 sm:text-base">
                {summary}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={readHref}
                className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90"
              >
                <OpenBookIcon className="h-5 w-6" tone="on-light" />
                Leia
              </Link>
              <Link
                href={introHref}
                className="inline-flex items-center gap-2 rounded bg-[#6d6d6eb3] px-4 py-2 text-sm font-bold text-white hover:bg-[#6d6d6ee0]"
              >
                <InformationCircleIcon className="h-5 w-5" />
                Mais informações
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
