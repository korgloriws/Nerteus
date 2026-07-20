import Link from "next/link";
import { API_URL } from "../../lib/api";
import { ProductCard, type AffiliateProduct } from "../../components/ProductCard";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<AffiliateProduct[]> {
  try {
    const res = await fetch(`${API_URL}/products?status_filter=active&limit=60`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LojaPage() {
  const products = await getProducts();

  return (
    <main className="space-y-8 text-foreground">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Afiliados</p>
          <h1 className="text-3xl md:text-4xl font-bold">Loja</h1>
          <p className="text-sm text-muted mt-1">
            Produtos selecionados. Ao clicar, você vai para o Mercado Livre e parceiros.
          </p>
        </div>
        <Link href="/" className="text-sm text-primary hover:opacity-80 whitespace-nowrap">
          ← Voltar
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted">
          Nenhum produto ativo no momento. Volte em breve.
        </div>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
