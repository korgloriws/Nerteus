import type { Metadata } from "next";
import { getApiUrl } from "../lib/api";
import { getPublicSiteUrl } from "../lib/siteUrl";
import { HomeContent, type PostCardData } from "./HomeContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: getPublicSiteUrl(),
  },
};

async function getPosts(): Promise<PostCardData[]> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(
      `${apiUrl}/posts?limit=500&status_filter=published&view=card`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return [];
    }
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const posts = await getPosts();
  return <HomeContent posts={posts} />;
}
