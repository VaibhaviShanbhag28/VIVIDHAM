import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Not available</p>
      <h1 className="mt-4 text-5xl">This piece could not be found</h1>
      <p className="mt-4 max-w-md text-muted">It may have been sold or removed from the catalogue. Explore our other pieces, or ask us about something similar.</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Browse the collection
      </Link>
    </div>
  );
}
