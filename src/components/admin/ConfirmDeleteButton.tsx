"use client";

import { useRef } from "react";
import { TrashIcon } from "@/components/icons";

/** Delete button that requires confirmation in an accessible modal <dialog>. */
export function ConfirmDeleteButton({
  action,
  id,
  title,
  description,
  label = "Delete",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  title: string;
  description: string;
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm text-ruby-700" onClick={() => dialog.current?.showModal()}>
        <TrashIcon size={16} /> {label}
      </button>
      <dialog ref={dialog} aria-labelledby={`del-${id}-title`} className="m-auto w-[min(92vw,28rem)] rounded-sm border border-sand bg-white p-0 shadow-xl backdrop:bg-emerald-950/50">
        <form action={action} className="p-6">
          <input type="hidden" name="id" value={id} />
          <h2 id={`del-${id}-title`} className="text-2xl">{title}</h2>
          <p className="mt-3 text-sm text-muted">{description}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => dialog.current?.close()} autoFocus>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-sm">
              {label}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
