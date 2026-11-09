import Link from "next/link";
import { BackButton } from "./BackButton";
import { LEGAL_LINKS } from "../lib/monetization";
import type { ReactNode } from "react";

type Props = {
  title: string;
  eyebrow?: string;
  updatedAt?: string;
  children: ReactNode;
};

export function LegalPage({ title, eyebrow = "Informações", updatedAt, children }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 text-foreground min-w-0">
      <BackButton label="Voltar" />
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
        <h1 className="fluid-h1 font-bold">{title}</h1>
        {updatedAt ? <p className="text-sm text-muted">Atualizado em {updatedAt}</p> : null}
      </header>
      <article className="legal-prose space-y-4 text-sm leading-relaxed text-muted sm:text-base [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:text-primary">
        {children}
      </article>
      <nav className="flex flex-wrap gap-2 border-t border-border pt-4" aria-label="Páginas institucionais">
        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-border/40"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
