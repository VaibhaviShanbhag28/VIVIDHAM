"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "@/app/admin/actions/auth";
import { Notice } from "@/components/ui/Notice";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  const e = state.errors ?? {};
  const field = (name: string, label: string, autoComplete: string, hint?: string) => (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} type="password" autoComplete={autoComplete} required maxLength={128} className="field-input" aria-invalid={e[name] ? true : undefined} aria-describedby={e[name] ? `${name}-error` : hint ? `${name}-hint` : undefined} />
      {hint && !e[name] && <p id={`${name}-hint`} className="field-hint">{hint}</p>}
      {e[name] && <p id={`${name}-error`} className="field-error">{e[name]}</p>}
    </div>
  );
  return (
    <form action={action} className="space-y-4" key={state.ok ? "done" : "form"}>
      {state.ok && <Notice tone="success">Password changed. Other sessions have been signed out.</Notice>}
      {field("currentPassword", "Current password", "current-password")}
      {field("newPassword", "New password", "new-password", `At least ${PASSWORD_MIN_LENGTH} characters, mixing letters with numbers or symbols.`)}
      {field("confirmPassword", "Confirm new password", "new-password")}
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
