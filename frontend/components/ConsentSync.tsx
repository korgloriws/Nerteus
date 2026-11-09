"use client";

import { useEffect } from "react";
import { readConsent, type ConsentState } from "../lib/monetization";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // Mesmo formato do snippet oficial do Google (Arguments, não array).
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function pushConsentUpdate(consent: ConsentState | null) {
  if (typeof window === "undefined") return;

  const analytics = consent?.analytics ? "granted" : "denied";
  const ads = consent?.ads ? "granted" : "denied";

  gtag("consent", "update", {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

/** Atualiza o Consent Mode quando o banner grava a escolha do visitante. */
export function ConsentSync() {
  useEffect(() => {
    const sync = () => pushConsentUpdate(readConsent());
    sync();
    window.addEventListener("nerteus-consent", sync);
    return () => window.removeEventListener("nerteus-consent", sync);
  }, []);

  return null;
}
