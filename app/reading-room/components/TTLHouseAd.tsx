"use client";

/**
 * TTLHouseAd.tsx — the-reading-room
 * ─────────────────────────────────────────────────────────────────
 * TTL's own ads. Fills every ad space (skyscrapers, the hero ad
 * window, the chapter gate) with rotating TTL promos, so no slot is
 * ever blank. When AdSense is approved, its code goes in these same
 * spaces.
 *
 *   <TTLHouseAd width={160} height={600} />   skyscraper
 *   <TTLHouseAd width={300} height={500} />   hero ad window
 *   <TTLHouseAd width={300} height={250} />   chapter gate
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";

type Promo = { eyebrow: string; headline: string; body: string; cta: string; href: string };

const PROMOS: Promo[] = [
  {
    eyebrow: "The Creators Room",
    headline: "Write for the Library",
    body: "Keep your copyright. Earn from every chapter readers unlock.",
    cta: "Apply",
    href: "https://write.the-tiniest-library.com/apply",
  },
  {
    eyebrow: "The Galleria",
    headline: "Comics, manga & webtoons",
    body: "Original series from independent artists.",
    cta: "Visit",
    href: "https://artists.the-tiniest-library.com",
  },
  {
    eyebrow: "The Reading Room",
    headline: "Find your next serial",
    body: "Free chapters from writers who own their work.",
    cta: "Browse",
    href: "/reading-room/stories",
  },
];

const STYLES = `
  .tha-card {
    position: relative; box-sizing: border-box; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    gap: 12px; padding: 18px 14px; text-align: center; text-decoration: none;
    background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.18) 0%, transparent 60%), #1A1612;
    border: 1px solid rgba(201,168,76,0.45); border-radius: 10px;
    color: #F4EEDF;
    transition: border-color 0.2s, transform 0.2s;
  }
  .tha-card:hover { border-color: #C9A84C; transform: translateY(-2px); }
  .tha-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; animation: tha-in 0.6s ease; }
  @keyframes tha-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .tha-mark {
    width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
    border: 1px solid #C9A84C; border-radius: 50%;
    font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: #C9A84C;
  }
  .tha-eyebrow {
    font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase; color: #C9A84C;
  }
  .tha-headline {
    font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600;
    font-size: 26px; line-height: 1.1; color: #F4EEDF;
  }
  .tha-body { font-family: 'Syne', sans-serif; font-size: 12px; line-height: 1.55; color: rgba(244,238,223,0.72); }
  .tha-cta {
    margin-top: 4px; padding: 8px 14px;
    background: linear-gradient(135deg, #C9A84C, #8a6510); color: #1A1612;
    border-radius: 6px; font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
  }
  .tha-narrow .tha-headline { font-size: 22px; }
  .tha-narrow .tha-body { font-size: 11px; }
  .tha-short { gap: 8px; padding: 14px; }
  .tha-short .tha-inner { gap: 7px; }
  .tha-short .tha-mark { display: none; }
  .tha-short .tha-headline { font-size: 22px; }
  .tha-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 5px; }
  .tha-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(201,168,76,0.3); }
  .tha-dot.on { background: #C9A84C; }
`;

export default function TTLHouseAd({ width = 300, height = 250 }: { width?: number; height?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % PROMOS.length), 7000);
    return () => clearInterval(t);
  }, []);

  const p = PROMOS[i];
  const shape = `${width < 200 ? " tha-narrow" : ""}${height < 300 ? " tha-short" : ""}`;
  const external = p.href.startsWith("http");

  return (
    <a
      className={`tha-card${shape}`}
      href={p.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener" : undefined}
      style={{ width, height }}
      aria-label={`${p.headline} — ${p.cta}`}
    >
      <style>{STYLES}</style>
      <div className="tha-inner" key={i}>
        <span className="tha-mark">TTL</span>
        <span className="tha-eyebrow">{p.eyebrow}</span>
        <span className="tha-headline">{p.headline}</span>
        <span className="tha-body">{p.body}</span>
        <span className="tha-cta">{p.cta} →</span>
      </div>
      <div className="tha-dots">
        {PROMOS.map((_, n) => <span key={n} className={`tha-dot${n === i ? " on" : ""}`} />)}
      </div>
    </a>
  );
}