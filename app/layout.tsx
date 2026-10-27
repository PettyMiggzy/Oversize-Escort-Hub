import './globals.css'
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import PushInit from './components/PushInit'
import HelperChat from '@/components/HelperChat'
import NativeFlag from '@/components/NativeFlag'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oversize-escort-hub.com"),
  title: {
    default: "Oversize Escort Hub | P/EVO Escorts & Oversize Load Board",
    template: "%s | Oversize Escort Hub",
  },
  description: "The marketplace for oversize load carriers and P/EVO pilot car escorts. Post loads, find escorts, bid on jobs. No commissions. Flat subscription only.",
  keywords: [
    "oversize escort", "pilot car escort", "PEVO escort", "P/EVO operator",
    "oversize load board", "pilot car driver", "oversize load escort",
    "find pilot car escort", "oversize carrier", "oversize load carrier",
    "pilot car company", "oversize transport escort", "wide load escort",
    "oversize load marketplace", "escort driver", "oversize permit",
    "freight broker oversize", "oversize load job board", "deadhead minimizer",
    "oversize escort marketplace"
  ],
  authors: [{ name: "Oversize Escort Hub", url: "https://www.oversize-escort-hub.com" }],
  creator: "Oversize Escort Hub",
  publisher: "Oversize Escort Hub",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.oversize-escort-hub.com",
    siteName: "Oversize Escort Hub",
    title: "Oversize Escort Hub | P/EVO Escorts & Oversize Load Board",
    description: "The marketplace for oversize load carriers and P/EVO pilot car escorts. Post loads, find escorts, bid on jobs. No commissions. Flat subscription only.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Oversize Escort Hub - P/EVO Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oversize Escort Hub | P/EVO Escorts & Load Board",
    description: "The marketplace for oversize carriers and P/EVO escorts. No commissions. Post loads, find escorts, bid on jobs.",
    images: ["/og-image.png"],
    creator: "@OversizeEscort",
  },
  // Do NOT set a sitewide homepage canonical here — that would make every
  // route claim / as canonical. Per-page alternates.canonical (or Next's
  // metadataBase + path) should win instead.
  category: "Transportation & Logistics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Oversize Escort Hub",
              url: "https://www.oversize-escort-hub.com",
              description: "The marketplace for oversize load carriers and P/EVO pilot car escorts.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Oversize Escort Hub",
              url: "https://www.oversize-escort-hub.com",
              logo: "https://www.oversize-escort-hub.com/logo.png",
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@oversize-escort-hub.com",
                contactType: "Customer Support",
              },
              sameAs: ["https://www.facebook.com/oversizeescorthub"],
              description: "Marketplace connecting oversize load carriers with P/EVO pilot car escorts. Built by a former truck driver and pilot car escort.",
              foundingDate: "2026",
              founder: {
                "@type": "Person",
                name: "Brian Ahmed",
                jobTitle: "CEO & Founder",
              },
            }),
          }}
        />
      </head>
      <body style={{ margin: 0 }}><NativeFlag /><PushInit />{children}<HelperChat /><Analytics /></body>
    </html>
  );
}
