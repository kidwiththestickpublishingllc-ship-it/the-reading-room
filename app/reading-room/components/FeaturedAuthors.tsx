"use client";

// app/reading-room/components/FeaturedAuthors.tsx
// Authors as newspaper clippings pinned to a cork board.
// Replaces the carousel, which was configured for ten cards and had three.
// Monochrome ink on newsprint; each author's accent survives as the pushpin.
// Prefix: fa-

import React from "react";

type Author = {
  slug: string;
  name: string;
  role: string;
  tagline: string;
  quote: string;
  genres: string[];
  accent: string;
};

const AUTHORS: Author[] = [
  { slug: "chris-knopf", name: "Chris Knopf", role: "Founding Author · Published", tagline: "Where the dead aren't quite done.", quote: "A ghost grows attached to someone who reminds him of himself.", genres: ["Horror Mystery", "Thriller"], accent: "#9B2335" },
  { slug: "d-cedeno", name: "Daniel Cedeno", role: "Founding Author · Creator", tagline: "Worlds that refuse to stay quiet.", quote: "The sky above Hartford wasn't supposed to flicker like a broken screen… but tonight it did.", genres: ["Sci-Fi", "Young Adult"], accent: "#C9A84C" },
  { slug: "sergio-lastre", name: "Sergio Lastre", role: "Founding Author", tagline: "Stories that live in the marrow.", quote: "Some doors don't open. They remember.", genres: ["Latin Stories", "Contemporary Fiction"], accent: "#6495ED" },
];

const STYLES = `
  .fa-board {
    --cork: #C2995F;
    --cork-frame: #A9762F;
    --news: #EDE7D6;
    --news-ink: #211B13;
    --news-dim: rgba(33,27,19,0.66);
    --news-rule: rgba(33,27,19,0.30);

    position: relative;
    padding: 40px 36px 44px;
    border: 14px solid var(--cork-frame);
    border-radius: 3px;
    background-color: var(--cork);
    background-image:
      radial-gradient(circle at 18% 28%, rgba(0,0,0,0.055) 0.9px, transparent 1.1px),
      radial-gradient(circle at 68% 62%, rgba(0,0,0,0.045) 0.8px, transparent 1px),
      radial-gradient(circle at 42% 84%, rgba(255,255,255,0.05) 0.7px, transparent 1px);
    background-size: 13px 13px, 19px 19px, 23px 23px;
    box-shadow: 0 14px 34px var(--surface-shadow), inset 0 0 60px rgba(0,0,0,0.14);
  }
  :root[data-theme="dark"] .fa-board {
    --cork: #3B2E20;
    --cork-frame: #241A11;
    --news: #2B2721;
    --news-ink: #E9E3D5;
    --news-dim: rgba(233,227,213,0.66);
    --news-rule: rgba(233,227,213,0.28);
  }

  .fa-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 34px 30px;
  }

  .fa-clip {
    position: relative;
    display: block;
    text-decoration: none;
    background: var(--news);
    color: var(--news-ink);
    padding: 30px 26px 22px;
    box-shadow: 0 9px 22px rgba(0,0,0,0.34);
    transition: transform 0.22s ease, box-shadow 0.22s ease;
  }
  /* a deckled bottom edge, so it reads as cut rather than cropped */
  .fa-clip::after {
    content: "";
    position: absolute; left: 0; right: 0; bottom: -6px; height: 7px;
    background: var(--news);
    -webkit-mask-image: radial-gradient(circle at 5px 0, transparent 0 4.4px, #000 4.9px);
    mask-image: radial-gradient(circle at 5px 0, transparent 0 4.4px, #000 4.9px);
    -webkit-mask-size: 10px 7px;
    mask-size: 10px 7px;
  }
  .fa-clip:nth-child(1) { transform: rotate(-1.1deg); }
  .fa-clip:nth-child(2) { transform: rotate(0.8deg); }
  .fa-clip:nth-child(3) { transform: rotate(0.6deg); }
  .fa-clip:nth-child(4) { transform: rotate(-0.7deg); }
  .fa-clip:hover { transform: rotate(0deg) translateY(-5px); box-shadow: 0 16px 32px rgba(0,0,0,0.4); }

  .fa-pin {
    position: absolute; top: -11px; left: 50%; margin-left: -10px;
    width: 20px; height: 20px; border-radius: 50%;
    box-shadow: 0 4px 7px rgba(0,0,0,0.5);
    z-index: 3;
  }

  .fa-kicker {
    font: 700 8.5px 'Syne', sans-serif;
    letter-spacing: 0.26em; text-transform: uppercase;
    text-align: center; color: var(--news-dim);
    padding: 7px 0;
    border-top: 3px double var(--news-rule);
    border-bottom: 1px solid var(--news-rule);
  }

  .fa-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(27px, 3vw, 36px);
    font-weight: 600; line-height: 1.04;
    text-align: center; margin: 15px 0 10px;
    color: var(--news-ink);
  }

  .fa-standfirst {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15.5px; font-style: italic; line-height: 1.45;
    text-align: center; color: var(--news-dim);
    padding-bottom: 14px; margin-bottom: 14px;
    border-bottom: 1px solid var(--news-rule);
  }

  .fa-quote {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px; line-height: 1.68;
    color: var(--news-ink);
    padding-left: 14px;
    border-left: 2px solid var(--news-rule);
    margin-bottom: 18px;
  }

  .fa-filed {
    font: 700 8px 'Syne', sans-serif;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--news-dim);
    padding-top: 11px;
    border-top: 1px solid var(--news-rule);
    display: flex; justify-content: space-between; gap: 12px;
  }
  .fa-filed span:last-child { white-space: nowrap; }

  /* the classified ad */
  .fa-ad {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 34px 26px;
  }
  .fa-ad-rule { border: 2px double var(--news-rule); padding: 24px 20px; width: 100%; }
  .fa-ad-k { font: 700 8px 'Syne', sans-serif; letter-spacing: 0.3em; text-transform: uppercase; color: var(--news-dim); }
  .fa-ad-h {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 26px; font-weight: 600; line-height: 1.15; margin: 12px 0 10px;
  }
  .fa-ad-s { font-size: 12.5px; line-height: 1.6; color: var(--news-dim); margin-bottom: 18px; }
  .fa-ad-go {
    font: 700 9px 'Syne', sans-serif; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--news-ink); border-bottom: 1px solid var(--news-rule); padding-bottom: 3px;
  }

  @media (max-width: 860px) {
    .fa-board { padding: 26px 18px 30px; border-width: 10px; }
    .fa-grid { grid-template-columns: 1fr; gap: 28px; }
    .fa-clip { transform: none !important; }
  }
`;

export default function FeaturedAuthors() {
  return (
    <div className="ttl-section fa-board">
      <style>{STYLES}</style>

      <div className="ttl-section-header">
        <div>
          <div className="ttl-section-accent">
            <div className="ttl-section-bar" />
            <div>
              <span className="ttl-section-eyebrow">Discover</span>
              <h2 className="ttl-section-title">Featured Authors</h2>
            </div>
          </div>
        </div>
        <a href="/reading-room/authors" className="ttl-section-link">Full Directory →</a>
      </div>
      <div className="ttl-divider" />

      <div className="fa-grid">
        {AUTHORS.map(author => (
          <a key={author.slug} className="fa-clip" href={`/reading-room/authors/${author.slug}`}>
            <span
              className="fa-pin"
              aria-hidden="true"
              style={{ background: `radial-gradient(circle at 34% 30%, #ffffff88, ${author.accent} 55%, #00000055)` }}
            />
            <div className="fa-kicker">{author.role}</div>
            <h3 className="fa-name">{author.name}</h3>
            <div className="fa-standfirst">{author.tagline}</div>
            <p className="fa-quote">&ldquo;{author.quote}&rdquo;</p>
            <div className="fa-filed">
              <span>Filed under: {author.genres.join(" · ")}</span>
              <span>Read →</span>
            </div>
          </a>
        ))}

        <div className="fa-clip fa-ad">
          <span className="fa-pin" aria-hidden="true" style={{ background: "radial-gradient(circle at 34% 30%, #ffffff88, #5A6B7A 55%, #00000055)" }} />
          <div className="fa-ad-rule">
            <div className="fa-ad-k">Classified</div>
            <div className="fa-ad-h">Your Story<br />Could Live Here</div>
            <div className="fa-ad-s">Reach thousands of readers. Feature your work on the board.</div>
            <a href="/reading-room/authors" className="fa-ad-go">Enquire →</a>
          </div>
        </div>
      </div>
    </div>
  );
}