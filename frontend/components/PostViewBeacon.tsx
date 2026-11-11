"use client";

import { useEffect } from "react";
import { getApiUrl } from "../lib/api";

const SESSION_PREFIX = "nerteus.viewed.v1:";

/**
 * Registra 1 view por post por aba/sessão — alimenta Mais vistos / Top 10.
 * Não usa o GET do post (esse era cacheado e as listas não mudavam).
 */
export function PostViewBeacon({ postId, slug }: { postId: number; slug: string }) {
  useEffect(() => {
    if (!postId || !slug) return;
    const key = `${SESSION_PREFIX}${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sem sessionStorage: ainda tenta contar
    }

    const controller = new AbortController();
    fetch(`${getApiUrl()}/posts/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      signal: controller.signal,
    }).catch(() => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    return () => controller.abort();
  }, [postId, slug]);

  return null;
}
