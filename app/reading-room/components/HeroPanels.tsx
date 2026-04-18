'use client'
import { useState, useEffect } from 'react'

const SPONSOR_ADS = [
  {
    type: 'sponsor',
    eyebrow: 'FEATURED SPONSOR',
    headline: 'Your Brand Here',
    body: 'Reach thousands of passionate readers and writers. Premium placement on The Tiniest Library.',
    cta: 'Advertise With Us →',
    href: 'mailto:hello@the-tiniest-library.com?subject=Sponsorship',
    bg: '#0e0c0a',
    accent: '#C9A84C',
  },
  {
    type: 'sponsor',
    eyebrow: 'FOR WRITERS',
    headline: 'Scrivener',
    body: 'The writing app built for long-form fiction. Trusted by novelists worldwide.',
    cta: 'Try Free →',
    href: 'https://www.literatureandlatte.com/scrivener',
    bg: '#0e0c0a',
    accent: '#C9A84C',
  },
]

const HOUSE_ADS = [
  {
    type: 'house',
    eyebrow: 'THE WRITER\'S ROOM',
    headline: 'Are You\nA Writer?',
    body: 'Join the Founding 100. Keep your copyright. Earn from every chapter.',
    cta: 'Apply Now →',
    href: 'https://write.the-tiniest-library.com/apply',
    bg: '#0a0e0c',
    accent: '#6495ED',
  },
  {
    type: 'house',
    eyebrow: 'THE RED ROOM',
    headline: 'Adult\nFiction',
    body: 'A candlelit room for stories other platforms are afraid of. 18+ only.',
    cta: 'Enter →',
    href: 'https://redroom.the-tiniest-library.com',
    bg: '#0e0a0a',
    accent: '#9B2335',
  },
  {
    type: 'house',
    eyebrow: 'INK ECONOMY',
    headline: 'Support\nWriters',
    body: 'Buy Ink and unlock stories. 100% of tips go directly to the writer.',
    cta: 'Buy Ink →',
    href: '/reading-room/buy-ink',
    bg: '#0e0c0a',
    accent: '#C9A84C',
  },
]

function AdPanel({ ads, side }: { ads: typeof SPONSOR_ADS, side: 'left' | 'right' }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % ads.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [ads.length])

  const ad = ads[idx]

  return (
    <div style={{
      background: ad.bg,
      border: `1px solid ${ad.accent}33`,
      borderRadius: 12,
      padding: '40px 28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      minHeight: 520,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.6s ease',
    }}>
      {/* Glow corner */}
      <div style={{
        position: 'absolute',
        top: 0,
        [side === 'left' ? 'right' : 'left']: 0,
        width: 180,
        height: 180,
        background: `radial-gradient(circle, ${ad.accent}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div>
        {/* Eyebrow */}
        <span style={{
          display: 'inline-block',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: ad.accent,
          border: `1px solid ${ad.accent}44`,
          borderRadius: 20,
          padding: '3px 10px',
          marginBottom: 28,
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>{ad.eyebrow}</span>

        {/* Headline */}
        <div style={{
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          fontWeight: 300,
          lineHeight: 1.05,
          color: '#f0ece2',
          marginBottom: 20,
          fontFamily: 'var(--font-playfair, serif)',
          whiteSpace: 'pre-line',
        }}>{ad.headline}</div>

        {/* Body */}
        <p style={{
          fontSize: 13,
          lineHeight: 1.75,
          color: '#8a8070',
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>{ad.body}</p>
      </div>

      <div>
        {/* CTA */}
        <a href={ad.href} target={ad.href.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 22px',
            borderRadius: 999,
            background: ad.accent,
            color: '#000',
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-inter, sans-serif)',
            marginBottom: 20,
          }}>{ad.cta}</a>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6 }}>
          {ads.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === idx ? ad.accent : `${ad.accent}44`,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function LeftAdPanel() {
  return <AdPanel ads={SPONSOR_ADS} side="left" />
}

export function RightAdPanel() {
  return <AdPanel ads={HOUSE_ADS} side="right" />
}