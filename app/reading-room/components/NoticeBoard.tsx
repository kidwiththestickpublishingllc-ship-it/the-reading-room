"use client";

// app/reading-room/components/NoticeBoard.tsx
// The three notice panels, lifted out of HowItWorks and given objects:
//   New This Week → polaroids taped to a dry-erase board
//   Community     → post-it notes on cork (real comments when they exist)
//   Live          → a laptop screen
// Prefix: nb-

import React from "react";

type Story = {
  slug: string;
  title: string;
  author: string;
  cover?: string | null;
};

type Note = {
  body: string;
  name: string;
};

interface NoticeBoardProps {
  stories: Story[];
  notes?: Note[];          // real reader comments, when wired up
}

// Shown until real comments exist. The board's own rules, in TTL's voice -
// not invented readers.
const HOUSE_RULES: Note[] = [
  { body: "First chapter is always free. Read it before you spend a thing.", name: "The Library" },
  { body: "Say what you thought — writers read every note on this board.", name: "The Library" },
  { body: "Spoilers behind a line break, please. Somebody's on chapter one.", name: "House Rules" },
  { body: "Be kind. This is somebody's first draft made public.", name: "House Rules" },
];

const STYLES = `
  .nb-stack { display: flex; flex-direction: column; gap: 30px; }

  /* ── shared ────────────────────────────────────────────── */
  .nb-hand {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    line-height: 1;
    margin: 0 0 18px;
  }
  .nb-tape {
    position: absolute; top: -9px; left: 50%; margin-left: -26px;
    width: 52px; height: 18px; transform: rotate(-2.5deg);
    background: rgba(214,201,164,0.72);
    border-left: 1px solid rgba(46,41,34,0.14);
    border-right: 1px solid rgba(46,41,34,0.14);
    z-index: 2;
  }

  /* ── 1. dry-erase board ────────────────────────────────── */
  .nb-wb {
    position: relative;
    background: #F7F7F4;
    background-image: linear-gradient(177deg, rgba(255,255,255,0.92), rgba(226,229,227,0.5));
    border: 12px solid #2A2A28;
    border-radius: 14px;
    padding: 24px 24px 18px;
    box-shadow:
      0 16px 34px var(--surface-shadow),
      inset 0 1px 0 rgba(255,255,255,0.95),
      inset 0 -20px 34px rgba(0,0,0,0.05);
  }
  :root[data-theme="dark"] .nb-wb {
    background: #22312B; background-image: none; border-color: #4A3A28;
    box-shadow: 0 16px 34px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3);
  }
  .nb-wb-title { font-size: 31px; color: #16161A; }
  :root[data-theme="dark"] .nb-wb-title { color: #F2EFE6; }
  .nb-wb-sub {
    font-family: 'Caveat', cursive; font-size: 19px;
    color: #9E3030; margin: -12px 0 20px;
  }
  :root[data-theme="dark"] .nb-wb-sub { color: #E8A0A0; }

  .nb-polas {
    display: flex; gap: 24px; overflow-x: auto;
    padding: 12px 4px 20px; scrollbar-width: thin;
  }
  .nb-pola {
    position: relative; flex-shrink: 0; width: 176px;
    background: #FFFFFF; padding: 11px 11px 0;
    box-shadow: 0 8px 20px rgba(0,0,0,0.26);
    text-decoration: none; display: block;
    transition: transform 0.2s ease;
  }
  .nb-pola:nth-child(odd) { transform: rotate(-1.6deg); }
  .nb-pola:nth-child(even) { transform: rotate(1.3deg); }
  .nb-pola:hover { transform: rotate(0deg) translateY(-5px); }
  .nb-pola-img {
    aspect-ratio: 1 / 1; width: 100%;
    background: #1E1A17; overflow: hidden;
    display: flex; align-items: flex-end; padding: 10px;
    box-sizing: border-box;
  }
  .nb-pola-img img { width: 100%; height: 100%; object-fit: cover; }
  .nb-pola-ghost {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15px; line-height: 1.2; color: rgba(244,241,234,0.72);
  }
  .nb-pola-cap {
    font-family: 'Caveat', cursive; font-weight: 600;
    padding: 11px 3px 15px; color: #141414; line-height: 1.15;
  }
  .nb-pola-t { font-size: 19px; display: block; }
  .nb-pola-a { font-size: 15px; color: #55504A; }
  .nb-pola-empty {
    flex-shrink: 0; width: 176px; min-height: 230px;
    border: 2px dashed rgba(40,40,40,0.28); border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 18px;
    font-family: 'Caveat', cursive; font-size: 18px; color: #4A4A4A;
  }
  :root[data-theme="dark"] .nb-pola-empty { border-color: rgba(240,236,226,0.3); color: #CFC9BB; }

  /* ── 2. cork board ─────────────────────────────────────── */
  .nb-cork {
    --cork: #C2995F; --cork-frame: #A9762F;
    position: relative;
    border: 14px solid var(--cork-frame); border-radius: 3px;
    padding: 30px 26px 34px;
    background-color: var(--cork);
    background-image:
      radial-gradient(circle at 18% 28%, rgba(0,0,0,0.055) 0.9px, transparent 1.1px),
      radial-gradient(circle at 68% 62%, rgba(0,0,0,0.045) 0.8px, transparent 1px);
    background-size: 13px 13px, 19px 19px;
    box-shadow: 0 14px 34px var(--surface-shadow), inset 0 0 60px rgba(0,0,0,0.14);
  }
  :root[data-theme="dark"] .nb-cork { --cork: #3B2E20; --cork-frame: #241A11; }
  .nb-cork-title { font-size: 29px; color: #2B1E0E; }
  :root[data-theme="dark"] .nb-cork-title { color: #EFE7D7; }

  .nb-notes { display: flex; flex-wrap: wrap; gap: 20px; }
  .nb-note {
    position: relative; width: 186px; min-height: 162px;
    padding: 20px 16px 16px; box-sizing: border-box;
    font-family: 'Caveat', cursive; font-size: 18px; line-height: 1.32;
    color: #241F10;
    box-shadow: 3px 7px 14px rgba(0,0,0,0.3);
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .nb-note:nth-child(4n+1) { background: #F4E07C; transform: rotate(-1.8deg); }
  .nb-note:nth-child(4n+2) { background: #F6B8C8; transform: rotate(1.4deg); }
  .nb-note:nth-child(4n+3) { background: #A9D9F2; transform: rotate(-0.9deg); }
  .nb-note:nth-child(4n+4) { background: #BFE3AE; transform: rotate(1.9deg); }
  .nb-note-pin {
    position: absolute; top: -8px; left: 50%; margin-left: -7px;
    width: 14px; height: 14px; border-radius: 50%;
    background: radial-gradient(circle at 34% 30%, #ffffff99, #8E2020 60%, #00000055);
    box-shadow: 0 3px 5px rgba(0,0,0,0.45);
  }
  .nb-note-by {
    font-size: 14px; margin-top: 12px;
    color: rgba(36,31,16,0.62); font-weight: 700;
  }

  /* ── 3. laptop ─────────────────────────────────────────── */
  .nb-lap { max-width: 580px; margin: 0 auto; }
  .nb-lap-lid {
    background: #2B2E33; border-radius: 13px 13px 5px 5px;
    padding: 14px 14px 18px;
    box-shadow: 0 16px 34px var(--surface-shadow);
  }
  .nb-lap-cam {
    width: 6px; height: 6px; border-radius: 50%;
    background: #15171A; margin: 0 auto 10px;
    box-shadow: inset 0 0 2px #000;
  }
  .nb-lap-screen {
    background: #121418; border-radius: 4px;
    padding: 16px 18px; min-height: 210px;
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    overflow: hidden;
  }
  .nb-lap-bar {
    display: flex; align-items: center; gap: 8px;
    padding-bottom: 10px; margin-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.09);
  }
  .nb-dot { width: 7px; height: 7px; border-radius: 50%; }
  .nb-lap-label {
    margin-left: 4px; font-size: 9px; letter-spacing: 0.2em;
    text-transform: uppercase; color: rgba(236,232,222,0.5);
  }
  .nb-lap-row {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 0; font-size: 11.5px; color: rgba(236,232,222,0.62);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    text-decoration: none;
  }
  .nb-lap-row b { color: #ECE8DE; font-weight: 600; }
  .nb-live { width: 6px; height: 6px; border-radius: 50%; background: #5BD98A; box-shadow: 0 0 6px #5BD98A; flex-shrink: 0; }
  .nb-lap-standby { padding: 26px 4px; color: rgba(236,232,222,0.5); font-size: 12px; line-height: 1.9; }
  .nb-cursor {
    display: inline-block; width: 7px; height: 14px;
    background: #5BD98A; vertical-align: -2px; margin-left: 4px;
    animation: nbBlink 1.1s steps(1) infinite;
  }
  @keyframes nbBlink { 50% { opacity: 0; } }
  .nb-lap-base {
    height: 13px; width: 116%; margin-left: -8%;
    background: linear-gradient(#C8CCD1, #8C9299);
    border-radius: 0 0 11px 11px;
    box-shadow: 0 7px 14px rgba(0,0,0,0.26);
  }
  .nb-lap-notch {
    width: 86px; height: 5px; margin: 0 auto;
    background: rgba(0,0,0,0.18); border-radius: 0 0 5px 5px;
  }

  .nb-foot {
    display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; justify-content: center; padding-top: 4px;
  }

  @media (max-width: 760px) {
    .nb-cork { padding: 20px 14px 24px; border-width: 10px; }
    .nb-note { width: 100%; }
    .nb-note, .nb-pola { transform: none !important; }
  }
`;

export default function NoticeBoard({ stories, notes }: NoticeBoardProps) {
  const fresh = stories.slice(0, 6);
  const pinned = notes && notes.length ? notes : HOUSE_RULES;

  return (
    <div className="nb-stack">
      <style>{STYLES}</style>

      {/* ── New This Week ── */}
      <section className="nb-wb">
        <h2 className="nb-hand nb-wb-title">New this week</h2>
        <div className="nb-wb-sub">fresh off the shelf ↓</div>
        <div className="nb-polas">
          {fresh.map(s => (
            <a key={s.slug} className="nb-pola" href={`/reading-room/stories/${s.slug}`}>
              <span className="nb-tape" aria-hidden="true" />
              <div className="nb-pola-img">
                {s.cover
                  ? <img src={s.cover} alt={`Cover of ${s.title}`} />
                  : <span className="nb-pola-ghost">{s.title}</span>}
              </div>
              <div className="nb-pola-cap">
                <span className="nb-pola-t">{s.title}</span>
                <span className="nb-pola-a">{s.author}</span>
              </div>
            </a>
          ))}
          <div className="nb-pola-empty">
            more going up<br />every week
          </div>
        </div>
      </section>

      {/* ── Community ── */}
      <section className="nb-cork">
        <h2 className="nb-hand nb-cork-title">The board</h2>
        <div className="nb-notes">
          {pinned.map((n, i) => (
            <div className="nb-note" key={i}>
              <span className="nb-note-pin" aria-hidden="true" />
              <div>{n.body}</div>
              <div className="nb-note-by">— {n.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live ── */}
      <section className="nb-lap">
        <div className="nb-lap-lid">
          <div className="nb-lap-cam" aria-hidden="true" />
          <div className="nb-lap-screen">
            <div className="nb-lap-bar">
              <span className="nb-dot" style={{ background: "#E05C52" }} />
              <span className="nb-dot" style={{ background: "#E3B341" }} />
              <span className="nb-dot" style={{ background: "#4FB868" }} />
              <span className="nb-lap-label">the reading room · live</span>
            </div>

            {stories.length ? (
              <>
                {stories.slice(0, 5).map(s => (
                  <a key={s.slug} className="nb-lap-row" href={`/reading-room/stories/${s.slug}`}>
                    <span className="nb-live" aria-hidden="true" />
                    <span><b>{s.title}</b> · {s.author}</span>
                  </a>
                ))}
                <div className="nb-lap-standby" style={{ padding: "14px 0 0" }}>
                  waiting for readers<span className="nb-cursor" aria-hidden="true" />
                </div>
              </>
            ) : (
              <div className="nb-lap-standby">
                the shelf is empty<br />
                listening for the first chapter<span className="nb-cursor" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
        <div className="nb-lap-base" />
        <div className="nb-lap-notch" />
      </section>

      <div className="nb-foot">
        <a href="/members" className="ttl-btn-primary">Go to Members Room →</a>
        <span className="ttl-btn-ghost" style={{ cursor: "default" }}>Payments by Stripe</span>
      </div>
    </div>
  );
}