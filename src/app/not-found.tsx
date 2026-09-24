import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 py-24 text-center">
      <Link href="/" aria-label="Home">
        <Wordmark />
      </Link>
      <p className="eyebrow mt-16">Error 404</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">The page you are looking for may have moved or no longer exists.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Go to home</Link>
        <Link href="/shop" className="btn btn-outline">Browse the collection</Link>
      </div>
    </main>
  );
}
