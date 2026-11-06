"use client";

import { useEffect } from "react";
import {
  COMPLETE_MIN,
  CONTINUE_MIN,
  getReadingEntry,
  measureArticle,
  saveReadingEntry,
} from "../lib/readingProgress";

type Props = {
  postId: number;
  slug: string;
};

/**
 * Mede o scroll do artigo, grava o ponto de parada e, se a leitura
 * ainda não acabou, devolve a tela perto de onde a pessoa parou.
 */
export function ReadingProgressTracker({ postId, slug }: Props) {
  useEffect(() => {
    const article = document.querySelector<HTMLElement>("[data-reading-root]");
    if (!article) return;

    const saved = getReadingEntry(postId);
    const shouldResume =
      !!saved && saved.progress >= CONTINUE_MIN && saved.progress < COMPLETE_MIN && saved.resume > 0.02;
    const shouldRestart = !!saved && saved.progress >= COMPLETE_MIN;

    let userMoved = false;
    let dirty = false;
    let programmatic = false;
    let allowScrollAsIntent = false;
    let snapshot: { progress: number; resume: number } | null = null;
    let saveTimer = 0;

    const previousRestoration = "scrollRestoration" in history ? history.scrollRestoration : "auto";
    if ((shouldResume || shouldRestart) && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const jumpTo = (top: number) => {
      if (Math.abs(window.scrollY - top) < 24) return;
      programmatic = true;
      window.scrollTo({ top, behavior: "auto" });
      window.setTimeout(() => {
        programmatic = false;
      }, 90);
    };

    const restore = () => {
      if (userMoved) return;
      if (shouldRestart) {
        jumpTo(0);
        return;
      }
      if (!shouldResume || !saved) return;
      const { articleTop, height } = measureArticle(article);
      const target = Math.max(0, articleTop + saved.resume * height - 72);
      jumpTo(target);
    };

    restore();
    const raf = window.requestAnimationFrame(restore);
    const retries = [80, 200, 450, 900, 1600].map((ms) => window.setTimeout(restore, ms));

    const observer = new ResizeObserver(() => restore());
    observer.observe(article);
    const stopObserving = window.setTimeout(() => observer.disconnect(), 2500);

    const persist = (reading: { progress: number; resume: number } | null = snapshot) => {
      if (!reading) return;
      saveReadingEntry({
        id: postId,
        slug,
        progress: reading.progress,
        resume: reading.resume,
      });
    };

    const markIntent = () => {
      userMoved = true;
    };

    const onWheel = () => markIntent();
    const onTouch = () => markIntent();
    const onKey = (event: KeyboardEvent) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      if (!keys.includes(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      markIntent();
    };

    const onScroll = () => {
      if (programmatic) return;
      if (!userMoved && !allowScrollAsIntent) return;
      markIntent();
      dirty = true;
      snapshot = measureArticle(article);
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => persist(snapshot), 350);
    };

    const armTimer = window.setTimeout(() => {
      allowScrollAsIntent = true;
    }, 1800);

    const flush = () => {
      if (!dirty) return;
      window.clearTimeout(saveTimer);
      persist(snapshot);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(raf);
      retries.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(stopObserving);
      window.clearTimeout(saveTimer);
      window.clearTimeout(armTimer);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
      if ("scrollRestoration" in history) {
        history.scrollRestoration = previousRestoration;
      }
    };
  }, [postId, slug]);

  return null;
}
