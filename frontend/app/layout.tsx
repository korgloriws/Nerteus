import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ThemeProviderClient } from "../components/ThemeProviderClient";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://31.97.167.75:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nerteus",
    template: "%s | Nerteus",
  },
  description: "Portal Nerteus de posts com vibe de streaming — curadoria dinâmica da cultura nerd",
  keywords: ["nerteus", "blog", "nerd", "cultura", "tecnologia", "games", "anime", "otaku"],
  authors: [{ name: "Nerteus" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Nerteus",
    title: "Nerteus",
    description: "Portal Nerteus de posts com vibe de streaming — curadoria dinâmica da cultura nerd",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerteus",
    description: "Portal Nerteus de posts com vibe de streaming — curadoria dinâmica da cultura nerd",
  },
  robots: {
    index: true,
    follow: true,
  },
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

