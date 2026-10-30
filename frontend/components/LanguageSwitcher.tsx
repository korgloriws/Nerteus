"use client";

import { useCallback, useEffect, useState } from "react";

type Lang = "pt" | "en" | "es";

const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "pt", label: "Português", short: "PT" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: number;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

export function isPageTranslated() {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)googtrans=\/[^/]+\/(?!pt\b)[^;]+/.test(document.cookie);
}

function readCurrentLang(): Lang {
  if (typeof document === "undefined") return "pt";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  const code = match?.[1];
  if (code === "en" || code === "es") return code;
  return "pt";
}

function clearGoogTransCookies() {
  const host = window.location.hostname;
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;${expires};path=/`;
  document.cookie = `googtrans=;${expires};path=/;domain=${host}`;
  document.cookie = `googtrans=;${expires};path=/;domain=.${host}`;
}

/**
 * Sempre via cookie + reload.
 * Trocar idioma "ao vivo" (select.change) quebra o DOM do React
 * porque o Google Translate envolve textos em <font>.
 */
function applyGoogleLang(lang: Lang) {
  if (lang === "pt") {
    clearGoogTransCookies();
  } else {
    clearGoogTransCookies();
    document.cookie = `googtrans=/pt/${lang};path=/`;
  }
  window.location.reload();
}

export function LanguageSwitcher() {
  const [active, setActive] = useState<Lang>("pt");

  useEffect(() => {
    setActive(readCurrentLang());

    const mountId = "google_translate_element";
    if (!document.getElementById(mountId)) {
      const mount = document.createElement("div");
      mount.id = mountId;
      mount.className = "notranslate";
      mount.setAttribute("translate", "no");
      mount.setAttribute("aria-hidden", "true");
      mount.style.display = "none";
      document.body.appendChild(mount);
    }

    window.googleTranslateElementInit = () => {
      try {
        // eslint-disable-next-line no-new
        new window.google!.translate.TranslateElement(
          {
            pageLanguage: "pt",
            includedLanguages: "en,es,pt",
            autoDisplay: false,
          },
          mountId
        );
      } catch {
        // cookie + reload já aplica o idioma
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-nerteus-google-translate="1"]'
    );
    if (existing) {
      if (window.google?.translate) {
        window.googleTranslateElementInit();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.dataset.nerteusGoogleTranslate = "1";
    document.body.appendChild(script);
  }, []);

  const onSelect = useCallback((lang: Lang) => {
    if (lang === active) return;
    setActive(lang);
    applyGoogleLang(lang);
  }, [active]);

  return (
    <div
      className="notranslate inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur"
      translate="no"
      role="group"
      aria-label="Idioma da página"
    >
      {LANGS.map((lang) => {
        const isActive = active === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            title={lang.label}
            aria-pressed={isActive}
            onClick={() => onSelect(lang.code)}
            className={`min-w-[2.5rem] rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
              isActive
                ? "bg-indigo-600 text-white shadow"
                : "text-muted hover:bg-border/50 hover:text-foreground"
            }`}
          >
            {lang.short}
          </button>
        );
      })}
    </div>
  );
}
