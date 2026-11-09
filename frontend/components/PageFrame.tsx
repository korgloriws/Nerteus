"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const home = pathname === "/";
  const postDetail = pathname.startsWith("/posts/");

  if (home || postDetail) {
    return <div className="w-full overflow-x-hidden pb-40 pt-14 lg:pb-8">{children}</div>;
  }

  return (
    <div className="app-shell mx-auto w-full max-w-6xl overflow-x-hidden px-3 pb-40 pt-16 sm:px-4 lg:pb-10">
      {children}
    </div>
  );
}
