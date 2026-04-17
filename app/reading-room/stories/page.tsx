"use client";

import React, { useEffect, useMemo, useState } from "react";

// =========================
// Browse All Stories — Phase 2
// Route: /reading-room/stories
// =========================

type Story = {
  slug: string;
  title: string;
  author: string;
  badge: "Serial" | "Exclusive" | "Early Access";
  description: string;
  cover: string;
  genres?: string[];
  teaser?: string;
  content?: string;
  addedAt?: string;
};

type Unlocks = Record<string, boolean>;
type SortKey = "newest" | "title_asc" | "author_asc" | "badge" | "unlocked_first";

// =========================
// Constants
// =========================
const SQUARESPACE_READING_ROOM = "/members";
const DEFAULT_INK = 250;
const DEFAULT_UNLOCK_COST = 25;

// =========================
// Genre Panels
// To update a genre image: change the `cover` path below.
// Images live in /public/genre-cards/FOLDER/filename.jpg
// =========================
type GenrePanel = { genre: string; cover: string; label: string };

const GENRE_PANELS: GenrePanel[] = [
  { genre: "Fantasy",               cover: "/genre-cards/FANTASY/genre-fantasy.jpg",                     label: "Fantasy" },
  { genre: "Sci-Fi",                cover: "/genre-cards/SCIENCE%20FICTION/genre-scifi.jpg",             label: "Sci-Fi" },
  { genre: "Horror Mystery",        cover: "/genre-cards/HORROR%20MYSTERY/genre-horror.jpg",             label: "Horror Mystery" },
  { genre: "Crime & Thrillers",     cover: "/genre-cards/CRIME%20THRILLER/genre-crime.jpg",              label: "Crime & Thrillers" },
  { genre: "Romance",               cover: "/genre-cards/ROMANCE/genre-romance.jpg",                     label: "Romance" },
  { genre: "Young Adult",           cover: "/genre-cards/YOUNG%20ADULT/genre-ya.jpg",                    label: "Young Adult" },
  { genre: "New Adult",             cover: "/genre-cards/NEW%20ADULT/genre-newadult.jpg",                label: "New Adult" },
  { genre: "Children's Literature", cover: "/genre-cards/CHILDRENS%20STORIES/genre-childrens.jpg",       label: "Children's Lit" },
  { genre: "Cozy",                  cover: "/genre-cards/COZY/genre-cozy.jpg",                           label: "Cozy" },
  { genre: "Poems & Memoirs",       cover: "/genre-cards/POETRY/genre-poems.jpg",                        label: "Poems & Memoirs" },
  { genre: "Adventure",             cover: "/genre-cards/ADVENTURE/genre-adventure.jpg",                 label: "Adventure" },
  { genre: "Contemporary Fiction",  cover: "/genre-cards/CONTEMPORARY%20FICTION/genre-contemporary.jpg", label: "Contemporary" },
  { genre: "Historical Fiction",    cover: "/genre-cards/HISTORICAL%20FICTION/genre-historical.jpg",     label: "Historical Fiction" },
  { genre: "Serialized Fiction",    cover: "/genre-cards/SERIALIZED%20FICTION/genre-serial.jpg",         label: "Serialized Fiction" },
  { genre: "Fan Fiction",           cover: "/genre-cards/FAN%20FICTION/genre-fanfic.jpg",                label: "Fan Fiction" },
  { genre: "Slice Of Life",         cover: "/genre-cards/SLICE%20OF%20LIFE/genre-sliceoflife.jpg",       label: "Slice of Life" },
  { genre: "Dark Academia",         cover: "/genre-cards/DARK%20ACADEMIA/genre-darkacademia.jpg",        label: "Dark Academia" },
  { genre: "Multi-Cultural",        cover: "/genre-cards/MULTICULTURAL/genre-multicultural.jpg",         label: "Multi-Cultural" },
  { genre: "Black Stories",         cover: "/genre-cards/BLACK%20STORIES/genre-blackstories.jpg",        label: "Black Stories" },
  { genre: "Latin Stories",         cover: "/genre-cards/LATIN%20VOICES/genre-latin.jpg",                label: "Latin Stories" },
  { genre: "AAPI Authors",          cover: "/genre-cards/AAPI/genre-aapi.jpg",                           label: "AAPI Authors" },
  { genre: "Indigenous Stories",    cover: "/genre-cards/INDEGINOUS%20VOICES/genre-indigenous.jpg",      label: "Indigenous Stories" },
  { genre: "LGBTQ+ Fiction",        cover: "/genre-cards/LGBTQ%2B%20VOICES/genre-lgbtq.jpg",            label: "LGBTQ+ Fiction" },
  { genre: "Adult 18+",             cover: "/genre-cards/ADULT/genre-adult.jpg",                         label: "Adult 18+" },
];

const TTL_GENRES: string[] = GENRE_PANELS.map((p) => p.genre);

// =========================
// LocalStorage Helpers
// =========================
function getInk(): number {
  if (typeof window === "undefined") return DEFAULT_INK;
  const raw = window.localStorage.getItem("ttl_ink");
  return raw ? Number(raw) : DEFAULT_INK;
}
function setInkStore(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ttl_ink", String(n));
}
function getUnlocks(): Unlocks {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem("ttl_unlocks");
  return raw ? (JSON.parse(raw) as Unlocks) : {};
}
function setUnlocks(next: Unlocks) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ttl_unlocks", JSON.stringify(next));
}

// =========================
// Demo Stories
// =========================
const stories: Story[] = [
  {
    slug: "fox-vs-the-world",
    title: "Fox Vs. The World (Preview)",
    author: "Daniel Cedeno",
    badge: "Early Access",
    description: "A first look at a world that refuses to stay quiet—exclusive chapters live here.",
    cover: "/images/cover-1.jpg",
    genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"],
    addedAt: "2026-01-02",
    teaser: "The sky above Hartford wasn't supposed to flicker like a broken screen… but tonight it did.",
    content: `CHAPTER 0 — THE GLITCH\n\nThe first time Fox noticed it, he thought it was just fatigue.\nA blink. A stutter in the air. A streetlight repeating the same pulse.\n\nBut then the world did it again—louder.\n\nCars paused mid-roll. A dog froze mid-bark. Even the wind held its breath.\n\nFox didn't.\n\nHe ran.\n\nAnd in that sprint, he felt it—like a seam under the skin of reality.\n\nSomebody had stitched the world together.\n\nAnd tonight… the stitching was coming undone.\n`,
  },
  {
    slug: "the-quiet-stairwell",
    title: "The Quiet Stairwell",
    author: "J. Holloway",
    badge: "Exclusive",
    description: "A private campus, a hidden society, and a truth that changes everything.",
    cover: "/images/cover-2.jpg",
    genres: ["Dark Academia", "Fantasy"],
    addedAt: "2026-01-01",
    teaser: "There was a stairwell no map acknowledged—yet every scholarship kid eventually heard about it.",
    content: `THE QUIET STAIRWELL\n\nThey told you it was a rumor.\nA soft myth to scare freshmen into staying out of locked doors.\n\nBut the lock was always warm.\n\nAnd the air behind it smelled like old paper, ink, and thunder.\n\nWhen I stepped inside, the campus got quieter—like it was listening.\n\nThen the stairs began to count me.\n`,
  },
  {
    slug: "lanterns-over-hartford",
    title: "Lanterns Over Hartford",
    author: "A. Rivera",
    badge: "Serial",
    description: "A cozy mystery told in weekly chapters—support to unlock the next page.",
    cover: "/images/cover-3.jpg",
    genres: ["Cozy", "Crime & Thrillers", "Serialized Fiction"],
    addedAt: "2025-12-20",
    teaser: "Lanterns appeared overnight across the riverwalk—each one with a name nobody claimed.",
    content: `LANTERNS OVER HARTFORD — EPISODE 1\n\nThe first lantern was tied to the railing outside the old café.\nIt glowed like a held secret.\n\nInside was a folded note:\n\n"RETURN WHAT WAS TAKEN."\n\nNo signature.\nNo threat.\n\nJust the kind of sentence that makes a whole city remember its sins.\n`,
  },
  {
    slug: "stars-dont-apologize",
    title: "Stars Don't Apologize",
    author: "M. Chen",
    badge: "Serial",
    description: "A tender sci-fi serial about distance, hope, and the gravity of choices.",
    cover: "/images/cover-4.jpg",
    genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"],
    addedAt: "2025-12-22",
    teaser: "The message arrived late—eight minutes late—like light that had to cross a hard truth.",
    content: `STARS DON'T APOLOGIZE — PART 1\n\nEveryone thinks space is silent.\nIt isn't.\n\nIt hums.\nIt remembers.\n\nWhen the signal finally hit my receiver, it carried a voice I wasn't ready for.\n\n"Don't come looking for me," it said.\n\nBut the stars don't apologize.\n\nAnd neither do I.\n`,
  },
];

// =========================
// Global Styles
// =========================
const GLOBAL_STYLES = `
  :root {
    --gold: #C9A84C;
    --gold-light: #E2C97E;
    --gold-dim: rgba(201,168,76,0.4);
    --gold-glow: rgba(201,168,76,0.15);
    --blue: #6495ED;
    --blue-dim: rgba(100,149,237,0.25);
    --blue-bright: #84b0f5;
    --ink-bg: #0a0a0a;
    --ink-surface: #111111;
    --ink-surface2: #181818;
    --ink-border: rgba(255,255,255,0.07);
    --ink-border-gold: rgba(201,168,76,0.28);
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--gold); }
`;

// =========================
// Badge
// =========================
function Badge({ label }: { label: Story["badge"] }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide style={{flexShrink:0}}";
  if (label === "Early Access") return (
    <span className={base} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>
      Early Access
    </span>
  );
  if (label === "Exclusive") return (
    <span className={base} style={{ background: "var(--gold-glow)", color: "var(--gold-light)", border: "1px solid var(--gold-dim)" }}>
      Exclusive
    </span>
  );
  return (
    <span className={base} style={{ background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid rgba(100,149,237,0.35)" }}>
      Serial
    </span>
  );
}

// =========================
// Navbar
// =========================
function Navbar({ ink }: { ink: number }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: "rgba(8,8,8,0.96)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--ink-border-gold)",
        boxShadow: "0 2px 40px rgba(0,0,0,0.7)",
      }}
    >
      {/* Gold accent line at very top */}
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

      <div className="flex items-center justify-between px-6 sm:px-10" style={{ height: 72 }}>
        {/* Left — logo + nav links */}
        <div className="flex items-center gap-8 min-w-0">
          <a href="/reading-room" className="flex items-center gap-3 style={{flexShrink:0}}">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black style={{flexShrink:0}}"
              style={{ background: "linear-gradient(135deg, var(--gold), #8a6510)", color: "#000" }}
            >
              TTL
            </div>
            <div className="hidden sm:block">
              <p className="text-base font-black tracking-wide leading-tight" style={{ color: "var(--gold-light)" }}>
                The Tiniest Library
              </p>
              <p className="text-xs font-medium leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                The Reading Room
              </p>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {[
              { label: "Reading Room", href: "/reading-room" },
              { label: "Browse Stories", href: "/reading-room/stories" },
              { label: "Members Site", href: SQUARESPACE_READING_ROOM, external: true },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-sm font-medium transition-colors whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right — ink balance + members button */}
        <div className="flex items-center gap-2 style={{flexShrink:0}} ml-4">
          {/* Ink balance — styled as a nav pill, sits cleanly in the bar */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              background: "var(--gold-glow)",
              border: "1px solid var(--gold-dim)",
              color: "var(--gold-light)",
              whiteSpace: "nowrap",
            }}
          >
            <span>✒️</span>
            <span>{ink}</span>
            <span className="hidden sm:inline">Ink</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px mx-1" style={{ background: "rgba(255,255,255,0.12)" }} />

          {/* Members Site link */}
          <a
            href={SQUARESPACE_READING_ROOM}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold transition hover:opacity-90 whitespace-nowrap"
            style={{ background: "var(--blue)", color: "#fff" }}
          >
            <span className="hidden sm:inline">Members Site →</span>
            <span className="sm:hidden">Members →</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

// =========================
// Genre Grid — tall paperback ratio (2:3)
// =========================
function GenreGrid({ activeGenre, onSelect }: { activeGenre: string; onSelect: (g: string) => void }) {
  const W = 130;
  const H = 195;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full" style={{ background: "var(--gold)" }} />
          <h2 className="text-lg font-bold text-white tracking-wide">Browse by Genre</h2>
        </div>
        {activeGenre !== "All" && (
          <button
            type="button" onClick={() => onSelect("All")}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ background: "var(--ink-surface2)", border: "1px solid var(--gold-dim)", color: "var(--gold-light)" }}
          >
            Clear Filter ✕
          </button>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--ink-surface)", border: "1px solid var(--ink-border)" }}>
        <div className="flex flex-wrap gap-4">

          {/* All Genres panel */}
          <div className="flex flex-col items-center gap-2" style={{ width: W }}>
            <button
              type="button" onClick={() => onSelect("All")}
              className="relative overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1.5"
              style={{
                width: W, height: H,
                border: activeGenre === "All" ? "2px solid var(--gold)" : "2px solid rgba(255,255,255,0.09)",
                background: activeGenre === "All"
                  ? "linear-gradient(160deg, #1c1500, #2e2000)"
                  : "linear-gradient(160deg, #181818, #0e0e0e)",
                boxShadow: activeGenre === "All"
                  ? "0 0 30px var(--gold-glow), 0 8px 32px rgba(0,0,0,0.8)"
                  : "0 4px 20px rgba(0,0,0,0.5)",
                transform: activeGenre === "All" ? "translateY(-6px)" : undefined,
              }}
            >
              {activeGenre === "All" && (
                <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
              )}
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span style={{ fontSize: 36 }}>📚</span>
              </div>
            </button>
            <p
              className="text-center text-xs font-bold leading-tight tracking-wider uppercase"
              style={{ color: activeGenre === "All" ? "var(--gold-light)" : "rgba(255,255,255,0.6)" }}
            >
              All Genres
            </p>
          </div>

          {/* Individual genre panels */}
          {GENRE_PANELS.map((panel) => {
            const isActive = activeGenre === panel.genre;
            if (panel.genre === "Adult 18+") {
  return (
    <div key={panel.genre} className="flex flex-col items-center gap-2" style={{ width: W }}>
      <button
        type="button"
        onClick={() => { window.location.href = "/reading-room/genres/adult-18"; }}
        className="relative overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1.5"
        style={{
          width: W, height: H,
          border: "2px solid rgba(201,168,76,0.8)",
          background: "linear-gradient(160deg, #1a0404 0%, #2d0808 60%, #1a0404 100%)",
          boxShadow: "0 0 30px rgba(201,168,76,0.35), 0 0 60px rgba(180,30,30,0.3), 0 8px 32px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 2, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
        <div style={{
          position: "absolute",
          top: 16, left: 20, right: 20, bottom: 16,
          border: "3px solid rgba(201,168,76,0.6)",
          borderRadius: 4,
          boxShadow: "0 0 16px rgba(201,168,76,0.3), inset 0 0 20px rgba(180,30,30,0.4)",
          background: "linear-gradient(180deg, #3d0a0a 0%, #1a0404 100%)",
        }}>
          <div style={{ position: "absolute", top: 10, left: 10, right: 10, height: "35%", border: "2px solid rgba(201,168,76,0.3)", background: "rgba(180,30,30,0.2)" }} />
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, height: "35%", border: "2px solid rgba(201,168,76,0.3)", background: "rgba(180,30,30,0.2)" }} />
          <div style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 10, height: 10, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ffdd88, #C9A84C, #8a6510)",
            boxShadow: "0 0 8px rgba(201,168,76,0.9), 0 0 16px rgba(201,168,76,0.5)",
          }} />
        </div>
        <div style={{
          position: "absolute", top: 8, right: 8,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
          color: "#C9A84C", fontFamily: "monospace",
          background: "rgba(0,0,0,0.6)", padding: "2px 5px", borderRadius: 3,
          border: "1px solid rgba(201,168,76,0.4)",
        }}>18+</div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" as const, background: "radial-gradient(ellipse at 50% 100%, rgba(180,30,30,0.4) 0%, transparent 70%)" }} />
      </button>
      <p className="text-center text-xs font-bold leading-tight tracking-wider uppercase"
        style={{ color: "#C9A84C", textShadow: "0 0 8px rgba(201,168,76,0.5)" }}>
        Adult 18+
      </p>
    </div>
  );
}
            return (
              <div key={panel.genre} className="flex flex-col items-center gap-2" style={{ width: W }}>
                <button
                  type="button"
                  onClick={() => {
  const slug = panel.genre
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\+/g, "")
    .replace(/&/g, "and");
  window.location.href = `/reading-room/genres/${slug}`;
}}
                  aria-label={`Filter by ${panel.label}`}
                  className="relative overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1.5"
                  style={{
                    width: W, height: H,
                    border: isActive ? "2px solid var(--gold)" : "2px solid rgba(255,255,255,0.07)",
                    boxShadow: isActive
                      ? "0 0 30px var(--gold-glow), 0 8px 32px rgba(0,0,0,0.8)"
                      : "0 4px 20px rgba(0,0,0,0.5)",
                    transform: isActive ? "translateY(-6px)" : undefined,
                  }}
                >
                  {/* Dark blue placeholder */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0e1a30 0%, #060d1e 100%)" }} />

                  {/* Watermark letter */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="select-none text-7xl font-black" style={{ color: "rgba(100,149,237,0.1)" }}>
                      {panel.label.charAt(0)}
                    </span>
                  </div>

                  {/* Cover image */}
                  <img
                    src={panel.cover} alt={panel.label}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />

                  {/* Subtle bottom vignette only — no text overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: isActive
                        ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)"
                        : "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 45%)",
                    }}
                  />

                  {/* Gold top line when active */}
                  {isActive && (
                    <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
                  )}
                </button>

                {/* Label BELOW the card */}
                <p
                  className="text-center text-xs font-bold leading-tight tracking-wider uppercase"
                  style={{ color: isActive ? "var(--gold-light)" : "rgba(255,255,255,0.6)" }}
                >
                  {panel.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =========================
// Reader Modal
// =========================
function ReaderModal({
  open, story, isUnlocked, inkCost, canUnlock, onClose, onUnlock,
}: {
  open: boolean; story: Story | null; isUnlocked: boolean;
  inkCost: number; canUnlock: boolean; onClose: () => void; onUnlock: () => void;
}) {
  if (!open || !story) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-label="Close" />
      <div
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--ink-surface)", border: "1px solid var(--ink-border-gold)" }}
      >
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, var(--blue-dim), var(--gold), var(--blue-dim))" }} />

        <div className="flex items-start justify-between gap-4 p-6" style={{ borderBottom: "1px solid var(--ink-border)" }}>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold-dim)" }}>The Tiniest Library</p>
            <h3 className="mt-2 text-xl font-bold text-white line-clamp-2">{story.title}</h3>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>by {story.author}</p>
            {story.genres?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {story.genres.slice(0, 6).map((g) => (
                  <span key={g} className="rounded-full px-3 py-0.5 text-xs"
                    style={{ background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid rgba(100,149,237,0.3)" }}>
                    {g}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button" onClick={onClose}
            className="style={{flexShrink:0}} rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80"
            style={{ background: "var(--ink-surface2)", border: "1px solid var(--ink-border)" }}
          >
            Close ✕
          </button>
        </div>

        <div className="max-h-[65vh] overflow-auto p-6">
          {!isUnlocked ? (
            <div className="rounded-xl p-5" style={{ background: "var(--ink-surface2)", border: "1px solid var(--ink-border)" }}>
              <p className="text-sm text-white/80"><span className="font-bold text-white">Locked.</span> Unlock to read the full chapter.</p>
              <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(100,149,237,0.07)", border: "1px solid var(--blue-dim)" }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--blue-bright)" }}>Teaser</p>
                <p className="text-sm text-white/75">{story.teaser ?? story.description}</p>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Unlock costs <span className="font-bold text-white">{inkCost}</span> Ink
                </span>
                <button
                  type="button" disabled={!canUnlock} onClick={onUnlock}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
                  style={canUnlock
                    ? { background: "linear-gradient(135deg, var(--gold), #8a6510)", color: "#000" }
                    : { background: "var(--ink-surface2)", color: "rgba(255,255,255,0.3)", border: "1px solid var(--ink-border)" }
                  }
                >
                  {canUnlock ? "Unlock & Read" : "Need more Ink"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-5" style={{ background: "var(--ink-surface2)", border: "1px solid var(--ink-border)" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--gold-light)" }}>Full Text</p>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                {story.content ?? "No content added yet."}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-6" style={{ borderTop: "1px solid var(--ink-border)" }}>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Press <span className="text-white/60">ESC</span> to close</span>
          <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer"
            className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid rgba(100,149,237,0.3)" }}
          >
            Open Members Site →
          </a>
        </div>
      </div>
    </div>
  );
}

// =========================
// Story Card
// =========================
function StoryCard({
  story, ink, inkCost, isUnlocked, onUnlock, onOpen,
}: {
  story: Story; ink: number; inkCost: number;
  isUnlocked: boolean; onUnlock: (slug: string) => void; onOpen: (slug: string) => void;
}) {
  const canUnlock = ink >= inkCost;
  return (
    <div
      role="button" tabIndex={0}
      onClick={() => onOpen(story.slug)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(story.slug); }}
      className="group cursor-pointer rounded-xl transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "var(--ink-surface)",
        border: "1px solid var(--ink-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ink-border-gold)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ink-border)")}
    >
      <div className="flex gap-4 p-5">
        <div
          className="style={{flexShrink:0}} overflow-hidden rounded-lg"
          style={{ width: 66, height: 96, border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <img
            src={story.cover} alt={story.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-white line-clamp-1">{story.title}</p>
              <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>by {story.author}</p>
            </div>
            <Badge label={story.badge} />
          </div>
          <p className="mt-2 text-sm line-clamp-2" style={{ color: "rgba(255,255,255,0.6)" }}>{story.description}</p>
          {story.genres?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {story.genres.slice(0, 3).map((g) => (
                <span key={g} className="rounded-full px-2.5 py-0.5 text-xs"
                  style={{ background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid rgba(100,149,237,0.2)" }}>
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {isUnlocked ? "✅ Unlocked" : `${inkCost} Ink to unlock`}
            </span>
            <button
              type="button"
              disabled={isUnlocked || !canUnlock}
              onClick={(e) => { e.stopPropagation(); onUnlock(story.slug); }}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
              style={isUnlocked
                ? { background: "var(--gold-glow)", color: "var(--gold-light)", border: "1px solid var(--gold-dim)" }
                : canUnlock
                ? { background: "linear-gradient(135deg, var(--gold), #8a6510)", color: "#000" }
                : { background: "var(--ink-surface2)", color: "rgba(255,255,255,0.25)", border: "1px solid var(--ink-border)" }
              }
            >
              {isUnlocked ? "Unlocked ✓" : canUnlock ? "Unlock" : "Need Ink"}
            </button>
          </div>
        </div>
      </div>
      <div className="px-5 pb-3">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Click card to open reader →</p>
      </div>
    </div>
  );
}

// =========================
// Footer
// =========================
function Footer() {
  return (
    <footer
      className="mt-20 px-6 sm:px-10 py-12"
      style={{ borderTop: "1px solid var(--ink-border-gold)", background: "var(--ink-surface)" }}
    >
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black style={{flexShrink:0}}"
              style={{ background: "linear-gradient(135deg, var(--gold), #8a6510)", color: "#000" }}
            >
              TTL
            </div>
            <div>
              <p className="text-xl font-black tracking-wide" style={{ color: "var(--gold-light)" }}>The Tiniest Library</p>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>The Reading Room</p>
            </div>
          </div>
          <p className="mt-2 text-sm italic" style={{ color: "rgba(255,255,255,0.3)" }}>Where every story finds its reader.</p>
          <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            © {new Date().getFullYear()} The Tiniest Library. All rights reserved.
          </p>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
            Unlocks persist in your browser (Phase 1).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/reading-room"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-80 text-center"
            style={{ background: "var(--ink-surface2)", color: "rgba(255,255,255,0.6)", border: "1px solid var(--ink-border)" }}
          >
            ← Reading Room
          </a>
          <a
            href={SQUARESPACE_READING_ROOM}
            target="_blank" rel="noopener noreferrer"
            className="rounded-xl px-5 py-2.5 text-sm font-bold transition hover:opacity-90 text-center"
            style={{ background: "linear-gradient(135deg, var(--gold), #8a6510)", color: "#000" }}
          >
            Open Members Site →
          </a>
        </div>
      </div>
    </footer>
  );
}

// =========================
// Main Page
// =========================
export default function BrowseAllStoriesPage() {
  const [ink, setInk] = useState<number>(DEFAULT_INK);
  const [unlocks, setUnlocksState] = useState<Unlocks>({});
  const [openStorySlug, setOpenStorySlug] = useState<string | null>(null);
  const [browseSearch, setBrowseSearch] = useState<string>("");
  const [browseGenre, setBrowseGenre] = useState<string>("All");
  const [browseSort, setBrowseSort] = useState<SortKey>("newest");
  const [browseUnlockedOnly, setBrowseUnlockedOnly] = useState<boolean>(false);

  useEffect(() => { setInk(getInk()); setUnlocksState(getUnlocks()); }, []);

  useEffect(() => {
    if (!openStorySlug) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenStorySlug(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [openStorySlug]);

  useEffect(() => setInkStore(ink), [ink]);
  useEffect(() => setUnlocks(unlocks), [unlocks]);

  const unlockStory = (slug: string, cost = DEFAULT_UNLOCK_COST) => {
    if (ink < cost) { alert(`You need ${cost} Ink to unlock this.`); return; }
    setInk((v) => v - cost);
    setUnlocksState((u) => ({ ...u, [slug]: true }));
  };

  const activeStory = useMemo(() =>
    openStorySlug ? stories.find((s) => s.slug === openStorySlug) ?? null : null,
    [openStorySlug]);
  const activeUnlocked = useMemo(() =>
    activeStory ? Boolean(unlocks[activeStory.slug]) : false,
    [activeStory, unlocks]);
  const activeCanUnlock = useMemo(() => ink >= DEFAULT_UNLOCK_COST, [ink]);

  const browseAllStories = useMemo(() => {
    const q = browseSearch.trim().toLowerCase();
    const toTime = (iso?: string) => { if (!iso) return 0; const t = Date.parse(iso); return Number.isFinite(t) ? t : 0; };
    const badgeRank = (b: Story["badge"]) => b === "Exclusive" ? 3 : b === "Early Access" ? 2 : 1;

    return [...stories
      .filter((s) => !q || [s.title, s.author, s.description, s.badge, ...(s.genres ?? [])].join(" ").toLowerCase().includes(q))
      .filter((s) => browseGenre === "All" || (s.genres ?? []).includes(browseGenre))
      .filter((s) => !browseUnlockedOnly || Boolean(unlocks[s.slug]))
    ].sort((a, b) => {
      if (browseSort === "title_asc") return a.title.localeCompare(b.title);
      if (browseSort === "author_asc") return a.author.localeCompare(b.author);
      if (browseSort === "badge") return badgeRank(b.badge) - badgeRank(a.badge);
      if (browseSort === "unlocked_first") {
        const au = Boolean(unlocks[a.slug]), bu = Boolean(unlocks[b.slug]);
        if (au !== bu) return bu ? 1 : -1;
      }
      return toTime(b.addedAt) - toTime(a.addedAt);
    });
  }, [browseSearch, browseGenre, browseUnlockedOnly, browseSort, unlocks]);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ background: "var(--ink-bg)", minHeight: "100vh" }}>

        <Navbar ink={ink} />

        {/* Spacer — pushes all content below the fixed navbar. Height must match navbar (72px + 2px gold line = 74px) */}
        <div style={{ height: 74 }} />

        <ReaderModal
          open={Boolean(openStorySlug)} story={activeStory}
          isUnlocked={activeUnlocked} inkCost={DEFAULT_UNLOCK_COST}
          canUnlock={activeCanUnlock}
          onClose={() => setOpenStorySlug(null)}
          onUnlock={() => { if (activeStory) unlockStory(activeStory.slug); }}
        />

        {/* Hero header */}
        <div
          className="px-6 sm:px-10 pt-12 pb-12"
          style={{
            background: "linear-gradient(180deg, rgba(100,149,237,0.07) 0%, rgba(201,168,76,0.03) 60%, transparent 100%)",
            borderBottom: "1px solid var(--ink-border)",
          }}
        >
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--gold-dim)" }}>
                The Tiniest Library
              </p>
              <h1 className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white">
                Browse All Stories
              </h1>
              <p className="mt-4 text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.45)" }}>
                Search by title, author, genre, or badge — then sort the grid.
              </p>
            </div>
            <div className="flex gap-3 style={{flexShrink:0}}">
              <a
                href="/reading-room"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-80"
                style={{ background: "var(--ink-surface)", border: "1px solid var(--ink-border)", color: "rgba(255,255,255,0.65)" }}
              >
                ← Reading Room
              </a>
              <a
                href={SQUARESPACE_READING_ROOM}
                target="_blank" rel="noopener noreferrer"
                className="rounded-xl px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--gold), #8a6510)", color: "#000" }}
              >
                Members Site →
              </a>
            </div>
          </div>
        </div>

        {/* Main */}
        <main className="mx-auto max-w-7xl px-6 sm:px-10 py-8">

          {/* Controls */}
          <div className="rounded-2xl p-5" style={{ background: "var(--ink-surface)", border: "1px solid var(--ink-border)" }}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-1 gap-2">
                <input
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search title, author, genre, badge…"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                  style={{ background: "var(--ink-surface2)", border: "1px solid var(--ink-border)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--gold-dim)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--ink-border)")}
                />
                <button
                  type="button" onClick={() => setBrowseSearch("")}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
                  style={{ background: "var(--ink-surface2)", border: "1px solid var(--ink-border)", color: "rgba(255,255,255,0.5)" }}
                >
                  Clear
                </button>
              </div>

              <select
                value={browseSort}
                onChange={(e) => setBrowseSort(e.target.value as SortKey)}
                className="rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                style={{ background: "var(--ink-surface2)", border: "1px solid var(--ink-border)", minWidth: 170 }}
              >
                <option value="newest">Newest First</option>
                <option value="title_asc">Title (A–Z)</option>
                <option value="author_asc">Author (A–Z)</option>
                <option value="badge">Badge Priority</option>
                <option value="unlocked_first">Unlocked First</option>
              </select>

              <button
                type="button"
                onClick={() => setBrowseUnlockedOnly((v) => !v)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                style={browseUnlockedOnly
                  ? { background: "var(--gold-glow)", border: "1px solid var(--gold)", color: "var(--gold-light)" }
                  : { background: "var(--ink-surface2)", border: "1px solid var(--ink-border)", color: "rgba(255,255,255,0.5)" }
                }
              >
                {browseUnlockedOnly ? "✅ Unlocked Only" : "Unlocked Only: OFF"}
              </button>

              <div
                className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={{ background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid rgba(100,149,237,0.25)", whiteSpace: "nowrap" }}
              >
                {browseAllStories.length} result{browseAllStories.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Genre grid */}
          <GenreGrid activeGenre={browseGenre} onSelect={setBrowseGenre} />

          {/* Stories section */}
          <div className="mt-10 mb-5 flex items-center gap-3">
            <div className="h-5 w-1 rounded-full" style={{ background: "var(--blue)" }} />
            <h2 className="text-lg font-bold text-white tracking-wide">
              {browseGenre === "All" ? "All Stories" : browseGenre}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {browseAllStories.map((s) => (
              <StoryCard
                key={s.slug} story={s} ink={ink}
                inkCost={DEFAULT_UNLOCK_COST}
                isUnlocked={Boolean(unlocks[s.slug])}
                onUnlock={(slug) => unlockStory(slug)}
                onOpen={(slug) => setOpenStorySlug(slug)}
              />
            ))}
          </div>

          {browseAllStories.length === 0 && (
            <div
              className="mt-6 rounded-xl p-10 text-center text-sm"
              style={{ background: "var(--ink-surface)", border: "1px solid var(--ink-border)", color: "rgba(255,255,255,0.4)" }}
            >
              No matches. Try a different search term, genre, or toggle filters.
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
