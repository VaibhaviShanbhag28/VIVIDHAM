import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { dbRateLimitStore } from "@/lib/rate-limit-db";
import { isSameOrigin } from "@/lib/request";
import { storeUpload, UploadError } from "@/lib/uploads/storage";
import { UPLOAD_KINDS, type UploadKind } from "@/lib/uploads/validate";

export const runtime = "nodejs";

/** Authenticated admin upload endpoint (multipart/form-data: file, kind). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await rateLimit(dbRateLimitStore, `upload:${admin.id}`, LIMITS.uploadPerAdmin);
  if (!limit.allowed) return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 8);
  if (contentLength > (maxMb + 1) * 1024 * 1024) {
    return NextResponse.json({ error: `The file is too large. Maximum size is ${maxMb} MB.` }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "product") as UploadKind;
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (!UPLOAD_KINDS.includes(kind)) return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });

  try {
    const stored = await storeUpload(file, kind);
    return NextResponse.json(stored, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[upload] failed", e instanceof Error ? e.message : "unknown error");
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
