"use client";

// app/components/WelcomeBoard.tsx
// The old splash, kept — but pinned to a cork board instead of taking the
// whole first screen. "The Tiniest Library" in a readable hand, with the
// line underneath it and a couple of pinned cards.
// Cork in light mode, chalkboard in dark (Surface handles that).
// Prefix: wb-

import Surface from "./Surface";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');

  .wb-inner { display: flex; flex-wrap: wrap; gap: 34px; align-items: center; }

  /* the pinned sign */
  .wb-sign {
    position: relative;
    flex: 1 1 380px; min-width: 0;
    background: var(--plate, #F8F2E2);
    color: var(--text-main, #1a1008);
    padding: 34px 32px 30px;
    box-shadow: 0 10px 26px rgba(0,0,0,0.32);
    transform: rotate(-1.2deg);
    text-align: center;
  }
  .wb-pin {
    position: absolute; top: -10px; left: 50%; margin-left: -9px;
    width: 18px; height: 18px; border-radius: 50%;
    background: radial-gradient(circle at 35% 32%, #ff8a8a, #c13b3b 60%, #8e2020);
    box-shadow: 0 3px 6px rgba(0,0,0,0.45);
  }
  .wb-name {
    font-family: 'Caveat', cursive;
    font-size: clamp(42px, 6vw, 66px);
    line-height: 1;
    font-weight: 700;
    margin: 0;
    color: var(--text-main, #1a1008);
  }
  .wb-rule {
    width: 80px; height: 2px; margin: 16px auto;
    background: var(--margin-rule, rgba(190,60,60,0.42));
  }
  .wb-line {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 19px; font-style: italic; line-height: 1.6;
    color: var(--text-dim, rgba(26,16,8,0.75));
    margin: 0; max-width: 34ch; margin-inline: auto;
  }

  /* small pinned cards beside it */
  .wb-cards { flex: 1 1 300px; display: flex; flex-wrap: wrap; gap: 20px; min-width: 0; }
  .wb-card {
    position: relative;
    flex: 1 1 140px; min-width: 0;
    background: var(--plate, #F8F2E2);
    color: var(--text-main, #1a1008);
    padding: 20px 18px 18px;
    box-shadow: 0 7px 18px rgba(0,0,0,0.3);
    text-decoration: none;
    display: block;
  }
  .wb-card:nth-child(1) { transform: rotate(1.4deg); }
  .wb-card:nth-child(2) { transform: rotate(-1.6deg); }
  .wb-card .wb-pin { margin-left: -7px; width: 14px; height: 14px; top: -8px; }
  .wb-k {
    font: 800 9px 'Syne', sans-serif; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold, #8A6510);
  }
  .wb-h {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 23px; line-height: 1.2; font-weight: 300; margin: 8px 0 6px;
  }
  .wb-s { font-size: 12.5px; line-height: 1.6; color: var(--text-dim, rgba(26,16,8,0.75)); }
  .wb-go {
    font: 700 10px 'Syne', sans-serif; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--gold, #8A6510);
    display: inline-block; margin-top: 12px;
  }

  @media (max-width: 900px) {
    .wb-inner { gap: 24px; }
    .wb-sign { transform: none; padding: 26px 20px 24px; }
    .wb-card { transform: none !important; }
  }
`;

export default function WelcomeBoard() {
  return (
    <Surface kind="board" span={12} label="The Reading Room">
      <style>{STYLES}</style>
      <div className="wb-inner">

        <div className="wb-sign">
          <span className="wb-pin" aria-hidden="true" />
          <h2 className="wb-name">The Tiniest Library</h2>
          <div className="wb-rule" aria-hidden="true" />
          <p className="wb-line">
            A space for long stories, serialised chapters and exclusive releases.
            Support creators with Ink and unlock what&rsquo;s next.
          </p>
        </div>

        <div className="wb-cards">
          <a className="wb-card" href="/reading-room/stories">
            <span className="wb-pin" aria-hidden="true" />
            <div className="wb-k">Read</div>
            <div className="wb-h">Browse the shelf</div>
            <div className="wb-s">Every story published on TTL. First chapters always free.</div>
            <span className="wb-go">Browse &rarr;</span>
          </a>

          <a className="wb-card" href="https://write.the-tiniest-library.com/apply">
            <span className="wb-pin" aria-hidden="true" />
            <div className="wb-k">Write</div>
            <div className="wb-h">Publish with us</div>
            <div className="wb-s">Keep your copyright. Earn from chapter one. Writers 13+.</div>
            <span className="wb-go">Apply &rarr;</span>
          </a>
        </div>

      </div>
    </Surface>
  );
}
