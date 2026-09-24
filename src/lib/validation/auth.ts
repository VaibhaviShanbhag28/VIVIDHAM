import { z } from "zod";

export const loginInput = z.object({
  email: z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.email("Enter a valid email address").max(200)),
  password: z.string().min(1, "Enter your password").max(200, "Password is too long"),
});

export const PASSWORD_MIN_LENGTH = 12;

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Use 128 characters or fewer")
  .refine((p) => /[a-zA-Z]/.test(p) && /[^a-zA-Z]/.test(p), "Mix letters with numbers or symbols")
  .refine((p) => new Set(p).size >= 6, "Password is too repetitive");

export const changePasswordInput = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a different password" });
