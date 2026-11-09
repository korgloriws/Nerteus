import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { ThemeProviderClient } from "../components/ThemeProviderClient";
import { PageFrame } from "../components/PageFrame";
import { SiteNav } from "../components/SiteNav";
import { PwaRegister } from "../components/PwaRegister";
import { PwaSplash } from "../components/PwaSplash";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerteus.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nerteus",
    template: "%s | Nerteus",
  },
  description: "Portal Nerteus de posts com vibe de streaming — curadoria dinâmica da cultura nerd",
  keywords: ["nerteus", "blog", "nerd", "cultura", "tecnologia", "games", "anime", "otaku"],
  authors: [{ name: "Nerteus" }],
  applicationName: "Nerteus",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nerteus",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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

export const viewport: Viewport = {
  themeColor: "#0f1115",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen transition-colors">
        <ThemeProviderClient>
          <PwaSplash />
          <PwaRegister />
          <SiteNav />
          <PageFrame>{children}</PageFrame>
        </ThemeProviderClient>
      </body>
    </html>
  );
}

