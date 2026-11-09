"use client";

import { useEffect, useRef, useState } from "react";
import { getMonetizationConfig, readConsent, type ConsentState } from "../lib/monetization";

type Props = {
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  /** Rótulo interno; não aparece como anúncio falso. */
  label?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Espaço de anúncio AdSense.
 * Só dispara o anúncio quando o visitante aceitou cookies de ads e há slot configurado.
 */
export function AdSlot({ slot, format = "auto", className = "", label = "Anúncio" }: Props) {
  const { adsenseClient, adsEnabled } = getMonetizationConfig();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener("nerteus-consent", sync);
    return () => window.removeEventListener("nerteus-consent", sync);
  }, []);

  const ready = adsEnabled && !!consent?.ads && !!slot;

  useEffect(() => {
    if (!ready || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense pode falhar em localhost / sem aprovação
    }
  }, [ready]);

  if (!adsEnabled) {
    return (
      <div
        className={`rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-xs text-muted ${className}`}
        aria-hidden
      >
        Espaço reservado para anúncio (AdSense ainda não configurado)
      </div>
    );
  }

  if (!consent?.ads) {
    return (
      <div className={`rounded-xl border border-border bg-card/30 px-4 py-5 text-center text-xs text-muted ${className}`}>
        Anúncios desativados nas suas preferências de cookies.
      </div>
    );
  }

  if (!slot) {
    return null;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
