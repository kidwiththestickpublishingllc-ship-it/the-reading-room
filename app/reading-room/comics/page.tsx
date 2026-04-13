"use client";

import React, { useEffect, useMemo, useState } from "react";

// =============================================================
// COMICS & MANGA — The Reading Room / TTL
// Route: /reading-room/comics
// Ink cost: 10 per chapter
// Sections: Comics | Manga (tabbed, separate)
// Color: Teal green (#2DD4BF / #0F766E) + gold (#C9A84C) on deep dark
// Fonts: Cormorant Garamond (display) + Syne (UI)
// =============================================================

// ─── Types ────────────────────────────────────────────────────
type MediaType = "comics" | "manga";

type ComicSeries = {
  slug: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  chapters: number;
  description: string;
  badge?: "New" | "Ongoing" | "Complete" | "Exclusive";
  inkPerChapter: number;
};

// ─── Constants ────────────────────────────────────────────────
const INK_PER_CHAPTER = 10;
const INK_KEY = "ttl_ink";
const UNLOCKS_KEY = "ttl_comic_unlocks";
const DEFAULT_INK = 250;

function getInk(): number {
  if (typeof window === "undefined") return DEFAULT_INK;
  const raw = localStorage.getItem(INK_KEY);
  return raw ? Number(raw) : DEFAULT_INK;
}
function setInkStore(n: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INK_KEY, String(n));
}
function getUnlocks(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(UNLOCKS_KEY) || "{}"); } catch { return {}; }
}
function setUnlocks(u: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(u));
}

// ─── Demo Data ────────────────────────────────────────────────
const DEMO_COMICS: ComicSeries[] = [
  { slug: "iron-meridian", title: "Iron Meridian", author: "D. Vasquez", cover: "", genre: "Sci-Fi", chapters: 8, description: "A lone engineer discovers a signal buried beneath a dead moon — and what answers her is older than the stars.", badge: "Ongoing", inkPerChapter: INK_PER_CHAPTER },
  { slug: "hollow-crown", title: "Hollow Crown", author: "M. Reyes", cover: "", genre: "Dark Fantasy", chapters: 12, description: "The king is dead. The throne bleeds. Three heirs race through a crumbling empire where magic costs memories.", badge: "Exclusive", inkPerChapter: INK_PER_CHAPTER },
  { slug: "neon-diocese", title: "Neon Diocese", author: "A. Park", cover: "", genre: "Cyberpunk", chapters: 6, description: "In a city run by a tech-cult, a defrocked priest hacks prayers and sells them on the black market.", badge: "New", inkPerChapter: INK_PER_CHAPTER },
  { slug: "saltwater-gospel", title: "Saltwater Gospel", author: "C. Obi", cover: "", genre: "Horror", chapters: 10, description: "Every lighthouse keeper on the Eastern coast vanished the same night. One journalist sails toward the truth.", badge: "Complete", inkPerChapter: INK_PER_CHAPTER },
  { slug: "the-cartographer", title: "The Cartographer", author: "L. Huang", cover: "", genre: "Adventure", chapters: 15, description: "Maps lie. The girl who draws them knows why — and the empire will burn her alive before she tells anyone.", badge: "Ongoing", inkPerChapter: INK_PER_CHAPTER },
  { slug: "dust-and-voltage", title: "Dust & Voltage", author: "J. Moreau", cover: "", genre: "Western Sci-Fi", chapters: 9, description: "Two gunslingers. One wants to kill the machine god. The other built it.", badge: "New", inkPerChapter: INK_PER_CHAPTER },
];

const DEMO_MANGA: ComicSeries[] = [
  { slug: "akari-no-hana", title: "Akari no Hana", author: "S. Tanaka", cover: "", genre: "Shounen", chapters: 24, description: "A talentless boy inherits a legendary sword — only to learn it speaks, argues, and has very strong opinions about honor.", badge: "Ongoing", inkPerChapter: INK_PER_CHAPTER },
  { slug: "vermillion-gate", title: "Vermillion Gate", author: "H. Yamamoto", cover: "", genre: "Seinen", chapters: 18, description: "A retired demon hunter opens a noodle shop. Demons keep finding him. The broth is still excellent.", badge: "Exclusive", inkPerChapter: INK_PER_CHAPTER },
  { slug: "paper-crane-club", title: "Paper Crane Club", author: "R. Ito", cover: "", genre: "Slice of Life", chapters: 11, description: "Five high schoolers fold origami after class and slowly, quietly, save each other.", badge: "Complete", inkPerChapter: INK_PER_CHAPTER },
  { slug: "echo-protocol", title: "Echo Protocol", author: "K. Mori", cover: "", genre: "Mecha", chapters: 20, description: "The AI in Pilot Seven's mech starts dreaming. The generals call it a glitch. Seven calls it a friend.", badge: "New", inkPerChapter: INK_PER_CHAPTER },
  { slug: "thousand-year-tea", title: "Thousand Year Tea", author: "Y. Kobayashi", cover: "", genre: "Historical", chapters: 16, description: "A tea master in feudal Japan carries a secret that three shogunates have tried to erase from history.", badge: "Ongoing", inkPerChapter: INK_PER_CHAPTER },
  { slug: "wild-frequency", title: "Wild Frequency", author: "N. Sato", cover: "", genre: "Romance", chapters: 14, description: "A music producer and a street musician share a studio wall, a broken heater, and absolutely zero intention of falling in love.", badge: "New", inkPerChapter: INK_PER_CHAPTER },
];

const COMIC_GENRES = ["All", "Sci-Fi", "Dark Fantasy", "Cyberpunk", "Horror", "Adventure", "Western Sci-Fi"];
const MANGA_GENRES = ["All", "Shounen", "Seinen", "Slice of Life", "Mecha", "Historical", "Romance"];
const BADGE_COLORS: Record<string, string> = {
  New: "#2DD4BF",
  Ongoing: "#C9A84C",
  Complete: "#6495ED",
  Exclusive: "#E879A0",
};

// ─── Placeholder Cover ────────────────────────────────────────
function CoverPlaceholder({ title, genre, type }: { title: string; genre: string; type: MediaType }) {
  const colors: Record<string, string[]> = {
    "Sci-Fi": ["#0F2A3A", "#2DD4BF"], "Dark Fantasy": ["#1A0E2E", "#8B5CF6"],
    Cyberpunk: ["#0A1628", "#F97316"], Horror: ["#1A0A0A", "#EF4444"],
    Adventure: ["#0A1F0A", "#22C55E"], "Western Sci-Fi": ["#1F1200", "#F59E0B"],
    Shounen: ["#0A1628", "#3B82F6"], Seinen: ["#1A1A1A", "#6B7280"],
    "Slice of Life": ["#0F2010", "#86EFAC"], Mecha: ["#0A0F1F", "#60A5FA"],
    Historical: ["#1A1208", "#D97706"], Romance: ["#1F0A14", "#F472B6"],
  };
  const [bg, accent] = colors[genre] || ["#0F1A1A", "#2DD4BF"];
  const symbol = type === "manga" ? "漫" : "◈";
  return (
    <div style={{ width: "100%", height: "100%", background: `linear-gradient(145deg, ${bg}, #0a0f0f)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 30% 20%, ${accent}18 0%, transparent 60%)` }} />
      <span style={{ fontSize: 38, color: accent, opacity: 0.6, fontFamily: "serif" }}>{symbol}</span>
      <span style={{ fontSize: 11, color: accent, opacity: 0.5, fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", padding: "0 12px" }}>{genre}</span>
    </div>
  );
}

// ─── Series Card ──────────────────────────────────────────────
function SeriesCard({ series, type, ink, onUnlock, unlocked }: {
  series: ComicSeries; type: MediaType;
  ink: number; onUnlock: (slug: string) => void; unlocked: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const canAfford = ink >= series.inkPerChapter;
  const badgeColor = series.badge ? BADGE_COLORS[series.badge] : "#2DD4BF";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? "rgba(45,212,191,0.35)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 16px 40px rgba(45,212,191,0.12)" : "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Cover */}
      <div style={{ height: 220, position: "relative", overflow: "hidden" }}>
        {series.cover ? (
          <img src={series.cover} alt={series.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <CoverPlaceholder title={series.title} genre={series.genre} type={type} />
        )}
        {series.badge && (
          <span style={{ position: "absolute", top: 10, left: 10, background: badgeColor, color: "#000", fontSize: 10, fontWeight: 700, fontFamily: "Syne, sans-serif", letterSpacing: "0.08em", padding: "3px 9px", borderRadius: 99, textTransform: "uppercase" }}>
            {series.badge}
          </span>
        )}
        {unlocked && (
          <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(45,212,191,0.5)", color: "#2DD4BF", fontSize: 10, fontFamily: "Syne, sans-serif", padding: "3px 9px", borderRadius: 99 }}>
            ✓ Unlocked
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 700, color: "#f0ece2", lineHeight: 1.2 }}>
            {series.title}
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(45,212,191,0.7)", fontWeight: 600 }}>
            {series.author}
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>·</span>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
            {series.genre}
          </span>
        </div>
        <p style={{ margin: "0 0 14px", fontFamily: "Cormorant Garamond, serif", fontSize: 14, color: "rgba(240,236,226,0.6)", lineHeight: 1.55 }}>
          {series.description}
        </p>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {series.chapters} chapters
          </span>
          <button
            onClick={() => !unlocked && onUnlock(series.slug)}
            style={{
              fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "6px 16px", borderRadius: 99, border: "none", cursor: unlocked ? "default" : "pointer",
              background: unlocked ? "rgba(45,212,191,0.12)" : canAfford ? "#2DD4BF" : "rgba(255,255,255,0.06)",
              color: unlocked ? "#2DD4BF" : canAfford ? "#000" : "rgba(255,255,255,0.3)",
              transition: "all 0.2s",
            }}
          >
            {unlocked ? "<a href={`/reading-room/comics/${series.slug}/read/1`} style={{ textDecoration: 'none', color: 'inherit' }}>Read →</a>" : canAfford ? `${series.inkPerChapter} Ink` : "Need Ink"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ComicsMangaPage() {
  const [activeTab, setActiveTab] = useState<MediaType>("comics");
  const [ink, setInk] = useState(DEFAULT_INK);
  const [unlocks, setUnlocksState] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInk(getInk());
    setUnlocksState(getUnlocks());
    setMounted(true);
  }, []);

  // Reset genre filter on tab switch
  const handleTabSwitch = (tab: MediaType) => {
    setActiveTab(tab);
    setGenreFilter("All");
    setSearch("");
  };

  const handleUnlock = (slug: string) => {
    if (ink < INK_PER_CHAPTER) return;
    const newInk = ink - INK_PER_CHAPTER;
    const newUnlocks = { ...unlocks, [slug]: true };
    setInk(newInk);
    setUnlocksState(newUnlocks);
    setInkStore(newInk);
    setUnlocks(newUnlocks);
  };

  const currentData = activeTab === "comics" ? DEMO_COMICS : DEMO_MANGA;
  const currentGenres = activeTab === "comics" ? COMIC_GENRES : MANGA_GENRES;

  const filtered = useMemo(() => {
    return currentData.filter(s => {
      const matchGenre = genreFilter === "All" || s.genre === genreFilter;
      const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.author.toLowerCase().includes(search.toLowerCase());
      return matchGenre && matchSearch;
    });
  }, [currentData, genreFilter, search]);

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
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(45,212,191,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(201,168,76,0.05) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Nav ── */
        .cm-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(8,15,15,0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(45,212,191,0.12);
          padding: 0 40px;
          height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cm-nav-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .cm-nav-glyph {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #0F766E, #2DD4BF);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: #000;
          font-family: 'Syne', sans-serif; letter-spacing: -0.05em;
        }
        .cm-nav-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 700;
          color: #f0ece2; letter-spacing: 0.02em;
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
          color: rgba(45,212,191,0.7); text-decoration: none; letter-spacing: 0.08em;
          text-transform: uppercase; transition: color 0.2s;
        }
        .cm-back-link:hover { color: #2DD4BF; }

        /* ── Hero ── */
        .cm-hero {
          position: relative; z-index: 1;
          padding: 72px 40px 56px;
          text-align: center;
          border-bottom: 1px solid rgba(45,212,191,0.08);
        }
        .cm-hero-eyebrow {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #2DD4BF; margin-bottom: 16px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .cm-hero-eyebrow::before, .cm-hero-eyebrow::after {
          content: ''; width: 32px; height: 1px; background: rgba(45,212,191,0.4);
        }
        .cm-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 7vw, 80px);
          font-weight: 700; line-height: 0.95;
          color: #f0ece2; margin: 0 0 20px;
          letter-spacing: -0.02em;
        }
        .cm-hero h1 em {
          font-style: italic; color: #2DD4BF;
        }
        .cm-hero-sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: rgba(240,236,226,0.5);
          font-style: italic; max-width: 480px; margin: 0 auto 32px;
          line-height: 1.5;
        }
        .cm-ink-note {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(45,212,191,0.06); border: 1px solid rgba(45,212,191,0.2);
          border-radius: 99px; padding: 8px 20px;
          font-family: 'Syne', sans-serif; font-size: 12px;
          color: rgba(45,212,191,0.8); letter-spacing: 0.06em;
        }

        /* ── Tabs ── */
        .cm-tabs {
          position: relative; z-index: 1;
          display: flex; justify-content: center;
          padding: 32px 40px 0; gap: 4px;
        }
        .cm-tab {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 12px 36px; border-radius: 99px;
          border: 1px solid transparent; cursor: pointer;
          transition: all 0.25s ease; background: transparent;
        }
        .cm-tab.active {
          background: #2DD4BF; color: #000;
          border-color: #2DD4BF;
          box-shadow: 0 0 24px rgba(45,212,191,0.25);
        }
        .cm-tab.inactive {
          color: rgba(240,236,226,0.4);
          border-color: rgba(255,255,255,0.08);
        }
        .cm-tab.inactive:hover {
          color: #2DD4BF; border-color: rgba(45,212,191,0.3);
          background: rgba(45,212,191,0.05);
        }

        /* ── Section Label ── */
        .cm-section-label {
          position: relative; z-index: 1;
          padding: 28px 40px 0;
          display: flex; align-items: center; gap: 16px;
        }
        .cm-section-label h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700; color: #f0ece2;
          margin: 0; letter-spacing: -0.01em;
        }
        .cm-section-label h2 span { color: #2DD4BF; font-style: italic; }
        .cm-section-line {
          flex: 1; height: 1px;
          background: linear-gradient(to right, rgba(45,212,191,0.2), transparent);
        }

        /* ── Controls ── */
        .cm-controls {
          position: relative; z-index: 1;
          padding: 20px 40px 0;
          display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
        }
        .cm-search {
          flex: 1; min-width: 200px; max-width: 320px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 99px; padding: 10px 20px;
          color: #f0ece2; font-family: 'Syne', sans-serif; font-size: 13px;
          outline: none; transition: border-color 0.2s;
        }
        .cm-search::placeholder { color: rgba(240,236,226,0.3); }
        .cm-search:focus { border-color: rgba(45,212,191,0.4); }
        .cm-genre-pills {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .cm-pill {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.07em; padding: 7px 16px; border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
          transition: all 0.2s; background: transparent; color: rgba(240,236,226,0.5);
        }
        .cm-pill.active {
          background: rgba(45,212,191,0.12);
          border-color: rgba(45,212,191,0.4); color: #2DD4BF;
        }
        .cm-pill:hover:not(.active) {
          border-color: rgba(45,212,191,0.25); color: rgba(45,212,191,0.7);
        }

        /* ── Grid ── */
        .cm-grid {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px; padding: 28px 40px 80px;
        }

        /* ── Empty ── */
        .cm-empty {
          position: relative; z-index: 1;
          text-align: center; padding: 80px 40px;
          color: rgba(240,236,226,0.3);
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-style: italic;
        }

        /* ── Footer divider ── */
        .cm-divider {
          position: relative; z-index: 1;
          height: 1px; margin: 0 40px;
          background: linear-gradient(to right, transparent, rgba(45,212,191,0.15), transparent);
        }

        @media (max-width: 640px) {
          .cm-nav { padding: 0 20px; }
          .cm-hero { padding: 48px 20px 40px; }
          .cm-tabs { padding: 24px 20px 0; }
          .cm-controls { padding: 16px 20px 0; }
          .cm-grid { padding: 24px 20px 60px; gap: 16px; }
          .cm-section-label { padding: 24px 20px 0; }
        }
      `}</style>

      <div className="cm-page">

        {/* ── Nav ── */}
        <nav className="cm-nav">
          <div className="cm-nav-brand">
            <div className="cm-nav-glyph">CM</div>
            <span className="cm-nav-title">
              Comics <span>&</span> Manga
            </span>
          </div>
          <div className="cm-nav-right">
            <div className="cm-ink-badge">
              🖋 {ink} Ink
            </div>
            <a href="/reading-room" className="cm-back-link">← Reading Room</a>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="cm-hero">
          <div className="cm-hero-eyebrow">The Tiniest Library</div>
          <h1>
            Visual <em>Stories</em><br />Come Alive
          </h1>
          <p className="cm-hero-sub">
            Panel by panel. Page by page. Comics and manga from independent creators — yours to unlock.
          </p>
          <div className="cm-ink-note">
            🖋 Just 10 Ink per chapter — our lowest unlock price
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="cm-tabs">
          <button className={`cm-tab ${activeTab === "comics" ? "active" : "inactive"}`} onClick={() => handleTabSwitch("comics")}>
            ◈ Comics
          </button>
          <button className={`cm-tab ${activeTab === "manga" ? "active" : "inactive"}`} onClick={() => handleTabSwitch("manga")}>
            漫 Manga
          </button>
        </div>

        {/* ── Section Label ── */}
        <div className="cm-section-label">
          <h2>{activeTab === "comics" ? <>Original <span>Comics</span></> : <>Manga <span>Collection</span></>}</h2>
          <div className="cm-section-line" />
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
            {filtered.length} series
          </span>
        </div>

        {/* ── Controls ── */}
        <div className="cm-controls">
          <input
            className="cm-search"
            placeholder="Search title or creator…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="cm-genre-pills">
            {currentGenres.map(g => (
              <button key={g} className={`cm-pill ${genreFilter === g ? "active" : ""}`} onClick={() => setGenreFilter(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        {filtered.length > 0 ? (
          <div className="cm-grid">
            {filtered.map(series => (
              <SeriesCard
                key={series.slug}
                series={series}
                type={activeTab}
                ink={ink}
                unlocked={!!unlocks[series.slug]}
                onUnlock={handleUnlock}
              />
            ))}
          </div>
        ) : (
          <div className="cm-empty">No series match your search…</div>
        )}

        <div className="cm-divider" />

      </div>
    </>
  );
}
