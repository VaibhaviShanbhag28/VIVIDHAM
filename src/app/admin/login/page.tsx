import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { getCurrentAdmin } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/dashboard");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Wordmark size="lg" />
        </div>
        <div className="card-surface mt-10 p-8 shadow-soft sm:p-10">
          <h1 className="text-3xl">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted">Restricted area for authorised staff.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-subtle">
          Forgotten your password? Ask the site owner to run <code className="font-mono">npm run admin:reset-password</code>.
        </p>
      </div>
    </main>
  );
}
