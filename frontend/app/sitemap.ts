import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "../lib/siteUrl";

/** Sempre regenera no request — evita sitemap “congelado” sem posts no build Docker. */
export const revalidate = 0;

type PostCard = {
  id: number;
  slug: string;
  created_at: string;
};

const LEGAL_PATHS = ["/sobre", "/contato", "/privacidade", "/cookies", "/termos", "/etica", "/loja"];

function apiBases(): string[] {
  const configured = process.env.API_URL_INTERNAL?.replace(/\/$/, "");
  return [...new Set([configured, "http://127.0.0.1:8000", "http://localhost:8000"].filter(Boolean))] as string[];
}

async function fetchPublishedPosts(): Promise<PostCard[]> {
  for (const base of apiBases()) {
    try {
      const res = await fetch(`${base}/posts?status_filter=published&limit=500&view=card`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) return data as PostCard[];
    } catch {
      // tenta o próximo host
    }
  }
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...LEGAL_PATHS.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "/loja" ? 0.8 : 0.4,
    })),
  ];

  const posts = await fetchPublishedPosts();
  for (const post of posts) {
    if (!post?.slug) continue;
    entries.push({
      url: `${siteUrl}/posts/${encodeURIComponent(post.slug)}`,
      lastModified: new Date(post.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
