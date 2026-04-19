import './globals.css'
import { Playfair_Display, Inter } from 'next/font/google'
import Script from 'next/script'
import PageChatWidget from "./components/PageChatWidget";
import WelcomeTour from "./components/WelcomeTour";

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
      </body>
    </html>
  )
}