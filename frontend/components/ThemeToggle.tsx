"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { isPageTranslated } from "./LanguageSwitcher";
import { themeLabels, useUiLang } from "../lib/uiLocale";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const lang = useUiLang();
  const t = themeLabels(lang);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    // Google Translate altera o DOM; re-render do React (tema) quebra com insertBefore.
    if (isPageTranslated()) {
      window.setTimeout(() => window.location.reload(), 40);
    }
  }

  return (
    <button
      type="button"
      aria-label={t.aria}
      translate="no"
      onClick={toggleTheme}
      className="notranslate flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-primary"
    >
      {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      {isDark ? t.light : t.dark}
    </button>
  );
}
