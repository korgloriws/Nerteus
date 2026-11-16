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
import { SocialIcons } from "./SocialLinks";
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

const PRIMARY_LINKS = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/loja", label: "Loja", icon: ShoppingBagIcon },
  { href: "/sobre", label: "Sobre", icon: null },
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
  const showWeekStrip = !onAdmin;
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
    const normalized = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const q = normalized(query.trim());
    if (q.length < 2) return [];
    return (catalog || [])
      .filter((post) => {
        return (
          normalized(post.title).includes(q) ||
          normalized(post.summary || "").includes(q) ||
          (post.tags || []).some((tag) => normalized(tag).includes(q))
        );
      })
      .slice(0, 12);
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
        {/* Linha 1: marca + navegação principal + ações */}
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-4">
          <BrandLogo compact />

          <nav
            className="ml-1 hidden items-center gap-0.5 md:flex"
            aria-label="Navegação principal"
          >
            {PRIMARY_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-card text-foreground"
                      : "text-muted hover:bg-card/70 hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Temas na mesma linha — cabeçalho de um andar */}
          {showWeekStrip && (
            <nav
              className="ml-2 hidden min-w-0 items-center gap-0.5 lg:flex"
              aria-label="Temas da semana"
            >
              <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
              {WEEKDAYS.map((day) => {
                const href = `/dia/${day.slug}`;
                const active = pathname === href;
                const isToday = today === day.key;
                return (
                  <Link
                    key={day.slug}
                    href={href}
                    title={day.theme}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-card text-foreground ring-1 ring-border"
                        : "text-muted hover:bg-card/70 hover:text-foreground"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: day.hex,
                        ...(isToday ? { boxShadow: `0 0 0 1px ${day.hex}` } : {}),
                      }}
                      aria-hidden
                    />
                    {day.theme}
                    {isToday ? <span className="sr-only">, hoje</span> : null}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-1.5 md:flex">
              <LanguageSwitcher />
              {onReadingPost && <ThemeToggle />}
            </div>

            <span className="mx-0.5 hidden h-5 w-px bg-border md:block" aria-hidden />

            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                setMenuOpen(false);
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition sm:h-10 sm:w-10 ${
                searchOpen
                  ? "border-indigo-400 bg-indigo-600 text-white"
                  : "border-indigo-500/40 bg-indigo-600/15 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-600/25 hover:text-white"
              }`}
              aria-label={searchOpen ? "Fechar busca" : "Buscar"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <XMarkIcon className="h-5 w-5" /> : <MagnifyingGlassIcon className="h-5 w-5" />}
            </button>

            <Link
              href="/admin"
              className={`hidden rounded-lg px-3 py-1.5 text-sm font-semibold transition md:inline-flex ${
                onAdmin
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-600/90 text-white hover:bg-indigo-500"
              }`}
            >
              Editor
            </Link>

            <span className="mx-0.5 hidden h-5 w-px bg-border lg:block" aria-hidden />

            <SocialIcons compact className="hidden lg:flex" branded />

            <button
              type="button"
              onClick={() => {
                setMenuOpen((open) => !open);
                setSearchOpen(false);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-card md:hidden"
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
          <div className="border-t border-border bg-background px-3 py-4 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-5">
              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Navegar</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRIMARY_LINKS.map((link) => {
                    const active = isActive(pathname, link.href);
                    const Icon = "icon" in link ? link.icon : null;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold ${
                          active
                            ? "border-foreground/20 bg-card text-foreground"
                            : "border-border bg-card/50 text-muted"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {Icon ? <Icon className="h-5 w-5 shrink-0" /> : null}
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold ${
                      onAdmin
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-indigo-500/40 bg-indigo-600/15 text-indigo-200"
                    }`}
                    aria-current={onAdmin ? "page" : undefined}
                  >
                    <PencilSquareIcon className="h-5 w-5 shrink-0" />
                    Editor
                  </Link>
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Redes</p>
                <SocialIcons />
              </section>

              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Preferências</p>
                <div className="flex flex-wrap items-center gap-3">
                  <LanguageSwitcher align="left" />
                  {onReadingPost && <ThemeToggle />}
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Legal</p>
                <div className="flex flex-wrap gap-2">
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
              </section>
            </div>
          </div>
        )}
      </header>

      {/* Dock mobile: Início + temas (não mistura com o topo) */}
      <nav
        className="fixed inset-x-3 z-40 lg:hidden"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-label="Início e temas da semana"
      >
        <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-6 px-1.5 py-2">
            <Link
              href="/"
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-[11px] font-semibold leading-none ${
                pathname === "/" ? "bg-background text-foreground" : "text-muted"
              }`}
              aria-current={pathname === "/" ? "page" : undefined}
              aria-label="Início"
            >
              <HomeIcon className="h-4 w-4" />
              Início
            </Link>
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
