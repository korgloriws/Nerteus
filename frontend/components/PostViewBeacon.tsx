"use client";

import { useEffect } from "react";
import { getApiUrl } from "../lib/api";

const SESSION_PREFIX = "nerteus.viewed.v1:";
const SID_KEY = "nerteus.sid.v1";

function getSessionId() {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return undefined;
  }
}

function detectDevice(): "mobile" | "tablet" | "desktop" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "unknown";
}

type Props = {
  postId: number;
  slug: string;
  title?: string;
  weekday?: string | null;
  dayTheme?: string | null;
  surface: "intro" | "read";
};

/**
 * Registra evento no analytics + incrementa views do post (home).
 * 1x por post+surface por aba/sessão — só marca após sucesso.
 */
export function PostViewBeacon({ postId, slug, weekday, dayTheme, surface }: Props) {
  useEffect(() => {
    if (!postId || !slug) return;
    const key = `${SESSION_PREFIX}${postId}:${surface}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // segue sem gate
    }

    const body = JSON.stringify({
      slug,
      surface,
      device: detectDevice(),
      session_id: getSessionId(),
      weekday: weekday || null,
      day_theme: dayTheme || null,
    });

    // Fire-and-forget: não abortar no cleanup (Strict Mode cancelava o POST).
    void fetch(`${getApiUrl()}/analytics/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) return;
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // rede/offline — tenta de novo na próxima montagem
      });
  }, [postId, slug, weekday, dayTheme, surface]);

  return null;
}
