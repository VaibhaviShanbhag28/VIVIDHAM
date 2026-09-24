"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface BaseProps {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
}

function Wrapper({ id, label, error, hint, required, className, children }: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-ruby-700" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: React.ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function TextField({
  value,
  onChange,
  type = "text",
  maxLength,
  placeholder,
  list,
  inputMode,
  autoComplete,
  ...rest
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  list?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <Wrapper id={id} {...rest}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        list={list}
        inputMode={inputMode}
        autoComplete={autoComplete ?? "off"}
        required={rest.required}
        aria-invalid={rest.error ? true : undefined}
        aria-describedby={describedBy(id, rest.error, rest.hint)}
        className="field-input"
      />
    </Wrapper>
  );
}

export function TextArea({ value, onChange, rows = 4, maxLength, placeholder, ...rest }: BaseProps & { value: string; onChange: (v: string) => void; rows?: number; maxLength?: number; placeholder?: string }) {
  const id = useId();
  return (
    <Wrapper id={id} {...rest}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        required={rest.required}
        aria-invalid={rest.error ? true : undefined}
        aria-describedby={describedBy(id, rest.error, rest.hint)}
        className="field-input"
      />
    </Wrapper>
  );
}

export function SelectField({ value, onChange, options, ...rest }: BaseProps & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <Wrapper id={id} {...rest}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={rest.error ? true : undefined} aria-describedby={describedBy(id, rest.error, rest.hint)} className="field-input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Wrapper>
  );
}

export function Toggle({ label, checked, onChange, hint, className }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-800" aria-describedby={hint ? `${id}-hint` : undefined} />
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
        {hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <div role="alert" tabIndex={-1} id="form-errors" className="rounded-sm border border-ruby-700/30 bg-ruby-50 p-4 text-sm text-ruby-700">
      <p className="font-semibold">Please fix {entries.length === 1 ? "this issue" : `these ${entries.length} issues`}:</p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5">
        {entries.slice(0, 12).map(([k, v]) => (
          <li key={k}>{v}</li>
        ))}
      </ul>
    </div>
  );
}

/** Uploads a single file to the admin upload endpoint. */
export async function uploadFile(file: File, kind: "product" | "certificate" | "branding" | "category") {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  const res = await fetch("/api/admin/uploads", { method: "POST", body, credentials: "same-origin" });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
    storageKey?: string;
    provider?: "LOCAL" | "CLOUDINARY";
    width?: number | null;
    height?: number | null;
    format?: string;
  };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
  return json as Required<Pick<typeof json, "url" | "storageKey" | "provider">> & typeof json;
}

export const CLIENT_MAX_UPLOAD_MB = 8;
