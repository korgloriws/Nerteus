import type { MetadataRoute } from "next";
import { getApiUrl } from "../lib/api";
import { getPublicSiteUrl } from "../lib/siteUrl";

type PostCard = {
  id: number;
  slug: string;
  created_at: string;
};

const siteUrl = getPublicSiteUrl();

const LEGAL_PATHS = ["/sobre", "/contato", "/privacidade", "/cookies", "/termos", "/etica", "/loja"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = getApiUrl();
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

  try {
    const res = await fetch(
      `${apiUrl}/posts?status_filter=published&limit=500&view=card`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const posts: PostCard[] = await res.json();
      for (const post of posts) {
        entries.push({
          url: `${siteUrl}/posts/${encodeURIComponent(post.slug)}`,
          lastModified: new Date(post.created_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // silently continue with static pages only
  }

  return entries;
}
