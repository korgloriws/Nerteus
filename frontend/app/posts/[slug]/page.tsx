import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "../../../lib/api";
import { PostTile } from "../../../components/PostTile";
import { PostToolbar } from "../../../components/PostToolbar";
import { ProductCard, type AffiliateProduct } from "../../../components/ProductCard";
import { CommentSection } from "../../../components/CommentSection";
import { resolveColor } from "../../../lib/themeColor";

export const dynamic = "force-dynamic";

type Post = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  tags: string[];
  related_ids?: number[];
  related_product_ids?: number[];
  hero_image?: string | null;
  created_at: string;
  weekday?: string | null;
};

async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${API_URL}/posts/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

async function getRelatedByIds(ids: number[]): Promise<Post[]> {
  if (!ids.length) return [];
  const res = await fetch(
    `${API_URL}/posts?ids=${ids.join(",")}&status_filter=published&limit=${Math.min(ids.length, 100)}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  return res.json();
}

async function getRelatedByTag(post: Post): Promise<Post[]> {
  const mainTag = post.tags?.[0];
  const url = mainTag
    ? `${API_URL}/posts?tag=${encodeURIComponent(mainTag)}&limit=7&status_filter=published`
    : `${API_URL}/posts?limit=7&status_filter=published`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = (await res.json()) as Post[];
  return data.filter((p) => p.slug !== post.slug).slice(0, 6);
}

async function getRelated(post: Post): Promise<Post[]> {
  const manualIds = (post.related_ids || []).filter((id) => id !== post.id);
  if (manualIds.length) {
    const manual = await getRelatedByIds(manualIds);
    if (manual.length) return manual.slice(0, 8);
  }
  return getRelatedByTag(post);
}

async function getProductsByIds(ids: number[]): Promise<AffiliateProduct[]> {
  if (!ids.length) return [];
  try {
    const res = await fetch(
      `${API_URL}/products?ids=${ids.join(",")}&status_filter=active&limit=${Math.min(ids.length, 100)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getProductsByPostId(postId: number): Promise<AffiliateProduct[]> {
  try {
    const res = await fetch(
      `${API_URL}/products?post_id=${postId}&status_filter=active&limit=12`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getPostProducts(post: Post): Promise<AffiliateProduct[]> {
  const manualIds = post.related_product_ids || [];
  if (manualIds.length) {
    const manual = await getProductsByIds(manualIds);
    if (manual.length) return manual.slice(0, 8);
  }
  return getProductsByPostId(post.id);
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return notFound();
  const [related, products] = await Promise.all([getRelated(post), getPostProducts(post)]);
  const color = resolveColor(post.tags, post.weekday);

  return (
    <div className={`space-y-8 sm:space-y-10 accent-${color.key} min-w-0`}>
      <PostToolbar />
      <article className="space-y-5 sm:space-y-6 min-w-0">
        <Link href="/" className="text-sm text-primary hover:opacity-80">
          ← Voltar
        </Link>
        <div className="min-w-0">
          <div className="text-sm text-muted mb-1">{new Date(post.created_at).toLocaleDateString("pt-BR")}</div>
          <h1 className="fluid-h1 font-bold mb-3 text-foreground">{post.title}</h1>
          <p className="text-base sm:text-lg text-muted break-words">{post.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="text-[11px] uppercase tracking-wide rounded-full px-2 py-1 accent-badge hover:opacity-80"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
        {post.hero_image ? (
          <div className="media-frame media-frame--hero rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.hero_image} alt={post.title} className="media-img absolute inset-0 h-full w-full" />
          </div>
        ) : null}
        <div
          className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-a:text-primary dark:prose-invert rich-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {related.length > 0 && (
        <section className="space-y-4 min-w-0">
          <h2 className="fluid-h2 font-semibold">Continue lendo</h2>
          <p className="text-sm text-muted">Próximas leituras selecionadas para você</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostTile key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="fluid-h2 font-semibold">Produtos relacionados</h2>
            <Link href="/loja" className="text-sm text-primary hover:opacity-80 whitespace-nowrap">
              Ver loja →
            </Link>
          </div>
          <div className="grid items-start gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <CommentSection postId={post.id} />
    </div>
  );
}
