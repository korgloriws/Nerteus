import Link from "next/link";
import { LEGAL_LINKS, getMonetizationConfig } from "../lib/monetization";

export function SiteFooter() {
  const { contactEmail } = getMonetizationConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background pb-28 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted">
          © {year} Nerteus ·{" "}
          <a className="hover:text-foreground" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
