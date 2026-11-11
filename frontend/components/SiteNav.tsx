"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bars3Icon,
  HomeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { getApiUrl } from "../lib/api";
import { WEEKDAYS } from "../lib/weekdays";
import { LEGAL_LINKS } from "../lib/monetization";

type SearchPost = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  tags?: string[];
  cover_url?: string | null;
};

const LINKS = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/loja", label: "Loja", icon: ShoppingBagIcon },
  { href: "/admin", label: "Editor", icon: PencilSquareIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const onAdmin = pathname.startsWith("/admin");
  const onPost = pathname.startsWith("/posts/");
  const onReadingPost = onPost && searchParams.get("ler") === "1";
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<SearchPost[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    setToday(keys[new Date().getDay()] || null);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen || catalog) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${getApiUrl()}/posts?limit=200&status_filter=published&view=card`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchPost[]) => {
        if (!cancelled) setCatalog(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchOpen, catalog]);

  const results = useMemo(() => {
    const normalized = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const q = normalized(query.trim());
    if (q.length < 2) return [];
    return (catalog || []).filter((post) => {
      return (
        normalized(post.title).includes(q) ||
        normalized(post.summary || "").includes(q) ||
        (post.tags || []).some((tag) => normalized(tag).includes(q))
      );
    }).slice(0, 12);
  }, [catalog, query]);

  function openPost(slug: string) {
    setSearchOpen(false);
    setQuery("");
    router.push(`/posts/${encodeURIComponent(slug)}`);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (results[0]) openPost(results[0].slug);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <BrandLogo compact />
          <nav className="ml-2 hidden min-w-0 items-center gap-1 md:flex" aria-label="Seções">
            {LINKS.filter((link) => link.href !== "/admin").map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                    active ? "bg-card text-foreground" : "text-muted hover:bg-card/70 hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            <span className="mx-1 hidden h-4 w-px shrink-0 bg-border lg:block" aria-hidden />
            {WEEKDAYS.map((day) => {
              const href = `/dia/${day.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={day.slug}
                  href={href}
                  title={day.theme}
                  className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold lg:inline-flex ${
                    active ? "bg-card text-foreground" : "text-muted hover:bg-card/70 hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: day.hex }} aria-hidden />
                  {day.theme}
                  {today === day.key ? <span className="sr-only">, hoje</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                setMenuOpen(false);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-card"
              aria-label={searchOpen ? "Fechar busca" : "Buscar"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <XMarkIcon className="h-5 w-5" /> : <MagnifyingGlassIcon className="h-5 w-5" />}
            </button>
            <div className="hidden items-center gap-2 md:flex">
              <LanguageSwitcher />
              {onReadingPost && <ThemeToggle />}
              <Link
                href="/sobre"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-card/70 hover:text-foreground"
              >
                Sobre
              </Link>
              <Link
                href="/admin"
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  onAdmin ? "bg-indigo-600 text-white" : "bg-indigo-600/90 text-white hover:bg-indigo-500"
                }`}
              >
                Editor
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen((open) => !open);
                setSearchOpen(false);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-card md:hidden"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="border-t border-border bg-background">
            <form onSubmit={onSearch} className="mx-auto max-w-6xl px-3 py-3 sm:px-4">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, tag ou tema..."
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-base text-foreground outline-none placeholder:text-muted"
              />
            </form>
            <div className="mx-auto max-h-[min(60vh,420px)] max-w-6xl overflow-y-auto px-3 pb-3 sm:px-4">
              {loading && <p className="px-2 py-3 text-sm text-muted">Buscando...</p>}
              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted">Nenhum resultado</p>
              )}
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openPost(item.slug)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-border/40"
                >
                  <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-border/40">
                    {item.cover_url ? (
                      <Image src={item.cover_url} alt="" fill className="object-cover" sizes="96px" unoptimized />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                    <span className="block truncate text-xs text-muted">{item.summary || "Sem resumo."}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {menuOpen && (
          <div className="border-t border-border bg-background px-3 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-3">
              <div className="grid grid-cols-3 gap-2" aria-label="Navegação">
                {LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  const Icon = link.icon;
                  const isEditor = link.href === "/admin";
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold ${
                        isEditor
                          ? active
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-indigo-500/40 bg-indigo-600/20 text-indigo-200"
                          : active
                            ? "border-foreground/20 bg-card text-foreground"
                            : "border-border bg-card/60 text-muted"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher />
                {onReadingPost && <ThemeToggle />}
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Informações do site">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <nav
        className="fixed inset-x-3 z-40 lg:hidden"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-label="Faixas da semana"
      >
        <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-5 px-1.5 py-2" aria-label="Faixas">
            {WEEKDAYS.map((day) => {
              const href = `/dia/${day.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={day.slug}
                  href={href}
                  className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-[11px] font-semibold leading-none ${
                    active ? "bg-background text-foreground" : "text-muted"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: day.hex }} aria-hidden />
                  {day.theme}
                  {today === day.key ? <span className="sr-only">, hoje</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
