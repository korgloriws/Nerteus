"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Esconde o rodapé na home para manter a faixa “infinita”. */
export function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  if (pathname === "/") return null;
  return children;
}
