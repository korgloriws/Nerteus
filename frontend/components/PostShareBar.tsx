"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpOnSquareIcon,
  CheckIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

type Props = {
  title: string;
  summary?: string | null;
  slug: string;
};

function buildShareUrl(slug: string) {
  const path = `/posts/${encodeURIComponent(slug)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.99.58 3.84 1.6 5.42L2 22l4.9-1.61a10 10 0 0 0 5.14 1.4h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.5 13.9c-.23.64-1.33 1.18-1.86 1.25-.47.07-1.07.1-1.73-.11-.4-.12-.91-.28-1.57-.55-2.76-1.19-4.56-3.98-4.7-4.16-.13-.18-1.1-1.46-1.1-2.79 0-1.32.69-1.97.94-2.24.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.46.23.54.77 1.87.84 2 .07.13.11.29.02.46-.1.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.13-.28.27-.12.53.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.27.13.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.58.75 1.85.88.27.14.45.2.52.31.07.11.07.64-.16 1.28z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M18.9 2H21l-6.52 7.45L22 22h-6.1l-4.77-6.23L5.7 22H3.6l6.98-7.98L2 2h6.25l4.3 5.7L18.9 2zm-2.14 18h1.67L7.33 3.9H5.54L16.76 20z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M14 9h3V6h-3c-1.9 0-3.5 1.5-3.5 3.4V12H8v3h2.5v7h3v-7H16l.5-3H13.5v-1.8c0-.7.3-1.2 1.2-1.2z" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M21.5 3.4 2.9 10.5c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3 1-.1.6.2L9.8 15.4l-.3 4.7c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M14.5 3c.4 2.4 1.9 4.1 4.2 4.4v2.7c-1.5-.1-2.9-.6-4.1-1.5v6.6c0 3.3-2.6 5.8-5.9 5.8S2.8 18.5 2.8 15.2 5.4 9.4 8.7 9.4c.4 0 .8 0 1.2.1v2.9c-.4-.2-.8-.2-1.2-.2-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3-1.4 3-3.1V3h2.8z" />
    </svg>
  );
}

type Action = {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

export function PostShareBar({ title, summary, slug }: Props) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [nativeBusy, setNativeBusy] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const shareText = useMemo(() => {
    const blurb = (summary || "").trim();
    return blurb ? `${title}\n\n${blurb}` : title;
  }, [title, summary]);

  async function copyLink(message?: string) {
    const url = buildShareUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setHint(message || "Link copiado.");
    window.setTimeout(() => {
      setCopied(false);
      setHint(null);
    }, 2200);
  }

  async function nativeShare() {
    const url = buildShareUrl(slug);
    if (!navigator.share) {
      await copyLink();
      return;
    }
    setNativeBusy(true);
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      // cancelado
    } finally {
      setNativeBusy(false);
    }
  }

  function openShare(kind: "whatsapp" | "x" | "facebook" | "telegram") {
    const url = encodeURIComponent(buildShareUrl(slug));
    const text = encodeURIComponent(shareText);
    const href =
      kind === "whatsapp"
        ? `https://wa.me/?text=${text}%0A%0A${url}`
        : kind === "x"
          ? `https://twitter.com/intent/tweet?text=${text}&url=${url}`
          : kind === "facebook"
            ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
            : `https://t.me/share/url?url=${url}&text=${text}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function shareToApp(app: "instagram" | "tiktok") {
    await copyLink(
      app === "instagram"
        ? "Link copiado. Cole no Instagram (Stories, Direct ou bio)."
        : "Link copiado. Cole no TikTok (mensagem ou bio)."
    );
    window.setTimeout(() => {
      window.open(app === "instagram" ? "https://www.instagram.com/" : "https://www.tiktok.com/", "_blank", "noopener,noreferrer");
    }, 250);
  }

  const actions: Action[] = [
    ...(canNativeShare
      ? [
          {
            key: "native",
            label: "Enviar",
            icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
            onClick: () => {
              void nativeShare();
            },
          },
        ]
      : []),
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <IconWhatsApp />,
      onClick: () => openShare("whatsapp"),
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: <IconInstagram />,
      onClick: () => {
        void shareToApp("instagram");
      },
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: <IconTikTok />,
      onClick: () => {
        void shareToApp("tiktok");
      },
    },
    {
      key: "x",
      label: "X",
      icon: <IconX />,
      onClick: () => openShare("x"),
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: <IconFacebook />,
      onClick: () => openShare("facebook"),
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: <IconTelegram />,
      onClick: () => openShare("telegram"),
    },
    {
      key: "copy",
      label: copied ? "Copiado" : "Copiar link",
      icon: copied ? <CheckIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />,
      onClick: () => {
        void copyLink("Link copiado para a área de transferência.");
      },
    },
  ];

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 sm:p-5" aria-label="Compartilhar este post">
      <div>
        <h2 className="text-base font-bold text-foreground sm:text-lg">Compartilhar este post</h2>
        <p className="mt-1 text-sm text-muted">
          Envie o link com título, resumo e imagem da capa para quem for receber.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={action.key === "native" && nativeBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-border/40"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </section>
  );
}
