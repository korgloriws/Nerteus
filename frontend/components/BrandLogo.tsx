import Link from "next/link";

type Props = {
  as?: "h1" | "span";
};

export function BrandLogo({ as = "span" }: Props) {
  const wordmark = (
    <span className="fluid-h1 font-bold leading-none text-foreground">Nerteus</span>
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
