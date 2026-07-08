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
};

async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/posts`, { next: { revalidate: 30 } });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export default async function HomePage() {
  const posts = await getPosts();
  return <HomeContent posts={posts} />;
}

