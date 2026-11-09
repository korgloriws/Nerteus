import Script from "next/script";
import { DEFAULT_ADSENSE_CLIENT, getMonetizationConfig } from "../lib/monetization";

/**
 * Script do AdSense no HTML (para o Google detectar o publisher).
 * Anúncios de verdade só sobem no AdSlot depois do consentimento de ads;
 * o Consent Mode já manda ad_storage denied/granted.
 */
export function AdSenseLoader() {
  const { adsenseClient } = getMonetizationConfig();
  const client = adsenseClient || DEFAULT_ADSENSE_CLIENT;

  return (
    <Script
      id="nerteus-adsense"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      crossOrigin="anonymous"
    />
  );
}
