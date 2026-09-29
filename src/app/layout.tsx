import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "VIVIDHUM JEWELLERY — Fine Jewellery & Gemstones",
    template: "%s | VIVIDHUM JEWELLERY",
  },
  description:
    "Discover fine jewellery and gemstones from VIVIDHUM JEWELLERY. Browse necklaces, earrings, rings, bangles and gemstones, and enquire directly on WhatsApp.",
  applicationName: "VIVIDHUM JEWELLERY",
  openGraph: {
    type: "website",
    siteName: "VIVIDHUM JEWELLERY",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/brand/vividham-icon.png", apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0e3b2e",
  width: "device-width",
  initialScale: 1,
};

/**
 * Optional, privacy-friendly analytics (e.g. self-hosted Plausible/Umami). Nothing is
 * loaded unless NEXT_PUBLIC_ANALYTICS_SRC is set; no cookies or personal data are added by this app.
 */
async function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  if (!src) return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <script defer src={src} data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || undefined} nonce={nonce} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
