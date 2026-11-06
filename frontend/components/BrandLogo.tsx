import Link from "next/link";
import { Archivo } from "next/font/google";

const wordmarkFont = Archivo({
  subsets: ["latin"],
  display: "swap",
});

type Props = {
  as?: "h1" | "span";
  compact?: boolean;
};

export function BrandLogo({ as = "span", compact = false }: Props) {
  const wordmark = (
    <span
      className={`${wordmarkFont.className} nf-wordmark ${
        compact ? "text-[1.65rem] sm:text-[1.9rem]" : "text-[2rem] sm:text-[2.35rem]"
      }`}
    >
      Nerteus
    </span>
  );

  const link = (
    <Link
      href="/"
      aria-label="Nerteus — voltar para a tela inicial"
      className="notranslate inline-block transition hover:opacity-80"
      translate="no"
    >
      {wordmark}
    </Link>
  );

  if (as === "h1") {
    return <h1 className="m-0">{link}</h1>;
  }

  return link;
}
