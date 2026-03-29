"use client";

import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import AdQueue from "./components/AdQueue";
import { startTour } from "@/app/components/WelcomeTour";

// =========================
// CHANGELOG
// =========================
// ✅ All previous functionality preserved (Ink, Stripe, Supabase, Reader Modal, Tips)
// ✅ V7: Full aesthetic redesign — matches TTL dark editorial system (Cormorant + Syne)
// ✅ V7: Nav bar with "Author Directory" tab linking to /reading-room/authors
// ✅ V7: Author cards wired to /reading-room/authors/[slug]
// ✅ V7: Cohesive dark background replacing cornflower blue — Reading Room feels like a real literary platform
// ✅ Phase 2: Matched to Browse All Stories visual system — black bg, gold + cornflower blue accents, sticky navbar
// ✅ Phase 3: Ink default set to 0 — populates on purchase only
// ✅ Phase 3: Red Door card added as entry point to The Red Room

// =========================
// Types
// =========================
type Author = {
  slug: string;
  name: string;
  tagline: string;
  genres: string[];
  image: string;
};

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
};

type SupabaseStoryRow = {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  description: string | null;
  cover_url: string | null;
  badge: "Serial" | "Exclusive" | "Early Access" | null;
  is_published: boolean | null;
  created_at?: string | null;
};

type Unlocks = Record<string, boolean>;
type AuthorJar = Record<string, number>;

// =========================
// Constants
// =========================
const SQUARESPACE_READING_ROOM =
  "https://www.the-tiniest-library.com/the-reading-room";

const DEFAULT_INK = 0;
const DEFAULT_UNLOCK_COST = 25;

const STRIPE_LINKS: Record<number, string> = {
  100: "https://buy.stripe.com/dRm9AT3lu7WK6INapV7AI00",
  600: "https://buy.stripe.com/6oU3cv2hqdh43wB69F7AI01",
  1500: "https://buy.stripe.com/4gM28r2hqel82sx8hN7AI02",
  2500: "https://buy.stripe.com/aFaeVd4py7WK9UZeGb7AI03",
};

const INK_PACKS = [
  { id: "ink-100", label: "Starter", ink: 100, price: "$1" },
  { id: "ink-600", label: "Reader", ink: 750, price: "$5" },
  { id: "ink-1500", label: "Supporter", ink: 1500, price: "$10" },
  { id: "ink-2500", label: "Collector", ink: 3000, price: "$20" },
];

const TTL_GENRES: string[] = [
  "Fantasy", "Sci-Fi", "Horror Mystery", "Crime & Thrillers", "Romance",
  "Young Adult", "New Adult", "Children's Literature", "Cozy", "Poems & Memoirs",
  "Adventure", "Contemporary Fiction", "Historical Fiction", "Serialized Fiction",
  "Fan Fiction", "Slice Of Life", "Dark Academia", "Multi-Cultural", "Black Stories",
  "Latin Stories", "AAPI Authors", "Indigenous Stories", "LGBTQ+ Fiction", "Adult 18+",
];

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
function getJar(): AuthorJar {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem("ttl_author_jar");
  return raw ? (JSON.parse(raw) as AuthorJar) : {};
}
function setJar(next: AuthorJar) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ttl_author_jar", JSON.stringify(next));
}

// =========================
// Demo Data
// =========================
const authors: Author[] = [
  { slug: "a-rivera", name: "A. Rivera", tagline: "Slow-burn mystery with heart.", genres: ["Crime & Thrillers", "Cozy"], image: "/images/author-1.jpg" },
  { slug: "j-holloway", name: "J. Holloway", tagline: "Dark academia + modern folklore.", genres: ["Dark Academia", "Fantasy"], image: "/images/author-2.jpg" },
  { slug: "m-chen", name: "M. Chen", tagline: "Soft sci-fi, big emotions.", genres: ["Sci-Fi", "Young Adult"], image: "/images/author-3.jpg" },
  { slug: "s-gomez", name: "S. Gomez", tagline: "Thrillers that don't let go.", genres: ["Crime & Thrillers"], image: "/images/author-4.jpg" },
];

const DEMO_STORIES: Story[] = [
  {
    slug: "fox-vs-the-world",
    title: "Fox Vs. The World (Preview)",
    author: "Daniel Cedeno",
    badge: "Early Access",
    description: "A first look at a world that refuses to stay quiet—exclusive chapters live here.",
    cover: "/images/cover-1.jpg",
    genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"],
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
    teaser: "The message arrived late—eight minutes late—like light that had to cross a hard truth.",
    content: `STARS DON'T APOLOGIZE — PART 1\n\nEveryone thinks space is silent.\nIt isn't.\n\nIt hums.\nIt remembers.\n\nWhen the signal finally hit my receiver, it carried a voice I wasn't ready to hear.\n\n"Don't come looking for me," it said.\n\nBut the stars don't apologize.\n\nAnd neither do I.\n`,
  },
];

// =========================
// Helpers
// =========================
function normalizeBadge(badge: string | null | undefined): "Serial" | "Exclusive" | "Early Access" {
  if (badge === "Exclusive" || badge === "Early Access" || badge === "Serial") return badge;
  return "Serial";
}
function guessGenresFromStory(row: SupabaseStoryRow): string[] {
  const haystack = `${row.title} ${row.description ?? ""} ${row.author_name}`.toLowerCase();
  const matches = TTL_GENRES.filter((genre) => haystack.includes(genre.toLowerCase()));
  return matches.length ? matches : ["Serialized Fiction"];
}
function mapSupabaseStoryToStory(row: SupabaseStoryRow): Story {
  return {
    slug: row.slug,
    title: row.title,
    author: row.author_name,
    badge: normalizeBadge(row.badge),
    description: row.description ?? "A new story is waiting in the Reading Room.",
    cover: row.cover_url || "/images/cover-1.jpg",
    genres: guessGenresFromStory(row),
    teaser: row.description ?? "Preview coming soon.",
    content: "This story is now connected to Supabase. Chapters will load dynamically from the database.",
  };
}

// =========================
// Phase 2 Styles — matches Browse All Stories
// =========================
const TTL_STYLES = `
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
    --ink-bg: #f0e6cc;
    --ink-surface: #f7f0e0;
    --ink-surface2: #ede0c4;
    --ink-border: rgba(139,100,20,0.15);
    --ink-border-gold: rgba(201,168,76,0.45);
    --text-main: #1a1008;
    --text-dim: rgba(26,16,8,0.6);
    --text-faint: rgba(26,16,8,0.35);
  }

  .ttl-root {
    min-height: 100vh;
    background: radial-gradient(ellipse at 50% 0%, #f5edd8 0%, #ede0c4 40%, #e8d5a8 70%, #dfc98a 100%);
    font-family: 'Syne', sans-serif;
    color: #ffffff;
    position: relative;
    overflow-x: hidden;
  }

  .ttl-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.35;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

  .ttl-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 40;
    background: rgba(240,230,204,0.97);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(100,149,237,0.3);
box-shadow: 0 2px 40px rgba(0,80,200,0.12), 0 0 0 1px rgba(100,149,237,0.08);
  }

  .ttl-nav-gold-line {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  .ttl-nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .ttl-nav-left {
    display: flex;
    align-items: center;
    gap: 40px;
    min-width: 0;
  }

  .ttl-nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .ttl-nav-logo-badge {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #000;
    flex-shrink: 0;
  }

  .ttl-nav-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .ttl-nav-brand-main {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    font-weight: 400;
    color: var(--gold-light);
    letter-spacing: 0.02em;
  }

  .ttl-nav-brand-sub {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: rgba(255,255,255,0.32);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ttl-nav-links {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .ttl-nav-link {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(232,228,218,0.45);
    text-decoration: none;
    padding: 6px 14px;
    border-radius: 4px;
    border: 1px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .ttl-nav-link:hover {
    color: var(--gold-light);
    border-color: var(--ink-border-gold);
    background: var(--gold-glow);
  }

  .ttl-nav-link.active {
    color: var(--gold-light);
    border-color: var(--gold-dim);
    background: var(--gold-glow);
  }

  .ttl-nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .ttl-nav-ink {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--gold-light);
    border: 1px solid var(--gold-dim);
    background: var(--gold-glow);
    padding: 6px 14px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .ttl-nav-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.1);
  }

  .ttl-nav-members {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    background: var(--blue);
    border: none;
    padding: 6px 18px;
    border-radius: 999px;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.2s;
  }

  .ttl-nav-members:hover { opacity: 0.88; }

  .ttl-nav-spacer { height: 74px; }

  .ttl-hero-section {
    padding: 0;
    background: linear-gradient(180deg, rgba(100,149,237,0.07) 0%, rgba(201,168,76,0.03) 60%, transparent 100%);
    border-bottom: 1px solid var(--ink-border);
  }

  .ttl-hero-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 72px 40px 56px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .ttl-hero-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--gold-dim);
    margin-bottom: 20px;
    display: block;
  }

  .ttl-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(64px, 8vw, 120px);
    font-weight: 300;
    line-height: 0.9;
    color: #ffffff;
    margin-bottom: 28px;
  }

  .ttl-hero-sub {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    color: var(--text-dim);
    max-width: 520px;
    line-height: 1.75;
    margin-bottom: 40px;
  }

  .ttl-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ttl-wrap {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 64px 40px 96px;
  }

  .ttl-btn-primary {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #000;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    border: none;
    padding: 13px 28px;
    border-radius: 8px;
    text-decoration: none;
    transition: opacity 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }

  .ttl-btn-primary:hover { opacity: 0.88; }

  .ttl-btn-ghost {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(232,228,218,0.6);
    background: transparent;
    border: 1px solid rgba(232,228,218,0.15);
    padding: 13px 28px;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .ttl-btn-ghost:hover {
    color: var(--gold-light);
    border-color: var(--gold-dim);
    background: var(--gold-glow);
  }

  .ttl-section { margin-bottom: 72px; }

  .ttl-section-header {
    margin-bottom: 8px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .ttl-section-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold-dim);
    display: block;
    margin-bottom: 6px;
  }

  .ttl-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 40px;
    font-weight: 300;
    color: #ffffff;
    line-height: 1;
  }

  .ttl-section-link {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--blue-bright);
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--blue-dim);
  }

  .ttl-section-link:hover { opacity: 0.7; }

  .ttl-divider {
    height: 1px;
    background: linear-gradient(to right, var(--gold-dim), transparent);
    margin: 20px 0 28px;
  }

  .ttl-section-accent {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .ttl-section-bar {
    width: 4px;
    height: 22px;
    border-radius: 2px;
    background: var(--gold);
    flex-shrink: 0;
  }

  .ttl-section-bar-blue { background: var(--blue); }

  .ttl-panel {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 28px;
    transition: border-color 0.2s;
  }

  .ttl-panel:hover { border-color: var(--ink-border-gold); }

  .ttl-panel-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--gold-dim);
    margin-bottom: 10px;
  }

  .ttl-wallet-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 12px;
  }

  .ttl-ink-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 60px;
    font-weight: 300;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 16px;
  }

  .ttl-ink-sub {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    color: var(--text-faint);
    line-height: 1.65;
    margin-bottom: 16px;
  }

  .ttl-ink-packs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .ttl-ink-pack {
    background: var(--ink-surface2);
    border: 1px solid var(--ink-border);
    border-radius: 10px;
    padding: 18px 14px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
    text-align: left;
    font-family: 'Syne', sans-serif;
  }

  .ttl-ink-pack:hover {
    background: var(--gold-glow);
    border-color: var(--gold-dim);
    transform: translateY(-2px);
  }

  .ttl-pack-label {
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 6px;
  }

  .ttl-pack-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
    font-weight: 300;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .ttl-pack-price {
    font-size: 13px;
    color: rgba(232,228,218,0.65);
    font-weight: 700;
    margin-bottom: 8px;
  }

  .ttl-pack-cta {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--blue-bright);
  }

  .ttl-authors-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .ttl-author-card {
    display: block;
    text-decoration: none;
    position: relative;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 28px 24px;
    overflow: hidden;
    transition: background 0.25s, border-color 0.25s, transform 0.2s;
  }

  .ttl-author-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    transform: scaleX(0);
    transition: transform 0.35s ease;
    transform-origin: left;
  }

  .ttl-author-card:hover {
    background: var(--ink-surface2);
    border-color: var(--ink-border-gold);
    transform: translateY(-3px);
  }

  .ttl-author-card:hover::before { transform: scaleX(1); }

  .ttl-author-avatar {
    width: 54px;
    height: 54px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1e1e26, #2a2a38);
    border: 1px solid var(--ink-border-gold);
    overflow: hidden;
    margin-bottom: 18px;
    flex-shrink: 0;
  }

  .ttl-author-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .ttl-author-avatar-initial {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 300;
    color: var(--gold);
  }

  .ttl-author-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    color: #ffffff;
    line-height: 1.15;
    margin-bottom: 5px;
  }

  .ttl-author-tagline {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.55;
    margin-bottom: 16px;
  }

  .ttl-author-genres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 18px;
  }

  .ttl-genre-tag {
    font-family: 'Syne', sans-serif;
    font-size: 8px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--blue-bright);
    border: 1px solid var(--blue-dim);
    background: var(--blue-dim);
    padding: 3px 9px;
    border-radius: 999px;
    transition: all 0.2s;
  }

  .ttl-author-tips {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .ttl-tip-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
    border: 1px solid var(--ink-border);
    background: transparent;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ttl-tip-btn:hover {
    color: var(--gold-light);
    border-color: var(--gold-dim);
    background: var(--gold-glow);
  }

  .ttl-jar-count {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    color: var(--text-faint);
    margin-left: auto;
  }

  .ttl-author-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 1px solid var(--ink-border);
  }

  .ttl-author-profile-link {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  .ttl-author-arrow {
    font-size: 14px;
    color: transparent;
    transition: color 0.25s, transform 0.25s;
  }

  .ttl-author-card:hover .ttl-author-arrow {
    color: var(--gold);
    transform: translate(2px, -2px);
  }

  .ttl-story-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .ttl-story-card {
    position: relative;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 24px;
    cursor: pointer;
    transition: background 0.25s, border-color 0.25s, transform 0.2s;
    overflow: hidden;
  }

  .ttl-story-card:hover {
    background: var(--ink-surface2);
    border-color: var(--ink-border-gold);
    transform: translateY(-3px);
  }

  .ttl-story-inner { display: flex; gap: 20px; }

  .ttl-story-cover {
    width: 64px;
    height: 92px;
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid var(--ink-border-gold);
    overflow: hidden;
    background: linear-gradient(135deg, #1e1e26, #2a2a38);
  }

  .ttl-story-cover img { width: 100%; height: 100%; object-fit: cover; }

  .ttl-story-body { flex: 1; min-width: 0; }

  .ttl-story-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }

  .ttl-story-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 400;
    color: #ffffff;
    line-height: 1.2;
  }

  .ttl-story-author {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    color: var(--text-dim);
    margin-bottom: 10px;
  }

  .ttl-story-desc {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text-faint);
    line-height: 1.65;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ttl-story-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ttl-story-genres {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 12px;
  }

  .ttl-story-hint {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(232,228,218,0.18);
    margin-top: 10px;
  }

  .ttl-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .ttl-badge-exclusive { border: 1px solid var(--gold-dim); color: var(--gold-light); background: var(--gold-glow); }
  .ttl-badge-early { border: 1px solid rgba(232,228,218,0.25); color: rgba(232,228,218,0.8); background: rgba(232,228,218,0.08); }
  .ttl-badge-serial { border: 1px solid var(--blue-dim); color: var(--blue-bright); background: var(--blue-dim); }

  .ttl-unlock-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--gold-dim);
    color: var(--gold-light);
    background: var(--gold-glow);
  }

  .ttl-unlock-btn:hover { background: rgba(201,168,76,0.2); }
  .ttl-unlock-btn:disabled { border-color: var(--ink-border); color: var(--text-faint); cursor: default; background: transparent; }
  .ttl-unlock-btn.unlocked { border-color: var(--ink-border); color: var(--text-faint); cursor: default; background: transparent; }

  .ttl-filter-bar {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ttl-filter-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--ink-border);
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    transition: all 0.18s;
  }

  .ttl-filter-btn:hover { border-color: var(--blue-dim); color: var(--blue-bright); background: var(--blue-dim); }

  .ttl-filter-btn.active {
    background: var(--gold-glow);
    border-color: var(--gold-dim);
    color: var(--gold-light);
  }

  .ttl-how-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .ttl-how-card {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 32px 28px;
    transition: border-color 0.2s;
  }

  .ttl-how-card:hover { border-color: var(--ink-border-gold); }

  .ttl-how-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 52px;
    font-weight: 300;
    color: rgba(201,168,76,0.18);
    line-height: 1;
    margin-bottom: 16px;
  }

  .ttl-how-title {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #ffffff;
    margin-bottom: 10px;
  }

  .ttl-how-text {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.7;
  }

  .ttl-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .ttl-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(10px);
    cursor: pointer;
    border: none;
    width: 100%;
    height: 100%;
  }

  .ttl-modal {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 720px;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border-gold);
    border-radius: 16px;
    overflow: hidden;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .ttl-modal-top-accent {
    height: 2px;
    background: linear-gradient(90deg, var(--blue-dim), var(--gold), var(--blue-dim));
  }

  .ttl-modal-header {
    padding: 28px 32px;
    border-bottom: 1px solid var(--ink-border);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .ttl-modal-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--gold-dim);
    margin-bottom: 8px;
  }

  .ttl-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 300;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .ttl-modal-author {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
  }

  .ttl-modal-close {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-dim);
    border: 1px solid var(--ink-border);
    background: var(--ink-surface2);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .ttl-modal-close:hover { color: #ffffff; border-color: var(--ink-border-gold); }

  .ttl-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 28px 32px;
  }

  .ttl-modal-footer {
    padding: 20px 32px;
    border-top: 1px solid var(--ink-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .ttl-modal-hint {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    color: var(--text-faint);
    letter-spacing: 0.08em;
  }

  .ttl-locked-panel {
    border: 1px solid var(--ink-border);
    padding: 24px;
    border-radius: 12px;
    background: var(--ink-surface2);
  }

  .ttl-teaser-box {
    border: 1px solid var(--blue-dim);
    background: var(--blue-dim);
    padding: 20px;
    margin: 16px 0;
    border-radius: 10px;
  }

  .ttl-teaser-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--blue-bright);
    margin-bottom: 10px;
  }

  .ttl-teaser-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    font-weight: 300;
    font-style: italic;
    color: rgba(232,228,218,0.75);
    line-height: 1.75;
  }

  .ttl-unlock-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
  }

  .ttl-unlock-info {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
  }

  .ttl-full-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 300;
    line-height: 1.9;
    color: rgba(232,228,218,0.85);
    white-space: pre-wrap;
  }

  .ttl-footer {
    margin-top: 72px;
    padding: 40px 0 24px;
    border-top: 1px solid var(--ink-border-gold);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ttl-footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ttl-footer-logo {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #000;
    flex-shrink: 0;
  }

  .ttl-footer-brand-text p:first-child {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 400;
    color: var(--gold-light);
  }

  .ttl-footer-brand-text p:last-child {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    color: var(--text-faint);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ttl-footer-copy {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--text-faint);
    text-transform: uppercase;
  }

  .ttl-footer-actions { display: flex; gap: 10px; }

  .ttl-status {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
    padding: 20px;
    border: 1px solid var(--ink-border);
    border-radius: 10px;
    letter-spacing: 0.06em;
    background: var(--ink-surface);
  }

  .ttl-status-warn {
    border-color: var(--gold-dim);
    background: var(--gold-glow);
    color: var(--gold-light);
    margin-bottom: 12px;
  }

  @media (max-width: 900px) {
    .ttl-nav-inner { padding: 0 24px; }
    .ttl-nav-links { display: none; }
    .ttl-wrap { padding: 48px 24px 72px; }
    .ttl-hero-inner { padding: 48px 24px 40px; }
    .ttl-authors-grid { grid-template-columns: repeat(2, 1fr); }
    .ttl-story-grid { grid-template-columns: 1fr; }
    .ttl-wallet-grid { grid-template-columns: 1fr; }
    .ttl-ink-packs { grid-template-columns: repeat(2, 1fr); }
    .ttl-how-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 480px) {
    .ttl-authors-grid { grid-template-columns: 1fr; }
    .ttl-hero-title { font-size: 52px; }
  }
`;

// =========================
// Sub-components
// =========================

function TTLBadge({ label }: { label: Story["badge"] }) {
  const cls =
    label === "Exclusive" ? "ttl-badge ttl-badge-exclusive" :
    label === "Early Access" ? "ttl-badge ttl-badge-early" :
    "ttl-badge ttl-badge-serial";
  return <span className={cls}>{label}</span>;
}

function AuthorAvatar({ author }: { author: Author }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = author.name.split(" ")[1]?.[0] ?? author.name[0];
  if (imgFailed || !author.image) {
    return (
      <div className="ttl-author-avatar">
        <div className="ttl-author-avatar-initial">{initial}</div>
      </div>
    );
  }
  return (
    <div className="ttl-author-avatar">
      <img src={author.image} alt={author.name} onError={() => setImgFailed(true)} />
    </div>
  );
}

function StoryCover({ story }: { story: Story }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (imgFailed || !story.cover) return <div className="ttl-story-cover" />;
  return (
    <div className="ttl-story-cover">
      <img src={story.cover} alt={story.title} onError={() => setImgFailed(true)} />
    </div>
  );
}

function ReaderModal({
  open, story, isUnlocked, inkCost, canUnlock, onClose, onUnlock,
}: {
  open: boolean; story: Story | null; isUnlocked: boolean;
  inkCost: number; canUnlock: boolean; onClose: () => void; onUnlock: () => void;
}) {
  if (!open || !story) return null;
  return (
    <div className="ttl-modal-overlay" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} className="ttl-modal-backdrop" aria-label="Close" />
      <div className="ttl-modal">
        <div className="ttl-modal-top-accent" />
        <div className="ttl-modal-header">
          <div>
            <div className="ttl-modal-eyebrow">The Tiniest Library — The Reading Room</div>
            <div className="ttl-modal-title">{story.title}</div>
            <div className="ttl-modal-author">by {story.author}</div>
            {story.genres?.length ? (
              <div className="ttl-story-genres" style={{ marginTop: 10 }}>
                {story.genres.slice(0, 5).map(g => (
                  <span key={g} className="ttl-genre-tag">{g}</span>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="ttl-modal-close">Close ✕</button>
        </div>
        <div className="ttl-modal-body">
          {!isUnlocked ? (
            <div className="ttl-locked-panel">
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(232,228,218,0.35)', marginBottom: 12 }}>
                This story is locked
              </div>
              <div className="ttl-teaser-box">
                <div className="ttl-teaser-label">Teaser</div>
                <div className="ttl-teaser-text">{story.teaser ?? story.description}</div>
              </div>
              <div className="ttl-unlock-row">
                <span className="ttl-unlock-info">Unlock costs <strong style={{ color: 'var(--gold)' }}>{inkCost}</strong> Ink</span>
                <button
                  type="button"
                  disabled={!canUnlock}
                  onClick={onUnlock}
                  className="ttl-unlock-btn"
                  style={!canUnlock ? { borderColor: 'var(--ink-border)', color: 'var(--text-faint)', cursor: 'default', background: 'transparent' } : {}}
                >
                  {canUnlock ? "Unlock & Read" : "Need more Ink"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 16 }}>Full Text</div>
              <div className="ttl-full-text">{story.content ?? "No content added yet."}</div>
            </div>
          )}
        </div>
        <div className="ttl-modal-footer">
          <span className="ttl-modal-hint">Press ESC to close</span>
          <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ttl-btn-ghost" style={{ fontSize: '9px', padding: '8px 18px', borderRadius: '8px' }} suppressHydrationWarning>
            Members Site →
          </a>
        </div>
      </div>
    </div>
  );
}

// =========================
// Red Door Card — entry to The Red Room
// =========================
function RedDoorCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="https://the-red-room.vercel.app"
  target="_blank"
  rel="noopener noreferrer"
  onMouseEnter={() => setHovered(true)}      
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        background: "linear-gradient(135deg, #1a0505 0%, #2d0808 50%, #1a0505 100%)",
        border: `1px solid ${hovered ? "rgba(200,60,60,0.8)" : "rgba(180,30,30,0.5)"}`,
        borderLeft: "4px solid #c94c4c",
        borderRadius: 12,
        padding: "28px 32px",
        marginBottom: 16,
        textDecoration: "none",
        position: "relative",
        overflow: "hidden",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 0.3s, transform 0.2s",
        boxShadow: "0 0 40px rgba(180,30,30,0.12), inset 0 0 60px rgba(180,30,30,0.04)",
      }}
    >
      <div style={{
        width: 64, height: 80, flexShrink: 0,
        background: "linear-gradient(180deg, #3d0a0a, #1a0404)",
        border: "2px solid rgba(201,168,76,0.6)",
        borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
        boxShadow: "0 0 20px rgba(201,168,76,0.2)",
        position: "relative",
      }}>
        🚪
        <div style={{
          position: "absolute", right: 8, top: "50%",
          width: 8, height: 8, borderRadius: "50%",
          background: "#C9A84C",
          boxShadow: "0 0 6px rgba(201,168,76,0.8)",
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9, letterSpacing: "0.28em",
          textTransform: "uppercase" as const,
          color: "rgba(200,80,80,0.8)", marginBottom: 8,
        }}>
          18+ · Age Verified Access Only
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 300, color: "#f0ece2",
          marginBottom: 6, lineHeight: 1.1,
        }}>
          The Red Room
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 12, color: "rgba(232,228,218,0.4)", lineHeight: 1.6,
        }}>
          Adult fiction for grown readers. 29 genres. Explicit content behind a verified age gate.
        </div>
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 10, letterSpacing: "0.2em",
        textTransform: "uppercase" as const,
        color: "rgba(200,80,80,0.7)",
        border: "1px solid rgba(200,80,80,0.3)",
        padding: "8px 16px", borderRadius: 6,
        flexShrink: 0,
      }}>
        Enter →
      </div>
      <div style={{
        position: "absolute", inset: 0,
        pointerEvents: "none" as const,
        background: "radial-gradient(ellipse at 20% 50%, rgba(180,30,30,0.08) 0%, transparent 70%)",
      }} />
    </a>
  );
}

// =========================
// Page
// =========================
export default function ReadingRoomHome() {
  const [ink, setInk] = useState<number>(DEFAULT_INK);
  const [unlocks, setUnlocksState] = useState<Unlocks>({});
  const [jar, setJarState] = useState<AuthorJar>({});
  const [stories, setStories] = useState<Story[]>(DEMO_STORIES);
  const [storiesLoading, setStoriesLoading] = useState<boolean>(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [openStorySlug, setOpenStorySlug] = useState<string | null>(null);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [openingInk, setOpeningInk] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setInk(getInk());
    setUnlocksState(getUnlocks());
    setJarState(getJar());
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
  
  useEffect(() => {
    async function loadStories() {
      try {
        setStoriesLoading(true);
        const { data, error } = await supabase
          .from("stories")
          .select("id, slug, title, author_name, description, cover_url, badge, is_published, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        if (error) { setStoriesError(error.message); setStories(DEMO_STORIES); return; }
        if (data && data.length > 0) {
          setStories((data as SupabaseStoryRow[]).map(mapSupabaseStoryToStory));
        } else {
          setStories(DEMO_STORIES);
        }
      } catch (err) {
        setStoriesError("Could not load stories from Supabase.");
        setStories(DEMO_STORIES);
      } finally {
        setStoriesLoading(false);
      }
    }
    loadStories();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const inkParam = params.get("ink");
    if (!inkParam) return;
    const amount = Number(inkParam);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setInk(c => c + amount);
    params.delete("ink");
    window.history.replaceState({}, "", window.location.pathname + (params.toString() ? `?${params}` : ""));
    setTimeout(() => alert(`✅ Purchase complete — ${amount} Ink added!`), 200);
  }, []);

  useEffect(() => {
    if (!openStorySlug) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenStorySlug(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openStorySlug]);

  useEffect(() => setInkStore(ink), [ink]);
  useEffect(() => setUnlocks(unlocks), [unlocks]);
  useEffect(() => setJar(jar), [jar]);

  const buyInk = (amount: number) => {
    const url = STRIPE_LINKS[amount];
    if (!url) { alert("Checkout link not found."); return; }
    setIsOpeningCheckout(true);
    setOpeningInk(amount);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => { setIsOpeningCheckout(false); setOpeningInk(null); }, 2500);
  };

  const unlockStory = (slug: string, cost = DEFAULT_UNLOCK_COST) => {
    if (ink < cost) { alert(`You need ${cost} Ink to unlock this.`); return; }
    setInk(v => v - cost);
    setUnlocksState(u => ({ ...u, [slug]: true }));
  };

  const tipAuthor = (authorSlug: string, amount: number) => {
    if (ink < amount) { alert("Not enough Ink yet."); return; }
    setInk(v => v - amount);
    setJarState(j => ({ ...j, [authorSlug]: (j[authorSlug] ?? 0) + amount }));
    alert(`Supported the author with ${amount} Ink!`);
  };

  const allGenres = useMemo(() => ["All", ...TTL_GENRES], []);
  const filteredStories = useMemo(() => {
    if (selectedGenre === "All") return stories;
    return stories.filter(s => (s.genres ?? []).includes(selectedGenre));
  }, [selectedGenre, stories]);

  const activeStory = useMemo(() => {
    if (!openStorySlug) return null;
    return stories.find(s => s.slug === openStorySlug) ?? null;
  }, [openStorySlug, stories]);

  const activeUnlocked = useMemo(() => activeStory ? Boolean(unlocks[activeStory.slug]) : false, [activeStory, unlocks]);
  const activeCanUnlock = useMemo(() => ink >= DEFAULT_UNLOCK_COST, [ink]);

  return (
    <>
      <style>{TTL_STYLES}</style>
      <div className="ttl-root">

        {/* ── NAVBAR ── */}
        <nav className="ttl-nav">
          <div className="ttl-nav-gold-line" />
          <div className="ttl-nav-inner">
            <div className="ttl-nav-left">
              <a href="/reading-room" className="ttl-nav-brand">
                <div className="ttl-nav-logo-badge">TTL</div>
                <div className="ttl-nav-brand-text">
                  <span className="ttl-nav-brand-main">The Tiniest Library</span>
                  <span className="ttl-nav-brand-sub">The Reading Room</span>
                </div>
              </a>
              <div className="ttl-nav-links">                
                <a href="/reading-room/authors" className="ttl-nav-link">Author Directory</a>
                <a href="/reading-room/stories" className="ttl-nav-link">All Stories</a>
                <a href="/reading-room/buy-ink" className="ttl-nav-link">Buy Ink ✒️</a>                
              </div>
            </div>
            <div className="ttl-nav-right">
              <a href="/reading-room/buy-ink" className="ttl-nav-ink" style={{ textDecoration: 'none' }}>
                <span>✒️</span>
                <span>{ink} Ink</span>
              </a>
              <div className="ttl-nav-divider" />
              <button
              type="button"
              className="ttl-nav-tour-btn"
              onClick={startTour}
              suppressHydrationWarning
              >
                📖 Tour
                </button>
                <div className="ttl-nav-divider" />
                <AdQueue />
                {user ? (
              <a href="/reading-room/account" className="ttl-nav-members">
                My Account →
              </a>
              ) : (
  <a href="/reading-room/login" className="ttl-nav-members">
    Sign In →
  </a>
)}
            </div>
          </div>
        </nav>

        <div className="ttl-nav-spacer" />

        <ReaderModal
          open={Boolean(openStorySlug)}
          story={activeStory}
          isUnlocked={activeUnlocked}
          inkCost={DEFAULT_UNLOCK_COST}
          canUnlock={activeCanUnlock}
          onClose={() => setOpenStorySlug(null)}
          onUnlock={() => { if (activeStory) unlockStory(activeStory.slug, DEFAULT_UNLOCK_COST); }}
        />

        {/* ── HERO ── */}
        <div className="ttl-hero-section">
          <div className="ttl-hero-inner">
            <span className="ttl-hero-eyebrow">The Tiniest Library</span>
            <h1 className="ttl-hero-title">
  The<br />
  <span style={{
    background: "linear-gradient(135deg, #C9A84C 0%, #FFE066 40%, #E2C97E 60%, #C9A84C 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontStyle: "italic",
    filter: "drop-shadow(0 0 12px rgba(201,168,76,0.5))",
  }}>Reading</span><br />
  <span style={{ paddingLeft: "4rem", color: "#1a1008" }}>Room</span>
</h1>
            <p className="ttl-hero-sub">
              A space for long stories, serialized chapters, and exclusive releases.
              Support creators with Ink and unlock what's next.
            </p>
            <div className="ttl-hero-actions">
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ttl-btn-primary">
                Enter Members Room →
              </a>
              <a href="/reading-room/authors" className="ttl-btn-ghost">Author Directory</a>
              <a href="#how-it-works" className="ttl-btn-ghost">How it works</a>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="ttl-wrap">

          {/* ── INK WALLET ── */}
          <div className="ttl-section">
            <div className="ttl-section-header">
              <div>
                <div className="ttl-section-accent">
                  <div className="ttl-section-bar" />
                  <div>
                    <span className="ttl-section-eyebrow">Wallet</span>
                    <h2 className="ttl-section-title">Reader Ink</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="ttl-divider" />
            <div className="ttl-wallet-grid">
              <div className="ttl-panel">
                <div className="ttl-panel-label">Your Balance</div>
                <div className="ttl-ink-num">{ink}</div>
                <p className="ttl-ink-sub">Ink is stored in your browser. It updates automatically after purchase.</p>
              </div>
              <div className="ttl-panel">
                <div className="ttl-panel-label">Buy Ink</div>
                <div className="ttl-ink-packs">
                  {INK_PACKS.map(p => (
                    <button key={p.id} type="button" onClick={() => buyInk(p.ink)} className="ttl-ink-pack">
                      <div className="ttl-pack-label">{p.label}</div>
                      <div className="ttl-pack-amount">{p.ink}</div>
                      <div className="ttl-pack-price">{p.price}</div>
                      <div className="ttl-pack-cta">
                        {isOpeningCheckout && openingInk === p.ink ? "Opening…" : "Stripe →"}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="ttl-ink-sub" style={{ marginTop: 14 }}>
                  Set each Stripe success URL to <strong style={{ color: 'var(--text-main)' }}>/reading-room?ink=XXX</strong> for auto-credit.
                </p>
              </div>
            </div>
          </div>

          {/* ── FEATURED AUTHORS ── */}
          <div className="ttl-section">
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
            <div className="ttl-authors-grid">
              {authors.map(author => (
                <a key={author.slug} href={`/reading-room/authors/${author.slug}`} className="ttl-author-card">
                  <AuthorAvatar author={author} />
                  <div className="ttl-author-name">{author.name}</div>
                  <div className="ttl-author-tagline">{author.tagline}</div>
                  <div className="ttl-author-genres">
                    {author.genres.map(g => (
                      <span key={g} className="ttl-genre-tag">{g}</span>
                    ))}
                  </div>
                  <div className="ttl-author-tips" onClick={e => e.preventDefault()}>
                    <button type="button" onClick={e => { e.preventDefault(); tipAuthor(author.slug, 10); }} className="ttl-tip-btn">Tip 10 Ink</button>
                    <button type="button" onClick={e => { e.preventDefault(); tipAuthor(author.slug, 25); }} className="ttl-tip-btn">Tip 25</button>
                    <span className="ttl-jar-count">Jar: <strong style={{ color: 'var(--text-dim)' }}>{jar[author.slug] ?? 0}</strong></span>
                  </div>
                  <div className="ttl-author-footer">
                    <span className="ttl-author-profile-link">🪶 Writer profile</span>
                    <span className="ttl-author-arrow">↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* ── FEATURED STORIES ── */}
          <div className="ttl-section">
            <div className="ttl-section-header">
              <div>
                <div className="ttl-section-accent">
                  <div className="ttl-section-bar ttl-section-bar-blue" />
                  <div>
                    <span className="ttl-section-eyebrow">Read</span>
                    <h2 className="ttl-section-title">Featured Stories</h2>
                  </div>
                </div>
              </div>
              <a href="/reading-room/stories" className="ttl-section-link">Browse All →</a>
            </div>
            <div className="ttl-divider" />

            {/* ── RED DOOR ── */}
            <RedDoorCard />

            <div className="ttl-filter-bar">
              {allGenres.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  className={`ttl-filter-btn${selectedGenre === g ? " active" : ""}`}
                >
                  {g}
                </button>
              ))}
            </div>

            {storiesLoading && <div className="ttl-status">Loading stories from the library…</div>}
            {storiesError && (
              <div className="ttl-status ttl-status-warn">
                Using fallback stories. Supabase: {storiesError}
              </div>
            )}

            <div className="ttl-story-grid">
              {filteredStories.map(story => {
                const isUnlocked = Boolean(unlocks[story.slug]);
                const canUnlock = ink >= DEFAULT_UNLOCK_COST;
                return (
                  <div
                    key={story.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenStorySlug(story.slug)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpenStorySlug(story.slug); }}
                    className="ttl-story-card"
                  >
                    <div className="ttl-story-inner">
                      <StoryCover story={story} />
                      <div className="ttl-story-body">
                        <div className="ttl-story-header">
                          <div className="ttl-story-title">{story.title}</div>
                          <TTLBadge label={story.badge} />
                        </div>
                        <div className="ttl-story-author">by {story.author}</div>
                        <div className="ttl-story-desc">{story.description}</div>
                        <div className="ttl-story-footer">
                          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, color: 'var(--text-faint)' }}>
                            {isUnlocked ? "✓ Unlocked" : `${DEFAULT_UNLOCK_COST} Ink to unlock`}
                          </span>
                          <button
                            type="button"
                            disabled={isUnlocked || !canUnlock}
                            className={`ttl-unlock-btn${isUnlocked ? " unlocked" : ""}`}
                            onClick={e => { e.stopPropagation(); unlockStory(story.slug, DEFAULT_UNLOCK_COST); }}
                          >
                            {isUnlocked ? "Unlocked" : canUnlock ? "Unlock" : "Need Ink"}
                          </button>
                        </div>
                        {story.genres?.length ? (
                          <div className="ttl-story-genres">
                            {story.genres.slice(0, 3).map(g => (
                              <span key={g} className="ttl-genre-tag">{g}</span>
                            ))}
                          </div>
                        ) : null}
                        <div className="ttl-story-hint">Click to open reader →</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── HOW IT WORKS ── */}
          <div className="ttl-section" id="how-it-works">
            <div className="ttl-section-header">
              <div>
                <div className="ttl-section-accent">
                  <div className="ttl-section-bar" />
                  <div>
                    <span className="ttl-section-eyebrow">Simple</span>
                    <h2 className="ttl-section-title">How it works</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="ttl-divider" />
            <div className="ttl-how-grid">
              <div className="ttl-how-card">
                <div className="ttl-how-num">01</div>
                <div className="ttl-how-title">Read</div>
                <div className="ttl-how-text">Browse authors and follow long stories chapter by chapter, on any device.</div>
              </div>
              <div className="ttl-how-card">
                <div className="ttl-how-num">02</div>
                <div className="ttl-how-title">Support</div>
                <div className="ttl-how-text">Buy Ink securely with Stripe and tip writers you want to back.</div>
              </div>
              <div className="ttl-how-card">
                <div className="ttl-how-num">03</div>
                <div className="ttl-how-title">Unlock</div>
                <div className="ttl-how-text">Ink unlocks early-access chapters and members-only exclusives.</div>
              </div>
            </div>
            <div className="ttl-hero-actions">
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ttl-btn-primary">
                Go to Members Room →
              </a>
              <span className="ttl-btn-ghost" style={{ cursor: 'default' }}>Payments by Stripe</span>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="ttl-footer">
            <div className="ttl-footer-brand">
              <div className="ttl-footer-logo">TTL</div>
              <div className="ttl-footer-brand-text">
                <p>The Tiniest Library</p>
                <p>The Reading Room</p>
              </div>
            </div>
            <span className="ttl-footer-copy">© {new Date().getFullYear()} The Tiniest Library. All rights reserved.</span>
            <div className="ttl-footer-actions">
              <a href="/reading-room/stories" className="ttl-btn-ghost" style={{ fontSize: '9px', padding: '8px 18px', borderRadius: '8px' }} suppressHydrationWarning>
                Browse Stories
              </a>
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ttl-btn-primary" style={{ fontSize: '9px', padding: '8px 18px', borderRadius: '8px' }} suppressHydrationWarning>
                Members Site →
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
