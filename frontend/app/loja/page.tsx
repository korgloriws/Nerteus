import Link from "next/link";
import { API_URL } from "../../lib/api";
import { ProductCard, type AffiliateProduct } from "../../components/ProductCard";
import { BackButton } from "../../components/BackButton";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<AffiliateProduct[]> {
  try {
    const res = await fetch(`${API_URL}/products?status_filter=active&limit=60`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LojaPage() {
  const products = await getProducts();
  const hasProducts = products.length > 0;

  return (
    <main className="space-y-6 text-foreground sm:space-y-8 min-w-0">
      <div className="space-y-3">
        <BackButton label="Voltar" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Afiliados</p>
          <h1 className="fluid-h1 font-bold">Loja</h1>
          <p className="mt-1 text-sm text-muted">
            {hasProducts
              ? "Produtos selecionados. Ao clicar, você vai para o Mercado Livre e parceiros."
              : "Estamos preparando as primeiras ofertas."}
          </p>
        </div>
      </div>

      {hasProducts ? (
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-10 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(37,99,235,0.25), transparent 45%), radial-gradient(circle at 80% 30%, rgba(220,38,38,0.2), transparent 40%), radial-gradient(circle at 50% 80%, rgba(22,163,74,0.18), transparent 45%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-md space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted">Loja Nerteus</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Em breve</h2>
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              Ainda não há produtos publicados. Assim que uma oferta for liberada, ela aparece aqui
              automaticamente.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90"
            >
              Voltar ao início
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
