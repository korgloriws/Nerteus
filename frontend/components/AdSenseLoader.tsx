"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getMonetizationConfig, readConsent, type ConsentState } from "../lib/monetization";

/** Carrega o script do AdSense uma vez, só com consentimento de ads. */
export function AdSenseLoader() {
  const { adsenseClient, adsEnabled } = getMonetizationConfig();
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener("nerteus-consent", sync);
    return () => window.removeEventListener("nerteus-consent", sync);
  }, []);

  if (!adsEnabled || !consent?.ads) return null;

  return (
    <Script
      id="nerteus-adsense"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
      crossOrigin="anonymous"
    />
  );
}
