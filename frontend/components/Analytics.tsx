"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getMonetizationConfig, readConsent, type ConsentState } from "../lib/monetization";

/**
 * Sobe GA4 / GTM só depois do consentimento de analytics.
 * Sem IDs no .env, o componente não faz nada.
 */
export function Analytics() {
  const { gaId, gtmId, analyticsEnabled } = getMonetizationConfig();
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener("nerteus-consent", sync);
    return () => window.removeEventListener("nerteus-consent", sync);
  }, []);

  if (!analyticsEnabled || !consent?.analytics) return null;

  return (
    <>
      {gtmId ? (
        <>
          <Script id="nerteus-gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
          <noscript>
            <iframe
              title="Google Tag Manager"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {gaId && !gtmId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="nerteus-ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}
    </>
  );
}
