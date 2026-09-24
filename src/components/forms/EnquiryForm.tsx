"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitEnquiryAction, type EnquiryFormState } from "@/app/actions/enquiry";
import { Notice } from "@/components/ui/Notice";

function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required ? <span className="text-ruby-700" aria-hidden>*</span> : <span className="font-normal text-subtle">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}

export function EnquiryForm({ productId, productName, compact = false }: { productId?: string; productName?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<EnquiryFormState, FormData>(submitEnquiryAction, { status: "idle" });
  const [startedAt, setStartedAt] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => setStartedAt(String(Date.now())), []);
  useEffect(() => {
    if (state.status !== "idle") summaryRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={summaryRef} tabIndex={-1} className="focus:outline-none">
        <Notice tone="success" title="Thank you — your enquiry has been sent.">
          {state.reference && (
            <p>
              Your reference number is <strong className="font-mono">{state.reference}</strong>. Please quote it if you contact us.
            </p>
          )}
          <p>We will reply using the contact details you provided. Sending an enquiry does not reserve or confirm an order.</p>
        </Notice>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const aria = (name: string) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `enq-${name}-error` : undefined,
  });

  return (
    <form action={action} noValidate className="space-y-4" aria-describedby="enq-summary">
      <div ref={summaryRef} tabIndex={-1} id="enq-summary" className="focus:outline-none">
        {state.status === "error" && <Notice tone="error">{state.message}</Notice>}
      </div>
      {productId && <input type="hidden" name="productId" value={productId} />}
      <input type="hidden" name="startedAt" value={startedAt} />
      {/* Honeypot — hidden from people and assistive technology */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="enq-website">Website</label>
        <input id="enq-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div className={compact ? "" : "sm:col-span-2"}>
          <Field id="enq-customerName" label="Your name" error={errors.customerName} required>
            <input id="enq-customerName" name="customerName" autoComplete="name" required maxLength={80} defaultValue={v.customerName} className="field-input" {...aria("customerName")} />
          </Field>
        </div>
        <Field id="enq-email" label="Email" error={errors.email} hint="Email or phone — at least one">
          <input id="enq-email" name="email" type="email" autoComplete="email" maxLength={200} defaultValue={v.email} className="field-input" {...aria("email")} />
        </Field>
        <Field id="enq-phone" label="Phone / WhatsApp" error={errors.phone}>
          <input id="enq-phone" name="phone" type="tel" autoComplete="tel" maxLength={20} defaultValue={v.phone} className="field-input" {...aria("phone")} />
        </Field>
      </div>
      {productId && (
        <Field id="enq-quantity" label="Quantity" error={errors.quantity}>
          <input id="enq-quantity" name="quantity" type="number" min={1} max={99} defaultValue={v.quantity || "1"} className="field-input !w-28" {...aria("quantity")} />
        </Field>
      )}
      <Field id="enq-message" label="Message" error={errors.message} required>
        <textarea
          id="enq-message"
          name="message"
          required
          maxLength={2000}
          rows={compact ? 4 : 5}
          defaultValue={v.message ?? (productName ? `I would like to know more about ${productName}.` : "")}
          className="field-input"
          {...aria("message")}
        />
      </Field>
      <div>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-emerald-800" aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "enq-consent-error" : undefined} />
          <span>
            I agree that my details may be used to respond to this enquiry, as described in the{" "}
            <Link href="/policies/privacy" className="text-emerald-800 underline underline-offset-4">privacy policy</Link>.
          </span>
        </label>
        {errors.consent && <p id="enq-consent-error" className="field-error">{errors.consent}</p>}
      </div>
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending || !startedAt}>
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
