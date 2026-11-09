"use client";

import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  fallback?: string;
  tone?: "default" | "on-dark";
};

export function BackButton({ label = "Voltar", fallback = "/", tone = "default" }: Props) {
  const router = useRouter();
  const toneClass =
    tone === "on-dark"
      ? "border-white/30 bg-black/45 text-white hover:bg-black/60"
      : "border-border bg-card text-foreground hover:bg-border/50";

  return (
    <button
      type="button"
      onClick={() => {
        const sameSite = document.referrer.startsWith(window.location.origin);
        if (sameSite && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallback);
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${toneClass}`}
    >
      ← {label}
    </button>
  );
}
