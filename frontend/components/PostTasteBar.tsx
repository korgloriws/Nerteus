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
  tone?: "default" | "on-dark";
};

export function PostTasteBar({ postId, slug, tone = "default" }: Props) {
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

  const idle =
    tone === "on-dark"
      ? "border-white/30 bg-black/25 text-white hover:bg-black/40"
      : "border-border bg-card text-foreground hover:bg-border/50";
  const active = "border-white bg-white text-black";
  const btn =
    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm";

  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2" role="group" aria-label="Sua avaliação">
      <button
        type="button"
        aria-pressed={reaction === "like"}
        onClick={() => press("like")}
        className={`${btn} ${reaction === "like" ? active : idle}`}
      >
        <HandThumbUpIcon className="h-4 w-4 shrink-0" />
        Gostei
      </button>
      <button
        type="button"
        aria-pressed={reaction === "dislike"}
        onClick={() => press("dislike")}
        className={`${btn} ${reaction === "dislike" ? active : idle}`}
      >
        <HandThumbDownIcon className="h-4 w-4 shrink-0" />
        Não gostei
      </button>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => toggleList(postId, slug)}
        className={`${btn} ${saved ? active : idle}`}
      >
        {saved ? <CheckIcon className="h-4 w-4 shrink-0" /> : <PlusIcon className="h-4 w-4 shrink-0" />}
        {saved ? "Na minha lista" : "Minha lista"}
      </button>
    </div>
  );
}
