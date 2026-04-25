"use client";

import React, { useEffect, useState } from "react";

// =============================================================
// COMICS & MANGA LANDING PAGE v2 — The Reading Room / TTL
// Route: /reading-room/comics
// Features:
//   - Comics tab: 25 genres
//   - Manga tab: 30 genres
//   - Genre cards link to /reading-room/comics/genres/[type]/[genre]
//   - Teal green throughout
//   - Shared Ink balance display
// =============================================================

// ─── Types ────────────────────────────────────────────────────
type MediaType = "comics" | "manga";

type Genre = {
  slug: string;
  label: string;
  description: string;
  emoji: string;
  seriesCount: number;
  cover?: string;
};

// ─── Ink helpers ──────────────────────────────────────────────
const INK_KEY = "ttl_ink";
const DEFAULT_INK = 250;
function getInk(): number {
  if (typeof window === "undefined") return DEFAULT_INK;
  const raw = localStorage.getItem(INK_KEY);
  return raw ? Number(raw) : DEFAULT_INK;
}

// ─── Genre Data ───────────────────────────────────────────────

const COMICS_GENRES: Genre[] = [
  // Shared
  { slug: "action", label: "Action", emoji: "⚡", description: "High-octane sequences, relentless pacing, and heroes forged in fire.", seriesCount: 0 },
  { slug: "adventure", label: "Adventure", emoji: "🗺️", description: "Uncharted worlds, perilous quests, and the thrill of the unknown.", seriesCount: 0 },
  { slug: "romance", label: "Romance", emoji: "🌹", description: "Love in all its forms — tender, turbulent, and transformative.", seriesCount: 0 },
  { slug: "horror", label: "Horror", emoji: "🕯️", description: "Things that lurk in the dark. Stories that stay with you.", seriesCount: 0 },
  { slug: "sci-fi", label: "Sci-Fi", emoji: "🚀", description: "The future, reimagined. Technology, humanity, and the stars.", seriesCount: 0 },
  { slug: "fantasy", label: "Fantasy", emoji: "🐉", description: "Magic systems, ancient lore, and worlds beyond the veil.", seriesCount: 0 },
  { slug: "mystery", label: "Mystery", emoji: "🔍", description: "Clues hidden in plain sight. Truth buried under beautiful lies.", seriesCount: 0 },
  { slug: "thriller", label: "Thriller", emoji: "🎭", description: "Every page a trap. Every panel a revelation.", seriesCount: 0 },
  { slug: "slice-of-life", label: "Slice of Life", emoji: "☕", description: "Small moments. Real people. The quiet beauty of ordinary days.", seriesCount: 0 },
  { slug: "comedy", label: "Comedy", emoji: "😄", description: "Panels that make you laugh out loud in public places.", seriesCount: 0 },
  { slug: "drama", label: "Drama", emoji: "🎬", description: "Human stories told with unflinching honesty and raw emotion.", seriesCount: 0 },
  { slug: "supernatural", label: "Supernatural", emoji: "👁️", description: "The world behind the world. Forces older than memory.", seriesCount: 0 },
  { slug: "historical", label: "Historical", emoji: "⚔️", description: "The past rendered in ink. History as you've never seen it.", seriesCount: 0 },
  { slug: "sports", label: "Sports", emoji: "🏆", description: "The grind, the glory, and everything between.", seriesCount: 0 },
  { slug: "crime", label: "Crime", emoji: "🔫", description: "Heists, detectives, and the blurred line between justice and survival.", seriesCount: 0 },
  // Comics only
  { slug: "superhero", label: "Superhero", emoji: "🦸", description: "Capes, powers, and the weight of saving the world.", seriesCount: 0 },
  { slug: "graphic-novel", label: "Graphic Novel", emoji: "📖", description: "Long-form visual storytelling at its most ambitious.", seriesCount: 0 },
  { slug: "western", label: "Western", emoji: "🤠", description: "Dust, gunfire, and a horizon that never gets any closer.", seriesCount: 0 },
  { slug: "crime-noir", label: "Crime Noir", emoji: "🌑", description: "Rain-slicked streets, shadowy figures, and morally grey heroes.", seriesCount: 0 },
  { slug: "indie-alternative", label: "Indie / Alternative", emoji: "✏️", description: "Experimental, raw, and unapologetically original.", seriesCount: 0 },
  { slug: "steampunk", label: "Steampunk", emoji: "⚙️", description: "Brass gears, airships, and Victorian futures that never were.", seriesCount: 0 },
  { slug: "post-apocalyptic", label: "Post-Apocalyptic", emoji: "🌆", description: "The world ended. What comes next is up to the survivors.", seriesCount: 0 },
  { slug: "political", label: "Political", emoji: "🗳️", description: "Power, corruption, and the people who dare to resist.", seriesCount: 0 },
  { slug: "war", label: "War", emoji: "🪖", description: "The front lines rendered in devastating detail.", seriesCount: 0 },
  { slug: "biography-memoir", label: "Biography / Memoir", emoji: "📝", description: "Real lives. Real stories. Drawn from memory.", seriesCount: 0 },
];

const MANGA_GENRES: Genre[] = [
  // Shared
  { slug: "action", label: "Action", emoji: "⚡", description: "High-octane sequences, relentless pacing, and heroes forged in fire.", seriesCount: 0 },
  { slug: "adventure", label: "Adventure", emoji: "🗺️", description: "Uncharted worlds, perilous quests, and the thrill of the unknown.", seriesCount: 0 },
  { slug: "romance", label: "Romance", emoji: "🌹", description: "Love in all its forms — tender, turbulent, and transformative.", seriesCount: 0 },
  { slug: "horror", label: "Horror", emoji: "🕯️", description: "Things that lurk in the dark. Stories that stay with you.", seriesCount: 0 },
  { slug: "sci-fi", label: "Sci-Fi", emoji: "🚀", description: "The future, reimagined. Technology, humanity, and the stars.", seriesCount: 0 },
  { slug: "fantasy", label: "Fantasy", emoji: "🐉", description: "Magic systems, ancient lore, and worlds beyond the veil.", seriesCount: 0 },
  { slug: "mystery", label: "Mystery", emoji: "🔍", description: "Clues hidden in plain sight. Truth buried under beautiful lies.", seriesCount: 0 },
  { slug: "thriller", label: "Thriller", emoji: "🎭", description: "Every page a trap. Every panel a revelation.", seriesCount: 0 },
  { slug: "slice-of-life", label: "Slice of Life", emoji: "☕", description: "Small moments. Real people. The quiet beauty of ordinary days.", seriesCount: 0 },
  { slug: "comedy", label: "Comedy", emoji: "😄", description: "Panels that make you laugh out loud in public places.", seriesCount: 0 },
  { slug: "drama", label: "Drama", emoji: "🎬", description: "Human stories told with unflinching honesty and raw emotion.", seriesCount: 0 },
  { slug: "supernatural", label: "Supernatural", emoji: "👁️", description: "The world behind the world. Forces older than memory.", seriesCount: 0 },
  { slug: "historical", label: "Historical", emoji: "⚔️", description: "The past rendered in ink. History as you've never seen it.", seriesCount: 0 },
  { slug: "sports", label: "Sports", emoji: "🏆", description: "The grind, the glory, and everything between.", seriesCount: 0 },
  { slug: "crime", label: "Crime", emoji: "🔫", description: "Heists, detectives, and the blurred line between justice and survival.", seriesCount: 0 },
  // Manga only
  { slug: "shounen", label: "Shounen", emoji: "🔥", description: "Young heroes, impossible odds, and the will to never give up.", seriesCount: 0 },
  { slug: "shoujo", label: "Shoujo", emoji: "🌸", description: "Heartfelt stories of growth, love, and self-discovery.", seriesCount: 0 },
  { slug: "seinen", label: "Seinen", emoji: "🌙", description: "Mature, complex narratives for readers who want more.", seriesCount: 0 },
  { slug: "josei", label: "Josei", emoji: "🍵", description: "Realistic romance and life stories for adult women.", seriesCount: 0 },
  { slug: "isekai", label: "Isekai", emoji: "🌀", description: "Transported to another world — and nothing will ever be the same.", seriesCount: 0 },
  { slug: "mecha", label: "Mecha", emoji: "🤖", description: "Giant machines, human pilots, and the cost of war.", seriesCount: 0 },
  { slug: "yaoi", label: "Yaoi", emoji: "💙", description: "Stories of love and connection between male characters.", seriesCount: 0 },
  { slug: "yuri", label: "Yuri", emoji: "💜", description: "Stories of love and connection between female characters.", seriesCount: 0 },
  { slug: "magical-girl", label: "Magical Girl", emoji: "✨", description: "Power, transformation, and the courage to protect what matters.", seriesCount: 0 },
  { slug: "martial-arts", label: "Martial Arts", emoji: "🥋", description: "Discipline, mastery, and the path of the warrior.", seriesCount: 0 },
  { slug: "psychological", label: "Psychological", emoji: "🧠", description: "Mind games, unreliable narrators, and truths that unravel slowly.", seriesCount: 0 },
  { slug: "school-life", label: "School Life", emoji: "🎒", description: "Friendships, rivalries, and the strange intensity of youth.", seriesCount: 0 },
  { slug: "cooking", label: "Cooking", emoji: "🍜", description: "Food as art, passion, and the language of love.", seriesCount: 0 },
  { slug: "music", label: "Music", emoji: "🎵", description: "The stage, the sound, and the soul behind every note.", seriesCount: 0 },
  { slug: "idol", label: "Idol", emoji: "🌟", description: "Fame, dreams, and the price of standing in the spotlight.", seriesCount: 0 },
];

// ─── Genre Card ───────────────────────────────────────────────
function GenreCard({ genre, type }: { genre: Genre; type: MediaType }) {
  const [hovered, setHovered] = useState(false);
  const href = `/reading-room/comics/genres/${type}/${genre.slug}`;

  return (
    <a
      href={href}
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: "relative",
        background: hovered
          ? "rgba(45,212,191,0.08)"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        padding: "28px 24px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered
          ? "0 20px 48px rgba(45,212,191,0.12)"
          : "0 2px 12px rgba(0,0,0,0.3)",
        overflow: "hidden",
        height: "100%",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: hovered
            ? "radial-gradient(circle at 30% 30%, rgba(45,212,191,0.06) 0%, transparent 70%)"
            : "none",
          transition: "all 0.3s",
          pointerEvents: "none",
        }} />

        {/* Cover image or placeholder */}
        <div style={{
  width: "100%", height: 140, borderRadius: 10,
  overflow: "hidden", marginBottom: 18,
}}>
  <img
    src={`/comics-genres/${type}/${genre.slug}/cover.jpg`}
    alt={genre.label}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
    onError={(e) => {
      const img = e.currentTarget;
      const parent = img.parentElement;
      if (parent) {
        img.style.display = "none";
        parent.style.background = "linear-gradient(145deg, rgba(45,212,191,0.06), rgba(15,118,110,0.04))";
        parent.style.border = "1px solid rgba(45,212,191,0.1)";
        parent.style.display = "flex";
        parent.style.alignItems = "center";
        parent.style.justifyContent = "center";
        parent.style.fontSize = "48px";
        parent.textContent = genre.emoji;
      }
    }}
  />
</div>
        {/* Label */}
        <h3 style={{
          margin: "0 0 8px",
          fontFamily: "Cormorant Garamond, serif",
          fontSize: 20, fontWeight: 700,
          color: hovered ? "#2DD4BF" : "#f0ece2",
          transition: "color 0.2s",
          lineHeight: 1.2,
        }}>
          {genre.label}
        </h3>

        {/* Description */}
        <p style={{
          margin: "0 0 16px",
          fontFamily: "Cormorant Garamond, serif",
          fontSize: 14, fontStyle: "italic",
          color: "rgba(240,236,226,0.5)",
          lineHeight: 1.55,
        }}>
          {genre.description}
        </p>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            fontFamily: "Syne, sans-serif", fontSize: 11,
            color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em",
          }}>
            {genre.seriesCount > 0 ? `${genre.seriesCount} series` : "Coming soon"}
          </span>
          <span style={{
            fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700,
            color: hovered ? "#2DD4BF" : "rgba(45,212,191,0.4)",
            letterSpacing: "0.08em", transition: "color 0.2s",
          }}>
            Browse →
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ComicsMangaPage() {
  const [activeTab, setActiveTab] = useState<MediaType>("comics");
  const [ink, setInk] = useState(DEFAULT_INK);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInk(getInk());
    setMounted(true);
  }, []);

  const handleTabSwitch = (tab: MediaType) => {
    setActiveTab(tab);
    setSearch("");
  };

  const currentGenres = activeTab === "comics" ? COMICS_GENRES : MANGA_GENRES;

  const filtered = search
    ? currentGenres.filter(g =>
        g.label.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
      )
    : currentGenres;

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .cm-page {
          min-height: 100vh;
          background: #080f0f;
          color: #f0ece2;
          font-family: 'Cormorant Garamond', serif;
          position: relative;
          overflow-x: hidden;
        }
        .cm-page::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(45,212,191,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(201,168,76,0.05) 0%, transparent 55%);
          pointer-events: none; z-index: 0;
        }

        /* Nav */
        .cm-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(8,15,15,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(45,212,191,0.1);
          padding: 0 40px; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cm-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .cm-nav-glyph {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #0F766E, #2DD4BF);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #000;
          font-family: 'Syne', sans-serif;
        }
        .cm-nav-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 700; color: #f0ece2;
        }
        .cm-nav-title span { color: #2DD4BF; }
        .cm-nav-right { display: flex; align-items: center; gap: 12px; }
        .cm-ink-badge {
          display: flex; align-items: center; gap: 6px;
          border: 1px solid rgba(201,168,76,0.3);
          background: rgba(201,168,76,0.06);
          padding: 5px 14px; border-radius: 99px;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          color: #C9A84C; letter-spacing: 0.06em;
        }
        .cm-back-link {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600;
          color: rgba(45,212,191,0.7); text-decoration: none;
          letter-spacing: 0.08em; text-transform: uppercase; transition: color 0.2s;
        }
        .cm-back-link:hover { color: #2DD4BF; }

        /* Hero */
        .cm-hero {
          position: relative; z-index: 1;
          padding: 72px 40px 56px; text-align: center;
          border-bottom: 1px solid rgba(45,212,191,0.08);
        }
        .cm-hero-eyebrow {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase; color: #2DD4BF;
          margin-bottom: 16px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .cm-hero-eyebrow::before, .cm-hero-eyebrow::after {
          content: ''; width: 32px; height: 1px; background: rgba(45,212,191,0.4);
        }
        .cm-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 7vw, 80px); font-weight: 700;
          line-height: 0.95; color: #f0ece2; margin: 0 0 20px;
          letter-spacing: -0.02em;
        }
        .cm-hero h1 em { font-style: italic; color: #2DD4BF; }
        .cm-hero-sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: rgba(240,236,226,0.5);
          font-style: italic; max-width: 520px; margin: 0 auto 32px; line-height: 1.5;
        }
        .cm-stats {
          display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;
        }
        .cm-stat {
          text-align: center;
        }
        .cm-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 700; color: #2DD4BF; line-height: 1;
        }
        .cm-stat-label {
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(240,236,226,0.35); margin-top: 4px;
        }

        /* Tabs */
        .cm-tabs {
          position: relative; z-index: 1;
          display: flex; justify-content: center;
          padding: 40px 40px 0; gap: 4px;
        }
        .cm-tab {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 12px 40px; border-radius: 99px;
          border: 1px solid transparent; cursor: pointer; transition: all 0.25s ease;
          background: transparent;
        }
        .cm-tab.active {
          background: #2DD4BF; color: #000; border-color: #2DD4BF;
          box-shadow: 0 0 24px rgba(45,212,191,0.25);
        }
        .cm-tab.inactive {
          color: rgba(240,236,226,0.4); border-color: rgba(255,255,255,0.08);
        }
        .cm-tab.inactive:hover {
          color: #2DD4BF; border-color: rgba(45,212,191,0.3);
          background: rgba(45,212,191,0.05);
        }

        /* Section header */
        .cm-section-header {
          position: relative; z-index: 1;
          padding: 32px 40px 0;
          display: flex; align-items: center; gap: 16px;
        }
        .cm-section-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px; font-weight: 700; color: #f0ece2;
          margin: 0; letter-spacing: -0.01em; white-space: nowrap;
        }
        .cm-section-header h2 span { color: #2DD4BF; font-style: italic; }
        .cm-section-line {
          flex: 1; height: 1px;
          background: linear-gradient(to right, rgba(45,212,191,0.2), transparent);
        }
        .cm-genre-count {
          font-family: 'Syne', sans-serif; font-size: 11px;
          color: rgba(255,255,255,0.2); white-space: nowrap; letter-spacing: 0.05em;
        }

        /* Search */
        .cm-search-wrap {
          position: relative; z-index: 1;
          padding: 20px 40px 0;
        }
        .cm-search {
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 99px; padding: 11px 22px;
          color: #f0ece2; font-family: 'Syne', sans-serif; font-size: 13px;
          outline: none; transition: border-color 0.2s;
        }
        .cm-search::placeholder { color: rgba(240,236,226,0.25); }
        .cm-search:focus { border-color: rgba(45,212,191,0.4); }

        /* Grid */
        .cm-grid {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px; padding: 28px 40px 80px;
        }

        /* Empty */
        .cm-empty {
          position: relative; z-index: 1;
          text-align: center; padding: 80px 40px;
          color: rgba(240,236,226,0.3);
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-style: italic;
        }

        /* Divider */
        .cm-divider {
          position: relative; z-index: 1;
          height: 1px; margin: 0 40px;
          background: linear-gradient(to right, transparent, rgba(45,212,191,0.15), transparent);
        }

        /* Submit CTA */
        .cm-submit-cta {
          position: relative; z-index: 1;
          margin: 60px 40px;
          background: rgba(45,212,191,0.04);
          border: 1px solid rgba(45,212,191,0.15);
          border-radius: 20px; padding: 48px 40px;
          text-align: center;
        }
        .cm-submit-cta h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 700; color: #f0ece2;
          margin: 0 0 12px;
        }
        .cm-submit-cta h3 span { color: #2DD4BF; font-style: italic; }
        .cm-submit-cta p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-style: italic;
          color: rgba(240,236,226,0.45); margin: 0 0 28px;
          max-width: 480px; margin-left: auto; margin-right: auto;
        }
        .cm-submit-btn {
          display: inline-block; padding: 14px 36px; border-radius: 99px;
          background: #2DD4BF; color: #000; text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          transition: opacity 0.2s;
          box-shadow: 0 0 28px rgba(45,212,191,0.25);
        }
        .cm-submit-btn:hover { opacity: 0.85; }

        @media (max-width: 640px) {
          .cm-nav { padding: 0 16px; height: 56px; }
          .cm-nav-title { font-size: 15px; }
          .cm-ink-badge { padding: 4px 10px; font-size: 10px; }
          .cm-back-link { display: none; }
          .cm-hero { padding: 48px 16px 40px; }
          .cm-hero h1 { font-size: 36px; }
          .cm-hero-sub { font-size: 16px; }
          .cm-tabs { padding: 20px 16px 0; }
          .cm-section-header { padding: 20px 16px 0; }
          .cm-search-wrap { padding: 12px 16px 0; }
          .cm-grid { padding: 16px 16px 80px; gap: 10px; grid-template-columns: repeat(2, 1fr); }
          .cm-submit-cta { margin: 32px 16px; padding: 28px 20px; }
          .cm-nav-right { gap: 8px; }
        }
      `}</style>

      <div className="cm-page">

        {/* Nav */}
        <nav className="cm-nav">
          <div className="cm-nav-brand">
            <div className="cm-nav-glyph">CM</div>
            <span className="cm-nav-title">
              Comics <span>&</span> Manga
            </span>
          </div>
          <div className="cm-nav-right">
            <div className="cm-ink-badge">🖋 {ink} Ink</div>
            <a href="/reading-room" className="cm-back-link">← Reading Room</a>
          </div>
        </nav>

        {/* Hero */}
        <section className="cm-hero">
          <div className="cm-hero-eyebrow">The Tiniest Library</div>
          <h1>Visual <em>Stories</em><br />Come Alive</h1>
          <p className="cm-hero-sub">
            Panel by panel. Page by page. Comics and manga from independent creators — yours to explore.
          </p>
          <div className="cm-stats">
            <div className="cm-stat">
              <div className="cm-stat-num">25</div>
              <div className="cm-stat-label">Comic Genres</div>
            </div>
            <div className="cm-stat">
              <div className="cm-stat-num">30</div>
              <div className="cm-stat-label">Manga Genres</div>
            </div>
            <div className="cm-stat">
              <div className="cm-stat-num">10</div>
              <div className="cm-stat-label">Ink per Chapter</div>
            </div>
            <div className="cm-stat">
              <div className="cm-stat-num">∞</div>
              <div className="cm-stat-label">Stories to Come</div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="cm-tabs">
          <button
            className={`cm-tab ${activeTab === "comics" ? "active" : "inactive"}`}
            onClick={() => handleTabSwitch("comics")}
          >
            ◈ Comics
          </button>
          <button
            className={`cm-tab ${activeTab === "manga" ? "active" : "inactive"}`}
            onClick={() => handleTabSwitch("manga")}
          >
            漫 Manga
          </button>
        </div>

        {/* Section header */}
        <div className="cm-section-header">
          <h2>
            {activeTab === "comics"
              ? <>Browse <span>Comics</span> Genres</>
              : <>Browse <span>Manga</span> Genres</>
            }
          </h2>
          <div className="cm-section-line" />
          <span className="cm-genre-count">{filtered.length} genres</span>
        </div>

        {/* Search */}
        <div className="cm-search-wrap">
          <input
            className="cm-search"
            placeholder="Search genres…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Genre Grid */}
        {filtered.length > 0 ? (
          <div className="cm-grid">
            {filtered.map(genre => (
              <GenreCard key={genre.slug} genre={genre} type={activeTab} />
            ))}
          </div>
        ) : (
          <div className="cm-empty">No genres match your search…</div>
        )}

        <div className="cm-divider" />

        {/* Submit CTA */}
        <div className="cm-submit-cta">
          <h3>Are you a <span>comic artist</span> or manga creator?</h3>
          <p>
            TTL is looking for its founding visual storytellers. Keep your copyright. Earn from every chapter unlocked.
          </p>
          <a href="https://write.the-tiniest-library.com/apply" className="cm-submit-btn">
            Apply to The Writer's Room →
          </a>
        </div>

      </div>
    </>
  );
}
