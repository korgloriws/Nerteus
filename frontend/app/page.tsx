import { API_URL } from "../lib/api";
import { HomeContent } from "./HomeContent";

export const dynamic = "force-dynamic";

type Post = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  tags?: string[];
  hero_image?: string | null;
  created_at: string;
  views?: number;
  weekday?: string | null;
  day_theme?: string | null;
};

async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${API_URL}/posts?limit=100&status_filter=published`, {
      next: { revalidate: 30 },
    });
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
