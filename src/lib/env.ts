import "server-only";
import { z } from "zod";

/**
 * Server-side environment validation. Import `env` only from server code —
 * nothing here is ever exposed to the browser bundle (no NEXT_PUBLIC_ prefix).
 */
const boolish = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    APP_URL: z.url().default("http://localhost:3000"),

    UPLOAD_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
    UPLOAD_DIR: z.string().default("./storage/uploads"),
    MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(25).default(8),
    ALLOW_LOCAL_UPLOADS_IN_PRODUCTION: boolish,

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_FOLDER: z.string().default("vividhum"),

    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(12),
    /** Only enable when deployed behind a proxy you control (Vercel, Nginx, Cloudflare). */
    TRUST_PROXY: boolish,
  })
  .superRefine((val, ctx) => {
    if (val.UPLOAD_DRIVER === "cloudinary") {
      for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const) {
        if (!val[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: `${key} is required when UPLOAD_DRIVER=cloudinary` });
        }
      }
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    // Never print the values themselves — only which variables are invalid.
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
