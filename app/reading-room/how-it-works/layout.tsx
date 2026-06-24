import type { Metadata } from "next";

/* ============================================================
   Server layout for /reading-room/how-it-works
   The page is a client component (can't export metadata),
   so this layout supplies its SEO. Targets the high-intent
   writer-recruitment searches TTL uniquely answers:
   pays writers, keep copyright, Wattpad/Royal Road alternative.
============================================================ */

const title =
  "How It Works — Publish Fiction, Keep Your Copyright, Earn Every Chapter";

const description =
  "The Tiniest Library pays writers 70–80% and lets them keep full copyright. Readers unlock chapters with Ink, and 100% of tips go straight to authors. A fairer home for serial fiction than Wattpad or Royal Road.";

const url = "https://read.the-tiniest-library.com/reading-room/how-it-works";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "publish fiction online",
    "platform that pays writers",
    "keep copyright publishing",
    "Wattpad alternative that pays",
    "Royal Road alternative",
    "earn money writing serial fiction",
    "pay per chapter reading",
    "support writers directly",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "How The Tiniest Library Works — A Fairer Home for Writers",
    description,
    url,
    type: "website",
    siteName: "The Tiniest Library",
  },
  twitter: {
    card: "summary_large_image",
    title: "How The Tiniest Library Works",
    description,
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
