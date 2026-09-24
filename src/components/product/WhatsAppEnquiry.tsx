"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, InfoIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { buildProductEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppEnquiry({
  businessName,
  whatsappNumber,
  productName,
  sku,
  displayPrice,
  productUrl,
  showQuantity,
  disabledReason,
}: {
  businessName: string;
  whatsappNumber: string | null;
  productName: string;
  sku: string;
  displayPrice: string;
  productUrl: string;
  showQuantity: boolean;
  disabledReason?: string | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const qtyId = useId();

  const href = useMemo(
    () =>
      buildWhatsAppUrl(
        whatsappNumber,
        buildProductEnquiryMessage({ businessName, productName, sku, displayPrice, quantity, productUrl, customerName: name, customerMessage: note }),
      ),
    [whatsappNumber, businessName, productName, sku, displayPrice, quantity, productUrl, name, note],
  );

  if (!href) {
    return (
      <div className="rounded-sm border border-gold-300 bg-gold-100 p-4 text-sm text-gold-700" role="status">
        <p className="font-semibold">WhatsApp enquiries are being set up.</p>
        <p className="mt-1">Please use the enquiry form below or contact us directly. Site administrator: add the WhatsApp number in Admin → Settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showQuantity && (
        <div className="flex items-center gap-4">
          <label htmlFor={qtyId} className="text-xs font-semibold tracking-[0.16em] text-ink uppercase">
            Quantity
          </label>
          <div className="inline-flex items-center border border-stone bg-white">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center hover:bg-cream disabled:opacity-40" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
              <MinusIcon size={16} />
              <span className="sr-only">Decrease quantity</span>
            </button>
            <input
              id={qtyId}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                setQuantity(Number.isFinite(n) ? Math.min(20, Math.max(1, n)) : 1);
              }}
              className="h-11 w-12 border-x border-stone text-center text-sm [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center hover:bg-cream disabled:opacity-40" onClick={() => setQuantity((q) => Math.min(20, q + 1))} disabled={quantity >= 20}>
              <PlusIcon size={16} />
              <span className="sr-only">Increase quantity</span>
            </button>
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          aria-expanded={showExtras}
          aria-controls="wa-extras"
          className="inline-flex items-center gap-1 text-sm text-emerald-800 underline-offset-4 hover:underline"
        >
          Add your name or a note (optional)
          <ChevronDown size={16} className={showExtras ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
        <div id="wa-extras" hidden={!showExtras} className="mt-3 space-y-3">
          <div>
            <label htmlFor="wa-name" className="field-label">Your name</label>
            <input id="wa-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className="field-input" />
          </div>
          <div>
            <label htmlFor="wa-note" className="field-label">Note</label>
            <textarea id="wa-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className="field-input" placeholder="e.g. ring size, occasion, delivery city" />
          </div>
        </div>
      </div>

      {disabledReason && <p className="text-sm text-ruby-700">{disabledReason}</p>}

      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full !py-4 text-[0.8rem]">
        <WhatsAppIcon size={22} /> Enquire on WhatsApp
        <span className="sr-only">(opens WhatsApp in a new tab)</span>
      </a>
      <p className="flex gap-2 text-xs leading-relaxed text-muted">
        <InfoIcon size={16} className="mt-0.5 shrink-0" />
        <span>
          Opens WhatsApp with a pre-filled message that you can review before sending. Opening WhatsApp does not place an order —
          availability, final price, shipping and payment are confirmed with you directly.
        </span>
      </p>
    </div>
  );
}
