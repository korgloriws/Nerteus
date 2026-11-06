import { notFound } from "next/navigation";
import { API_URL } from "../../../lib/api";
import { PostTile, type PostTileProps } from "../../../components/PostTile";
import { BackButton } from "../../../components/BackButton";
import { weekdayBySlug, weekdaySectionTitle } from "../../../lib/weekdays";

export const dynamic = "force-dynamic";

type Card = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  tags?: string[];
  cover_url?: string | null;
  weekday?: string | null;
};

async function getByWeekday(key: string): Promise<PostTileProps[]> {
  const res = await fetch(
    `${API_URL}/posts?weekday=${encodeURIComponent(key)}&status_filter=published&view=card&order_by=-created_at&limit=60`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const cards = (await res.json()) as Card[];
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    slug: card.slug,
    summary: card.summary,
    tags: card.tags,
    hero_image: card.cover_url,
    weekday: card.weekday,
  }));
}

export default async function DayPage({ params }: { params: { day: string } }) {
  const day = weekdayBySlug(decodeURIComponent(params.day));
  if (!day) notFound();
  const posts = await getByWeekday(day.key);
  const title = weekdaySectionTitle(day);

  return (
    <main className="space-y-6 text-foreground min-w-0">
      <BackButton label="Voltar" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Faixa</p>
        <h1 className="fluid-h1 font-bold break-words">{title}</h1>
        <p className="text-sm text-muted">Posts de {day.theme}</p>
      </div>
      {posts.length ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostTile key={post.id} {...post} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-muted">
          Nenhum post publicado nesta faixa ainda.
        </div>
      )}
    </main>
  );
}
