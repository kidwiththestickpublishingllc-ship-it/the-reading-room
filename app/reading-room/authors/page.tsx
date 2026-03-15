"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";

// ─────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────
type Author = {
  name: string;
  slug: string;
  genre: string;
  role: string;
  initial: string;
  bio: string;
  stories: number;
};

// ─────────────────────────────────────────────
// HARDCODED DATA
// When Supabase is ready, replace this block with:
//   const { data: authors } = await supabase.from("authors").select("*");
// and remove the AUTHORS const below.
// ─────────────────────────────────────────────
const AUTHORS: Author[] = [
  {
    name: "A. Rivera",
    slug: "a-rivera",
    genre: "Mystery",
    role: "Founding Author",
    initial: "R",
    bio: "Writes shadowed narratives where nothing is what it seems.",
    stories: 4,
  },
  {
    name: "J. Holloway",
    slug: "j-holloway",
    genre: "Dark Academia",
    role: "Founding Author",
    initial: "H",
    bio: "Explores the dangerous romance of knowledge and obsession.",
    stories: 6,
  },
  {
    name: "M. Chen",
    slug: "m-chen",
    genre: "Sci-Fi",
    role: "Founding Author",
    initial: "C",
    bio: "Builds futures that feel terrifyingly close to now.",
    stories: 3,
  },
];

const GENRES = [
  "All",
  "Mystery",
  "Dark Academia",
  "Sci-Fi",
  "Romance",
  "Horror",
  "Literary Fiction",
  "Fantasy",
];

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function AuthorsDirectory() {
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [spotlight, setSpotlight] = useState<Author | null>(null);

  useEffect(() => {
    const pick = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
    setSpotlight(pick);
  }, []);

  const filtered = useMemo(() => {
    return AUTHORS.filter((a) => {
      const matchesGenre = activeGenre === "All" || a.genre === activeGenre;
      const matchesSearch =
        search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.genre.toLowerCase().includes(search.toLowerCase());
      return matchesGenre && matchesSearch;
    });
  }, [search, activeGenre]);

  const genreCount = new Set(AUTHORS.map((a) => a.genre)).size;
  const totalStories = AUTHORS.reduce((sum, a) => sum + a.stories, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ad-root {
          min-height: 100vh;
          background: #0c0c0e;
          font-family: 'Syne', sans-serif;
          color: #e8e4da;
          position: relative;
          overflow-x: hidden;
        }

        .ad-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        .ad-wrap {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          padding: 72px 32px 96px;
        }

        /* ── PAGE HEADER ── */
        .ad-eyebrow {
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #c9a84c;
          display: block;
          margin-bottom: 12px;
        }

        .ad-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 60px;
          font-weight: 300;
          line-height: 1;
          color: #f0ece2;
          margin-bottom: 14px;
        }

        .ad-desc {
          font-size: 13px;
          color: rgba(232,228,218,0.38);
          max-width: 420px;
          line-height: 1.7;
          margin-bottom: 40px;
        }

        /* ── STATS BAR ── */
        .ad-stats {
          display: flex;
          gap: 0;
          margin-bottom: 52px;
          border: 1px solid rgba(232,228,218,0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .ad-stat {
          flex: 1;
          padding: 18px 24px;
          border-right: 1px solid rgba(232,228,218,0.08);
        }

        .ad-stat:last-child { border-right: none; }

        .ad-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: #c9a84c;
          line-height: 1;
          margin-bottom: 4px;
        }

        .ad-stat-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(232,228,218,0.28);
        }

        /* ── SPOTLIGHT ── */
        .ad-spotlight-label {
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.5);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ad-spotlight-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(201,168,76,0.12);
        }

        .ad-spotlight {
          display: block;
          text-decoration: none;
          position: relative;
          background: linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 2px;
          padding: 36px 40px;
          margin-bottom: 56px;
          overflow: hidden;
          transition: border-color 0.3s, background 0.3s;
        }

        .ad-spotlight:hover {
          border-color: rgba(201,168,76,0.4);
          background: linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(255,255,255,0.04) 100%);
        }

        .ad-spotlight::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
          background: #c9a84c;
        }

        .ad-spotlight-inner {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .ad-spotlight-avatar {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          border-radius: 2px;
          background: linear-gradient(135deg, #1e1e26, #2a2a38);
          border: 1px solid rgba(201,168,76,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: #c9a84c;
        }

        .ad-spotlight-info { flex: 1; }

        .ad-spotlight-genre {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.65);
          margin-bottom: 6px;
        }

        .ad-spotlight-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          font-weight: 300;
          color: #f0ece2;
          line-height: 1;
          margin-bottom: 10px;
        }

        .ad-spotlight-bio {
          font-size: 13px;
          color: rgba(232,228,218,0.48);
          line-height: 1.6;
          max-width: 480px;
        }

        .ad-spotlight-cta {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #c9a84c;
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.25s;
        }

        .ad-spotlight:hover .ad-spotlight-cta { gap: 12px; }

        /* ── SEARCH + FILTER ── */
        .ad-controls {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }

        .ad-search-wrap { position: relative; }

        .ad-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(232,228,218,0.22);
          font-size: 15px;
          pointer-events: none;
        }

        .ad-search {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(232,228,218,0.09);
          border-radius: 2px;
          color: #e8e4da;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          padding: 13px 16px 13px 42px;
          outline: none;
          transition: border-color 0.2s;
        }

        .ad-search::placeholder { color: rgba(232,228,218,0.2); }
        .ad-search:focus { border-color: rgba(201,168,76,0.38); }

        .ad-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ad-genre-btn {
          font-family: 'Syne', sans-serif;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 2px;
          border: 1px solid rgba(232,228,218,0.1);
          background: transparent;
          color: rgba(232,228,218,0.35);
          cursor: pointer;
          transition: all 0.2s;
        }

        .ad-genre-btn:hover {
          border-color: rgba(232,228,218,0.28);
          color: rgba(232,228,218,0.65);
        }

        .ad-genre-btn.active {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.42);
          color: #c9a84c;
        }

        /* ── RESULTS META ── */
        .ad-meta {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(232,228,218,0.2);
          margin-bottom: 18px;
        }

        /* ── GRID ── */
        .ad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }

        .ad-card {
          display: block;
          text-decoration: none;
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(232,228,218,0.07);
          padding: 30px 26px 40px;
          overflow: hidden;
          transition: background 0.3s, border-color 0.3s;
        }

        .ad-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 2px;
          height: 0;
          background: #c9a84c;
          transition: height 0.35s ease;
        }

        .ad-card:hover { background: rgba(255,255,255,0.055); border-color: rgba(201,168,76,0.16); }
        .ad-card:hover::before { height: 100%; }

        .ad-card-avatar {
          width: 46px;
          height: 46px;
          border-radius: 2px;
          background: linear-gradient(135deg, #1e1e26, #2a2a38);
          border: 1px solid rgba(201,168,76,0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          color: #c9a84c;
          margin-bottom: 20px;
          transition: border-color 0.3s;
        }

        .ad-card:hover .ad-card-avatar { border-color: rgba(201,168,76,0.48); }

        .ad-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 400;
          color: #f0ece2;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .ad-card-role {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.5);
          margin-bottom: 14px;
        }

        .ad-card-bio {
          font-size: 12px;
          color: rgba(232,228,218,0.32);
          line-height: 1.65;
          margin-bottom: 20px;
        }

        .ad-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ad-card-tag {
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(232,228,218,0.32);
          border: 1px solid rgba(232,228,218,0.09);
          padding: 3px 9px;
          transition: all 0.3s;
        }

        .ad-card:hover .ad-card-tag {
          color: rgba(232,228,218,0.58);
          border-color: rgba(232,228,218,0.2);
        }

        .ad-card-stories {
          font-size: 10px;
          color: rgba(232,228,218,0.18);
        }

        .ad-arrow {
          position: absolute;
          bottom: 22px;
          right: 22px;
          font-size: 15px;
          color: transparent;
          transition: color 0.3s, transform 0.3s;
        }

        .ad-card:hover .ad-arrow { color: #c9a84c; transform: translate(3px, -3px); }

        /* ── EMPTY STATE ── */
        .ad-empty {
          grid-column: 1 / -1;
          padding: 72px 0;
          text-align: center;
        }

        .ad-empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: rgba(232,228,218,0.25);
          margin-bottom: 8px;
        }

        .ad-empty-sub {
          font-size: 11px;
          letter-spacing: 0.1em;
          color: rgba(232,228,218,0.14);
        }

        /* ── FOOTER ── */
        .ad-footer {
          margin-top: 52px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ad-footer-count {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(232,228,218,0.18);
          white-space: nowrap;
        }

        .ad-footer-line {
          flex: 1;
          height: 1px;
          background: rgba(232,228,218,0.06);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .ad-wrap { padding: 48px 20px 72px; }
          .ad-title { font-size: 40px; }
          .ad-grid { grid-template-columns: 1fr; }
          .ad-spotlight-inner { flex-direction: column; align-items: flex-start; gap: 16px; }
          .ad-stats { flex-direction: column; }
          .ad-stat { border-right: none; border-bottom: 1px solid rgba(232,228,218,0.08); }
          .ad-stat:last-child { border-bottom: none; }
        }

        @media (min-width: 641px) and (max-width: 860px) {
          .ad-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="ad-root">
        <div className="ad-wrap">

          {/* ── Header ── */}
          <span className="ad-eyebrow">The Reading Room</span>
          <h1 className="ad-title">Author<br />Directory</h1>
          <p className="ad-desc">
            Every voice that calls TTL home. Discover the writers shaping our library — one tiny story at a time.
          </p>

          {/* ── Stats Bar ── */}
          <div className="ad-stats">
            <div className="ad-stat">
              <div className="ad-stat-num">{AUTHORS.length}</div>
              <div className="ad-stat-label">Authors</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-num">{genreCount}</div>
              <div className="ad-stat-label">Genres</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-num">{totalStories}</div>
              <div className="ad-stat-label">Stories Published</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-num">∞</div>
              <div className="ad-stat-label">Words Yet to Come</div>
            </div>
          </div>

          {/* ── Spotlight ── */}
          {spotlight && (
            <>
              <div className="ad-spotlight-label">Author Spotlight</div>
              <Link href={`/reading-room/authors/${spotlight.slug}`} className="ad-spotlight">
                <div className="ad-spotlight-inner">
                  <div className="ad-spotlight-avatar">{spotlight.initial}</div>
                  <div className="ad-spotlight-info">
                    <div className="ad-spotlight-genre">{spotlight.genre}</div>
                    <div className="ad-spotlight-name">{spotlight.name}</div>
                    <div className="ad-spotlight-bio">{spotlight.bio}</div>
                    <div className="ad-spotlight-cta">View Profile →</div>
                  </div>
                </div>
              </Link>
            </>
          )}

          {/* ── Search + Genre Filter ── */}
          <div className="ad-controls">
            <div className="ad-search-wrap">
              <span className="ad-search-icon">⌕</span>
              <input
                className="ad-search"
                placeholder="Search by name or genre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="ad-genres">
              {GENRES.map((g) => (
                <button
                  key={g}
                  className={`ad-genre-btn${activeGenre === g ? " active" : ""}`}
                  onClick={() => setActiveGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ── Results meta ── */}
          <div className="ad-meta">
            {filtered.length} {filtered.length === 1 ? "author" : "authors"} found
          </div>

          {/* ── Author Grid ── */}
          <div className="ad-grid">
            {filtered.length > 0 ? (
              filtered.map((author) => (
                <Link
                  key={author.slug}
                  href={`/reading-room/authors/${author.slug}`}
                  className="ad-card"
                >
                  <div className="ad-card-avatar">{author.initial}</div>
                  <div className="ad-card-name">{author.name}</div>
                  <div className="ad-card-role">{author.role}</div>
                  <div className="ad-card-bio">{author.bio}</div>
                  <div className="ad-card-footer">
                    <span className="ad-card-tag">{author.genre}</span>
                    <span className="ad-card-stories">
                      {author.stories} {author.stories === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  <span className="ad-arrow">↗</span>
                </Link>
              ))
            ) : (
              <div className="ad-empty">
                <div className="ad-empty-title">No authors found</div>
                <div className="ad-empty-sub">Try a different search or genre</div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="ad-footer">
            <span className="ad-footer-count">The Tiniest Library · Reading Room</span>
            <div className="ad-footer-line" />
          </div>

        </div>
      </div>
    </>
  );
}
