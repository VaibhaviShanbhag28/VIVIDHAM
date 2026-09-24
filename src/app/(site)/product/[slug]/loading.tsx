export default function ProductLoading() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true">
      <p className="sr-only" role="status">Loading product…</p>
      <div className="skeleton h-3 w-48 rounded-sm" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="skeleton aspect-[4/5]" />
        <div className="space-y-4">
          <div className="skeleton h-3 w-24 rounded-sm" />
          <div className="skeleton h-12 w-4/5 rounded-sm" />
          <div className="skeleton h-8 w-40 rounded-sm" />
          <div className="skeleton mt-8 h-14 w-full rounded-sm" />
          <div className="skeleton h-40 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}
