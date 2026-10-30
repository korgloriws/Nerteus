"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function ThemeProviderClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPostPage = pathname?.startsWith("/posts");
  const isAdminPage = pathname?.startsWith("/admin");
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme={isPostPage || isAdminPage ? undefined : "dark"}
      storageKey="nerteus-theme"
    >
      {children}
    </ThemeProvider>
  );
}
