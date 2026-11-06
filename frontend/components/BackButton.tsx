"use client";

import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  fallback?: string;
};

export function BackButton({ label = "Voltar", fallback = "/" }: Props) {
  const router = useRouter();

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
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-border/50"
    >
      ← {label}
    </button>
  );
}
