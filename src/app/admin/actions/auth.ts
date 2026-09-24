"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { authenticateAdmin } from "@/lib/auth/login";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, createSession, destroySession, getCurrentAdmin, requireAdmin, setSessionCookie } from "@/lib/auth/session";
import { dbRateLimitStore } from "@/lib/rate-limit-db";
import { clientFingerprint, userAgent } from "@/lib/request";
import { changePasswordInput, loginInput } from "@/lib/validation/auth";
import { fieldErrors } from "@/lib/validation/common";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginInput.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const emailValue = typeof formData.get("email") === "string" ? String(formData.get("email")).slice(0, 200) : "";
  if (!parsed.success) return { error: "Enter a valid email address and password.", email: emailValue };

  const result = await authenticateAdmin(parsed.data.email, parsed.data.password, {
    fingerprint: await clientFingerprint(),
    store: dbRateLimitStore,
  });
  if (!result.ok) {
    if (result.reason === "rate_limited" || result.reason === "locked") {
      const minutes = Math.max(1, Math.ceil((result.retryAfterSeconds ?? 60) / 60));
      return { error: `Too many sign-in attempts. Please wait about ${minutes} minute(s) and try again.`, email: emailValue };
    }
    return { error: "Incorrect email or password.", email: emailValue };
  }

  const { token, expiresAt } = await createSession(result.adminUserId, await userAgent());
  await setSessionCookie(token, expiresAt);
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  const admin = await getCurrentAdmin();
  if (admin) await destroySession(admin.sessionId);
  await clearSessionCookie();
  redirect("/admin/login");
}

export type PasswordState = { ok?: boolean; errors?: Record<string, string> };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const admin = await requireAdmin();
  const parsed = changePasswordInput.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.currentPassword))) {
    return { errors: { currentPassword: "Current password is incorrect" } };
  }
  const now = new Date();
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword), passwordChangedAt: now },
  });
  // Sign out every session (including this one), then issue a fresh session for the current browser.
  await prisma.adminSession.deleteMany({ where: { adminUserId: admin.id } });
  const { token, expiresAt } = await createSession(admin.id, await userAgent());
  await setSessionCookie(token, expiresAt);
  return { ok: true };
}
