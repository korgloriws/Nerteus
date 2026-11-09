import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { API_URL } from "../../../lib/api";
import type { PostTileProps } from "../../../components/PostTile";
import type { AffiliateProduct } from "../../../components/ProductCard";
import { PostExperience } from "../../../components/PostExperience";
import { stripHeroFromContent } from "../../../lib/stripHeroFromContent";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerteus.com";

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
  cover_url?: string | null;
};

async function getPost(slug: string): Promise<Post | null> {
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

function toTile(post: Post): PostTileProps {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    tags: post.tags,
    hero_image: post.hero_image || post.cover_url,
    weekday: post.weekday,
  };
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
      ...(coverUrl && {
        images: [
          {
            url: coverUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      }),
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

export default async function PostPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { ler?: string };
}) {
  const post = await getPost(params.slug);
  if (!post) return notFound();
  const [related, products] = await Promise.all([getRelated(post), getPostProducts(post)]);
  const bodyHtml = stripHeroFromContent(post.content, post.hero_image);
  const initialReading = searchParams?.ler === "1";

  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#141414]" />}>
      <PostExperience
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          tags: post.tags || [],
          hero_image: post.hero_image,
          created_at: post.created_at,
          weekday: post.weekday,
        }}
        bodyHtml={bodyHtml}
        related={related.map(toTile)}
        products={products}
        initialReading={initialReading}
      />
    </Suspense>
  );
}
