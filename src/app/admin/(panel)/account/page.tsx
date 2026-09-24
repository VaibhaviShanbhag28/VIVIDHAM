import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const admin = await requireAdminPage();
  const sessions = await prisma.adminSession.findMany({
    where: { adminUserId: admin.id, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, userAgent: true, lastSeenAt: true, createdAt: true },
  });
  return (
    <>
      <AdminPageHeader title="Your account" description={`${admin.name} · ${admin.email}`} />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <AdminCard title="Change password" description="Changing your password signs out all other sessions.">
          <ChangePasswordForm />
        </AdminCard>
        <AdminCard title="Active sessions">
          <ul className="divide-y divide-sand text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="py-3">
                <p className="text-ink">
                  {s.userAgent?.slice(0, 90) ?? "Unknown browser"} {s.id === admin.sessionId && <strong className="text-emerald-800">(this browser)</strong>}
                </p>
                <p className="text-xs text-subtle">Signed in {formatDate(s.createdAt, true)} · last active {formatDate(s.lastSeenAt, true)}</p>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </>
  );
}
