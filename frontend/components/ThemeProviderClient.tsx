"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Tema claro só no modo leitura do post (?ler=1).
 * Resumo/ficha do post, home, admin e o resto ficam sempre dark.
 */
function ThemeProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isReadingPost =
    Boolean(pathname?.startsWith("/posts/")) && searchParams.get("ler") === "1";

  return (
    <ThemeProvider
      key={isReadingPost ? "theme-reading" : "theme-site"}
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme={isReadingPost ? undefined : "dark"}
      storageKey="nerteus-theme"
    >
      {children}
    </ThemeProvider>
  );
}

export function ThemeProviderClient({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          storageKey="nerteus-theme"
        >
          {children}
        </ThemeProvider>
      }
    >
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </Suspense>
  );
}
