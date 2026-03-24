"use client";

import React, { useState, useMemo, useEffect } from "react";

// =========================
// Route: /reading-room/authors/page.tsx
// Authors directory — library card grid
// =========================

const SQUARESPACE_READING_ROOM = "https://www.the-tiniest-library.com/the-reading-room";

type Author = {
  slug: string;
  name: string;
  initial: string;
  role: string;
  genres: string[];
  tagline: string;
  bio: string;
  storiesCount: number;
  inkJar: number;
};

const MOCK_AUTHORS: Author[] = [
  {
    slug: "a-rivera",
    name: "A. Rivera",
    initial: "R",
    role: "Founding Author",
    genres: ["Crime & Thrillers", "Cozy"],
    tagline: "Slow-burn mystery with heart.",
    bio: "A. Rivera writes cozy mysteries with teeth — stories set in quiet towns where nothing is ever quite what it seems. Known for morally complex detectives and endings that linger.",
    storiesCount: 3,
    inkJar: 140,
  },
  {
    slug: "j-holloway",
    name: "J. Holloway",
    initial: "H",
    role: "Founding Author",
    genres: ["Dark Academia", "Fantasy"],
    tagline: "Dark academia + modern folklore.",
    bio: "J. Holloway writes about secret societies, haunted libraries, and the particular madness of people who love learning too much. Their prose has been described as 'Donna Tartt with a folklore obsession.'",
    storiesCount: 2,
    inkJar: 210,
  },
  {
    slug: "m-chen",
    name: "M. Chen",
    initial: "C",
    role: "Founding Author",
    genres: ["Sci-Fi", "Young Adult"],
    tagline: "Soft sci-fi, big emotions.",
    bio: "M. Chen writes science fiction that cares more about what people feel than what spaceships look like. Themes of distance, memory, and the gravity of small choices show up in everything they write.",
    storiesCount: 4,
    inkJar: 95,
  },
  {
    slug: "s-gomez",
    name: "S. Gomez",
    initial: "G",
    role: "Author",
    genres: ["Crime & Thrillers"],
    tagline: "Thrillers that don't let go.",
    bio: "S. Gomez writes tightly-plotted crime fiction with an emphasis on consequence. Their stories move fast and leave marks. Currently working on a serial set in a city that doesn't sleep and doesn't forgive.",
    storiesCount: 2,
    inkJar: 60,
  },
  {
    slug: "d-cedeno",
    name: "Daniel Cedeno",
    initial: "D",
    role: "Founding Author",
    genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"],
    tagline: "Worlds that refuse to stay quiet.",
    bio: "Daniel Cedeno builds worlds that feel like they existed before the first page and will keep going after the last. Creator of the Fox Vs. The World universe — a serialized sci-fi saga about a teenager who discovers reality has a seam.",
    storiesCount: 5,
    inkJar: 380,
  },
  {
    slug: "e-walsh",
    name: "E. Walsh",
    initial: "W",
    role: "Author",
    genres: ["Romance", "Contemporary Fiction"],
    tagline: "Love stories that don't flinch.",
    bio: "E. Walsh writes romance that refuses to be comfortable. Their contemporary fiction is achingly honest about desire, grief, and the complicated arithmetic of two people deciding to stay. Debut serial launching this quarter.",
    storiesCount: 1,
    inkJar: 45,
  },
];

const ALL_GENRES = [
  "All Genres", "Crime & Thrillers", "Cozy", "Dark Academia",
  "Fantasy", "Sci-Fi", "Young Adult", "Serialized Fiction",
  "Romance", "Contemporary Fiction",
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --gold: #C9A84C;
    --gold-light: #E2C97E;
    --gold-dim: rgba(201,168,76,0.38);
    --gold-glow: rgba(201,168,76,0.13);
    --blue: #6495ED;
    --blue-dim: rgba(100,149,237,0.22);
    --blue-bright: #84b0f5;
    --ink-bg: #0a0a0a;
    --ink-surface: #111111;
    --ink-surface2: #181818;
    --ink-border: rgba(255,255,255,0.07);
    --ink-border-gold: rgba(201,168,76,0.26);
    --text-main: #f0ece2;
    --text-dim: rgba(232,228,218,0.45);
    --text-faint: rgba(232,228,218,0.25);
    --card-bg: #0f0f0f;
    --card-lines: rgba(201,168,76,0.06);
  }

  .ad-root {
    min-height: 100vh;
    background: var(--ink-bg);
    font-family: 'Syne', sans-serif;
    color: var(--text-main);
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .ad-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 40;
    background: rgba(8,8,8,0.96);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--ink-border-gold);
    box-shadow: 0 2px 40px rgba(0,0,0,0.7);
  }
  .ad-nav-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 40px;
    height: 72px; display: flex; align-items: center;
    justify-content: space-between; gap: 24px;
  }
  .ad-nav-left { display: flex; align-items: center; gap: 32px; }
  .ad-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .ad-nav-logo {
    width: 36px; height: 36px; border-radius: 8px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; color: #000;
  }
  .ad-nav-brand-main {
    font-family: 'Cormorant Garamond', serif; font-size: 17px;
    font-weight: 400; color: var(--gold-light); letter-spacing: 0.02em;
  }
  .ad-nav-brand-sub {
    font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.32); letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ad-nav-links { display: flex; align-items: center; gap: 2px; }
  .ad-nav-link {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--text-dim); text-decoration: none;
    padding: 6px 14px; border-radius: 4px; border: 1px solid transparent;
    transition: all 0.2s; white-space: nowrap;
  }
  .ad-nav-link:hover { color: var(--gold-light); border-color: var(--ink-border-gold); background: var(--gold-glow); }
  .ad-nav-link.active { color: var(--gold-light); border-color: var(--ink-border-gold); }
  .ad-nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ad-nav-ink {
    display: flex; align-items: center; gap: 6px;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; color: var(--gold-light);
    border: 1px solid var(--gold-dim); background: var(--gold-glow);
    padding: 6px 14px; border-radius: 999px; white-space: nowrap;
  }
  .ad-nav-members {
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; color: #fff; background: var(--blue);
    border: none; padding: 6px 18px; border-radius: 999px;
    text-decoration: none; white-space: nowrap; transition: opacity 0.2s;
  }
  .ad-nav-members:hover { opacity: 0.88; }
  .ad-spacer { height: 72px; }

  /* ── HERO ── */
  .ad-hero {
    padding: 72px 40px 56px;
    max-width: 1400px; margin: 0 auto;
    border-bottom: 1px solid var(--ink-border);
  }
  .ad-hero-eyebrow {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.32em;
    text-transform: uppercase; color: var(--gold); display: block;
    margin-bottom: 16px; opacity: 0.85;
  }
  .ad-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 7vw, 96px); font-weight: 300; line-height: 0.92;
    color: var(--text-main); margin-bottom: 24px;
  }
  .ad-hero-title em { font-style: italic; color: var(--gold-light); }
  .ad-hero-sub {
    font-family: 'Syne', sans-serif; font-size: 13px; color: var(--text-dim);
    max-width: 520px; line-height: 1.8; margin-bottom: 40px;
  }
  .ad-hero-stats {
    display: flex; gap: 40px; flex-wrap: wrap;
    padding-top: 32px; border-top: 1px solid var(--ink-border);
  }
  .ad-hero-stat { display: flex; flex-direction: column; gap: 4px; }
  .ad-hero-stat-num {
    font-family: 'Cormorant Garamond', serif; font-size: 36px;
    font-weight: 300; color: var(--gold); line-height: 1;
  }
  .ad-hero-stat-label {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--text-faint);
  }

  /* ── CONTROLS ── */
  .ad-controls {
    max-width: 1400px; margin: 0 auto;
    padding: 32px 40px 24px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 20px; flex-wrap: wrap;
  }
  .ad-search-wrap { position: relative; flex: 1; max-width: 360px; }
  .ad-search-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 13px; color: var(--text-faint); pointer-events: none;
  }
  .ad-search {
    width: 100%; background: var(--ink-surface);
    border: 1px solid var(--ink-border); border-radius: 8px;
    padding: 10px 14px 10px 36px;
    font-family: 'Syne', sans-serif; font-size: 12px; letter-spacing: 0.06em;
    color: var(--text-main); outline: none; transition: border-color 0.2s;
  }
  .ad-search::placeholder { color: var(--text-faint); }
  .ad-search:focus { border-color: var(--gold-dim); }
  .ad-genres { display: flex; gap: 6px; flex-wrap: wrap; }
  .ad-genre-pill {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase; padding: 6px 14px; border-radius: 999px;
    border: 1px solid var(--ink-border); color: var(--text-dim);
    background: transparent; cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
  }
  .ad-genre-pill:hover { color: var(--gold-light); border-color: var(--gold-dim); }
  .ad-genre-pill.active {
    color: var(--gold-light); border-color: var(--gold-dim);
    background: var(--gold-glow);
  }

  /* ── CARD CATALOG GRID ── */
  .ad-grid-wrap { max-width: 1400px; margin: 0 auto; padding: 8px 40px 96px; }
  .ad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  /* ── LIBRARY CARD ── */
  .ad-card {
    position: relative;
    background: var(--card-bg);
    border: 1px solid var(--ink-border);
    border-radius: 4px;
    overflow: hidden;
    text-decoration: none;
    display: block;
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
  }

  /* Card catalog ruled lines */
  .ad-card::after {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image: repeating-linear-gradient(
      transparent,
      transparent 27px,
      var(--card-lines) 27px,
      var(--card-lines) 28px
    );
    top: 72px;
  }

  .ad-card:hover {
    transform: translateY(-6px) rotate(-0.3deg);
    border-color: var(--gold-dim);
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px var(--gold-dim);
  }

  /* Gold left tab */
  .ad-card-tab {
    position: absolute; top: 0; left: 0;
    width: 6px; height: 100%;
    background: linear-gradient(to bottom, var(--gold), #8a6510);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .ad-card:hover .ad-card-tab { opacity: 1; }

  /* Card header strip */
  .ad-card-header {
    padding: 16px 20px 14px 22px;
    border-bottom: 1px solid var(--ink-border);
    display: flex; align-items: center; gap: 14px;
    background: rgba(201,168,76,0.04);
    position: relative; z-index: 1;
  }

  .ad-card-avatar {
    width: 44px; height: 44px; border-radius: 6px; flex-shrink: 0;
    background: linear-gradient(135deg, #1a1a24, #252535);
    border: 1px solid var(--gold-dim);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300; color: var(--gold);
  }

  .ad-card-header-text { flex: 1; min-width: 0; }

  .ad-card-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 400; color: var(--text-main);
    line-height: 1.1; margin-bottom: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .ad-card-role {
    font-family: 'Syne', sans-serif; font-size: 8px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); opacity: 0.7;
  }

  .ad-card-stamp {
    font-family: 'Cormorant Garamond', serif;
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--gold-dim); border: 1px solid var(--gold-dim);
    padding: 3px 8px; border-radius: 2px; flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.3s;
  }
  .ad-card:hover .ad-card-stamp { opacity: 1; color: var(--gold); border-color: var(--gold-dim); }

  /* Card body — the ruled lines area */
  .ad-card-body {
    padding: 18px 20px 18px 22px;
    position: relative; z-index: 1;
    min-height: 140px;
  }

  .ad-card-field {
    margin-bottom: 14px;
  }

  .ad-card-field-label {
    font-family: 'Syne', sans-serif; font-size: 8px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--text-faint);
    display: block; margin-bottom: 4px;
  }

  .ad-card-field-value {
    font-family: 'Syne', sans-serif; font-size: 12px;
    color: var(--text-dim); line-height: 1.5;
  }

  .ad-card-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px; font-style: italic; font-weight: 300;
    color: rgba(232,228,218,0.6); line-height: 1.5;
  }

  .ad-card-genres { display: flex; flex-wrap: wrap; gap: 5px; }
  .ad-card-genre-tag {
    font-family: 'Syne', sans-serif; font-size: 8px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--blue-bright);
    border: 1px solid var(--blue-dim); background: var(--blue-dim);
    padding: 2px 8px; border-radius: 999px;
  }

  /* Card footer */
  .ad-card-footer {
    padding: 12px 20px 14px 22px;
    border-top: 1px solid var(--ink-border);
    display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 1;
    background: rgba(0,0,0,0.2);
  }

  .ad-card-meta {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.1em;
    color: var(--text-faint);
    display: flex; align-items: center; gap: 12px;
  }

  .ad-card-meta-item { display: flex; align-items: center; gap: 4px; }

  .ad-card-pull {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.16em;
    text-transform: uppercase; color: transparent;
    display: flex; align-items: center; gap: 5px;
    transition: color 0.25s;
  }
  .ad-card:hover .ad-card-pull { color: var(--gold); }

  /* ── EMPTY STATE ── */
  .ad-empty {
    grid-column: 1 / -1;
    padding: 80px 32px; text-align: center;
    border: 1px solid var(--ink-border); border-radius: 12px;
    background: var(--ink-surface);
  }
  .ad-empty-title {
    font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300;
    color: var(--text-main); margin-bottom: 12px;
  }
  .ad-empty-text {
    font-family: 'Syne', sans-serif; font-size: 13px; color: var(--text-dim); line-height: 1.7;
  }

  /* ── FOOTER ── */
  .ad-footer {
    max-width: 1400px; margin: 0 auto;
    padding: 40px 40px 32px;
    border-top: 1px solid var(--gold-dim);
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .ad-footer-brand { display: flex; align-items: center; gap: 12px; }
  .ad-footer-logo {
    width: 36px; height: 36px; border-radius: 8px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #000;
  }
  .ad-footer-brand-main {
    font-family: 'Cormorant Garamond', serif; font-size: 18px;
    font-weight: 400; color: var(--gold-light);
  }
  .ad-footer-brand-sub {
    font-family: 'Syne', sans-serif; font-size: 10px; color: var(--text-faint);
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ad-footer-copy {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.12em;
    color: var(--text-faint); text-transform: uppercase;
  }
  .ad-footer-actions { display: flex; gap: 10px; }
  .ad-btn-primary {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase; color: #000;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    border: none; padding: 10px 22px; border-radius: 8px;
    text-decoration: none; cursor: pointer; font-weight: 700;
    transition: opacity 0.2s; display: inline-flex; align-items: center; gap: 8px;
  }
  .ad-btn-primary:hover { opacity: 0.88; }
  .ad-btn-ghost {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase; color: rgba(232,228,218,0.6);
    background: transparent; border: 1px solid rgba(232,228,218,0.15);
    padding: 10px 22px; border-radius: 8px; text-decoration: none;
    cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
  }
  .ad-btn-ghost:hover { color: var(--gold-light); border-color: var(--gold-dim); background: var(--gold-glow); }

  @media (max-width: 1100px) { .ad-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 700px) {
    .ad-grid { grid-template-columns: 1fr; }
    .ad-nav-links { display: none; }
    .ad-hero { padding: 48px 24px 40px; }
    .ad-controls { padding: 24px; }
    .ad-grid-wrap { padding: 8px 24px 64px; }
  }
`;

export default function AuthorsDirectory() {
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [ink] = useState(() => {
    if (typeof window === "undefined") return 250;
    return Number(window.localStorage.getItem("ttl_ink") ?? 250);
  });

  const filtered = useMemo(() => {
    return MOCK_AUTHORS.filter(a => {
      const matchesSearch =
        search.trim() === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tagline.toLowerCase().includes(search.toLowerCase()) ||
        a.genres.some(g => g.toLowerCase().includes(search.toLowerCase()));
      const matchesGenre =
        activeGenre === "All Genres" || a.genres.includes(activeGenre);
      return matchesSearch && matchesGenre;
    });
  }, [search, activeGenre]);

  return (
    <>
      <style>{STYLES}</style>
      <div className="ad-root">

        {/* NAV */}
        <nav className="ad-nav">
          <div className="ad-nav-inner">
            <div className="ad-nav-left">
              <a href="/reading-room" className="ad-nav-brand">
                <div className="ad-nav-logo">TTL</div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                  <span className="ad-nav-brand-main">The Tiniest Library</span>
                  <span className="ad-nav-brand-sub">The Reading Room</span>
                </div>
              </a>
              <div className="ad-nav-links">
                <a href="/reading-room" className="ad-nav-link">Reading Room</a>
                <a href="/reading-room/authors" className="ad-nav-link active">Authors</a>
                <a href="/reading-room/stories" className="ad-nav-link">All Stories</a>
                <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ad-nav-link">Members Site</a>
              </div>
            </div>
            <div className="ad-nav-right">
              <div className="ad-nav-ink"><span>✒️</span><span>{ink} Ink</span></div>
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ad-nav-members">Members →</a>
            </div>
          </div>
        </nav>
        <div className="ad-spacer" />

        {/* HERO */}
        <div className="ad-hero">
          <span className="ad-hero-eyebrow">The Tiniest Library — Author Catalog</span>
          <h1 className="ad-hero-title">The <em>Writers</em><br />Behind the Words</h1>
          <p className="ad-hero-sub">
            Every story on TTL is written by a real person with a real voice. Browse the author catalog, discover who's writing in your favorite genres, and tip the writers whose work moves you.
          </p>
          <div className="ad-hero-stats">
            <div className="ad-hero-stat">
              <span className="ad-hero-stat-num">{MOCK_AUTHORS.length}</span>
              <span className="ad-hero-stat-label">Authors</span>
            </div>
            <div className="ad-hero-stat">
              <span className="ad-hero-stat-num">{MOCK_AUTHORS.reduce((a, b) => a + b.storiesCount, 0)}</span>
              <span className="ad-hero-stat-label">Stories</span>
            </div>
            <div className="ad-hero-stat">
              <span className="ad-hero-stat-num">{ALL_GENRES.length - 1}</span>
              <span className="ad-hero-stat-label">Genres</span>
            </div>
            <div className="ad-hero-stat">
              <span className="ad-hero-stat-num">∞</span>
              <span className="ad-hero-stat-label">Words Yet to Come</span>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="ad-controls">
          <div className="ad-search-wrap">
            <span className="ad-search-icon">🔍</span>
            <input
              className="ad-search"
              type="text"
              placeholder="Search authors, genres, keywords…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="ad-genres">
            {ALL_GENRES.map(g => (
              <button
                key={g}
                className={`ad-genre-pill${activeGenre === g ? " active" : ""}`}
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* CARD GRID */}
        <div className="ad-grid-wrap">
          <div className="ad-grid">
            {filtered.length === 0 ? (
              <div className="ad-empty">
                <div className="ad-empty-title">No authors found.</div>
                <p className="ad-empty-text">Try a different search or genre filter.</p>
              </div>
            ) : filtered.map(author => (
              <a key={author.slug} href={`/reading-room/authors/${author.slug}`} className="ad-card">
                <div className="ad-card-tab" />

                {/* Header */}
                <div className="ad-card-header">
                  <div className="ad-card-avatar">{author.initial}</div>
                  <div className="ad-card-header-text">
                    <div className="ad-card-name">{author.name}</div>
                    <div className="ad-card-role">{author.role}</div>
                  </div>
                  <div className="ad-card-stamp">TTL</div>
                </div>

                {/* Body — ruled lines */}
                <div className="ad-card-body">
                  <div className="ad-card-field">
                    <span className="ad-card-field-label">Voice</span>
                    <div className="ad-card-tagline">{author.tagline}</div>
                  </div>
                  <div className="ad-card-field">
                    <span className="ad-card-field-label">Genres</span>
                    <div className="ad-card-genres">
                      {author.genres.map(g => (
                        <span key={g} className="ad-card-genre-tag">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="ad-card-footer">
                  <div className="ad-card-meta">
                    <span className="ad-card-meta-item">📖 {author.storiesCount} {author.storiesCount === 1 ? "story" : "stories"}</span>
                    <span className="ad-card-meta-item">✒️ {author.inkJar} ink earned</span>
                  </div>
                  <div className="ad-card-pull">
                    Pull card ↗
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="ad-footer">
          <div className="ad-footer-brand">
            <div className="ad-footer-logo">TTL</div>
            <div>
              <div className="ad-footer-brand-main">The Tiniest Library</div>
              <div className="ad-footer-brand-sub">The Reading Room</div>
            </div>
          </div>
          <span className="ad-footer-copy">© {new Date().getFullYear()} The Tiniest Library</span>
          <div className="ad-footer-actions">
            <a href="/reading-room" className="ad-btn-ghost">← Reading Room</a>
            <a href="https://www.the-tiniest-library.com/new-page-1" target="_blank" rel="noopener noreferrer" className="ad-btn-primary">Apply to Write →</a>
          </div>
        </div>

      </div>
    </>
  );
}
