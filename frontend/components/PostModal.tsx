import Image from "next/image";
import Link from "next/link";
import type { PostTileProps } from "./PostTile";
import { resolveColor } from "../lib/themeColor";
import type { CSSProperties } from "react";

type PostModalProps = {
  post: PostTileProps | null;
  onClose: () => void;
};

export function PostModal({ post, onClose }: PostModalProps) {
  if (!post) return null;
  const color = resolveColor(post.tags, post.weekday);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div
        className={`relative max-w-4xl w-full overflow-hidden rounded-3xl border border-border/25 bg-card/60 shadow-2xl animate-float-in accent-surface accent-${color.key}`}
      >
        <div className="grid md:grid-cols-[1.2fr_1fr] items-stretch">
          <div className="relative h-64 md:h-full">
            {post.hero_image ? (
              <Image
                src={post.hero_image}
                alt={post.title}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          </div>
          <div className="p-8 space-y-4 backdrop-blur-sm bg-card/70">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Prévia</p>
            <h3 className="text-2xl font-bold text-foreground leading-tight">{post.title}</h3>
            <p className="text-sm text-muted">{post.summary || "Sem resumo disponível."}</p>
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] uppercase tracking-wide rounded-full border border-border/70 bg-card/60 px-2 py-[4px] text-foreground/80"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="pt-3 flex items-center gap-3">
              <Link
                href={`/posts/${post.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Ler agora
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/20"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes float-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-float-in {
          animation: float-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

