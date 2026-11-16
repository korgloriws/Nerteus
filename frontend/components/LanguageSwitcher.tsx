"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type LangCode =
  | "pt"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "ko"
  | "zh-CN"
  | "ru"
  | "ar"
  | "hi";

const LANGS: { code: LangCode; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "br" },
  { code: "en", label: "English", flag: "us" },
  { code: "es", label: "Español", flag: "es" },
  { code: "fr", label: "Français", flag: "fr" },
  { code: "de", label: "Deutsch", flag: "de" },
  { code: "it", label: "Italiano", flag: "it" },
  { code: "ja", label: "日本語", flag: "jp" },
  { code: "ko", label: "한국어", flag: "kr" },
  { code: "zh-CN", label: "中文", flag: "cn" },
  { code: "ru", label: "Русский", flag: "ru" },
  { code: "ar", label: "العربية", flag: "sa" },
  { code: "hi", label: "हिन्दी", flag: "in" },
];

const LANG_CODES = LANGS.map((l) => l.code);
const INCLUDED_LANGUAGES = LANG_CODES.join(",");

function FlagImg({ code, className = "" }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt=""
      width={20}
      height={14}
      loading="lazy"
      decoding="async"
      className={`inline-block rounded-[2px] object-cover shadow-sm ${className}`}
    />
  );
}

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

function isLangCode(value: string): value is LangCode {
  return (LANG_CODES as string[]).includes(value);
}

function readCurrentLang(): LangCode {
  if (typeof document === "undefined") return "pt";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  const code = match?.[1];
  if (code && isLangCode(code)) return code;
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
function applyGoogleLang(lang: LangCode) {
  if (lang === "pt") {
    clearGoogTransCookies();
  } else {
    clearGoogTransCookies();
    document.cookie = `googtrans=/pt/${lang};path=/`;
  }
  window.location.reload();
}

type Props = {
  className?: string;
  /** Menu mobile: abre alinhado à esquerda */
  align?: "left" | "right";
};

export function LanguageSwitcher({ className = "", align = "right" }: Props) {
  const [active, setActive] = useState<LangCode>("pt");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

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
            includedLanguages: INCLUDED_LANGUAGES,
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

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onSelect = useCallback(
    (lang: LangCode) => {
      setOpen(false);
      if (lang === active) return;
      setActive(lang);
      applyGoogleLang(lang);
    },
    [active]
  );

  const current = LANGS.find((l) => l.code === active) || LANGS[0];

  return (
    <div
      ref={rootRef}
      className={`notranslate relative inline-flex ${className}`}
      translate="no"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Idioma: ${current.label}`}
        title="Idioma"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-sm text-foreground transition hover:bg-border/40 sm:h-10"
      >
        <FlagImg code={current.flag} className="h-3.5 w-5" />
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Escolher idioma"
          className={`absolute top-[calc(100%+0.4rem)] z-50 max-h-72 w-52 overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-xl ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {LANGS.map((lang) => {
            const selected = active === lang.code;
            return (
              <li key={lang.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => onSelect(lang.code)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "bg-indigo-600/20 text-foreground"
                      : "text-muted hover:bg-card hover:text-foreground"
                  }`}
                >
                  <FlagImg code={lang.flag} className="h-3.5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-medium">{lang.label}</span>
                  {selected ? <span className="text-[10px] text-indigo-300">●</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
