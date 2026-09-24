import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RichText } from "@/components/content/RichText";
import { Notice } from "@/components/ui/Notice";
import { getContentPage } from "@/lib/catalogue/queries";
import { getContentTemplate } from "@/lib/content-defaults";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About us",
  description: "The story, craftsmanship and values behind VIVIDHUM JEWELLERY.",
};

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getContentPage("about"), getSiteSettings()]);
  const template = getContentTemplate("about")!;
  const content = page ?? { ...template, isApproved: false };

  return (
    <>
      <section className="bg-cream">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-20 lg:gap-16">
          <div>
            <p className="eyebrow">About us</p>
            <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">{content.title}</h1>
            {content.summary && <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">{content.summary}</p>}
            {settings.brandStory && <p className="mt-5 max-w-lg leading-relaxed text-muted">{settings.brandStory.split(/\n{2,}/)[0]}</p>}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-tl-[6rem]">
            <Image src="/demo/story.webp" alt="" fill priority sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
          </div>
        </div>
      </section>
      <div className="container-page max-w-3xl py-14 sm:py-20">
        {!content.isApproved && (
          <Notice tone="warning" title="Draft — awaiting client approval" className="mb-10">
            The text on this page contains placeholders that {settings.businessName} will replace with its own story.
          </Notice>
        )}
        <RichText source={content.body} />
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">Explore the collection</Link>
          <Link href="/contact" className="btn btn-outline">Contact us</Link>
        </div>
      </div>
    </>
  );
}
