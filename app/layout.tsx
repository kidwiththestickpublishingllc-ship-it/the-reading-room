import './globals.css'
import { Playfair_Display, Inter } from 'next/font/google'
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
      <body className="font-inter bg-[#FAFAF8] text-[#111111]">
        {children}
        <PageChatWidget />
        <WelcomeTour />
      </body>
    </html>
  )
}
