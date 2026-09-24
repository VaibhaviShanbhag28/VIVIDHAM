"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GridIcon, InboxIcon, PageIcon, SettingsIcon, TagIcon, UserIcon, GemIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: GridIcon },
  { href: "/admin/products", label: "Products", Icon: GemIcon },
  { href: "/admin/categories", label: "Categories", Icon: TagIcon },
  { href: "/admin/enquiries", label: "Enquiries", Icon: InboxIcon },
  { href: "/admin/content", label: "Pages & policies", Icon: PageIcon },
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
  { href: "/admin/account", label: "Account", Icon: UserIcon },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar overflow-x-auto px-3 pb-3 lg:overflow-visible lg:px-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-emerald-900 text-ivory" : "text-muted hover:bg-cream hover:text-ink",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
