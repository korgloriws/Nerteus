import { useEffect, useState } from "react";
import { HeroHighlight } from "./HeroHighlight";
import type { PostTileProps } from "./PostTile";

type Props = {
  posts: PostTileProps[];
  intervalMs?: number;
};

// Mantém a mesma aparência do HeroHighlight, apenas alternando automaticamente.
export function HeroCarousel({ posts, intervalMs = 8000 }: Props) {
  const [index, setIndex] = useState(0);
  const total = posts.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs]);

  if (!posts.length) return null;

  const current = posts[index];

  return (
    <div className="relative">
      <HeroHighlight
        title={current.title}
        slug={current.slug}
        summary={current.summary}
        hero_image={current.hero_image}
        tags={current.tags}
        weekday={current.weekday}
      />
    </div>
  );
}
