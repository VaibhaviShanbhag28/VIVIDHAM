"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { CloseIcon, MenuIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

export function Header({
  businessName,
  logoUrl,
  nav,
  whatsappUrl,
}: {
  businessName: string;
  logoUrl: string | null;
  nav: NavItem[];
  whatsappUrl: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  // Close overlays on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  // Escape closes; lock background scroll and keep focus inside the drawer while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        menuButton.current?.focus();
      }
      if (e.key === "Tab" && menuOpen && drawer.current) {
        const focusables = drawer.current.querySelectorAll<HTMLElement>("a, button, input");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    if (menuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (menuOpen) drawer.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [menuOpen]);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname.startsWith(path) && !href.includes("?");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-4 lg:h-24">
        <div className="flex flex-1 items-center gap-1 lg:hidden">
          <button
            ref={menuButton}
            type="button"
            className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-cream"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon size={24} />
            <span className="sr-only">Open menu</span>
          </button>
        </div>

        <Link href="/" className="shrink-0 rounded-sm" aria-label={`${businessName} — home`}>
          <Wordmark logoUrl={logoUrl} businessName={businessName} />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-7 xl:gap-9">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "link-underline py-2 text-[0.72rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:text-emerald-800",
                    isActive(item.href) ? "text-emerald-800" : "text-ink",
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 lg:flex-none">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-cream"
            aria-expanded={searchOpen}
            aria-controls="site-search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <CloseIcon size={22} /> : <SearchIcon size={22} />}
            <span className="sr-only">{searchOpen ? "Close search" : "Search"}</span>
          </button>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-sm px-2 text-whatsapp hover:bg-cream sm:px-3"
            >
              <WhatsAppIcon size={22} />
              <span className="hidden text-[0.72rem] font-semibold tracking-[0.14em] uppercase xl:inline">WhatsApp</span>
              <span className="sr-only xl:hidden">Chat with us on WhatsApp (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>

      {/* Search panel */}
      <div id="site-search" hidden={!searchOpen} className="border-t border-sand bg-ivory">
        <form action="/shop" method="get" role="search" className="container-page flex items-center gap-3 py-4">
          <label htmlFor="header-search" className="sr-only">
            Search jewellery and gemstones
          </label>
          <SearchIcon className="text-subtle" />
          <input
            ref={searchInput}
            id="header-search"
            name="q"
            type="search"
            maxLength={100}
            placeholder="Search by name, SKU, category or gemstone…"
            className="h-11 flex-1 bg-transparent font-serif text-xl placeholder:text-subtle focus:outline-none"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", menuOpen ? "visible" : "invisible")} aria-hidden={!menuOpen}>
        <div
          className={cn("absolute inset-0 bg-emerald-950/40 transition-opacity", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <div
          id="mobile-menu"
          ref={drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-ivory shadow-xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-sand px-5 py-4">
            <Wordmark logoUrl={logoUrl} businessName={businessName} className="scale-90 origin-left" />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-sm hover:bg-cream"
              onClick={() => {
                setMenuOpen(false);
                menuButton.current?.focus();
              }}
            >
              <CloseIcon size={24} />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="divide-y divide-sand">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center justify-between py-4 font-serif text-2xl text-ink hover:text-emerald-800">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {whatsappUrl && (
            <div className="border-t border-sand p-5">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
                <WhatsAppIcon /> Chat on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
