'use client'
import { useState, useEffect } from 'react'

const SPONSOR_ADS = [
  {
    eyebrow: 'FEATURED SPONSOR',
    headline: 'Your Brand Here',
    body: 'Reach thousands of passionate readers and writers. Premium placement on The Tiniest Library.',
    cta: 'Advertise With Us →',
    href: 'mailto:hello@the-tiniest-library.com?subject=Sponsorship',
  },
  {
    eyebrow: 'FOR WRITERS',
    headline: 'Scrivener',
    body: 'The writing app built for long-form fiction. Trusted by novelists worldwide.',
    cta: 'Try Free →',
    href: 'https://www.literatureandlatte.com/scrivener',
  },
]

const HOUSE_ADS = [
  {
    eyebrow: "THE WRITER'S ROOM",
    headline: 'Join the\nFounding 100',
    body: 'Keep your copyright. Earn from every chapter you publish.',
    cta: 'Apply Now →',
    href: 'https://write.the-tiniest-library.com/apply',
  },
  {
    eyebrow: 'THE RED ROOM',
    headline: 'Adult\nFiction',
    body: 'A candlelit room for stories other platforms are afraid of. 18+ only.',
    cta: 'Enter →',
    href: 'https://redroom.the-tiniest-library.com',
  },
  {
    eyebrow: 'INK ECONOMY',
    headline: 'Support\nWriters',
    body: 'Buy Ink and unlock stories. 100% of tips go directly to the writer.',
    cta: 'Buy Ink →',
    href: '/reading-room/buy-ink',
  },
]

const SHELF_LINES = [0, 1, 2]

function ShelfPanel({ ads, side }: { ads: typeof SPONSOR_ADS, side: 'left' | 'right' }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ads.length), 5000)
    return () => clearInterval(t)
  }, [ads.length])

  const ad = ads[idx]

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(201,168,76,0.03)',
      border: '1px solid rgba(201,168,76,0.25)',
      borderRadius: 12,
      padding: '28px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
    justifyContent: 'flex-start',
gap: 16,
minHeight: 0,
height: '100%',
    }}>

      {/* Bookshelf lines */}
      {SHELF_LINES.map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 60 + (i * 90),
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15), rgba(100,149,237,0.1), transparent)',
          pointerEvents: 'none',
        }} />
      ))}

      {/* Corner accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        [side === 'left' ? 'right' : 'left']: 0,
        width: 60,
        height: 60,
        background: 'radial-gradient(circle, rgba(100,149,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div>
        {/* Eyebrow */}
        <span style={{
          display: 'inline-block',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: '#6495ED',
          border: '1px solid rgba(100,149,237,0.3)',
          borderRadius: 20,
          padding: '2px 10px',
          marginBottom: 16,
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>{ad.eyebrow}</span>

        {/* Headline */}
        <div style={{
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.2,
          color: '#1a1008',
          marginBottom: 12,
          fontFamily: 'var(--font-playfair, serif)',
          whiteSpace: 'pre-line',
        }}>{ad.headline}</div>

        {/* Body */}
        <p style={{
          fontSize: 11,
          lineHeight: 1.7,
          color: '#6b5e4a',
          fontFamily: 'var(--font-inter, sans-serif)',
          margin: 0,
        }}>{ad.body}</p>
      </div>

      <div>
        {/* Gold shelf line above CTA */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, rgba(201,168,76,0.4), transparent)',
          marginBottom: 14,
        }} />

        {/* CTA button */}
        <a href={ad.href}
          target={ad.href.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '7px 16px',
            borderRadius: 999,
            background: 'transparent',
            border: '1px solid rgba(201,168,76,0.5)',
            color: '#C9A84C',
            fontSize: 10,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-inter, sans-serif)',
            marginBottom: 12,
          }}>{ad.cta}</a>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 5 }}>
          {ads.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 16 : 5,
              height: 5,
              borderRadius: 3,
              background: i === idx ? '#C9A84C' : 'rgba(201,168,76,0.25)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function LeftAdPanel() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://a.magsrv.com/ad-provider.js';
    script.async = true;
    script.type = 'application/javascript';
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(201,168,76,0.03)',
      border: '1px solid rgba(201,168,76,0.25)',
      borderRadius: 12,
      padding: '28px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 0,
      height: '100%',
      gap: 16,
    }}>
      <span style={{
        display: 'inline-block',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: '#6495ED',
        border: '1px solid rgba(100,149,237,0.3)',
        borderRadius: 20,
        padding: '2px 10px',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}>SPONSORED</span>

      <ins className="eas6a97888e2" data-zoneid="5906998"></ins>

      <script dangerouslySetInnerHTML={{
        __html: `(AdProvider = window.AdProvider || []).push({"serve": {}});`
      }} />
    </div>
  )
}
export function RightAdPanel() {
  return <ShelfPanel ads={HOUSE_ADS} side="right" />
}