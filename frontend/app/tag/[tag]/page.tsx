import { notFound } from "next/navigation";
import Link from "next/link";
import { API_URL } from "../../../lib/api";
import { PostTile } from "../../../components/PostTile";
import type { PostTileProps } from "../../../components/PostTile";
import { humanizeTag } from "../../../lib/tagLabels";

export const dynamic = "force-dynamic";

type TagParams = {
  params: { tag: string };
};

async function getByTag(tag: string): Promise<PostTileProps[]> {
  const res = await fetch(
    `${API_URL}/posts?tag=${encodeURIComponent(tag)}&status_filter=published&order_by=-views&limit=60`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function TagPage({ params }: TagParams) {
  const tag = decodeURIComponent(params.tag);
  const posts = await getByTag(tag);
  if (!posts.length) {
    return notFound();
  }
  const label = humanizeTag(tag);

  return (
    <main className="space-y-6 text-foreground min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Tag</p>
          <h1 className="fluid-h1 font-bold break-words">{label}</h1>
          <p className="text-sm text-muted">Posts com a tag “{label}”</p>
        </div>
        <Link href="/" className="text-sm text-primary hover:opacity-80 whitespace-nowrap pt-1">
          ← Voltar
        </Link>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostTile key={p.id} {...p} />
        ))}
      </div>
    </main>
  );
}
