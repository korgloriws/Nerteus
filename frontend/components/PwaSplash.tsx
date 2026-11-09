"use client";

import { useEffect, useState } from "react";
import { Archivo } from "next/font/google";

const splashFont = Archivo({
  subsets: ["latin"],
  display: "swap",
});

const WORD = "Nerteus";
const STORAGE_KEY = "nerteus.splash.v1";

export function PwaSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // sem sessionStorage: mostra uma vez nesta visita
    }
    setVisible(true);
    const leaveAt = window.setTimeout(() => setLeaving(true), 2100);
    const hideAt = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }, 2700);
    return () => {
      window.clearTimeout(leaveAt);
      window.clearTimeout(hideAt);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`nf-splash ${leaving ? "nf-splash--out" : ""}`}
      role="presentation"
      aria-hidden
    >
      <div className={`nf-splash-mark ${splashFont.className}`}>
        {WORD.split("").map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="nf-splash-letter"
            style={{ animationDelay: `${180 + index * 70}ms` }}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="nf-splash-bar" aria-hidden />
    </div>
  );
}
