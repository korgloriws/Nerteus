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
    <div className="h-52 min-w-[260px] max-w-[320px] rounded-xl bg-border/40 animate-pulse flex flex-col overflow-hidden">
      <div className="h-28 bg-border/60" />
      <div className="p-4 space-y-2 flex-1">
        <div className="h-4 w-3/4 bg-border/80 rounded" />
        <div className="h-3 w-1/2 bg-border/60 rounded" />
        <div className="flex gap-2">
          <div className="h-3 w-10 bg-border/70 rounded-full" />
          <div className="h-3 w-10 bg-border/70 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RowSection({ title, posts, emptyHint, onQuickView, loadingSkeletonCount = 0 }: RowSectionProps) {
  const showSkeletons = !posts.length && loadingSkeletonCount > 0;
  if (!posts.length && !showSkeletons) {
    return null;
  }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="grid auto-cols-[260px] lg:auto-cols-[320px] grid-flow-col gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#1f2430] scrollbar-track-transparent">
        {showSkeletons
          ? Array.from({ length: loadingSkeletonCount }).map((_, idx) => <SkeletonTile key={idx} />)
          : posts.map((post) => (
              <PostTile key={post.id} {...post} onQuickView={onQuickView ? () => onQuickView(post) : undefined} />
            ))}
      </div>
      {posts.length === 0 && emptyHint ? (
        <p className="text-sm text-[#c1c5d0]">{emptyHint}</p>
      ) : null}
    </section>
  );
}

