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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <meta name="6a97888e-site-verification" content="00ed2aa926fd6a0c5aec0314667770e6" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6696631641081046"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://a.magsrv.com/ad-provider.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-inter bg-[#FAFAF8] text-[#111111]">
        {children}
        <PageChatWidget />
        <WelcomeTour />
        <Analytics />
        <ins className="eas6a97888e17" data-zoneid="5907410"></ins>
        <Script
          id="exoclick-sticky-reading"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(AdProvider = window.AdProvider || []).push({"serve": {}});`
          }}
        />
      </body>
    </html>
  )
}