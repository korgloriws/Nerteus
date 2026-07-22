import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ThemeProviderClient } from "../components/ThemeProviderClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nerteus",
  description: "Portal Nerteus de posts com vibe de streaming",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground min-h-screen transition-colors">
        <ThemeProviderClient>
          <div className="app-shell max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
            {children}
          </div>
        </ThemeProviderClient>
      </body>
    </html>
  );
}

