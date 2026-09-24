import { randomUUID } from "node:crypto";

/**
 * Upload validation based on the file's actual bytes (magic numbers), not the
 * client-supplied name or MIME type. SVG, HTML, scripts and executables are
 * never accepted.
 */

export type DetectedType = "jpeg" | "png" | "webp" | "avif" | "pdf";

export const IMAGE_TYPES: DetectedType[] = ["jpeg", "png", "webp", "avif"];
export const CERTIFICATE_TYPES: DetectedType[] = ["jpeg", "png", "webp", "avif", "pdf"];

export function detectFileType(buf: Uint8Array): DetectedType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "png";
  const ascii = (start: number, end: number) => String.fromCharCode(...buf.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "avif";
  if (ascii(0, 5) === "%PDF-") return "pdf";
  return null;
}

const BLOCKED_EXTENSIONS = /\.(svg|svgz|html?|xhtml|xml|js|mjs|cjs|ts|php\d?|phtml|asp|aspx|jsp|exe|dll|bat|cmd|com|sh|ps1|msi|scr|jar|py|rb|pl|cgi)$/i;

export interface UploadCheck {
  ok: boolean;
  error?: string;
  type?: DetectedType;
}

export function validateUpload(
  file: { name: string; size: number; bytes: Uint8Array },
  opts: { allowed: DetectedType[]; maxBytes: number },
): UploadCheck {
  if (file.size <= 0 || file.bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (file.size > opts.maxBytes || file.bytes.length > opts.maxBytes) {
    return { ok: false, error: `The file is too large. Maximum size is ${Math.floor(opts.maxBytes / (1024 * 1024))} MB.` };
  }
  if (BLOCKED_EXTENSIONS.test(file.name)) return { ok: false, error: "This file type is not allowed." };
  const type = detectFileType(file.bytes);
  if (!type || !opts.allowed.includes(type)) {
    const names = opts.allowed.map((t) => t.toUpperCase()).join(", ");
    return { ok: false, error: `Unsupported file. Please upload ${names}.` };
  }
  return { ok: true, type };
}

/** Random, non-guessable file name; never derived from user input. */
export function safeFileName(ext: string) {
  const clean = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "bin";
  return `${randomUUID()}.${clean}`;
}

export const UPLOAD_KINDS = ["product", "certificate", "branding", "category"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
