"use client";

import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function PostToolbar() {
  return (
    <div className="notranslate sticky top-0 z-30 -mx-3 mb-2 flex items-center justify-between gap-3 bg-background/90 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4" translate="no">
      <BrandLogo />
      <div className="flex items-center gap-3 flex-wrap justify-end">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  );
}
