import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getEnv, isProduction } from "@/lib/env";
import { safeFileName, validateUpload, CERTIFICATE_TYPES, IMAGE_TYPES, type UploadKind } from "./validate";

export interface StoredFile {
  url: string;
  storageKey: string;
  provider: "LOCAL" | "CLOUDINARY";
  width: number | null;
  height: number | null;
  bytes: number;
  format: string;
}

export class UploadError extends Error {}

const MAX_DIMENSION = { product: 2400, certificate: 2400, branding: 1600, category: 1600 } as const;

/** Local uploads live outside /public and are streamed by /media/[...path]. */
export function localUploadRoot() {
  return path.resolve(process.cwd(), getEnv().UPLOAD_DIR);
}

function assertLocalAllowed() {
  const env = getEnv();
  if (env.UPLOAD_DRIVER === "local" && isProduction() && !env.ALLOW_LOCAL_UPLOADS_IN_PRODUCTION) {
    throw new UploadError(
      "Local file storage is disabled in production. Configure Cloudinary (UPLOAD_DRIVER=cloudinary) or set ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=true on a server with a persistent disk.",
    );
  }
}

/**
 * Validates, re-encodes and stores an upload. Images are decoded and re-encoded
 * to WebP with sharp — this strips EXIF/GPS metadata and neutralises polyglot files.
 */
export async function storeUpload(file: File, kind: UploadKind): Promise<StoredFile> {
  const env = getEnv();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const allowed = kind === "certificate" ? CERTIFICATE_TYPES : IMAGE_TYPES;
  const check = validateUpload({ name: file.name, size: file.size, bytes }, { allowed, maxBytes: env.MAX_UPLOAD_MB * 1024 * 1024 });
  if (!check.ok || !check.type) throw new UploadError(check.error ?? "Invalid file");

  let output: Buffer;
  let ext: string;
  let width: number | null = null;
  let height: number | null = null;

  if (check.type === "pdf") {
    output = Buffer.from(bytes);
    ext = "pdf";
  } else {
    try {
      const max = MAX_DIMENSION[kind];
      const { data, info } = await sharp(bytes, { limitInputPixels: 60_000_000 })
        .rotate()
        .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer({ resolveWithObject: true });
      output = data;
      width = info.width;
      height = info.height;
      ext = "webp";
    } catch {
      throw new UploadError("The image could not be processed. It may be corrupt.");
    }
  }

  const fileName = safeFileName(ext);
  if (env.UPLOAD_DRIVER === "cloudinary") {
    return uploadToCloudinary(output, kind, fileName, ext, width, height);
  }

  assertLocalAllowed();
  const dir = path.join(localUploadRoot(), kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), output, { flag: "wx" });
  const storageKey = `${kind}/${fileName}`;
  return { url: `/media/${storageKey}`, storageKey, provider: "LOCAL", width, height, bytes: output.length, format: ext };
}

async function uploadToCloudinary(buf: Buffer, kind: UploadKind, fileName: string, ext: string, width: number | null, height: number | null): Promise<StoredFile> {
  const env = getEnv();
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  const publicId = fileName.replace(/\.[^.]+$/, "");
  const result = await new Promise<{ secure_url: string; public_id: string; width?: number; height?: number; bytes: number; format?: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/${kind}`,
          public_id: publicId,
          resource_type: ext === "pdf" ? "raw" : "image",
          overwrite: false,
        },
        (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res)),
      );
      stream.end(buf);
    },
  ).catch(() => {
    throw new UploadError("Upload to image storage failed. Please try again.");
  });
  return {
    url: result.secure_url,
    storageKey: `${ext === "pdf" ? "raw" : "image"}:${result.public_id}`,
    provider: "CLOUDINARY",
    width: result.width ?? width,
    height: result.height ?? height,
    bytes: result.bytes,
    format: result.format ?? ext,
  };
}

/** Best-effort deletion of a stored file. Never throws. */
export async function deleteStoredFile(provider: string | null | undefined, storageKey: string | null | undefined) {
  if (!storageKey) return;
  try {
    if (provider === "LOCAL") {
      const root = localUploadRoot();
      const target = path.resolve(root, storageKey);
      if (!target.startsWith(root + path.sep)) return;
      await unlink(target);
    } else if (provider === "CLOUDINARY") {
      const env = getEnv();
      if (env.UPLOAD_DRIVER !== "cloudinary") return;
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
      const [resourceType, publicId] = storageKey.includes(":") ? storageKey.split(/:(.+)/) : ["image", storageKey];
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }
  } catch {
    // Orphaned files are harmless; deletion failures must not break admin flows.
  }
}

/**
 * Only accept image/file references that point at storage we control, so a
 * tampered admin request cannot inject arbitrary third-party URLs.
 */
export function isTrustedMediaUrl(url: string): boolean {
  if (url.startsWith("/media/") && !url.includes("..")) return true;
  if (url.startsWith("/demo/") && !url.includes("..")) return true;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (cloud && url.startsWith(`https://res.cloudinary.com/${cloud}/`)) return true;
  return false;
}
