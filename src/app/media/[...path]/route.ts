import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { localUploadRoot } from "@/lib/uploads/storage";

/**
 * Serves locally stored uploads (development / single-server deployments).
 * Only whitelisted extensions inside the upload root are served, with
 * `nosniff` so browsers never interpret files as another content type.
 */
const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  if (!segments.length || segments.some((s) => !/^[a-z0-9][a-z0-9._-]*$/i.test(s) || s.includes(".."))) {
    return new Response("Not found", { status: 404 });
  }
  const root = localUploadRoot();
  const target = path.resolve(root, ...segments);
  const ext = path.extname(target).toLowerCase();
  if (!target.startsWith(root + path.sep) || !TYPES[ext]) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(target);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const body = await readFile(target);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": TYPES[ext],
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        // Sandboxing breaks built-in PDF viewers, so it is applied to images only.
        ...(ext === ".pdf" ? {} : { "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
