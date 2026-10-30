import Image from "next/image";

export type AffiliateProduct = {
  id: number;
  name: string;
  affiliate_url: string;
  price?: string | null;
  size?: string | null;
  color?: string | null;
  image?: string | null;
  description?: string | null;
  coupon?: string | null;
  validity_days?: number;
  expires_at?: string | null;
  post_id?: number | null;
  status?: string;
};

type Props = {
  product: AffiliateProduct;
};

export function ProductCard({ product }: Props) {
  const meta = [product.color, product.size].filter(Boolean).join(" · ");

  return (
    <a
      href={product.affiliate_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="media-frame media-frame--square relative">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="media-img p-2 transition duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/40 via-orange-600/30 to-card" />
        )}
        {product.coupon ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-600/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Cupom {product.coupon}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4 min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground break-words">{product.name}</h3>
        {product.price ? <p className="text-base sm:text-lg font-bold text-amber-500">{product.price}</p> : null}
        {meta ? <p className="text-[11px] uppercase tracking-wide text-muted">{meta}</p> : null}
        {product.description ? (
          <p className="line-clamp-2 text-xs text-muted break-words">{product.description}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-primary">
          Ver na loja →
        </span>
      </div>
    </a>
  );
}
