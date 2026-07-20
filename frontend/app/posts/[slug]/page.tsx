import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "../../../lib/api";
import { PostTile } from "../../../components/PostTile";
import { PostToolbar } from "../../../components/PostToolbar";
import { ProductCard, type AffiliateProduct } from "../../../components/ProductCard";
import { resolveColor } from "../../../lib/themeColor";

export const dynamic = "force-dynamic";

type Post = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  tags: string[];
  hero_image?: string | null;
  created_at: string;
  weekday?: string | null;
};

async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${API_URL}/posts/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

async function getRelated(post: Post): Promise<Post[]> {
  const mainTag = post.tags?.[0];
  const url = mainTag
    ? `${API_URL}/posts?tag=${encodeURIComponent(mainTag)}&limit=7&status_filter=published`
    : `${API_URL}/posts?limit=7&status_filter=published`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = (await res.json()) as Post[];
  return data.filter((p) => p.slug !== post.slug).slice(0, 6);
}

async function getPostProducts(postId: number): Promise<AffiliateProduct[]> {
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

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return notFound();
  const [related, products] = await Promise.all([getRelated(post), getPostProducts(post.id)]);
  const color = resolveColor(post.tags, post.weekday);

  return (
    <div className={`space-y-10 accent-${color.key}`}>
      <PostToolbar />
      <article className="space-y-6">
        <Link href="/" className="text-sm text-primary hover:opacity-80">
          ← Voltar
        </Link>
        <div>
          <div className="text-sm text-muted mb-1">{new Date(post.created_at).toLocaleDateString("pt-BR")}</div>
          <h1 className="text-3xl font-bold mb-3 text-foreground">{post.title}</h1>
          <p className="text-lg text-muted">{post.summary}</p>
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
        <div
          className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-a:text-primary dark:prose-invert rich-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {products.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Produtos relacionados</h2>
            <Link href="/loja" className="text-sm text-primary hover:opacity-80">
              Ver loja →
            </Link>
          </div>
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Relacionados</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostTile key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
