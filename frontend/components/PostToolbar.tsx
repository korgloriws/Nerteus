"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function PostToolbar() {
  return (
    <div className="notranslate flex items-center justify-end gap-3 flex-wrap" translate="no">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  );
}
