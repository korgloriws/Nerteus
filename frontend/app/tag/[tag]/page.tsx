import { notFound } from "next/navigation";
import Link from "next/link";
import { API_URL } from "../../../lib/api";
import { PostTile } from "../../../components/PostTile";
import type { PostTileProps } from "../../../components/PostTile";

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

  return (
    <main className="space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Tag</p>
          <h1 className="text-3xl font-bold">{tag}</h1>
          <p className="text-sm text-muted">Posts com a tag “{tag}”</p>
        </div>
        <Link href="/" className="text-sm text-primary hover:opacity-80">
          ← Voltar
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostTile key={p.id} {...p} />
        ))}
      </div>
    </main>
  );
}
