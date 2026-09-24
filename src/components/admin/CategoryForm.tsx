"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { saveCategoryAction, type CategoryFormState } from "@/app/admin/actions/categories";
import { UploadIcon } from "@/components/icons";
import { Notice } from "@/components/ui/Notice";
import { uploadFile } from "./fields";

export interface CategoryValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  showInNav: boolean;
}

export function CategoryForm({ initial, onDone }: { initial: CategoryValues; onDone?: () => void }) {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(async (prev, fd) => {
    const res = await saveCategoryAction(prev, fd);
    if (res.ok) onDone?.();
    return res;
  }, {});
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const e = state.errors ?? {};
  const pfx = initial.id ?? "new";

  return (
    <form action={action} className="space-y-4" key={state.ok && !initial.id ? "reset" : pfx}>
      {state.ok && state.message && <Notice tone="success">{state.message}</Notice>}
      {e._form && <Notice tone="error">{e._form}</Notice>}
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${pfx}-name`} className="field-label">Name <span className="text-ruby-700" aria-hidden>*</span></label>
          <input id={`${pfx}-name`} name="name" required maxLength={80} defaultValue={initial.name} className="field-input" aria-invalid={e.name ? true : undefined} aria-describedby={e.name ? `${pfx}-name-err` : undefined} />
          {e.name && <p id={`${pfx}-name-err`} className="field-error">{e.name}</p>}
        </div>
        <div>
          <label htmlFor={`${pfx}-slug`} className="field-label">URL slug</label>
          <input id={`${pfx}-slug`} name="slug" maxLength={100} defaultValue={initial.slug} placeholder="generated from the name" className="field-input" aria-invalid={e.slug ? true : undefined} aria-describedby={e.slug ? `${pfx}-slug-err` : undefined} />
          {e.slug && <p id={`${pfx}-slug-err`} className="field-error">{e.slug}</p>}
        </div>
      </div>
      <div>
        <label htmlFor={`${pfx}-desc`} className="field-label">Description</label>
        <textarea id={`${pfx}-desc`} name="description" maxLength={500} rows={2} defaultValue={initial.description} className="field-input !min-h-16" />
        {e.description && <p className="field-error">{e.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {imageUrl && (
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-cream">
            <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
          </div>
        )}
        <label className="btn btn-ghost btn-sm cursor-pointer border border-sand">
          <UploadIcon size={16} /> {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={uploading}
            onChange={async (ev) => {
              const file = ev.target.files?.[0];
              if (!file) return;
              setUploadError(null);
              setUploading(true);
              try {
                setImageUrl((await uploadFile(file, "category")).url);
              } catch (err) {
                setUploadError(err instanceof Error ? err.message : "Upload failed");
              }
              setUploading(false);
            }}
          />
        </label>
        {imageUrl && (
          <button type="button" className="text-sm text-ruby-700 underline" onClick={() => setImageUrl("")}>Remove image</button>
        )}
      </div>
      {(uploadError || e.imageUrl) && <p className="field-error">{uploadError ?? e.imageUrl}</p>}
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="h-4 w-4 accent-emerald-800" /> Active (visible on the website)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="showInNav" defaultChecked={initial.showInNav} className="h-4 w-4 accent-emerald-800" /> Show in main navigation</label>
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending || uploading}>{pending ? "Saving…" : initial.id ? "Save changes" : "Create category"}</button>
    </form>
  );
}

export function CategoryEditToggle({ initial }: { initial: CategoryValues }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm !px-2" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Edit"}
      </button>
      {open && (
        <div className="mt-3 border-t border-sand pt-4">
          <CategoryForm initial={initial} onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
