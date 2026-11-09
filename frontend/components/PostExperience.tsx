"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { OpenBookIcon } from "./OpenBookIcon";
import { BackButton } from "./BackButton";
import { PostTasteBar } from "./PostTasteBar";
import { PostShareBar } from "./PostShareBar";
import { ReadingProgressTracker } from "./ReadingProgressTracker";
import { PostTile, type PostTileProps } from "./PostTile";
import { ProductCard, type AffiliateProduct } from "./ProductCard";
import { CommentSection } from "./CommentSection";
import { classifyProgress, getReadingEntry } from "../lib/readingProgress";
import { resolveColor } from "../lib/themeColor";

type PostData = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  tags: string[];
  hero_image?: string | null;
  created_at: string;
  weekday?: string | null;
};

type Props = {
  post: PostData;
  bodyHtml: string;
  related: PostTileProps[];
  products: AffiliateProduct[];
  initialReading?: boolean;
};

export function PostExperience({ post, bodyHtml, related, products, initialReading = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const color = resolveColor(post.tags, post.weekday);
  const [reading, setReading] = useState(initialReading);
  const [bucket, setBucket] = useState<"ignore" | "continue" | "again">("ignore");

  useEffect(() => {
    setReading(searchParams.get("ler") === "1");
  }, [searchParams]);

  useEffect(() => {
    const entry = getReadingEntry(post.id);
    setBucket(entry ? classifyProgress(entry.progress) : "ignore");
  }, [post.id, reading]);

  const ctaLabel = useMemo(() => {
    if (bucket === "continue") return "Continuar lendo";
    if (bucket === "again") return "Ler novamente";
    return "Seguir leitura";
  }, [bucket]);

  function startReading() {
    setReading(true);
    const url = `/posts/${encodeURIComponent(post.slug)}?ler=1`;
    router.push(url, { scroll: true });
  }

  if (reading) {
    return (
      <div className={`space-y-8 sm:space-y-10 accent-${color.key} min-w-0`}>
        <ReadingProgressTracker postId={post.id} slug={post.slug} />
        <article id="ler" data-reading-root className="mx-auto w-full max-w-6xl space-y-5 px-3 sm:space-y-6 sm:px-4 min-w-0">
          <BackButton label="Voltar" fallback={`/posts/${encodeURIComponent(post.slug)}`} />
          <div className="min-w-0">
            <div className="mb-1 text-sm text-muted">{new Date(post.created_at).toLocaleDateString("pt-BR")}</div>
            <h1 className="fluid-h1 mb-3 font-bold text-foreground">{post.title}</h1>
            {post.summary ? <p className="break-words text-base text-muted sm:text-lg">{post.summary}</p> : null}
            <div className="mt-4">
              <PostTasteBar postId={post.id} slug={post.slug} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className="accent-badge rounded-full px-2 py-1 text-[11px] uppercase tracking-wide hover:opacity-80"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <div
            className="prose rich-content max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-a:text-primary dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </article>

        {related.length > 0 && (
          <section className="mx-auto w-full max-w-6xl space-y-4 px-3 sm:px-4 min-w-0">
            <h2 className="fluid-h2 font-semibold">Próximas leituras</h2>
            <p className="text-sm text-muted">Sugestões escolhidas para seguir a partir daqui</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostTile key={item.id} {...item} />
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className="mx-auto w-full max-w-6xl space-y-4 px-3 sm:px-4 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="fluid-h2 font-semibold">Produtos relacionados</h2>
              <Link href="/loja" className="whitespace-nowrap text-sm text-primary hover:opacity-80">
                Ver loja →
              </Link>
            </div>
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto w-full max-w-6xl space-y-6 px-3 sm:px-4">
          <PostShareBar title={post.title} summary={post.summary} slug={post.slug} />
          <CommentSection postId={post.id} />
        </div>

        <div className="mx-auto w-full max-w-6xl px-3 pb-6 sm:px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`accent-${color.key} min-w-0`}>
      <section className="nf-detail relative overflow-hidden bg-[#141414]">
        <div className="relative h-[58vh] min-h-[380px] max-h-[560px] w-full sm:aspect-[2.2/1] sm:h-auto sm:max-h-[620px] sm:min-h-0">
          {post.hero_image ? (
            <Image
              src={post.hero_image}
              alt={post.title}
              fill
              priority
              unoptimized
              className="object-cover object-[center_22%] sm:object-[center_20%]"
              sizes="100vw"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15 sm:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black via-black/60 to-transparent sm:block" />
          <div className="nf-hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-28" />

          <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-8 sm:pt-4 lg:px-12">
            <BackButton label="Voltar" tone="on-dark" />
          </div>

          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="relative w-full max-w-2xl space-y-3 px-4 pb-10 sm:space-y-4 sm:px-8 sm:pb-12 lg:px-12">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                {new Date(post.created_at).toLocaleDateString("pt-BR")}
              </p>
              <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-5xl">
                {post.title}
              </h1>
              {post.summary ? (
                <p className="max-w-xl text-sm leading-relaxed text-white/88 sm:text-base sm:line-clamp-4">
                  {post.summary}
                </p>
              ) : (
                <p className="text-sm text-white/70">Sem resumo disponível.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {post.tags?.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] uppercase tracking-wide text-white/90 hover:bg-black/50"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={startReading}
                  className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-white/90"
                >
                  <OpenBookIcon className="h-5 w-6" tone="on-light" />
                  {ctaLabel}
                </button>
                <span className="inline-flex items-center gap-2 rounded bg-[#6d6d6eb3] px-4 py-2.5 text-sm font-bold text-white">
                  <InformationCircleIcon className="h-5 w-5" />
                  Introdução
                </span>
              </div>
              <div className="pt-2">
                <PostTasteBar postId={post.id} slug={post.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="space-y-4 px-4 py-8 sm:px-8 lg:px-12">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">Próximas leituras</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostTile key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
