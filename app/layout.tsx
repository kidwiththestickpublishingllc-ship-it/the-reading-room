import './globals.css'
import { Playfair_Display, Inter } from 'next/font/google'
import Script from 'next/script'
import PageChatWidget from "./components/PageChatWidget"
import WelcomeTour from "./components/WelcomeTour"
import { Analytics } from '@vercel/analytics/react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  metadataBase: new URL('https://read.the-tiniest-library.com'),
  title: {
    default: 'The Tiniest Library — Read Original Fiction, Support the Writers',
    template: '%s — The Tiniest Library',
  },
  description:
    'A home for original serial fiction where writers keep their copyright and earn from every chapter readers unlock. Discover new voices across every genre on The Tiniest Library.',
  keywords: ['serial fiction', 'read stories online', 'web fiction', 'original fiction', 'support writers', 'independent authors'],
  openGraph: {
    siteName: 'The Tiniest Library',
    type: 'website',
    title: 'The Tiniest Library — Read Original Fiction, Support the Writers',
    description: 'Original serial fiction where writers keep their copyright and earn from every unlock.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Tiniest Library',
    description: 'Original serial fiction where writers keep their copyright and earn from every unlock.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>        
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6696631641081046"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-inter bg-[#FAFAF8] text-[#111111]">
        {children}
        <PageChatWidget />
        <WelcomeTour />
        <Analytics />
      </body>
    </html>
  )
}