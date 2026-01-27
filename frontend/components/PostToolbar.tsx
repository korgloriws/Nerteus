"use client";

import { ThemeToggle } from "./ThemeToggle";

export function PostToolbar() {
  return (
    <div className="flex items-center justify-end gap-3">
      <ThemeToggle />
    </div>
  );
}
