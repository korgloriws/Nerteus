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

function formatPrice(price?: string | null) {
  if (!price) return null;
  const trimmed = price.trim();
  if (!trimmed) return null;
  if (/[rR]\$/.test(trimmed) || /[^\d.,]/.test(trimmed.replace(/\s/g, ""))) return trimmed;
  return `R$ ${trimmed}`;
}

export function ProductCard({ product }: Props) {
  const meta = [product.color, product.size].filter(Boolean).join(" · ");
  const priceLabel = formatPrice(product.price);

  return (
    <a
      href={product.affiliate_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group relative flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:hover:-translate-y-1"
    >
      <div className="media-frame media-frame--square relative bg-border/20">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="media-img p-1.5 transition duration-200 group-hover:scale-[1.02] sm:p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 320px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/40 via-orange-600/30 to-card" />
        )}
        {product.coupon ? (
          <span className="absolute left-1.5 top-1.5 z-10 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-emerald-600/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:left-2 sm:top-2 sm:py-1">
            Cupom {product.coupon}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
        <h3 className="line-clamp-2 break-words text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {product.name}
        </h3>
        {priceLabel ? (
          <p className="break-words text-sm font-bold text-amber-500 sm:text-lg">{priceLabel}</p>
        ) : null}
        {meta ? (
          <p className="truncate text-[10px] uppercase tracking-wide text-muted sm:text-[11px]">{meta}</p>
        ) : null}
        {product.description ? (
          <p className="line-clamp-2 hidden break-words text-xs text-muted sm:block">{product.description}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-primary sm:text-xs">
          Ver na loja →
        </span>
      </div>
    </a>
  );
}
