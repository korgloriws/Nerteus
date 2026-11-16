import { SOCIAL_LINKS, type SocialNetwork } from "../lib/social";

function IconInstagram({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function IconYouTube({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.6 12 4.6 12 4.6s-7.5 0-9.4.5A3 3 0 0 0 .5 7.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.8zM9.8 15.5v-7l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

function IconTikTok({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M14.5 3c.4 2.4 1.9 4.1 4.2 4.4v2.7c-1.5-.1-2.9-.6-4.1-1.5v6.6c0 3.3-2.6 5.8-5.9 5.8S2.8 18.5 2.8 15.2 5.4 9.4 8.7 9.4c.4 0 .8 0 1.2.1v2.9c-.4-.2-.8-.2-1.2-.2-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3-1.4 3-3.1V3h2.8z" />
    </svg>
  );
}

function SocialIcon({ id, className }: { id: SocialNetwork["id"]; className?: string }) {
  if (id === "youtube") return <IconYouTube className={className} />;
  if (id === "tiktok") return <IconTikTok className={className} />;
  return <IconInstagram className={className} />;
}

const BRAND_COLOR: Record<SocialNetwork["id"], string> = {
  instagram: "#E4405F",
  youtube: "#FF0000",
  tiktok: "#25F4EE",
};

type IconsProps = {
  className?: string;
  compact?: boolean;
  /** Cores oficiais de cada rede */
  branded?: boolean;
};

/** Ícones compactos para o cabeçalho / menu. */
export function SocialIcons({ className = "", compact = false, branded = true }: IconsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label="Redes sociais Nerteus">
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.id}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${item.label} Nerteus`}
          title={item.label}
          className={`inline-flex items-center justify-center rounded-full border transition hover:scale-105 hover:brightness-110 ${
            branded ? "border-transparent bg-transparent" : "border-border text-muted hover:border-foreground/25 hover:bg-card hover:text-foreground"
          } ${compact ? "h-9 w-9" : "h-10 w-10"}`}
          style={branded ? { color: BRAND_COLOR[item.id] } : undefined}
        >
          <SocialIcon id={item.id} className={compact ? "h-4 w-4" : "h-[1.05rem] w-[1.05rem]"} />
        </a>
      ))}
    </div>
  );
}

type CalloutProps = {
  tone?: "default" | "on-dark";
  className?: string;
};

/** Chamada padrão no início do post. */
export function SocialFollowCallout({ tone = "default", className = "" }: CalloutProps) {
  const onDark = tone === "on-dark";
  return (
    <aside
      className={`rounded-2xl border px-3.5 py-3 sm:px-4 sm:py-3.5 ${
        onDark
          ? "border-white/20 bg-black/35 text-white"
          : "border-border bg-card/70 text-foreground"
      } ${className}`}
      aria-label="Siga o Nerteus nas redes"
    >
      <p className={`text-sm font-semibold ${onDark ? "text-white" : "text-foreground"}`}>
        Nos siga nas redes sociais
      </p>
      <p className={`mt-0.5 text-xs ${onDark ? "text-white/70" : "text-muted"}`}>
        Conteúdo novo no Instagram, YouTube e TikTok.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
              onDark
                ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                : "border-border bg-background text-foreground hover:bg-border/50"
            }`}
          >
            <span style={{ color: onDark ? undefined : BRAND_COLOR[item.id] }} className={onDark ? "text-white" : ""}>
              <SocialIcon id={item.id} className="h-3.5 w-3.5" />
            </span>
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
