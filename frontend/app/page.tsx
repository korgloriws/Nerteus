import type { Metadata } from "next";
import { getApiUrl } from "../lib/api";
import { getPublicSiteUrl } from "../lib/siteUrl";
import { HomeContent, type HomeRanking, type PostCardData } from "./HomeContent";

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

async function getHomeRanking(): Promise<HomeRanking | null> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/analytics/ranking?limit=10`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      top_all_time: data.top_all_time || [],
      top_month: data.top_month || [],
    };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [posts, ranking] = await Promise.all([getPosts(), getHomeRanking()]);
  return <HomeContent posts={posts} ranking={ranking} />;
}
