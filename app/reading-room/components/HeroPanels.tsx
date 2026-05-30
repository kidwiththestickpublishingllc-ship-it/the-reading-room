'use client'
import { useState, useEffect, useRef } from 'react'

// =========================
// Adsterra Banner (atOptions iframe) — reusable, any size
// =========================
function AdsterraBanner({ adKey, width, height, onFill }: { adKey: string; width: number; height: number; onFill?: (filled: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted || !ref.current) return;
    if (ref.current.querySelector('iframe') || ref.current.querySelector('script')) return;
    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.text = `atOptions = { 'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{} };`;
    const inv = document.createElement('script');
    inv.type = 'text/javascript';
    inv.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    inv.onerror = () => onFill?.(false);
    ref.current.appendChild(conf);
    ref.current.appendChild(inv);
    const timer = setTimeout(() => {
      const iframe = ref.current?.querySelector('iframe');
      onFill?.(!!iframe && iframe.clientHeight > 10);
    }, 4000);
    return () => clearTimeout(timer);
  }, [mounted, adKey, width, height, onFill]);
  if (!mounted) return <div style={{ width, height }} />;
  return <div ref={ref} style={{ width, height, overflow: 'hidden' }} />;
}

// =========================
// Adsterra Native Banner — reusable, self-contained
// =========================
function AdsterraNative({ scriptSrc, containerId }: { scriptSrc: string; containerId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    // Avoid double-injecting on re-render
    if (ref.current.querySelector('script')) return;
    const container = document.createElement('div');
    container.id = containerId;
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = scriptSrc;
    ref.current.appendChild(container);
    ref.current.appendChild(script);
  }, [scriptSrc, containerId]);
  return <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />;
}

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
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: '#6495ED',
        border: '1px solid rgba(100,149,237,0.3)',
        borderRadius: 20,
        padding: '2px 10px',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}>SPONSORED</span>

      <AdsterraBanner
        adKey="7bda6115e949728e7480cea4662de9ce"
        width={300}
        height={250}
      />
    </div>
  )
}
export function RightAdPanel() {
  return <ShelfPanel ads={HOUSE_ADS} side="right" />
}