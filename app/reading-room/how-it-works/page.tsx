"use client";

import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";

// =========================
// Route: /reading-room/how-it-works
// =========================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --gold: #C9A84C;
    --gold-light: #E2C97E;
    --gold-dim: rgba(201,168,76,0.35);
    --gold-glow: rgba(201,168,76,0.12);
    --blue: #6495ED;
    --blue-dim: rgba(100,149,237,0.22);
    --blue-bright: #84b0f5;
    --teal: #2DD4BF;
    --red: #c94c4c;
    --ink-bg: #0a0805;
    --ink-surface: #110e0a;
    --ink-surface2: #1a1208;
    --ink-border: rgba(201,168,76,0.12);
    --ink-border-gold: rgba(201,168,76,0.3);
    --text-main: #f0ece2;
    --text-dim: rgba(240,236,226,0.6);
    --text-faint: rgba(240,236,226,0.3);
  }

  .hiw-root {
    min-height: 100vh;
    background: radial-gradient(ellipse at 60% 0%, #2a1508 0%, #1a0f07 30%, #0f0805 60%, #080503 100%);
    font-family: 'Syne', sans-serif;
    color: var(--text-main);
    overflow-x: hidden;
    position: relative;
  }

  .hiw-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: 0.4;
  }

  /* ── HERO ── */
  .hiw-hero {
    position: relative; z-index: 1;
    padding: 96px 40px 80px;
    text-align: center;
    border-bottom: 1px solid var(--ink-border-gold);
    background: linear-gradient(180deg, rgba(201,168,76,0.05) 0%, transparent 100%);
  }

  .hiw-hero-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase;
    color: var(--gold); display: block; margin-bottom: 20px; opacity: 0.85;
  }

  .hiw-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 8vw, 108px);
    font-weight: 300; line-height: 0.92;
    color: var(--text-main); margin-bottom: 28px;
  }

  .hiw-hero-title em {
    font-style: italic;
    background: linear-gradient(135deg, #C9A84C 0%, #FFE066 40%, #E2C97E 60%, #C9A84C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 2px 8px rgba(139,100,20,0.5));
  }

  .hiw-hero-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-style: italic;
    color: var(--text-dim); max-width: 600px;
    margin: 0 auto 48px; line-height: 1.7;
  }

  .hiw-hero-pills {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
  }

  .hiw-pill {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 8px 20px; border-radius: 999px;
    text-decoration: none; transition: all 0.2s;
  }

  .hiw-pill-gold {
    color: #000; background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none;
  }

  .hiw-pill-ghost {
    color: var(--gold-light);
    background: var(--gold-glow);
    border: 1px solid var(--gold-dim);
  }

  .hiw-pill-ghost:hover { background: rgba(201,168,76,0.2); }

  /* ── WRAP ── */
  .hiw-wrap {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 80px 40px 96px;
  }

  /* ── SECTION ── */
  .hiw-section { margin-bottom: 96px; }

  .hiw-section-label {
    display: flex; align-items: center; gap: 16px; margin-bottom: 48px;
  }

  .hiw-section-bar {
    width: 48px; height: 2px;
    background: var(--gold); flex-shrink: 0;
  }

  .hiw-section-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase;
    color: var(--gold); opacity: 0.8;
  }

  .hiw-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5vw, 56px); font-weight: 300;
    color: var(--text-main); line-height: 1; margin-bottom: 16px;
  }

  .hiw-section-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-style: italic;
    color: var(--text-dim); line-height: 1.7; max-width: 600px;
    margin-bottom: 48px;
  }

  .hiw-divider {
    height: 1px;
    background: linear-gradient(to right, var(--gold-dim), transparent);
    margin-bottom: 48px;
  }

  /* ── STEP CARDS ── */
  .hiw-steps {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    margin-bottom: 40px;
  }

  .hiw-step {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 16px; padding: 36px 28px;
    position: relative; overflow: hidden;
    transition: border-color 0.3s, transform 0.2s;
  }

  .hiw-step:hover {
    border-color: var(--gold-dim);
    transform: translateY(-4px);
  }

  .hiw-step::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    opacity: 0; transition: opacity 0.3s;
  }

  .hiw-step:hover::before { opacity: 1; }

  .hiw-step-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 72px; font-weight: 300;
    color: rgba(201,168,76,0.12); line-height: 1;
    margin-bottom: 16px; display: block;
  }

  .hiw-step-icon {
    font-size: 32px; display: block; margin-bottom: 16px;
  }

  .hiw-step-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 12px;
  }

  .hiw-step-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-style: italic;
    color: var(--text-dim); line-height: 1.7;
  }

  /* ── INK SECTION ── */
  .hiw-ink-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    margin-bottom: 32px;
  }

  .hiw-ink-card {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 16px; padding: 32px 28px;
    transition: border-color 0.2s;
  }

  .hiw-ink-card:hover { border-color: var(--gold-dim); }

  .hiw-ink-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
  }

  .hiw-ink-packs {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
  }

  .hiw-ink-pack {
    background: var(--ink-surface2);
    border: 1px solid var(--ink-border);
    border-radius: 10px; padding: 16px 14px;
    transition: all 0.2s;
  }

  .hiw-ink-pack:hover {
    border-color: var(--gold-dim);
    background: rgba(201,168,76,0.06);
  }

  .hiw-pack-label {
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--text-faint); margin-bottom: 6px;
  }

  .hiw-pack-ink {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: var(--gold); line-height: 1; margin-bottom: 2px;
  }

  .hiw-pack-price {
    font-size: 13px; font-weight: 700;
    color: var(--text-dim); margin-bottom: 4px;
  }

  .hiw-pack-note {
    font-size: 9px; letter-spacing: 0.08em;
    color: var(--text-faint);
  }

  .hiw-ink-spend-list {
    display: flex; flex-direction: column; gap: 12px;
  }

  .hiw-ink-spend-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px;
    background: var(--ink-surface2);
    border: 1px solid var(--ink-border);
    border-radius: 10px; transition: all 0.2s;
  }

  .hiw-ink-spend-item:hover { border-color: var(--gold-dim); }

  .hiw-ink-spend-icon { font-size: 20px; flex-shrink: 0; }

  .hiw-ink-spend-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-style: italic; color: var(--text-dim); flex: 1;
  }

  .hiw-ink-spend-cost {
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 700;
    color: var(--gold); white-space: nowrap;
  }

  /* ── ROOMS SECTION ── */
  .hiw-rooms {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    margin-bottom: 32px;
  }

  .hiw-room-card {
    border-radius: 16px; padding: 36px 28px;
    text-decoration: none; display: block;
    position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .hiw-room-card:hover { transform: translateY(-6px); }

  .hiw-room-reading {
    background: linear-gradient(135deg, #1a0f07 0%, #2a1508 100%);
    border: 1px solid rgba(201,168,76,0.3);
    box-shadow: 0 0 40px rgba(201,168,76,0.08);
  }

  .hiw-room-reading:hover {
    box-shadow: 0 20px 60px rgba(201,168,76,0.15);
  }

  .hiw-room-writers {
    background: linear-gradient(135deg, #0f0a1a 0%, #1a1030 100%);
    border: 1px solid rgba(100,149,237,0.3);
    box-shadow: 0 0 40px rgba(100,149,237,0.06);
  }

  .hiw-room-writers:hover {
    box-shadow: 0 20px 60px rgba(100,149,237,0.12);
  }

  .hiw-room-red {
    background: linear-gradient(135deg, #1a0505 0%, #2d0808 100%);
    border: 1px solid rgba(201,76,76,0.3);
    box-shadow: 0 0 40px rgba(201,76,76,0.06);
  }

  .hiw-room-red:hover {
    box-shadow: 0 20px 60px rgba(201,76,76,0.12);
  }

  .hiw-room-emoji {
    font-size: 36px; display: block; margin-bottom: 20px;
  }

  .hiw-room-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: var(--text-main); margin-bottom: 10px; line-height: 1.1;
  }

  .hiw-room-desc {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: var(--text-dim); line-height: 1.7;
    margin-bottom: 24px;
  }

  .hiw-room-features {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;
  }

  .hiw-room-feature {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: var(--text-dim);
    display: flex; align-items: center; gap: 8px;
  }

  .hiw-room-feature::before {
    content: '✦';
    font-size: 8px; color: var(--gold); flex-shrink: 0;
  }

  .hiw-room-cta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase;
    display: inline-flex; align-items: center; gap: 6px;
    transition: gap 0.2s;
  }

  .hiw-room-card:hover .hiw-room-cta { gap: 10px; }

  /* ── COMICS SECTION ── */
  .hiw-comics-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
    margin-bottom: 32px;
  }

  .hiw-comics-panel {
    background: var(--ink-surface);
    border: 1px solid rgba(45,212,191,0.2);
    border-radius: 16px; padding: 36px 28px;
    transition: border-color 0.2s, transform 0.2s;
  }

  .hiw-comics-panel:hover {
    border-color: rgba(45,212,191,0.5);
    transform: translateY(-4px);
  }

  .hiw-comics-accent {
    font-family: 'Syne', sans-serif;
    font-size: 9px; font-weight: 700; letter-spacing: 0.24em;
    text-transform: uppercase; color: #2DD4BF;
    margin-bottom: 12px; display: block;
  }

  .hiw-comics-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: var(--text-main); margin-bottom: 14px;
  }

  .hiw-comics-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-style: italic;
    color: var(--text-dim); line-height: 1.75;
    margin-bottom: 20px;
  }

  .hiw-comics-genres {
    display: flex; flex-wrap: wrap; gap: 6px;
  }

  .hiw-comics-tag {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase;
    color: #2DD4BF;
    border: 1px solid rgba(45,212,191,0.3);
    background: rgba(45,212,191,0.06);
    padding: 3px 10px; border-radius: 999px;
  }

  /* ── WRITER CTA ── */
  .hiw-writer-cta {
    background: linear-gradient(135deg, rgba(100,149,237,0.08), rgba(201,168,76,0.05));
    border: 1px solid rgba(100,149,237,0.2);
    border-radius: 20px; padding: 56px 48px;
    text-align: center; position: relative; overflow: hidden;
  }

  .hiw-writer-cta::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #6495ED, var(--gold), #6495ED, transparent);
  }

  .hiw-writer-cta-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--blue-bright); margin-bottom: 16px; display: block; opacity: 0.8;
  }

  .hiw-writer-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 5vw, 52px); font-weight: 300;
    color: var(--text-main); margin-bottom: 16px; line-height: 1.1;
  }

  .hiw-writer-cta-title em {
    font-style: italic; color: var(--blue-bright);
  }

  .hiw-writer-cta-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 19px; font-style: italic;
    color: var(--text-dim); max-width: 560px;
    margin: 0 auto 36px; line-height: 1.7;
  }

  .hiw-writer-perks {
    display: flex; gap: 32px; justify-content: center;
    flex-wrap: wrap; margin-bottom: 40px;
  }

  .hiw-writer-perk {
    text-align: center;
  }

  .hiw-writer-perk-icon { font-size: 28px; display: block; margin-bottom: 8px; }

  .hiw-writer-perk-text {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-dim);
  }

  .hiw-cta-buttons {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
  }

  .hiw-btn-primary {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #000;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none; padding: 14px 32px; border-radius: 8px;
    text-decoration: none; transition: opacity 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }

  .hiw-btn-primary:hover { opacity: 0.88; }

  .hiw-btn-blue {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #fff;
    background: #6495ED;
    border: none; padding: 14px 32px; border-radius: 8px;
    text-decoration: none; transition: opacity 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }

  .hiw-btn-blue:hover { opacity: 0.88; }

  .hiw-btn-ghost {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--text-dim);
    background: transparent;
    border: 1px solid rgba(240,236,226,0.15);
    padding: 14px 32px; border-radius: 8px;
    text-decoration: none; transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }

  .hiw-btn-ghost:hover {
    color: var(--gold-light);
    border-color: var(--gold-dim);
    background: var(--gold-glow);
  }

  /* ── FAQ ── */
  .hiw-faq { display: flex; flex-direction: column; gap: 12px; }

  .hiw-faq-item {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px; padding: 24px 28px;
    transition: border-color 0.2s;
  }

  .hiw-faq-item:hover { border-color: var(--gold-dim); }

  .hiw-faq-q {
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 700;
    color: var(--gold-light); margin-bottom: 10px;
    display: flex; align-items: flex-start; gap: 12px;
  }

  .hiw-faq-q::before {
    content: 'Q';
    font-size: 9px; letter-spacing: 0.1em;
    color: var(--gold); background: rgba(201,168,76,0.1);
    border: 1px solid var(--gold-dim);
    padding: 2px 7px; border-radius: 4px; flex-shrink: 0; margin-top: 2px;
  }

  .hiw-faq-a {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-style: italic;
    color: var(--text-dim); line-height: 1.75;
    padding-left: 32px;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .hiw-steps { grid-template-columns: 1fr; }
    .hiw-rooms { grid-template-columns: 1fr; }
    .hiw-ink-grid { grid-template-columns: 1fr; }
    .hiw-comics-grid { grid-template-columns: 1fr; }
    .hiw-wrap { padding: 56px 24px 80px; }
    .hiw-hero { padding: 72px 24px 56px; }
    .hiw-writer-cta { padding: 40px 24px; }
  }

  @media (max-width: 480px) {
    .hiw-hero-title { font-size: 44px; }
    .hiw-ink-packs { grid-template-columns: 1fr; }
  }
`;

export default function HowItWorksPage() {
  return (
    <>
      <style>{STYLES}</style>
      <TTLNav />
      <div style={{ height: 74 }} />

      <div className="hiw-root">

        {/* ── HERO ── */}
        <section className="hiw-hero">
          <span className="hiw-hero-eyebrow">The Tiniest Library — A Guide</span>
          <h1 className="hiw-hero-title">
            How <em>TTL</em><br />Works
          </h1>
          <p className="hiw-hero-sub">
            A literary platform built for readers who love stories, writers who deserve to be paid, and a community that believes fiction matters.
          </p>
          <div className="hiw-hero-pills">
            <a href="/reading-room/stories" className="hiw-pill hiw-pill-gold">Start Reading →</a>
            <a href="https://write.the-tiniest-library.com" className="hiw-pill hiw-pill-ghost">Apply to Write</a>
            <a href="/reading-room/buy-ink" className="hiw-pill hiw-pill-ghost">Buy Ink</a>
          </div>
        </section>

        <div className="hiw-wrap">

          {/* ── FOR READERS ── */}
          <section className="hiw-section">
            <div className="hiw-section-label">
              <div className="hiw-section-bar" />
              <span className="hiw-section-eyebrow">For Readers</span>
            </div>
            <h2 className="hiw-section-title">Read. Unlock. Support.</h2>
            <p className="hiw-section-sub">
              Every story on TTL starts free. You join, you get Ink, and you start reading. It's that simple.
            </p>
            <div className="hiw-divider" />

            <div className="hiw-steps">
              {[
                { num: "01", icon: "🪶", title: "Join Free", text: "Create your free account and receive 50 Ink immediately — enough to unlock 2 chapters from any story in the library." },
                { num: "02", icon: "📖", title: "Browse & Read", text: "Explore 24+ genres of prose fiction, comics, and manga from independent writers. Chapter 1 of every story is always free." },
                { num: "03", icon: "✒️", title: "Unlock with Ink", text: "Each chapter costs 25 Ink. Once unlocked, it's yours permanently — saved to your library forever, across all devices." },
                { num: "04", icon: "❤️", title: "Tip Writers", text: "Send Ink directly to the authors you love. 100% of every tip goes straight to the writer. No platform cut on tips." },
                { num: "05", icon: "💬", title: "Join the Community", text: "Share story picks, start discussions, and connect with other readers in the Members Room — your private literary clubhouse." },
                { num: "06", icon: "📚", title: "Build Your Library", text: "Every story you unlock lives on your permanent shelf. Track what you're reading, mark what you've finished, come back any time." },
              ].map(step => (
                <div key={step.num} className="hiw-step">
                  <span className="hiw-step-num">{step.num}</span>
                  <span className="hiw-step-icon">{step.icon}</span>
                  <div className="hiw-step-title">{step.title}</div>
                  <div className="hiw-step-text">{step.text}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── THE INK ECONOMY ── */}
          <section className="hiw-section">
            <div className="hiw-section-label">
              <div className="hiw-section-bar" />
              <span className="hiw-section-eyebrow">The Ink Economy</span>
            </div>
            <h2 className="hiw-section-title">What is Ink?</h2>
            <p className="hiw-section-sub">
              Ink is TTL's currency — simple, transparent, and designed to put money in writers' hands.
            </p>
            <div className="hiw-divider" />

            <div className="hiw-ink-grid">
              {/* Get Ink */}
              <div className="hiw-ink-card">
                <div className="hiw-ink-card-title">
                  <span>✒️</span> How to get Ink
                </div>
                <div className="hiw-ink-packs">
                  {[
                    { label: "Starter", ink: 100, price: "$1", note: "~4 chapters" },
                    { label: "Reader", ink: 750, price: "$5", note: "~30 chapters" },
                    { label: "Supporter", ink: 1500, price: "$10", note: "~60 chapters" },
                    { label: "Collector", ink: 3000, price: "$20", note: "~120 chapters" },
                  ].map(pack => (
                    <div key={pack.label} className="hiw-ink-pack">
                      <div className="hiw-pack-label">{pack.label}</div>
                      <div className="hiw-pack-ink">{pack.ink}</div>
                      <div className="hiw-pack-price">{pack.price}</div>
                      <div className="hiw-pack-note">{pack.note}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: "italic", color: "var(--text-faint)", marginTop: 20, lineHeight: 1.6 }}>
                  New members start with 50 free Ink. No credit card required.
                </p>
                <a href="/reading-room/buy-ink" style={{ display: "inline-block", marginTop: 20, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#000", background: "linear-gradient(135deg, #C9A84C, #8a6510)", padding: "10px 22px", borderRadius: 8, textDecoration: "none" }}>
                  Buy Ink →
                </a>
              </div>

              {/* Spend Ink */}
              <div className="hiw-ink-card">
                <div className="hiw-ink-card-title">
                  <span>📖</span> How to spend Ink
                </div>
                <div className="hiw-ink-spend-list">
                  {[
                    { icon: "📖", text: "Unlock a story chapter — yours forever", cost: "25 Ink" },
                    { icon: "🎨", text: "Unlock a comics or manga chapter", cost: "10 Ink" },
                    { icon: "❤️", text: "Tip a writer directly", cost: "Any amount" },
                    { icon: "🔓", text: "Early access chapters before public release", cost: "25 Ink" },
                    { icon: "⭐", text: "Exclusive Members Room content", cost: "Varies" },
                  ].map((item, i) => (
                    <div key={i} className="hiw-ink-spend-item">
                      <span className="hiw-ink-spend-icon">{item.icon}</span>
                      <span className="hiw-ink-spend-text">{item.text}</span>
                      <span className="hiw-ink-spend-cost">{item.cost}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: "italic", color: "var(--text-faint)", marginTop: 20, lineHeight: 1.6 }}>
                  70% of every chapter unlock goes directly to the writer. 100% of tips go to the writer.
                </p>
              </div>
            </div>
          </section>

          {/* ── THE THREE ROOMS ── */}
          <section className="hiw-section">
            <div className="hiw-section-label">
              <div className="hiw-section-bar" />
              <span className="hiw-section-eyebrow">Three Rooms</span>
            </div>
            <h2 className="hiw-section-title">The Library Has Three Doors</h2>
            <p className="hiw-section-sub">
              Each room is a distinct space with its own purpose, aesthetic, and community.
            </p>
            <div className="hiw-divider" />

            <div className="hiw-rooms">
              <a href="/reading-room" className="hiw-room-card hiw-room-reading">
                <span className="hiw-room-emoji">📚</span>
                <div className="hiw-room-name">The Reading Room</div>
                <div className="hiw-room-desc">
                  The main library. Prose fiction across 24 genres — from Romance and Sci-Fi to Dark Academia, Black Stories, and Indigenous Voices.
                </div>
                <div className="hiw-room-features">
                  <div className="hiw-room-feature">24+ genres of original fiction</div>
                  <div className="hiw-room-feature">Serialized chapters updated regularly</div>
                  <div className="hiw-room-feature">Author profiles and tip jars</div>
                  <div className="hiw-room-feature">50 free Ink for new members</div>
                </div>
                <div className="hiw-room-cta" style={{ color: "#C9A84C" }}>
                  Enter the Reading Room →
                </div>
              </a>

              <a href="https://write.the-tiniest-library.com" className="hiw-room-card hiw-room-writers">
                <span className="hiw-room-emoji">🪶</span>
                <div className="hiw-room-name">The Writer's Room</div>
                <div className="hiw-room-desc">
                  Where writers live. Apply, build your profile, submit chapters, track your earnings, and connect with your readers.
                </div>
                <div className="hiw-room-features">
                  <div className="hiw-room-feature">Apply to become a TTL author</div>
                  <div className="hiw-room-feature">Keep your copyright — always</div>
                  <div className="hiw-room-feature">Earn through the Ink economy</div>
                  <div className="hiw-room-feature">Founding 100 writers badge</div>
                </div>
                <div className="hiw-room-cta" style={{ color: "#84b0f5" }}>
                  Enter the Writer's Room →
                </div>
              </a>

              <a href="https://redroom.the-tiniest-library.com" className="hiw-room-card hiw-room-red">
                <span className="hiw-room-emoji">🚪</span>
                <div className="hiw-room-name">The Red Room</div>
                <div className="hiw-room-desc">
                  Adult fiction for grown readers. 29 genres of explicit content behind a verified age gate. Serious literary space, no softening of edges.
                </div>
                <div className="hiw-room-features">
                  <div className="hiw-room-feature">18+ age verified access only</div>
                  <div className="hiw-room-feature">29 adult genres</div>
                  <div className="hiw-room-feature">Same Ink economy applies</div>
                  <div className="hiw-room-feature">Separate community space</div>
                </div>
                <div className="hiw-room-cta" style={{ color: "#f87171" }}>
                  Enter the Red Room →
                </div>
              </a>
            </div>
          </section>

          {/* ── COMICS & MANGA ── */}
          <section className="hiw-section">
            <div className="hiw-section-label">
              <div className="hiw-section-bar" style={{ background: "#2DD4BF" }} />
              <span className="hiw-section-eyebrow" style={{ color: "#2DD4BF" }}>Visual Stories</span>
            </div>
            <h2 className="hiw-section-title">Comics & Manga</h2>
            <p className="hiw-section-sub">
              Panel by panel. Page by page. TTL supports visual storytellers — comics and manga from independent creators.
            </p>
            <div className="hiw-divider" />

            <div className="hiw-comics-grid">
              <div className="hiw-comics-panel">
                <span className="hiw-comics-accent">◈ Comics</span>
                <div className="hiw-comics-title">Western Comics</div>
                <div className="hiw-comics-text">
                  25 genres of original sequential art — from Superhero and Crime Noir to Biography, Steampunk, and Post-Apocalyptic. Each panel unlocks for 10 Ink.
                </div>
                <div className="hiw-comics-genres">
                  {["Superhero", "Crime Noir", "Horror", "Sci-Fi", "Fantasy", "Indie/Alt", "Biography", "Steampunk"].map(g => (
                    <span key={g} className="hiw-comics-tag">{g}</span>
                  ))}
                </div>
              </div>

              <div className="hiw-comics-panel">
                <span className="hiw-comics-accent">漫 Manga</span>
                <div className="hiw-comics-title">Manga</div>
                <div className="hiw-comics-text">
                  30 manga genres including Shounen, Shoujo, Seinen, Isekai, Mecha, Yaoi, Yuri, Magical Girl, and more. TTL supports manga creators from all backgrounds.
                </div>
                <div className="hiw-comics-genres">
                  {["Shounen", "Shoujo", "Seinen", "Isekai", "Mecha", "Magical Girl", "Psychological", "School Life"].map(g => (
                    <span key={g} className="hiw-comics-tag">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <a href="/reading-room/comics" className="hiw-btn-primary">
                Browse Comics & Manga →
              </a>
            </div>
          </section>

          {/* ── FOR WRITERS ── */}
          <section className="hiw-section">
            <div className="hiw-writer-cta">
              <span className="hiw-writer-cta-eyebrow">For Writers</span>
              <h2 className="hiw-writer-cta-title">
                Your words deserve<br /><em>a real home.</em>
              </h2>
              <p className="hiw-writer-cta-text">
                TTL is built for writers who are serious about their craft and serious about getting paid. No algorithms. No follower counts. Just readers who find your work and Ink that flows to your account.
              </p>

              <div className="hiw-writer-perks">
                {[
                  { icon: "©️", text: "Keep Your Copyright" },
                  { icon: "✒️", text: "Earn Through Ink" },
                  { icon: "🏅", text: "Founding 100 Badge" },
                  { icon: "📊", text: "Full Earnings Dashboard" },
                  { icon: "🪶", text: "Author Profile Page" },
                  { icon: "📖", text: "Serialized Chapters" },
                ].map(perk => (
                  <div key={perk.text} className="hiw-writer-perk">
                    <span className="hiw-writer-perk-icon">{perk.icon}</span>
                    <div className="hiw-writer-perk-text">{perk.text}</div>
                  </div>
                ))}
              </div>

              <div className="hiw-cta-buttons">
                <a href="https://write.the-tiniest-library.com" className="hiw-btn-blue">Apply to Write →</a>
                <a href="/reading-room/authors" className="hiw-btn-ghost">Meet Our Authors</a>
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="hiw-section">
            <div className="hiw-section-label">
              <div className="hiw-section-bar" />
              <span className="hiw-section-eyebrow">Questions</span>
            </div>
            <h2 className="hiw-section-title">Frequently Asked</h2>
            <div className="hiw-divider" />

            <div className="hiw-faq">
              {[
                {
                  q: "Is TTL free to use?",
                  a: "Yes. Reading Room access is free. Every new member receives 50 Ink to start — enough to unlock 2 chapters. You can also browse and read Chapter 1 of every story for free, forever."
                },
                {
                  q: "What happens to my unlocked stories if I cancel?",
                  a: "Nothing. Unlocked chapters are yours permanently. There's no subscription required to access content you've already unlocked. Your library is yours."
                },
                {
                  q: "How much do writers earn?",
                  a: "70% of every chapter unlock goes to the writer. 100% of every tip goes directly to the writer, with no platform cut. Writers can also see their full earnings dashboard in The Writer's Room."
                },
                {
                  q: "Can I submit my comics or manga to TTL?",
                  a: "Yes — TTL is actively looking for comics artists and manga creators. Apply through The Writer's Room. You keep your copyright and earn through the same Ink economy as prose writers."
                },
                {
                  q: "What is the Red Room?",
                  a: "The Red Room is TTL's adult fiction platform — 29 genres of explicit content behind a verified age gate. It uses the same Ink economy and writer support model as the Reading Room, but for 18+ content."
                },
                {
                  q: "How do I apply to write for TTL?",
                  a: "Head to The Writer's Room at write.the-tiniest-library.com and submit your application. The founding 100 writers receive a permanent badge and priority placement across the platform."
                },
              ].map((item, i) => (
                <div key={i} className="hiw-faq-item">
                  <div className="hiw-faq-q">{item.q}</div>
                  <div className="hiw-faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "var(--text-dim)", marginBottom: 32, lineHeight: 1.7 }}>
              Every story starts with a reader. Every reader starts here.
            </p>
            <div className="hiw-cta-buttons">
              <a href="/reading-room/login" className="hiw-btn-primary">Join Free — 50 Ink →</a>
              <a href="/reading-room/stories" className="hiw-btn-ghost">Browse Stories</a>
            </div>
          </section>

        </div>

        <TTLFooter />
      </div>
    </>
  );
}
