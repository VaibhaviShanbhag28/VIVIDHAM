"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { ImageDTO } from "@/lib/catalogue/queries";
import { cn } from "@/lib/utils";
import { ProductImagePlaceholder } from "./ProductCard";

export function ProductGallery({ images, name, isDemo }: { images: ImageDTO[]; name: string; isDemo: boolean }) {
  const [index, setIndex] = useState(0);
  if (!images.length) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        <ProductImagePlaceholder label="Photographs coming soon" />
      </div>
    );
  }
  const current = images[Math.min(index, images.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row" aria-roledescription="carousel" aria-label={`${name} photographs`}>
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" aria-label="Choose image">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block aspect-[4/5] w-16 overflow-hidden border transition md:w-20",
                  i === index ? "border-emerald-900" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        className="group relative aspect-[4/5] flex-1 overflow-hidden bg-cream"
        tabIndex={images.length > 1 ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        aria-label={images.length > 1 ? "Use left and right arrow keys to change image" : undefined}
      >
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="animate-fade-in object-cover"
        />
        {isDemo && (
          <span className="absolute top-4 left-4 bg-ink/80 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.18em] text-ivory uppercase">
            Demo content
          </span>
        )}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-soft transition hover:bg-ivory md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
              <ChevronLeft />
              <span className="sr-only">Previous image</span>
            </button>
            <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-soft transition hover:bg-ivory md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
              <ChevronRight />
              <span className="sr-only">Next image</span>
            </button>
            <p className="absolute right-4 bottom-4 bg-ivory/90 px-2 py-0.5 text-xs text-ink" aria-live="polite">
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
