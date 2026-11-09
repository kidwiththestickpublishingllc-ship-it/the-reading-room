"use client";

// app/reading-room/components/Floor.tsx
// A page of the notebook — ruled ground, spiral binding, red margin rule.
// Surfaces go inside via <Surface>. Grid is 12 columns, single column on mobile.
// Prefix: flr-

import React from "react";

type Props = {
  name?: string;              // "Ground Floor", "Second Floor", "Your Library"
  number?: number | string;   // page number, bottom right
  slug?: string;              // small line bottom left
  variant?: "paper" | "cover"; // paper = ruled page · cover = dark inside cover
  children: React.ReactNode;
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');
  .flr {
    position: relative;
    background: var(--paper, #FAF6EC);
    color: var(--text-main, #1a1008);
    border: 1px solid var(--edge, rgba(46,41,34,0.14));
    box-shadow: 0 6px 24px var(--surface-shadow, rgba(46,41,34,0.18));
    padding: 44px 40px 54px 112px;
    margin: 0 auto 44px;
    max-width: 1240px;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent, transparent 31px,
      var(--paper-rule, rgba(90,130,170,0.17)) 31px,
      var(--paper-rule, rgba(90,130,170,0.17)) 32px
    );
  }

  /* binding */
  .flr-trough {
    position: absolute; left: 0; top: 0; bottom: 0; width: 62px;
    background: var(--bind-trough, #DED6C4);
    border-right: 1px solid var(--edge, rgba(46,41,34,0.14));
  }
  .flr-rings {
    position: absolute; left: 19px; top: 20px; bottom: 20px; width: 24px;
    background-image: repeating-linear-gradient(
      to bottom,
      var(--bind-ring, #9A8F7A) 0, var(--bind-ring, #9A8F7A) 26px,
      transparent 26px, transparent 62px
    );
    border-radius: 12px; opacity: 0.6;
  }
  .flr-holes {
    position: absolute; left: 23px; top: 20px; bottom: 20px; width: 16px;
    background-image: repeating-linear-gradient(
      to bottom,
      var(--paper, #FAF6EC) 0, var(--paper, #FAF6EC) 16px,
      transparent 16px, transparent 62px
    );
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px var(--edge, rgba(46,41,34,0.14));
  }
  .flr-margin {
    position: absolute; left: 94px; top: 0; bottom: 0; width: 2px;
    background: var(--margin-rule, rgba(190,60,60,0.42));
  }

  /* dark inside-cover variant — for the writers floor */
  .flr-cover {
    background: #2A2520;
    background-image: none;
    color: #F4F1EA;
    border-color: rgba(255,255,255,0.08);
  }
  .flr-cover .flr-trough { background: #1B1714; border-right-color: rgba(255,255,255,0.07); }
  .flr-cover .flr-holes { background-image: repeating-linear-gradient(to bottom, #2A2520 0, #2A2520 16px, transparent 16px, transparent 62px); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
  .flr-cover .flr-margin { background: rgba(201,168,76,0.4); }

  /* labels */
  .flr-name {
    font: 800 10px 'Syne', sans-serif;
    letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--gold, #8A6510);
    margin-bottom: 18px;
  }
  .flr-cover .flr-name { color: #C9A84C; }
  .flr-num {
    position: absolute; right: 18px; bottom: 14px;
    font-family: 'Caveat', cursive; font-size: 21px;
    color: var(--text-faint, rgba(26,16,8,0.45));
  }
  .flr-slug {
    position: absolute; left: 112px; bottom: 16px;
    font: 800 9px 'Syne', sans-serif; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--text-faint, rgba(26,16,8,0.45));
  }

  .flr-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 22px; }

  @media (max-width: 900px) {
    .flr { padding: 28px 18px 44px 60px; margin-bottom: 28px; }
    .flr-trough { width: 34px; }
    .flr-rings { left: 9px; width: 16px; }
    .flr-holes { left: 11px; width: 12px; }
    .flr-margin { left: 50px; }
    .flr-slug { left: 60px; }
    .flr-grid { gap: 16px; }
  }
`;

export default function Floor({
  name, number, slug, variant = "paper", children,
}: Props) {
  const cls = ["flr", variant === "cover" ? "flr-cover" : ""].filter(Boolean).join(" ");

  return (
    <section className={cls}>
      <style>{STYLES}</style>
      <div className="flr-trough" aria-hidden="true" />
      <div className="flr-rings" aria-hidden="true" />
      <div className="flr-holes" aria-hidden="true" />
      <div className="flr-margin" aria-hidden="true" />

      {name && <div className="flr-name">{name}</div>}
      <div className="flr-grid">{children}</div>
      {slug && <span className="flr-slug">{slug}</span>}
      {number !== undefined && <span className="flr-num">{number}</span>}
    </section>
  );
}
