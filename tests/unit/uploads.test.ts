import { describe, expect, it } from "vitest";
import { CERTIFICATE_TYPES, detectFileType, IMAGE_TYPES, safeFileName, validateUpload } from "@/lib/uploads/validate";

const bytes = (...parts: (number[] | string)[]) => {
  const out: number[] = [];
  for (const p of parts) out.push(...(typeof p === "string" ? Array.from(p, (c) => c.charCodeAt(0)) : p));
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
};

const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0]);
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = bytes("RIFF", [0, 0, 0, 0], "WEBP");
const AVIF = bytes([0, 0, 0, 0x1c], "ftypavif");
const PDF = bytes("%PDF-1.7");
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg">');
const HTML = bytes("<!doctype html><script>");
const EXE = bytes("MZ", [0x90, 0x00]);

const MB = 1024 * 1024;

describe("detectFileType", () => {
  it("recognises supported formats from magic bytes", () => {
    expect(detectFileType(JPEG)).toBe("jpeg");
    expect(detectFileType(PNG)).toBe("png");
    expect(detectFileType(WEBP)).toBe("webp");
    expect(detectFileType(AVIF)).toBe("avif");
    expect(detectFileType(PDF)).toBe("pdf");
  });

  it("does not recognise SVG, HTML or executables", () => {
    expect(detectFileType(SVG)).toBeNull();
    expect(detectFileType(HTML)).toBeNull();
    expect(detectFileType(EXE)).toBeNull();
    expect(detectFileType(new Uint8Array([0xff]))).toBeNull();
  });
});

describe("validateUpload", () => {
  const opts = { allowed: IMAGE_TYPES, maxBytes: 8 * MB };

  it("accepts real images", () => {
    expect(validateUpload({ name: "ring.jpg", size: 1000, bytes: JPEG }, opts)).toEqual({ ok: true, type: "jpeg" });
    expect(validateUpload({ name: "ring.webp", size: 1000, bytes: WEBP }, opts).ok).toBe(true);
  });

  it("rejects oversized and empty files", () => {
    expect(validateUpload({ name: "big.jpg", size: 9 * MB, bytes: JPEG }, opts).error).toMatch(/too large/);
    expect(validateUpload({ name: "empty.jpg", size: 0, bytes: new Uint8Array() }, opts).error).toMatch(/empty/);
  });

  it("rejects SVG, disguised and executable uploads", () => {
    expect(validateUpload({ name: "logo.svg", size: 100, bytes: SVG }, opts).ok).toBe(false);
    expect(validateUpload({ name: "photo.jpg", size: 100, bytes: HTML }, opts).ok).toBe(false); // wrong content, image name
    expect(validateUpload({ name: "shell.php", size: 100, bytes: JPEG }, opts).ok).toBe(false); // image bytes, script name
    expect(validateUpload({ name: "setup.exe", size: 100, bytes: EXE }, opts).ok).toBe(false);
  });

  it("only allows PDFs where certificates are expected", () => {
    expect(validateUpload({ name: "cert.pdf", size: 100, bytes: PDF }, opts).ok).toBe(false);
    expect(validateUpload({ name: "cert.pdf", size: 100, bytes: PDF }, { allowed: CERTIFICATE_TYPES, maxBytes: 8 * MB }).ok).toBe(true);
  });
});

describe("safeFileName", () => {
  it("generates random names that ignore user input", () => {
    const a = safeFileName("webp");
    const b = safeFileName("webp");
    expect(a).toMatch(/^[0-9a-f-]{36}\.webp$/);
    expect(a).not.toBe(b);
    expect(safeFileName("../../etc/passwd")).toMatch(/^[0-9a-f-]{36}\.etcpa$/);
  });
});
