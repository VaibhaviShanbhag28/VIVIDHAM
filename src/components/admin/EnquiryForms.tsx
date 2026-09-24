"use client";

import { useActionState } from "react";
import { createManualEnquiryAction, updateEnquiryAction, type EnquiryAdminState } from "@/app/admin/actions/enquiries";
import { Notice } from "@/components/ui/Notice";
import { ENQUIRY_CHANNEL_LABELS, ENQUIRY_STATUS_LABELS } from "@/lib/utils";

export function EnquiryStatusForm({ id, status, adminNotes }: { id: string; status: string; adminNotes: string }) {
  const [state, action, pending] = useActionState<EnquiryAdminState, FormData>(updateEnquiryAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.ok && <Notice tone="success">Saved.</Notice>}
      {state.errors?._form && <Notice tone="error">{state.errors._form}</Notice>}
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="status" className="field-label">Status</label>
        <select id="status" name="status" defaultValue={status} className="field-input">
          {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="adminNotes" className="field-label">Internal notes</label>
        <textarea id="adminNotes" name="adminNotes" rows={6} maxLength={4000} defaultValue={adminNotes} className="field-input" aria-describedby="notes-hint" />
        <p id="notes-hint" className="field-hint">Only visible to admins.</p>
        {state.errors?.adminNotes && <p className="field-error">{state.errors.adminNotes}</p>}
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function ManualEnquiryForm({ products }: { products: { id: string; name: string; sku: string }[] }) {
  const [state, action, pending] = useActionState<EnquiryAdminState, FormData>(createManualEnquiryAction, {});
  const e = state.errors ?? {};
  const field = (name: string, label: string, input: React.ReactNode) => (
    <div>
      <label htmlFor={`m-${name}`} className="field-label">{label}</label>
      {input}
      {e[name] && <p className="field-error">{e[name]}</p>}
    </div>
  );
  return (
    <form action={action} className="space-y-5">
      {Object.keys(e).length > 0 && <Notice tone="error">Please check the highlighted fields.</Notice>}
      {field(
        "channel",
        "Received via",
        <select id="m-channel" name="channel" className="field-input" defaultValue="WHATSAPP_MANUAL">
          {Object.entries(ENQUIRY_CHANNEL_LABELS).filter(([v]) => v !== "WEBSITE_FORM").map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>,
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        {field("customerName", "Customer name", <input id="m-customerName" name="customerName" maxLength={120} className="field-input" />)}
        {field("phone", "Phone / WhatsApp", <input id="m-phone" name="phone" type="tel" maxLength={20} className="field-input" />)}
        {field("email", "Email", <input id="m-email" name="email" type="email" maxLength={200} className="field-input" />)}
      </div>
      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        {field(
          "productId",
          "Product (optional)",
          <select id="m-productId" name="productId" className="field-input" defaultValue="">
            <option value="">— General enquiry —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>,
        )}
        {field("quantity", "Quantity", <input id="m-quantity" name="quantity" type="number" min={1} max={999} className="field-input" />)}
      </div>
      {field("message", "Customer message", <textarea id="m-message" name="message" rows={4} maxLength={4000} className="field-input" />)}
      {field("adminNotes", "Internal notes", <textarea id="m-adminNotes" name="adminNotes" rows={3} maxLength={4000} className="field-input" />)}
      <p className="text-xs text-muted">Only record details the customer has shared with you, and only what you need to follow up.</p>
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Record enquiry"}</button>
    </form>
  );
}
