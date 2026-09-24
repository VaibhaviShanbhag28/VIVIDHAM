import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/content/ContentPageView";
import { getContentPage } from "@/lib/catalogue/queries";
import { getContentTemplate } from "@/lib/content-defaults";
import { getSiteSettings } from "@/lib/settings";

const POLICY_SLUGS = ["shipping", "returns", "privacy", "terms", "care"];

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  if (!POLICY_SLUGS.includes(slug)) return null;
  const page = await getContentPage(slug);
  if (page) return { title: page.title, summary: page.summary, body: page.body, isApproved: page.isApproved, updatedAt: page.updatedAt };
  const t = getContentTemplate(slug);
  return t ? { title: t.title, summary: t.summary, body: t.body, isApproved: false, updatedAt: null } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await load((await params).slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.summary ?? undefined,
    robots: page.isApproved ? undefined : { index: false, follow: true },
  };
}

export default async function PolicyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([load(slug), getSiteSettings()]);
  if (!page) notFound();
  return <ContentPageView {...page} eyebrow="Customer information" businessName={settings.businessName} />;
}
