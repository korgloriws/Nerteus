"use client";

import { useEffect, useState } from "react";
import { CheckIcon, HandThumbDownIcon, HandThumbUpIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  getTasteEntry,
  MINHA_LISTA,
  setReaction,
  toggleList,
  type Reaction,
} from "../lib/taste";

type Props = {
  postId: number;
  slug: string;
};

export function PostTasteBar({ postId, slug }: Props) {
  const [reaction, setLocalReaction] = useState<Reaction | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => {
      const entry = getTasteEntry(postId);
      setLocalReaction(entry?.reaction ?? null);
      setSaved(!!entry?.lists.includes(MINHA_LISTA));
    };
    sync();
    window.addEventListener("nerteus-taste", sync);
    return () => window.removeEventListener("nerteus-taste", sync);
  }, [postId]);

  function press(next: Reaction) {
    setReaction(postId, slug, next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sua avaliação">
      <button
        type="button"
        aria-pressed={reaction === "like"}
        onClick={() => press("like")}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
          reaction === "like"
            ? "border-white bg-white text-black"
            : "border-border bg-card text-foreground hover:bg-border/50"
        }`}
      >
        <HandThumbUpIcon className="h-4 w-4" />
        Gostei
      </button>
      <button
        type="button"
        aria-pressed={reaction === "dislike"}
        onClick={() => press("dislike")}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
          reaction === "dislike"
            ? "border-white bg-white text-black"
            : "border-border bg-card text-foreground hover:bg-border/50"
        }`}
      >
        <HandThumbDownIcon className="h-4 w-4" />
        Não gostei
      </button>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => toggleList(postId, slug)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
          saved
            ? "border-white bg-white text-black"
            : "border-border bg-card text-foreground hover:bg-border/50"
        }`}
      >
        {saved ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        {saved ? "Na minha lista" : "Minha lista"}
      </button>
    </div>
  );
}
