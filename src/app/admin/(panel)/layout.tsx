import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions/auth";
import { Wordmark } from "@/components/brand/Wordmark";
import { LogoutIcon } from "@/components/icons";
import { requireAdminPage } from "@/lib/auth/session";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | VIVIDHUM" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="min-h-dvh bg-[#f7f4ee] lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-emerald-900 focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <aside className="border-b border-sand bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-7">
          <Link href="/admin/dashboard" className="block origin-left scale-75 lg:scale-90">
            <Wordmark />
          </Link>
          <p className="hidden text-[0.65rem] font-semibold tracking-[0.2em] text-subtle uppercase lg:mt-2 lg:block">Admin dashboard</p>
          <form action={logoutAction} className="lg:hidden">
            <button type="submit" className="btn btn-ghost btn-sm">
              <LogoutIcon size={16} /> Sign out
            </button>
          </form>
        </div>
        <AdminNav />
        <div className="mt-auto hidden border-t border-sand p-5 lg:block">
          <p className="truncate text-sm font-semibold text-ink">{admin.name}</p>
          <p className="truncate text-xs text-subtle">{admin.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/" target="_blank" className="btn btn-ghost btn-sm !px-2">View site</Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-sm !px-2">
                <LogoutIcon size={16} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="admin-main" tabIndex={-1} className="min-w-0 px-4 py-8 focus:outline-none sm:px-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
