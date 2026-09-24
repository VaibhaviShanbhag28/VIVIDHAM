import { Notice } from "@/components/ui/Notice";
import { formatDate } from "@/lib/utils";
import { RichText } from "./RichText";

export function ContentPageView({
  title,
  summary,
  body,
  isApproved,
  updatedAt,
  eyebrow,
  businessName,
}: {
  businessName: string;
  title: string;
  summary: string | null;
  body: string;
  isApproved: boolean;
  updatedAt: Date | null;
  eyebrow?: string;
}) {
  return (
    <article className="container-page max-w-3xl py-14 sm:py-20">
      <header className="border-b border-sand pb-8 text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 text-5xl leading-tight sm:text-6xl">{title}</h1>
        {summary && <p className="mt-4 text-lg text-muted">{summary}</p>}
        {updatedAt && isApproved && <p className="mt-4 text-xs text-subtle">Last updated {formatDate(updatedAt)}</p>}
      </header>
      {!isApproved && (
        <Notice tone="warning" title="Draft — awaiting client approval" className="mt-8">
          This page is a template and has not yet been approved by {businessName}. Its content is not a binding policy. Please contact us for the
          current terms.
        </Notice>
      )}
      <div className="mt-10">
        <RichText source={body} />
      </div>
    </article>
  );
}
