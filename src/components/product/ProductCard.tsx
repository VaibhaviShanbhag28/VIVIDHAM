import Image from "next/image";
import Link from "next/link";
import { GemIcon } from "@/components/icons";
import type { ProductCardDTO } from "@/lib/catalogue/queries";
import { AVAILABILITY_LABELS } from "@/lib/utils";
import { Price } from "./Price";

export function ProductImagePlaceholder({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cream to-sand text-gold-600">
      <GemIcon size={40} />
      {label && <span className="px-4 text-center text-xs tracking-widest text-muted uppercase">{label}</span>}
    </div>
  );
}

export function ProductCard({ product, priority = false }: { product: ProductCardDTO; priority?: boolean }) {
  const soldOut = product.availability === "SOLD_OUT";
  const img = product.primaryImage;
  const alt = img?.alt ?? product.name;
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {img ? (
          <>
            <Image
              src={img.url}
              alt={alt}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            />
            {product.secondaryImage && (
              <Image
                src={product.secondaryImage.url}
                alt=""
                fill
                sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <ProductImagePlaceholder label="Image coming soon" />
        )}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {product.isDemo && (
            <span className="bg-ink/80 px-2 py-1 text-[0.6rem] font-semibold tracking-[0.18em] text-ivory uppercase">Demo</span>
          )}
          {product.isNewArrival && !soldOut && (
            <span className="bg-ivory/95 px-2 py-1 text-[0.6rem] font-semibold tracking-[0.18em] text-emerald-900 uppercase">New</span>
          )}
          {soldOut && (
            <span className="bg-ivory/95 px-2 py-1 text-[0.6rem] font-semibold tracking-[0.18em] text-ruby-700 uppercase">Sold out</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        {product.jewelleryType && <p className="eyebrow !text-[0.62rem]">{product.jewelleryType}</p>}
        <h3 className="mt-1.5 font-serif text-xl leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} salePrice={product.salePrice} size="sm" className="mt-2" />
        {product.availability !== "IN_STOCK" && !soldOut && (
          <p className="mt-1 text-xs text-muted">{AVAILABILITY_LABELS[product.availability]}</p>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardDTO[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
