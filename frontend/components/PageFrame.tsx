"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const home = pathname === "/";
  const postDetail = pathname.startsWith("/posts/");
  const admin = pathname.startsWith("/admin");
  // Header tem 1 linha; no desktop (lg+) entra a faixa "Temas" — exceto no admin.
  const topPad = admin ? "pt-14" : "pt-14 lg:pt-[5.75rem]";

  if (home || postDetail) {
    return <div className={`w-full overflow-x-hidden pb-40 lg:pb-8 ${topPad}`}>{children}</div>;
  }

  return (
    <div className={`app-shell mx-auto w-full max-w-6xl overflow-x-hidden px-3 pb-40 sm:px-4 lg:pb-10 ${admin ? "pt-16" : "pt-16 lg:pt-[6.25rem]"}`}>
      {children}
    </div>
  );
}
