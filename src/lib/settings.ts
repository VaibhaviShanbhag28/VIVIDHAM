import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { normaliseWhatsAppNumber } from "@/lib/whatsapp";
import { DEFAULT_SETTINGS, type SiteSettings, type TrustHighlight } from "./settings-defaults";

export { DEFAULT_SETTINGS, type SiteSettings, type TrustHighlight };

export const SETTINGS_TAG = "site-settings";

function parseHighlights(value: unknown): TrustHighlight[] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.trustHighlights;
  return value
    .filter((h): h is { title: string; description?: string | null } => !!h && typeof h === "object" && typeof (h as { title?: unknown }).title === "string")
    .map((h) => ({ title: h.title, description: typeof h.description === "string" && h.description ? h.description : null }));
}

async function loadSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) return DEFAULT_SETTINGS;
  const { id: _id, trustHighlights, updatedAt, ...rest } = row;
  return {
    ...rest,
    trustHighlights: trustHighlights === null ? DEFAULT_SETTINGS.trustHighlights : parseHighlights(trustHighlights),
    updatedAt: updatedAt.toISOString(),
  };
}

export const getSiteSettings = unstable_cache(loadSettings, ["site-settings"], { tags: [SETTINGS_TAG], revalidate: 300 });

export function whatsappConfigured(s: Pick<SiteSettings, "whatsappNumber">) {
  return normaliseWhatsAppNumber(s.whatsappNumber) !== null;
}

export function formatAddress(s: SiteSettings): string[] {
  const cityLine = [s.city, s.state, s.postalCode].filter(Boolean).join(", ");
  return [s.addressLine1, s.addressLine2, cityLine, s.country && (s.addressLine1 || cityLine) ? s.country : null].filter(
    (l): l is string => !!l && l.trim() !== "",
  );
}
