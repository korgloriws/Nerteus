import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { API_URL } from "../../../lib/api";
import { PostTile } from "../../../components/PostTile";
import { PostToolbar } from "../../../components/PostToolbar";
import { ProductCard, type AffiliateProduct } from "../../../components/ProductCard";
import { CommentSection } from "../../../components/CommentSection";
import { resolveColor } from "../../../lib/themeColor";
import { stripHeroFromContent } from "../../../lib/stripHeroFromContent";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://31.97.167.75:3000";

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
  updated_at?: string;
  weekday?: string | null;
};

async function getPost(slug: string): Promise<Post | null> {
  // Next já pode entregar o slug decodificado; encode evita URL inválida no fetch.
  const encoded = encodeURIComponent(decodeURIComponent(slug));
  const res = await fetch(`${API_URL}/posts/${encoded}`, { next: { revalidate: 60 } });
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

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getDescription(post: Post): string {
  if (post.summary) return post.summary;
  const plain = stripHtmlTags(post.content);
  if (plain.length <= 155) return plain;
  return plain.slice(0, 152) + "...";
}

function getCoverUrl(post: Post): string | null {
  if (!post.hero_image) return null;
  if (post.hero_image.startsWith("http://") || post.hero_image.startsWith("https://")) {
    return post.hero_image;
  }
  return `${siteUrl}/api/posts/${post.id}/cover`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) {
    return { title: "Post não encontrado" };
  }

  const description = getDescription(post);
  const canonicalUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}`;
  const coverUrl = getCoverUrl(post);

  return {
    title: post.title,
    description,
    keywords: post.tags,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: canonicalUrl,
      siteName: "Nerteus",
      locale: "pt_BR",
      ...(coverUrl && { images: [{ url: coverUrl }] }),
      publishedTime: post.created_at,
      ...(post.updated_at && { modifiedTime: post.updated_at }),
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return notFound();
  const [related, products] = await Promise.all([getRelated(post), getPostProducts(post)]);
  const color = resolveColor(post.tags, post.weekday);
  const bodyHtml = stripHeroFromContent(post.content, post.hero_image);

  return (
    <div className={`space-y-8 sm:space-y-10 accent-${color.key} min-w-0`}>
      <PostToolbar />
      <article className="space-y-5 sm:space-y-6 min-w-0">
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
        <div
          className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-a:text-primary dark:prose-invert rich-content"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
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

      <div className="pt-2 pb-6">
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
