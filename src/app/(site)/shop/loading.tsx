export default function ShopLoading() {
  return (
    <div className="container-page py-10 sm:py-14" aria-busy="true">
      <p className="sr-only" role="status">Loading products…</p>
      <div className="skeleton h-3 w-24 rounded-sm" />
      <div className="skeleton mt-8 h-12 w-72 max-w-full rounded-sm" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[17rem_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-6 rounded-sm" />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <div className="skeleton aspect-[4/5]" />
              <div className="skeleton mt-4 h-5 w-3/4 rounded-sm" />
              <div className="skeleton mt-2 h-4 w-1/3 rounded-sm" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
