import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ title, description, actions, back }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="text-xs font-semibold tracking-[0.14em] text-emerald-800 uppercase hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-1 text-4xl">{title}</h1>
        {description && <div className="mt-2 max-w-3xl text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function AdminCard({ title, description, children, className, id }: { title?: string; description?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("card-surface p-5 sm:p-6", className)} aria-labelledby={title && id ? `${id}-title` : undefined}>
      {title && (
        <div className="mb-5">
          <h2 id={id ? `${id}-title` : undefined} className="font-sans text-base font-semibold tracking-normal">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

const BADGE_TONES = {
  green: "bg-emerald-50 text-emerald-800 border-emerald-100",
  gold: "bg-gold-100 text-gold-700 border-gold-300",
  grey: "bg-cream text-muted border-sand",
  red: "bg-ruby-50 text-ruby-700 border-ruby-700/20",
  dark: "bg-ink text-ivory border-ink",
} as const;

export function Badge({ tone = "grey", children }: { tone?: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap", BADGE_TONES[tone])}>{children}</span>;
}

export const STATUS_TONE = { PUBLISHED: "green", DRAFT: "gold", ARCHIVED: "grey" } as const;
export const ENQUIRY_TONE = { NEW: "gold", CONTACTED: "green", IN_DISCUSSION: "green", CLOSED: "grey" } as const;
