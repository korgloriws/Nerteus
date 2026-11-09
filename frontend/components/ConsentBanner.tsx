"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readConsent, writeConsent, type ConsentState } from "../lib/monetization";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readConsent());
  }, []);

  function save(partial: Pick<ConsentState, "analytics" | "ads">) {
    writeConsent(partial);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 z-50 max-w-xl md:left-auto md:right-4" style={{ bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }}>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-bold text-foreground">Cookies e privacidade</p>
        <p className="mt-1 text-sm text-muted">
          Usamos cookies necessários para o site funcionar. Com sua permissão, também usamos
          Analytics e anúncios (AdSense). Veja a{" "}
          <Link href="/privacidade" className="text-primary hover:opacity-80">
            Política de Privacidade
          </Link>{" "}
          e a{" "}
          <Link href="/cookies" className="text-primary hover:opacity-80">
            Política de Cookies
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save({ analytics: true, ads: true })}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-black hover:bg-white/90"
          >
            Aceitar tudo
          </button>
          <button
            type="button"
            onClick={() => save({ analytics: true, ads: false })}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-border/40"
          >
            Só Analytics
          </button>
          <button
            type="button"
            onClick={() => save({ analytics: false, ads: false })}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-border/40"
          >
            Recusar opcionais
          </button>
        </div>
      </div>
    </div>
  );
}
