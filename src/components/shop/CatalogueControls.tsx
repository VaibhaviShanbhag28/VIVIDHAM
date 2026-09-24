"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { CloseIcon, FilterIcon } from "@/components/icons";
import { AVAILABILITY_LABELS, cn } from "@/lib/utils";

interface Facets {
  categories: { name: string; slug: string; count: number }[];
  types: { value: string; count: number }[];
  materials: { value: string; count: number }[];
  gems: { value: string; count: number }[];
  priceRange: { min: string | null; max: string | null };
}

interface Current {
  q: string | null;
  categories: string[];
  types: string[];
  gems: string[];
  materials: string[];
  availability: string[];
  minPrice: string | null;
  maxPrice: string | null;
  sort: string;
}

const PendingContext = createContext(false);
const FORM_ID = "catalogue-filters";

/** Wraps the results so they fade while a new filter request is in flight. */
export function CatalogueShell({ children, sidebar, toolbar }: { children: React.ReactNode; sidebar: React.ReactNode; toolbar: React.ReactNode }) {
  return (
    <FilterNavigator>
      <div className="grid gap-10 lg:grid-cols-[16rem_1fr] xl:grid-cols-[17rem_1fr]">
        {sidebar}
        <div>
          {toolbar}
          <PendingResults>{children}</PendingResults>
        </div>
      </div>
    </FilterNavigator>
  );
}

const NavigateContext = createContext<(form: HTMLFormElement) => void>(() => {});

function FilterNavigator({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const navigate = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const sp = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      if (typeof v === "string" && v.trim() !== "" && !(k === "sort" && v === "featured")) sp.append(k, v.trim());
    }
    startTransition(() => router.push(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
  };
  return (
    <NavigateContext.Provider value={navigate}>
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </NavigateContext.Provider>
  );
}

function PendingResults({ children }: { children: React.ReactNode }) {
  const pending = useContext(PendingContext);
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50")}>
      {pending && (
        <p className="sr-only" role="status">
          Loading products…
        </p>
      )}
      {children}
    </div>
  );
}

function CheckboxGroup({ legend, name, options, selected }: { legend: string; name: string; options: { value: string; label: string; count?: number }[]; selected: string[] }) {
  if (!options.length) return null;
  return (
    <fieldset className="border-t border-sand py-5">
      <legend className="float-left mb-3 w-full text-[0.7rem] font-semibold tracking-[0.2em] text-ink uppercase">{legend}</legend>
      <ul className="clear-both max-h-64 space-y-1 overflow-y-auto pr-1">
        {options.map((o) => {
          const id = `${name}-${o.value}`.replace(/\s+/g, "-").toLowerCase();
          return (
            <li key={o.value}>
              <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-muted hover:text-ink">
                <input
                  id={id}
                  type="checkbox"
                  name={name}
                  value={o.value}
                  defaultChecked={selected.some((s) => s.toLowerCase() === o.value.toLowerCase())}
                  className="h-4 w-4 accent-emerald-800"
                />
                <span className="flex-1">{o.label}</span>
                {o.count !== undefined && <span className="text-xs text-subtle">{o.count}</span>}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export function FilterSidebar({ facets, current }: { facets: Facets; current: Current }) {
  const navigate = useContext(NavigateContext);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const activeCount =
    current.categories.length + current.types.length + current.gems.length + current.materials.length + current.availability.length + (current.minPrice ? 1 : 0) + (current.maxPrice ? 1 : 0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(e.currentTarget);
    setOpen(false);
  };

  // Desktop: apply immediately when a checkbox changes.
  const onChange = (e: React.FormEvent<HTMLFormElement>) => {
    if (isDesktop && e.target instanceof HTMLInputElement && e.target.type === "checkbox") navigate(e.currentTarget);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm lg:hidden" aria-expanded={open} aria-controls="filter-panel">
        <FilterIcon size={16} /> Filters {activeCount > 0 && <span className="rounded-full bg-emerald-900 px-1.5 text-[0.65rem] text-ivory">{activeCount}</span>}
      </button>

      <div className={cn("fixed inset-0 z-50 bg-emerald-950/40 lg:hidden", open ? "block" : "hidden")} onClick={() => setOpen(false)} aria-hidden />
      <aside
        id="filter-panel"
        aria-label="Filters"
        className={cn(
          "lg:static lg:block lg:translate-x-0",
          open ? "fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-ivory shadow-xl" : "hidden lg:block",
        )}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
      >
        <form id={FORM_ID} ref={formRef} action="/shop" method="get" onSubmit={onSubmit} onChange={onChange} className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sand px-5 py-4 lg:hidden">
            <p className="font-serif text-2xl">Filters</p>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-sm hover:bg-cream">
              <CloseIcon />
              <span className="sr-only">Close filters</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 lg:overflow-visible lg:px-0">
            {current.q && <input type="hidden" name="q" value={current.q} />}
            <input type="hidden" name="sort" value={current.sort} />
            <CheckboxGroup legend="Category" name="category" selected={current.categories} options={facets.categories.map((c) => ({ value: c.slug, label: c.name, count: c.count }))} />
            <CheckboxGroup legend="Jewellery type" name="type" selected={current.types} options={facets.types.map((t) => ({ value: t.value, label: t.value, count: t.count }))} />
            <CheckboxGroup legend="Gemstone" name="gem" selected={current.gems} options={facets.gems.map((g) => ({ value: g.value, label: g.value, count: g.count }))} />
            <CheckboxGroup legend="Material" name="material" selected={current.materials} options={facets.materials.map((m) => ({ value: m.value, label: m.value, count: m.count }))} />
            <CheckboxGroup
              legend="Availability"
              name="availability"
              selected={current.availability}
              options={Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <fieldset className="border-t border-sand py-5">
              <legend className="mb-3 text-[0.7rem] font-semibold tracking-[0.2em] text-ink uppercase">Price (₹)</legend>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="price-min">Minimum price</label>
                <input id="price-min" name="min" inputMode="numeric" pattern="[0-9,]*" placeholder={facets.priceRange.min ? `Min ${Math.floor(Number(facets.priceRange.min))}` : "Min"} defaultValue={current.minPrice?.replace(/\.00$/, "") ?? ""} className="field-input !min-h-10 text-sm" />
                <span aria-hidden className="text-subtle">–</span>
                <label className="sr-only" htmlFor="price-max">Maximum price</label>
                <input id="price-max" name="max" inputMode="numeric" pattern="[0-9,]*" placeholder={facets.priceRange.max ? `Max ${Math.ceil(Number(facets.priceRange.max))}` : "Max"} defaultValue={current.maxPrice?.replace(/\.00$/, "") ?? ""} className="field-input !min-h-10 text-sm" />
              </div>
              <button type="submit" className="btn btn-outline btn-sm mt-3 hidden w-full lg:inline-flex">Apply price</button>
            </fieldset>
          </div>
          <div className="flex gap-3 border-t border-sand p-5 lg:border-0 lg:px-0">
            <button type="submit" className="btn btn-primary flex-1 lg:hidden">Show results</button>
            {activeCount > 0 && (
              <a href={current.q ? `/shop?q=${encodeURIComponent(current.q)}` : "/shop"} className="btn btn-ghost btn-sm flex-1 lg:flex-none lg:px-0 lg:underline lg:underline-offset-4">
                Clear all
              </a>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}

export function SortSelect({ value, options }: { value: string; options: readonly { value: string; label: string }[] }) {
  const navigate = useContext(NavigateContext);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        Sort
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={value}
        className="field-input !min-h-10 !w-auto py-1.5 text-sm"
        onChange={(e) => {
          const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
          if (!form) return;
          const hidden = form.querySelector<HTMLInputElement>('input[name="sort"]');
          if (hidden) hidden.value = e.target.value;
          navigate(form);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
