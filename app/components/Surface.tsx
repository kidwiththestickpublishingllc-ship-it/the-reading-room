"use client";

// app/reading-room/components/Surface.tsx
// One surface inside a Floor. Six kinds, each with a job:
//   plate      — clean unruled paper. PROSE ONLY.
//   card       — index card. One per thing: a story, a series, an author.
//   note       — post-it. Short, interruptive, ephemeral.
//   board      — cork (light) / chalkboard (dark). One per COLLECTION.
//   whiteboard — black frame + marker ledge. Announcements.
//   slip       — ledger receipt. Anything financial.
//   bare       — no surface, sits directly on the Floor. The default.
// Prefix: srf-

import React from "react";

type Props = {
  children: React.ReactNode;
  kind?: "bare" | "plate" | "card" | "note" | "board" | "whiteboard" | "slip";
  span?: number;              // 1-12 columns on desktop
  label?: string;             // small uppercase label above the content
  tilt?: "l" | "r";           // slight rotation — cards and notes only
  flush?: boolean;            // kill inner padding, for carousels
  autoHide?: boolean;         // collapse when it has no real content
  className?: string;
  style?: React.CSSProperties;
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
  .srf { position: relative; min-width: 0; }
  .srf-label {
    font: 800 10px 'Syne', sans-serif;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold, #8A6510);
    margin-bottom: 12px;
  }

  /* ── PLATE — prose only ─────────────────────────── */
  .srf-plate {
    background: var(--plate, #FFFDF7);
    border: 1px solid var(--edge, rgba(46,41,34,0.14));
    box-shadow: 0 3px 14px var(--surface-shadow, rgba(46,41,34,0.18));
    padding: 30px 34px;
  }

  /* ── CARD — index card ──────────────────────────── */
  .srf-card {
    background: var(--plate, #FFFDF7);
    border: 1px solid var(--edge, rgba(46,41,34,0.14));
    box-shadow: 0 4px 12px var(--surface-shadow, rgba(46,41,34,0.18));
    padding: 0 0 16px;
  }
  .srf-card::before {
    content: ""; display: block; height: 34px;
    border-bottom: 1.5px solid var(--margin-rule, rgba(190,60,60,0.42));
  }
  .srf-card-inner {
    padding: 12px 16px 0;
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 25px,
      var(--paper-rule, rgba(90,130,170,0.17)) 25px,
      var(--paper-rule, rgba(90,130,170,0.17)) 26px
    );
  }

  /* ── NOTE — post-it ─────────────────────────────── */
  .srf-note {
    background: var(--note, #FBE88C);
    color: var(--note-text, #3A3312);
    padding: 20px 18px;
    box-shadow: 1px 6px 14px var(--surface-shadow, rgba(46,41,34,0.18));
    min-height: 150px;
  }
  .srf-note::after {
    content: ""; position: absolute; right: 0; bottom: 0;
    width: 26px; height: 26px;
    background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.16) 50%);
  }
  .srf-note .srf-label { color: rgba(58,51,18,0.62); }

  /* ── BOARD — cork, chalkboard in dark ───────────── */
  .srf-board {
    border: 14px solid var(--board-frame, #B5833F);
    border-radius: 3px;
    background-color: var(--board-face, #C9A371);
    background-image:
      radial-gradient(circle at 20% 30%, rgba(0,0,0,0.055) 0.9px, transparent 1.1px),
      radial-gradient(circle at 70% 60%, rgba(0,0,0,0.045) 0.8px, transparent 1px),
      radial-gradient(circle at 45% 85%, rgba(255,255,255,0.05) 0.9px, transparent 1.1px);
    background-size: 13px 13px, 19px 19px, 11px 11px;
    box-shadow: 0 10px 30px var(--surface-shadow, rgba(46,41,34,0.18)),
                inset 0 0 50px rgba(0,0,0,0.12);
    padding: 30px;
    color: var(--board-text, #4A3A22);
  }
  :root[data-theme="dark"] .srf-board {
    background-image:
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.045), transparent 60%),
      radial-gradient(ellipse at 75% 70%, rgba(255,255,255,0.035), transparent 55%);
    background-size: auto, auto;
  }
  .srf-board .srf-label { color: var(--board-text, #4A3A22); opacity: 0.75; }

  /* ── WHITEBOARD ─────────────────────────────────── */
  .srf-whiteboard {
    border: 16px solid #2A2A2C;
    border-radius: 22px;
    background: #F7F7F5;
    background-image: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(0,0,0,0.035));
    box-shadow: 0 12px 34px var(--surface-shadow, rgba(46,41,34,0.18)),
                inset 0 1px 0 rgba(255,255,255,0.8);
    padding: 30px 32px 50px;
    color: #1F1F22;
  }
  :root[data-theme="dark"] .srf-whiteboard {
    border-color: #0E0F10; background: #1A1D1C; color: #E2E8E2;
    background-image: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2));
  }
  .srf-whiteboard::after {
    content: ""; position: absolute; right: 26px; bottom: 16px;
    width: 76px; height: 12px; border-radius: 6px;
    background: linear-gradient(90deg, #1F1F22 0 18%, #E9E9EA 18% 100%);
    box-shadow: 0 2px 4px rgba(0,0,0,0.35);
  }

  /* ── SLIP — ledger receipt ──────────────────────── */
  .srf-slip {
    background: var(--plate, #FFFDF7);
    border: 1px solid var(--edge, rgba(46,41,34,0.14));
    box-shadow: 0 4px 12px var(--surface-shadow, rgba(46,41,34,0.18));
    padding: 20px 22px;
    font-family: 'Courier Prime', ui-monospace, monospace;
  }

  /* ── modifiers ──────────────────────────────────── */
  .srf-tilt-l { transform: rotate(-1.1deg); }
  .srf-tilt-r { transform: rotate(0.8deg); }
  .srf-flush { padding: 0; }
  .srf-autohide:not(:has(a)):not(:has(img)):not(:has(button)) { display: none; }

  @media (max-width: 900px) {
    .srf { grid-column: span 12 !important; }
    .srf-tilt-l, .srf-tilt-r { transform: none; }
    .srf-plate { padding: 22px 20px; }
    .srf-board { border-width: 10px; padding: 20px; }
    .srf-whiteboard { border-width: 12px; border-radius: 16px; padding: 22px 20px 44px; }
    .srf [class*="-row"], .srf [class*="-grid"] { grid-template-columns: 1fr !important; }
    .srf * { min-width: 0; max-width: 100%; }
    .srf img { height: auto; }
  }
`;

export default function Surface({
  children, kind = "bare", span = 12, label, tilt, flush,
  autoHide, className = "", style,
}: Props) {
  const cls = [
    "srf",
    kind !== "bare" ? `srf-${kind}` : "",
    tilt === "l" ? "srf-tilt-l" : "",
    tilt === "r" ? "srf-tilt-r" : "",
    flush ? "srf-flush" : "",
    autoHide ? "srf-autohide" : "",
    className,
  ].filter(Boolean).join(" ");

  const body =
    kind === "card"
      ? <div className="srf-card-inner">{label && <div className="srf-label">{label}</div>}{children}</div>
      : <>{label && <div className="srf-label">{label}</div>}{children}</>;

  return (
    <div className={cls} style={{ gridColumn: `span ${span}`, ...style }}>
      <style>{STYLES}</style>
      {body}
    </div>
  );
}
