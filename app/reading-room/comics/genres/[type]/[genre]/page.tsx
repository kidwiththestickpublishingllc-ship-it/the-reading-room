"use client";

import React, { useEffect, useState } from "react";

// =============================================================
// COMICS / MANGA GENRE LANDING PAGE — The Reading Room / TTL
// Route: /reading-room/comics/genres/[type]/[genre]
// Features:
//   - Hero with genre title, lore, emoji
//   - Series grid filtered by genre
//   - Ink unlock system (10 Ink per chapter)
//   - Cover image swappable via public/comic-genres/[genre]/
//   - Teal green throughout
// =============================================================

// ─── Types ────────────────────────────────────────────────────
type MediaType = "comics" | "manga";

type Series = {
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

// ─── Ink helpers ──────────────────────────────────────────────
const INK_KEY = "ttl_ink";
const UNLOCKS_KEY = "ttl_comic_unlocks";
const DEFAULT_INK = 250;
const INK_PER_CHAPTER = 10;

function getInk(): number {
  if (typeof window === "undefined") return DEFAULT_INK;
  const raw = localStorage.getItem(INK_KEY);
  return raw ? Number(raw) : DEFAULT_INK;
}
function setInkStore(n: number) {
  localStorage.setItem(INK_KEY, String(n));
}
function getUnlocks(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(UNLOCKS_KEY) || "{}"); } catch { return {}; }
}
function setUnlocks(u: Record<string, boolean>) {
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(u));
}

// ─── Genre Meta ───────────────────────────────────────────────
const GENRE_META: Record<string, { label: string; emoji: string; lore: string; cover?: string }> = {
  // Shared
  "action":           { label: "Action",           emoji: "⚡", lore: "High-octane sequences, relentless pacing, and heroes forged in fire. These are stories that move." },
  "adventure":        { label: "Adventure",         emoji: "🗺️", lore: "Uncharted worlds, perilous quests, and the thrill of the unknown. Pack light. The journey is everything." },
  "romance":          { label: "Romance",           emoji: "🌹", lore: "Love in all its forms — tender, turbulent, and transformative. Hearts rendered in ink." },
  "horror":           { label: "Horror",            emoji: "🕯️", lore: "Things that lurk in the dark. Stories you finish at 3am and immediately regret." },
  "sci-fi":           { label: "Sci-Fi",            emoji: "🚀", lore: "The future, reimagined. Technology, humanity, and the infinite expanse of the stars." },
  "fantasy":          { label: "Fantasy",           emoji: "🐉", lore: "Magic systems, ancient lore, and worlds beyond the veil of the ordinary." },
  "mystery":          { label: "Mystery",           emoji: "🔍", lore: "Clues hidden in plain sight. Truth buried under beautiful lies. Every panel is a puzzle." },
  "thriller":         { label: "Thriller",          emoji: "🎭", lore: "Every page a trap. Every panel a revelation. Trust no one — especially the narrator." },
  "slice-of-life":    { label: "Slice of Life",     emoji: "☕", lore: "Small moments. Real people. The quiet, devastating beauty of ordinary days." },
  "comedy":           { label: "Comedy",            emoji: "😄", lore: "Panels that make you laugh out loud in public places. You've been warned." },
  "drama":            { label: "Drama",             emoji: "🎬", lore: "Human stories told with unflinching honesty. Nothing is resolved easily here." },
  "supernatural":     { label: "Supernatural",      emoji: "👁️", lore: "The world behind the world. Forces older than memory, stranger than dreams." },
  "historical":       { label: "Historical",        emoji: "⚔️", lore: "The past rendered in devastating detail. History as you've never experienced it." },
  "sports":           { label: "Sports",            emoji: "🏆", lore: "The grind, the glory, the heartbreak, and everything in between." },
  "crime":            { label: "Crime",             emoji: "🔫", lore: "Heists, detectives, and the blurred line between justice and survival." },
  // Comics only
  "superhero":        { label: "Superhero",         emoji: "🦸", lore: "Capes, powers, and the unbearable weight of saving a world that doesn't always deserve it." },
  "graphic-novel":    { label: "Graphic Novel",     emoji: "📖", lore: "Long-form visual storytelling at its most ambitious and most human." },
  "western":          { label: "Western",           emoji: "🤠", lore: "Dust, gunfire, and a horizon that never gets any closer no matter how fast you ride." },
  "crime-noir":       { label: "Crime Noir",        emoji: "🌑", lore: "Rain-slicked streets, shadowy figures, and heroes too damaged to look away." },
  "indie-alternative":{ label: "Indie / Alternative",emoji: "✏️", lore: "Experimental, raw, and unapologetically original. Comics that color outside every line." },
  "steampunk":        { label: "Steampunk",         emoji: "⚙️", lore: "Brass gears, airships, and Victorian futures that never were but should have been." },
  "post-apocalyptic": { label: "Post-Apocalyptic",  emoji: "🌆", lore: "The world ended. What comes next depends entirely on who's left standing." },
  "political":        { label: "Political",         emoji: "🗳️", lore: "Power, corruption, and the people who dare to resist both." },
  "war":              { label: "War",               emoji: "🪖", lore: "The front lines rendered in ink. The cost of conflict made impossible to look away from." },
  "biography-memoir": { label: "Biography / Memoir",emoji: "📝", lore: "Real lives. Real stories. Drawn from memory and given back to the world." },
  // Manga only
  "shounen":          { label: "Shounen",           emoji: "🔥", lore: "Young heroes, impossible odds, and the will to never give up no matter the cost." },
  "shoujo":           { label: "Shoujo",            emoji: "🌸", lore: "Heartfelt stories of growth, love, and the quiet courage of self-discovery." },
  "seinen":           { label: "Seinen",            emoji: "🌙", lore: "Mature, complex narratives for readers who want more than easy answers." },
  "josei":            { label: "Josei",             emoji: "🍵", lore: "Realistic romance and life stories rendered with warmth and hard-won wisdom." },
  "isekai":           { label: "Isekai",            emoji: "🌀", lore: "Transported to another world — and nothing, not even yourself, will ever be the same." },
  "mecha":            { label: "Mecha",             emoji: "🤖", lore: "Giant machines, human pilots, and the terrible cost of fighting a war in someone else's armor." },
  "yaoi":             { label: "Yaoi",              emoji: "💙", lore: "Stories of love, tension, and connection between male characters — told with depth and care." },
  "yuri":             { label: "Yuri",              emoji: "💜", lore: "Stories of love, tension, and connection between female characters — told with depth and care." },
  "magical-girl":     { label: "Magical Girl",      emoji: "✨", lore: "Power, transformation, and the courage to protect everything you love." },
  "martial-arts":     { label: "Martial Arts",      emoji: "🥋", lore: "Discipline, mastery, and the endless path of the warrior. Every fight is a conversation." },
  "psychological":    { label: "Psychological",     emoji: "🧠", lore: "Mind games, unreliable narrators, and truths that unravel slowly — then all at once." },
  "school-life":      { label: "School Life",       emoji: "🎒", lore: "Friendships, rivalries, and the strange, irreplaceable intensity of being young." },
  "cooking":          { label: "Cooking",           emoji: "🍜", lore: "Food as art, passion, memory, and the most honest language of love." },
  "music":            { label: "Music",             emoji: "🎵", lore: "The stage, the sound, and the soul that bleeds into every note." },
  "idol":             { label: "Idol",              emoji: "🌟", lore: "Fame, sacrifice, and the price of standing in the light everyone else craves." },
};

// ─── Demo Series ──────────────────────────────────────────────
const DEMO_SERIES: Record<string, Series[]> = {
  "action": [
    { slug: "iron-meridian", title: "Iron Meridian", author: "D. Vasquez", cover: "", genre: "action", chapters: 8, description: "A lone engineer discovers a signal buried beneath a dead moon.", badge: "Ongoing", inkPerChapter: INK_PER_CHAPTER },
    { slug: "hollow-crown", title: "Hollow Crown", author: "M. Reyes", cover: "", genre: "action", chapters: 12, description: "Three heirs race through a crumbling empire where magic costs memories.", badge: "Exclusive", inkPerChapter: INK_PER_CHAPTER },
  ],
};

const BADGE_COLORS: Record<string, string> = {
  New: "#2DD4BF", Ongoing: "#C9A84C", Complete: "#6495ED", Exclusive: "#E879A0",
};

// ─── slug → display ───────────────────────────────────────────
function slugToLabel(slug: string): string {
  return GENRE_META[slug]?.label || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Series Card ──────────────────────────────────────────────
function SeriesCard({ series, ink, onUnlock, unlocked }: {
  series: Series; ink: number;
  onUnlock: (slug: string) => void; unlocked: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const canAfford = ink >= series.inkPerChapter;

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
      <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
        {series.cover ? (
          <img src={series.cover} alt={series.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(145deg, #0a1a1a, #050f0f)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 40, opacity: 0.4 }}>
              {GENRE_META[series.genre]?.emoji || "◈"}
            </span>
          </div>
        )}
        {series.badge && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: BADGE_COLORS[series.badge], color: "#000",
            fontSize: 10, fontWeight: 700, fontFamily: "Syne, sans-serif",
            letterSpacing: "0.08em", padding: "3px 9px", borderRadius: 99,
            textTransform: "uppercase",
          }}>
            {series.badge}
          </span>
        )}
        {unlocked && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.7)", border: "1px solid rgba(45,212,191,0.5)",
            color: "#2DD4BF", fontSize: 10, fontFamily: "Syne, sans-serif",
            padding: "3px 9px", borderRadius: 99,
          }}>✓ Unlocked</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{
          margin: "0 0 4px", fontFamily: "Cormorant Garamond, serif",
          fontSize: 18, fontWeight: 700, color: "#f0ece2", lineHeight: 1.2,
        }}>{series.title}</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(45,212,191,0.7)", fontWeight: 600 }}>
            {series.author}
          </span>
        </div>
        <p style={{
          margin: "0 0 14px", fontFamily: "Cormorant Garamond, serif",
          fontSize: 14, color: "rgba(240,236,226,0.55)", lineHeight: 1.55,
        }}>{series.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {series.chapters} chapters
          </span>
          <button
            onClick={() => {
              if (unlocked) {
                window.location.href = `/reading-room/comics/${series.slug}/read/1`;
              } else {
                onUnlock(series.slug);
              }
            }}
            style={{
              fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "6px 16px", borderRadius: 99, border: "none",
              cursor: "pointer",
              background: unlocked ? "rgba(45,212,191,0.12)" : canAfford ? "#2DD4BF" : "rgba(255,255,255,0.06)",
              color: unlocked ? "#2DD4BF" : canAfford ? "#000" : "rgba(255,255,255,0.3)",
              transition: "all 0.2s",
            }}
          >
            {unlocked ? "Read →" : canAfford ? `${series.inkPerChapter} Ink` : "Need Ink"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ComicGenrePage() {
  // In real use, pull from useParams() or route params
  // For now using URL parsing
  const [type, setType] = useState<MediaType>("comics");
  const [genreSlug, setGenreSlug] = useState("action");
  const [ink, setInk] = useState(DEFAULT_INK);
  const [unlocks, setUnlocksState] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Parse type and genre from URL
    const parts = window.location.pathname.split("/");
    // /reading-room/comics/genres/[type]/[genre]
    const typeIdx = parts.indexOf("genres") + 1;
    const genreIdx = typeIdx + 1;
    if (parts[typeIdx]) setType(parts[typeIdx] as MediaType);
    if (parts[genreIdx]) setGenreSlug(parts[genreIdx]);
    setInk(getInk());
    setUnlocksState(getUnlocks());
    setMounted(true);
  }, []);

  const handleUnlock = (slug: string) => {
    if (ink < INK_PER_CHAPTER) return;
    const newInk = ink - INK_PER_CHAPTER;
    const newUnlocks = { ...unlocks, [slug]: true };
    setInk(newInk);
    setUnlocksState(newUnlocks);
    setInkStore(newInk);
    setUnlocks(newUnlocks);
  };

  const meta = GENRE_META[genreSlug];
  const label = meta?.label || slugToLabel(genreSlug);
  const emoji = meta?.emoji || "◈";
  const lore = meta?.lore || "Stories from the finest independent creators.";
  const series = DEMO_SERIES[genreSlug] || [];
  // Cover image path — swap by adding image to public/comic-genres/[genre]/hero.jpg
 const heroCover = `/comics-genres/${type}/${genreSlug}/hero.jpg`;

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .cg-page {
          min-height: 100vh;
          background: #080f0f;
          color: #f0ece2;
          font-family: 'Cormorant Garamond', serif;
        }

        /* Nav */
        .cg-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(8,15,15,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(45,212,191,0.1);
          padding: 0 40px; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cg-breadcrumb {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .cg-breadcrumb a {
          color: rgba(45,212,191,0.6); text-decoration: none; transition: color 0.2s;
        }
        .cg-breadcrumb a:hover { color: #2DD4BF; }
        .cg-breadcrumb span { color: rgba(255,255,255,0.2); }
        .cg-breadcrumb strong { color: #f0ece2; font-weight: 700; }
        .cg-nav-right { display: flex; align-items: center; gap: 12px; }
        .cg-ink-badge {
          border: 1px solid rgba(201,168,76,0.3);
          background: rgba(201,168,76,0.06);
          padding: 5px 14px; border-radius: 99px;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          color: #C9A84C; letter-spacing: 0.06em;
        }

        /* Hero */
        .cg-hero {
          position: relative; min-height: 420px;
          display: flex; align-items: flex-end;
          overflow: hidden;
        }
        .cg-hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(160deg, #0a1f1f 0%, #050f0f 100%);
        }
        .cg-hero-bg img {
          width: 100%; height: 100%; object-fit: cover; opacity: 0.25;
        }
        .cg-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #080f0f 0%, rgba(8,15,15,0.4) 60%, transparent 100%);
        }
        .cg-hero-teal {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 20% 50%, rgba(45,212,191,0.08) 0%, transparent 65%);
        }
        .cg-hero-content {
          position: relative; z-index: 2;
          padding: 60px 40px 56px; width: 100%;
        }
        .cg-hero-type {
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(45,212,191,0.6); margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .cg-hero-type::before {
          content: ''; width: 24px; height: 1px; background: rgba(45,212,191,0.4);
        }
        .cg-hero-emoji { font-size: 56px; margin-bottom: 16px; display: block; line-height: 1; }
        .cg-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 8vw, 96px); font-weight: 700;
          color: #f0ece2; margin: 0 0 16px; line-height: 0.9;
          letter-spacing: -0.03em;
        }
        .cg-hero h1 em { font-style: italic; color: #2DD4BF; }
        .cg-hero-lore {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-style: italic;
          color: rgba(240,236,226,0.5); max-width: 560px; line-height: 1.5;
          margin: 0;
        }

        /* Series section */
        .cg-section {
          padding: 48px 40px 80px;
        }
        .cg-section-header {
          display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
        }
        .cg-section-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700; color: #f0ece2; margin: 0;
        }
        .cg-section-header h2 span { color: #2DD4BF; font-style: italic; }
        .cg-section-line {
          flex: 1; height: 1px;
          background: linear-gradient(to right, rgba(45,212,191,0.2), transparent);
        }

        /* Grid */
        .cg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* Empty state */
        .cg-empty {
          text-align: center; padding: 80px 0;
          border: 1px dashed rgba(45,212,191,0.15); border-radius: 16px;
        }
        .cg-empty-emoji { font-size: 48px; margin-bottom: 16px; display: block; }
        .cg-empty h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px; font-weight: 700; color: #f0ece2; margin: 0 0 8px;
        }
        .cg-empty p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-style: italic;
          color: rgba(240,236,226,0.35); margin: 0 0 24px;
        }
        .cg-empty-btn {
          display: inline-block; padding: 11px 28px; border-radius: 99px;
          background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.25);
          color: #2DD4BF; text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.2s;
        }
        .cg-empty-btn:hover { background: rgba(45,212,191,0.15); }

        @media (max-width: 640px) {
          .cg-nav { padding: 0 20px; }
          .cg-hero-content { padding: 40px 20px 40px; }
          .cg-section { padding: 36px 20px 60px; }
          .cg-grid { gap: 14px; }
        }
      `}</style>

      <div className="cg-page">

        {/* Nav */}
        <nav className="cg-nav">
          <div className="cg-breadcrumb">
            <a href="/reading-room">Reading Room</a>
            <span>›</span>
            <a href="/reading-room/comics">Comics & Manga</a>
            <span>›</span>
            <strong>{label}</strong>
          </div>
          <div className="cg-nav-right">
            <div className="cg-ink-badge">🖋 {ink} Ink</div>
          </div>
        </nav>

        {/* Hero */}
        <section className="cg-hero">
          <div className="cg-hero-bg">
            <img src={heroCover} alt={label} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="cg-hero-overlay" />
          <div className="cg-hero-teal" />
          <div className="cg-hero-content">
            <div className="cg-hero-type">
              {type === "comics" ? "◈ Comics" : "漫 Manga"} · {label}
            </div>
            <span className="cg-hero-emoji">{emoji}</span>
            <h1>{label.split(" ").map((w, i) => i === 0 ? <em key={i}>{w}</em> : ` ${w}`)}</h1>
            <p className="cg-hero-lore">{lore}</p>
          </div>
        </section>

        {/* Series */}
        <section className="cg-section">
          <div className="cg-section-header">
            <h2><span>{label}</span> Series</h2>
            <div className="cg-section-line" />
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
              {series.length} series
            </span>
          </div>

          {series.length > 0 ? (
            <div className="cg-grid">
              {series.map(s => (
                <SeriesCard
                  key={s.slug}
                  series={s}
                  ink={ink}
                  unlocked={!!unlocks[s.slug]}
                  onUnlock={handleUnlock}
                />
              ))}
            </div>
          ) : (
            <div className="cg-empty">
              <span className="cg-empty-emoji">{emoji}</span>
              <h3>Coming Soon</h3>
              <p>No {label} series yet — but creators are on their way.</p>
              <a href="https://write.the-tiniest-library.com/apply" className="cg-empty-btn">
                Be the first to publish here →
              </a>
            </div>
          )}
        </section>

      </div>
    </>
  );
}
