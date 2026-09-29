import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. Per-request nonce-based Content-Security-Policy.
 * 2. Optimistic admin gate: requests to /admin/* without a session cookie are
 *    redirected to the login page. This is only a UX shortcut — every admin
 *    page, server action and API route validates the session server-side.
 */
const SESSION_COOKIES = ["__Host-vj_admin", "vj_admin"];

function buildCsp(nonce: string) {
  const dev = process.env.NODE_ENV !== "production";
  const analytics = process.env.NEXT_PUBLIC_ANALYTICS_SRC ? new URL(process.env.NEXT_PUBLIC_ANALYTICS_SRC).origin : "";
  const cloudinary = "https://res.cloudinary.com";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}${analytics ? ` ${analytics}` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${cloudinary}`,
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}${analytics ? ` ${analytics}` : ""}`,
    `frame-src 'self' ${cloudinary}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  if (pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|media/|demo/|brand/|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
