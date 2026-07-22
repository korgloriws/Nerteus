import { PostTile, type PostTileProps } from "./PostTile";

type RowSectionProps = {
  title: string;
  posts: PostTileProps[];
  emptyHint?: string;
  onQuickView?: (post: PostTileProps) => void;
  loadingSkeletonCount?: number;
};

function SkeletonTile() {
  return (
    <div className="w-[72vw] max-w-[300px] shrink-0 rounded-xl bg-border/40 animate-pulse overflow-hidden">
      <div className="aspect-[16/10] bg-border/60" />
    </div>
  );
}

export function RowSection({ title, posts, emptyHint, onQuickView, loadingSkeletonCount = 0 }: RowSectionProps) {
  const showSkeletons = !posts.length && loadingSkeletonCount > 0;
  if (!posts.length && !showSkeletons) {
    return null;
  }
  return (
    <section className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="fluid-h2 font-semibold text-foreground break-words">{title}</h2>
      </div>
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#1f2430] scrollbar-track-transparent">
        {showSkeletons
          ? Array.from({ length: loadingSkeletonCount }).map((_, idx) => <SkeletonTile key={idx} />)
          : posts.map((post) => (
              <div key={post.id} className="w-[72vw] max-w-[300px] shrink-0 snap-start">
                <PostTile {...post} onQuickView={onQuickView ? () => onQuickView(post) : undefined} />
              </div>
            ))}
      </div>
      {posts.length === 0 && emptyHint ? (
        <p className="text-sm text-muted">{emptyHint}</p>
      ) : null}
    </section>
  );
}
