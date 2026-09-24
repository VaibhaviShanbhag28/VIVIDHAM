# VIVIDHUM JEWELLERY — Catalogue & Admin

A premium jewellery and gemstone catalogue with **WhatsApp purchase enquiries**, a website enquiry form, and a secure **admin dashboard** for products, categories, enquiries, pages and business settings.

> **Release scope:** this is a catalogue. It has no cart, checkout or online payments. Clicking **Enquire on WhatsApp** opens a pre-filled message that the customer reviews and sends. Opening that message does **not** confirm an order, payment, reservation or shipment.

---

## Contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Quick start (local development)](#quick-start-local-development)
4. [Environment variables](#environment-variables)
5. [Database & migrations](#database--migrations)
6. [Creating the first admin account](#creating-the-first-admin-account)
7. [Image & file storage](#image--file-storage)
8. [WhatsApp enquiry flow](#whatsapp-enquiry-flow)
9. [Testing, linting & type checking](#testing-linting--type-checking)
10. [Deployment](#deployment)
11. [Security notes](#security-notes)
12. [Project structure](#project-structure)
13. [Information still required from the client](#information-still-required-from-the-client)
14. [Incomplete integrations & production prerequisites](#incomplete-integrations--production-prerequisites)

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4 with a custom design system (ivory / emerald / champagne gold; Cormorant Garamond + Manrope) |
| Database | PostgreSQL + Prisma ORM 6 (DECIMAL columns for money) |
| Validation | Zod 4 schemas shared by client and server |
| Auth | Custom server-side sessions: Argon2id passwords, random tokens stored hashed (SHA-256), HTTP-only `SameSite=Strict` cookies |
| Images | `sharp` (re-encode to WebP, strip metadata), `next/image` responsive delivery; Cloudinary or local disk storage |
| Tests | Vitest (unit + optional PostgreSQL integration tests) |

## Features

**Storefront**
- Announcement bar, sticky header with search, accessible mobile menu, footer with contact/policies/social links, floating WhatsApp button.
- Home page: hero, featured categories, new arrivals, gemstone edit, featured pieces, brand story, trust highlights, Instagram CTA, WhatsApp CTA.
- Shop: responsive grid; filters for category, jewellery type, gemstone, material, availability and price; sorting (featured, newest, price ↑/↓); search by name, SKU, category, gemstone or tag; pagination; loading skeletons and empty states. Filters work without JavaScript (plain GET form).
- Product page: gallery with thumbnails and keyboard navigation, SKU, INR price with optional sale price, availability, specifications, gemstone details, certification (issuer, number, date, file, verification link), care, delivery and returns information, quantity selector, **Enquire on WhatsApp**, website enquiry form, related products.
- Empty fields are hidden — nothing is invented. Demo products carry a visible **Demo** badge and notice.
- About, Contact and five policy pages (shipping, returns, privacy, terms, care), editable from the admin. Unapproved pages show **“Draft — awaiting client approval”** and are `noindex`.
- SEO: per-page metadata, Open Graph, canonical URLs, `sitemap.xml`, `robots.txt`; Product JSON-LD only for real (non-demo) products and only with supplied data.

**Admin (`/admin`)**
- `/admin/login` — rate-limited sign-in with account lockout; no public registration.
- `/admin/dashboard` — counts, recent enquiries, launch checklist.
- `/admin/products` — search/filter, publish/unpublish, mark sold out; create/edit with multi-image upload, primary image, reordering, alt text, gemstones, certificates (PDF/image upload), SEO fields; preview before publishing; delete with confirmation.
- `/admin/categories` — create, edit, reorder, activate/deactivate, delete (only when unused), category images.
- `/admin/enquiries` — search and filter, status (New / Contacted / In discussion / Closed), internal notes, reply-on-WhatsApp shortcut, **manual recording** of enquiries received via WhatsApp/phone/in store.
- `/admin/content` — edit About and policy pages with a safe Markdown subset and live preview; approval switch.
- `/admin/settings` — business name, logo, tagline, brand story, phone, WhatsApp, email, address, hours, map and social links, announcement bar, hero banner, trust highlights, footer text, shipping and returns summaries.
- `/admin/account` — change password (signs out other sessions), list active sessions.

---

## Quick start (local development)

Prerequisites: **Node.js 20.9+** (22 LTS recommended) and **PostgreSQL 14+**.

```bash
npm install
```

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL`. To create a dedicated database and user (recommended — do not use the `postgres` superuser for the app):

```sql
CREATE USER vividhum_app WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE vividhum OWNER vividhum_app;
-- optional, for integration tests:
CREATE DATABASE vividhum_test OWNER vividhum_app;
```

Apply migrations, seed starter content and create your admin account:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run admin:create
```

Start the dev server and open http://localhost:3000 (admin: http://localhost:3000/admin/login):

```bash
npm run dev
```

## Environment variables

See [.env.example](.env.example) — it contains placeholders only.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✔ | PostgreSQL connection string |
| `APP_URL` | ✔ in production | Public site URL — used for canonical links, sitemap and WhatsApp product links |
| `SESSION_TTL_HOURS` | | Admin session lifetime (default 12) |
| `TRUST_PROXY` | | `true` only behind a trusted proxy/platform that sets `X-Forwarded-For` (enables per-visitor rate limits). When `false`, all visitors share one rate-limit bucket. |
| `UPLOAD_DRIVER` | | `local` (default) or `cloudinary` |
| `UPLOAD_DIR` | | Local upload folder (default `./storage/uploads`, outside `/public`) |
| `MAX_UPLOAD_MB` | | Max upload size (default 8) |
| `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION` | | Must be `true` to use local storage in production |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` / `_FOLDER` | with Cloudinary | Cloudinary credentials (server-side only) |
| `TEST_DATABASE_URL` | | Separate database for integration tests — **wiped on every test run** |
| `NEXT_PUBLIC_ANALYTICS_SRC` / `_DOMAIN` | | Optional privacy-friendly analytics script; nothing loads when empty |

No secret is exposed to the browser: only the optional `NEXT_PUBLIC_ANALYTICS_*` values are public by design.

## Database & migrations

- Schema: [prisma/schema.prisma](prisma/schema.prisma). Models: `AdminUser`, `AdminSession`, `RateLimitBucket`, `Category`, `Product`, `ProductCategory`, `ProductImage`, `ProductGemstone`, `ProductCertification`, `Enquiry`, `SiteSettings`, `ContentPage`.
- Money uses `DECIMAL(12,2)`; the app formats and compares amounts as strings / integer paise — never floating point.
- Initial migration: [prisma/migrations](prisma/migrations).

| Task | Command |
| --- | --- |
| Create/apply migrations in development | `npm run db:migrate` |
| Apply migrations in production | `npm run db:deploy` |
| Seed starter categories, settings, page templates and demo products (idempotent) | `npm run db:seed` |
| Remove all demo products | `npm run demo:remove` |
| Browse data | `npm run db:studio` |

## Creating the first admin account

There is **no public sign-up page**. The owner creates accounts from a terminal with database access:

```bash
npm run admin:create
```

You are prompted for email, name and password (the password is not echoed). Passwords need at least 12 characters mixing letters with numbers or symbols. The first account becomes the **owner**.

Reset a forgotten password (also signs out all of that admin's sessions):

```bash
npm run admin:reset-password
```

Non-interactive use (for example a one-off console on your hosting platform) — values are read from that command's environment only and never written to disk or the repository:

```bash
ADMIN_EMAIL=owner@example.com ADMIN_NAME="Owner" ADMIN_PASSWORD='…' npm run admin:create
```

Avoid leaving `ADMIN_PASSWORD` in shell history or in permanent platform environment variables.

## Image & file storage

All uploads go through `POST /api/admin/uploads` (admin session + same-origin check + rate limit):

1. File size is checked (default 8 MB).
2. The type is detected from the **file bytes** (JPEG, PNG, WebP, AVIF; PDF only for certificates). SVG, HTML, scripts and executables are rejected regardless of their name.
3. Images are decoded and **re-encoded to WebP** with `sharp` (auto-rotated, resized to ≤ 2400 px, EXIF/GPS removed).
4. Files get random UUID names; only URLs + metadata are stored in the database.

**Development (`UPLOAD_DRIVER=local`)** — files are written to `./storage/uploads` (git-ignored, outside `/public`) and served by `/media/[...path]` with `nosniff` and a strict per-file CSP.
Local storage is **refused in production** unless `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=true`, because most hosts (Vercel, containers) have ephemeral disks. Only enable it on a server with a persistent, backed-up disk.

**Production (`UPLOAD_DRIVER=cloudinary`)** — create a Cloudinary account, then set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Images are delivered from `res.cloudinary.com` through `next/image`.

## WhatsApp enquiry flow

1. The customer picks a quantity and can optionally add their name and a note.
2. The site builds a message containing product name, SKU, displayed price, quantity and product URL, and a closing request for availability, final price, shipping and payment details ([src/lib/whatsapp.ts](src/lib/whatsapp.ts)).
3. The link uses the click-to-chat format `https://wa.me/<number>?text=<URL-encoded message>`, with the number in international format (digits only).
4. WhatsApp opens in a new tab; **the customer reviews and sends the message themselves**.
5. If no valid WhatsApp number is configured, a friendly notice is shown instead of a broken link, and the admin dashboard lists it on the launch checklist.

WhatsApp conversations are **not** recorded in the admin dashboard automatically — the website cannot see them. Staff can log them via **Enquiries → Record enquiry**. Automatic capture would need the WhatsApp Business Platform (Cloud API) with webhooks, which is not part of this release.

The website enquiry form (contact page and every product page) **is** recorded: it validates on the server, uses a honeypot + minimum-fill-time check and a rate limit, asks for consent, and returns a reference number such as `VJ-260924-7KQ4M`.

## Testing, linting & type checking

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run typecheck
```

- **Unit tests** (always run): WhatsApp message building & URL encoding, money formatting, validation schemas (products, enquiries, settings, passwords), upload validation (magic bytes, size, SVG/HTML/executable rejection, safe names), catalogue search/filter/sort parsing, rate limiting, Argon2id hashing, safe Markdown links, and **admin authorisation** (every admin action and the upload route refuse to run without a valid session).
- **Integration tests** (run when `TEST_DATABASE_URL` is set): product create/edit/status changes, duplicate SKU and untrusted image rejection, public listing (published only), search/filter/sort/pagination, enquiry submission and management, settings updates, login, session validation/expiry and rate limiting. The test database schema is reset on every run, and the suite refuses to run if `TEST_DATABASE_URL` equals `DATABASE_URL`.

## Deployment

### Option A — Vercel (or similar) + managed PostgreSQL + Cloudinary

1. Provision PostgreSQL (e.g. Neon, Supabase, RDS) and Cloudinary.
2. Set environment variables: `DATABASE_URL`, `APP_URL=https://your-domain`, `UPLOAD_DRIVER=cloudinary`, the `CLOUDINARY_*` values, `TRUST_PROXY=true`.
3. Build command: `npm run build` (runs `prisma generate`). Run `npm run db:deploy` against the production database before (or as part of) each release.
4. Once: `npm run db:seed` (optional starter content) and `npm run admin:create` from a machine that can reach the database.

### Option B — Single Linux server (Node + PostgreSQL + Nginx)

```bash
npm ci
```

```bash
npm run db:deploy
```

```bash
npm run build
```

```bash
npm start
```

Run behind Nginx/Caddy with HTTPS, set `TRUST_PROXY=true`, keep the Node process alive with systemd or pm2, and back up both the database and `UPLOAD_DIR` if using local storage.

### Before going live

- [ ] Real WhatsApp number, contact details, logo and address entered in **Admin → Settings**.
- [ ] Policy and About pages rewritten, legally reviewed and **approved** in **Admin → Pages & policies**.
- [ ] Demo products replaced (`npm run demo:remove`) and real photography uploaded.
- [ ] `APP_URL` set to the production domain (HTTPS).
- [ ] Cloudinary (or persistent storage) configured.
- [ ] Database backups enabled.
- [ ] Security review and penetration test performed on the deployed environment.

## Security notes

Implemented:
- Server-side authentication on every admin page, server action and API route (the middleware redirect is only a convenience).
- Argon2id password hashing; generic login errors; timing-equalised checks for unknown emails; per-IP and per-email rate limits; account lockout after 10 failures.
- Random 256-bit session tokens, stored only as SHA-256 hashes; `HttpOnly`, `Secure` (production), `SameSite=Strict`, `__Host-` prefixed cookie in production; logout and password changes revoke sessions.
- Zod validation on client **and** server; Prisma parameterised queries; admin-supplied image URLs must point to storage we control.
- Upload validation by magic bytes, re-encoding, random names, no SVG/HTML, per-admin upload rate limit, same-origin check.
- Nonce-based Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, permissions policy, HSTS in production; admin pages `noindex` + `no-store`.
- No `dangerouslySetInnerHTML` for user content (the only use is JSON-LD with `<` escaped); editable pages use a safe Markdown subset with protocol-checked links.
- Logs never include passwords, tokens or enquiry contents.

This codebase has **not** been penetration-tested and is **not** claimed to be production-secure until deployed with HTTPS, reviewed and tested in its real environment.

## Project structure

```
prisma/                 schema, migrations, seed (demo content)
public/demo/            generated placeholder artwork (replace with real photos)
scripts/                create-admin, remove-demo-content, generate-placeholders
src/app/(site)/         storefront pages (home, shop, product, about, contact, policies)
src/app/admin/          login, dashboard, products, categories, enquiries, content, settings, account + server actions
src/app/api/admin/      authenticated upload endpoint
src/app/media/          local upload file server (development / single server)
src/components/         UI: site chrome, product, shop, forms, admin
src/lib/                env, db, auth, catalogue queries/filters, services, uploads, validation, whatsapp, money
tests/                  unit and integration tests
```

---

## Information still required from the client

- Final **logo** files (SVG/PNG, light and dark versions) and brand colours/fonts if different from the temporary identity.
- **WhatsApp Business number** (international format) and whether a separate phone line is used.
- Business **email**, **address**, **business hours** and **Google Maps link**.
- **Instagram**, Facebook, YouTube, Pinterest URLs (whichever apply).
- **Brand story**, About-page content (history, craftsmanship, values, gemstone expertise).
- Approved **policies**: shipping & delivery, returns/refunds/exchanges, privacy, terms & conditions, jewellery care — ideally reviewed by a legal adviser.
- **Product catalogue**: photographs (consistent 4:5 portrait crops recommended), names, SKUs, prices (and whether prices include tax/making charges), materials, metal purity and weights, sizes, gemstone details, hallmark details, certificates (issuer, number, scans) and stock status.
- Final **category** list and category images.
- Trust/service statements the business is willing to promise (e.g. certification, insurance, exchange policy).
- **Production domain** and hosting preference.
- Whether an analytics tool should be used (and consent requirements).

## Incomplete integrations & production prerequisites

- **Payments, cart, checkout, customer accounts, wishlist** — out of scope for this release. The data model (DECIMAL prices, product/enquiry separation, `AdminRole`) is ready to extend.
- **WhatsApp Business API** — not integrated; WhatsApp chats are not captured automatically. Manual recording is available.
- **Email notifications** for new website enquiries — not configured (needs an email provider such as Resend/SES/SMTP).
- **Cloud image storage** — Cloudinary support is implemented but needs an account and credentials.
- **Rate limiting** — stored in PostgreSQL (works across instances). For very high traffic, move to Redis. Set `TRUST_PROXY=true` behind a proxy so limits apply per visitor.
- **Analytics** — only the hook exists (`NEXT_PUBLIC_ANALYTICS_SRC`); choose a privacy-friendly provider and add a consent flow if required.
- **Backups, monitoring and error reporting** — to be configured on the hosting platform.
- **Legal review** of all policy pages and the privacy notice.
- **Accessibility audit** with real assistive technology and a **security review / penetration test** on the deployed site.
- Placeholder artwork in `public/demo` is original, procedurally generated illustration — replace it with real photography.
