"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { ReactNode, Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isPostReadingPath(pathname: string | null, ler: string | null) {
  return Boolean(pathname?.startsWith("/posts/")) && ler === "1";
}

/** Garante dark fora da leitura (ficha/resumo e resto do site). */
function ForceDarkOutsideReading({ enabled }: { enabled: boolean }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!enabled) return;
    setTheme("dark");
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }, [enabled, setTheme]);

  return null;
}

/**
 * Tema claro e botão de tema: só na leitura do post (?ler=1).
 * Resumo Netflix, home, admin etc. ficam sempre dark.
 */
function ThemeProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isReadingPost = isPostReadingPath(pathname, searchParams.get("ler"));

  return (
    <ThemeProvider
      key={isReadingPost ? "theme-reading" : "theme-site"}
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme={isReadingPost ? undefined : "dark"}
      storageKey="nerteus-theme"
    >
      <ForceDarkOutsideReading enabled={!isReadingPost} />
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
