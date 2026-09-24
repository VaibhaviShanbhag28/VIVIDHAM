"use client";

import { useActionState, useState } from "react";
import { saveContentPageAction, type ContentState } from "@/app/admin/actions/settings";
import { RichText } from "@/components/content/RichText";
import { Notice } from "@/components/ui/Notice";

export function ContentPageForm({ slug, initial }: { slug: string; initial: { title: string; summary: string; body: string; isApproved: boolean } }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveContentPageAction, {});
  const [body, setBody] = useState(initial.body);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const e = state.errors ?? {};
  const hasPlaceholders = /\[Client (to|and legal)/.test(body);

  return (
    <form action={action} className="space-y-5">
      {state.ok && <Notice tone="success">Page saved.</Notice>}
      {Object.keys(e).length > 0 && <Notice tone="error">Please check the highlighted fields.</Notice>}
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="field-label">Title</label>
          <input id="title" name="title" required maxLength={120} defaultValue={initial.title} className="field-input" />
          {e.title && <p className="field-error">{e.title}</p>}
        </div>
        <div>
          <label htmlFor="summary" className="field-label">Summary</label>
          <input id="summary" name="summary" maxLength={300} defaultValue={initial.summary} className="field-input" />
          {e.summary && <p className="field-error">{e.summary}</p>}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="body" className="field-label !mb-0">Content</label>
          <div role="tablist" aria-label="Editor mode" className="flex gap-1 text-xs">
            <button type="button" role="tab" aria-selected={tab === "edit"} onClick={() => setTab("edit")} className={tab === "edit" ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}>Write</button>
            <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={tab === "preview" ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}>Preview</button>
          </div>
        </div>
        <textarea id="body" name="body" rows={22} maxLength={30000} value={body} onChange={(ev) => setBody(ev.target.value)} hidden={tab !== "edit"} className="field-input font-mono text-sm" aria-describedby="body-hint" />
        {tab === "preview" && (
          <div className="rounded-sm border border-sand bg-white p-6">
            <RichText source={body} />
          </div>
        )}
        <p id="body-hint" className="field-hint">
          Formatting: <code>## Heading</code>, <code>### Subheading</code>, <code>- list item</code>, <code>**bold**</code>, <code>[link text](/contact)</code>. Leave a blank line between paragraphs.
        </p>
        {e.body && <p className="field-error">{e.body}</p>}
      </div>
      {hasPlaceholders && <Notice tone="warning">This page still contains “[Client to …]” placeholders. Replace them before approving.</Notice>}
      <label className="flex items-start gap-3 rounded-sm border border-sand bg-cream/50 p-4 text-sm">
        <input type="checkbox" name="isApproved" defaultChecked={initial.isApproved} className="mt-0.5 h-5 w-5 accent-emerald-800" />
        <span>
          <strong className="text-ink">Approved by the business</strong>
          <span className="block text-muted">When checked, the “awaiting approval” notice is removed and the page can be indexed by search engines.</span>
        </span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
    </form>
  );
}
