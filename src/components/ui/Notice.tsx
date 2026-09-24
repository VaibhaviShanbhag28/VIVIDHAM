import { AlertIcon, CheckIcon, InfoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "error";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-emerald-100 bg-emerald-50 text-emerald-900",
    warning: "border-gold-300 bg-gold-100 text-gold-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    error: "border-ruby-700/30 bg-ruby-50 text-ruby-700",
  }[tone];
  const Icon = tone === "success" ? CheckIcon : tone === "info" ? InfoIcon : AlertIcon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-sm border px-4 py-3 text-sm", styles, className)}>
      <Icon className="mt-0.5 shrink-0" size={18} />
      <div className="space-y-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-stone bg-cream/40 px-6 py-16 text-center">
      <div className="ornament w-40" aria-hidden>
        <span className="text-lg">◆</span>
      </div>
      <h2 className="mt-5 text-3xl">{title}</h2>
      {children && <div className="mt-3 max-w-md text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
