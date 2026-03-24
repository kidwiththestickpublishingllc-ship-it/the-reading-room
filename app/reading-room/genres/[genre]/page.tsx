"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// Route: /reading-room/genres/[genre]/page.tsx
// Dynamic genre page — handles all 24 TTL genres
// Usage: drop this file at app/reading-room/genres/[genre]/page.tsx
// =========================

// =========================
// Types
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

type Author = {
  slug: string;
  name: string;
  tagline: string;
  genres: string[];
  image: string;
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
const SQUARESPACE_READING_ROOM = "https://www.the-tiniest-library.com/the-reading-room";
const DEFAULT_INK = 250;
const DEFAULT_UNLOCK_COST = 25;

const STRIPE_LINKS: Record<number, string> = {
  100: "https://buy.stripe.com/dRm9AT3lu7WK6INapV7AI00",
  600: "https://buy.stripe.com/6oU3cv2hqdh43wB69F7AI01",
  1500: "https://buy.stripe.com/4gM28r2hqel82sx8hN7AI02",
  2500: "https://buy.stripe.com/aFaeVd4py7WK9UZeGb7AI03",
};

// =========================
// Genre Meta — art, lore, emoji, accent color
// =========================
type GenreMeta = {
  label: string;
  cover: string;
  emoji: string;
  accent: string;         // CSS color for accent bar / highlights
  accentDim: string;      // dimmed version for borders
  lore: string;           // the descriptive blurb shown on the page
};

const GENRE_META: Record<string, GenreMeta> = {
  "Fantasy": {
    label: "Fantasy",
    cover: "/genre-cards/FANTASY/genre-fantasy.jpg",
    emoji: "🧙",
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.28)",
    lore: "Worlds where magic is real, monsters roam, and the ordinary becomes extraordinary. Fantasy at TTL spans high epic quests and quiet village folklore — from ancient wizards to chosen heroes who never asked for the title. If you've ever wanted to step through a door that shouldn't exist, this is your genre.",
  },
  "Sci-Fi": {
    label: "Sci-Fi",
    cover: "/genre-cards/SCIENCE%20FICTION/genre-scifi.jpg",
    emoji: "🚀",
    accent: "#60a5fa",
    accentDim: "rgba(96,165,250,0.28)",
    lore: "The future is a foreign country — and these are its dispatches. Science fiction on TTL explores what happens when humanity pushes too far, builds too fast, or finally reaches the stars. From hard sci-fi thought experiments to soft futures full of feeling, every story here dares to ask: what if?",
  },
  "Horror Mystery": {
    label: "Horror Mystery",
    cover: "/genre-cards/HORROR%20MYSTERY/genre-horror.jpg",
    emoji: "🕯️",
    accent: "#f87171",
    accentDim: "rgba(248,113,113,0.28)",
    lore: "Something is wrong in the house at the end of the road. Something has always been wrong. Horror Mystery at TTL blends dread with detective instinct — stories where the shadows have teeth and the clues lead somewhere you're not sure you want to go. Read with the lights on.",
  },
  "Crime & Thrillers": {
    label: "Crime & Thrillers",
    cover: "/genre-cards/CRIME%20THRILLER/genre-crime.jpg",
    emoji: "🔍",
    accent: "#fbbf24",
    accentDim: "rgba(251,191,36,0.28)",
    lore: "Lies buried under alibis. Bodies in the rain. A detective who knows more than they're telling. Crime & Thriller fiction at TTL keeps you three steps behind and desperate to catch up. These are stories of moral complexity, ticking clocks, and the kind of tension that makes your pulse do the reading.",
  },
  "Romance": {
    label: "Romance",
    cover: "/genre-cards/ROMANCE/genre-romance.jpg",
    emoji: "🌹",
    accent: "#fb7185",
    accentDim: "rgba(251,113,133,0.28)",
    lore: "Love is never simple. Romance at TTL is raw, tender, funny, heartbreaking — and always honest about the fact that two people choosing each other is one of the most complicated things in the world. Whether it's slow burn over centuries or a single breathless weekend, these stories make you feel it.",
  },
  "Young Adult": {
    label: "Young Adult",
    cover: "/genre-cards/YOUNG%20ADULT/genre-ya.jpg",
    emoji: "🌟",
    accent: "#34d399",
    accentDim: "rgba(52,211,153,0.28)",
    lore: "The most electric years. YA fiction at TTL captures the specific electricity of becoming — first love, first loss, first time realizing the adults don't have it figured out either. These are stories for readers who remember what it felt like when everything was still possible and nothing had set yet.",
  },
  "New Adult": {
    label: "New Adult",
    cover: "/genre-cards/NEW%20ADULT/genre-newadult.jpg",
    emoji: "🎓",
    accent: "#818cf8",
    accentDim: "rgba(129,140,248,0.28)",
    lore: "Too old to hide under a curfew. Too young to know what they're doing. New Adult fiction lives in the gap between leaving home and figuring out who you actually are. College dorms, first jobs, complicated relationships, and the strange freedom of nobody watching — this is that chapter.",
  },
  "Children's Literature": {
    label: "Children's Literature",
    cover: "/genre-cards/CHILDRENS%20STORIES/genre-childrens.jpg",
    emoji: "🌈",
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.28)",
    lore: "The stories children carry into adulthood are the ones that shaped them most. Children's Literature at TTL is crafted with the same care as any other genre — maybe more. These are tales of wonder, courage, kindness, and the kind of magic that lives in a good sentence read at exactly the right moment.",
  },
  "Cozy": {
    label: "Cozy",
    cover: "/genre-cards/COZY/genre-cozy.jpg",
    emoji: "☕",
    accent: "#d97706",
    accentDim: "rgba(217,119,6,0.28)",
    lore: "A warm mug. A rainy window. A mystery that won't ruin your evening. Cozy fiction at TTL is a refuge — stories that feel like a favorite sweater, set in small towns or cozy bookshops where things go gently wrong and gently right again. No gore. No dread. Just charm, community, and the satisfying click of things resolving.",
  },
  "Poems & Memoirs": {
    label: "Poems & Memoirs",
    cover: "/genre-cards/POETRY/genre-poems.jpg",
    emoji: "🪶",
    accent: "#c084fc",
    accentDim: "rgba(192,132,252,0.28)",
    lore: "The truest writing is often the shortest. Poems & Memoirs at TTL gives space to the lyric, the confessional, and the deeply personal — verse that turns on a single image, and prose that opens a whole life in a paragraph. These writers aren't hiding behind fiction. This is what they actually mean.",
  },
  "Adventure": {
    label: "Adventure",
    cover: "/genre-cards/ADVENTURE/genre-adventure.jpg",
    emoji: "🗺️",
    accent: "#22d3ee",
    accentDim: "rgba(34,211,238,0.28)",
    lore: "The horizon is never enough — there's always another one. Adventure fiction at TTL throws characters into the unknown and watches what they're made of. Jungles, open seas, lost cities, impossible missions. These stories move fast and ask big questions: how far would you go, and what would you do when you got there?",
  },
  "Contemporary Fiction": {
    label: "Contemporary Fiction",
    cover: "/genre-cards/CONTEMPORARY%20FICTION/genre-contemporary.jpg",
    emoji: "🏙️",
    accent: "#6495ED",
    accentDim: "rgba(100,149,237,0.28)",
    lore: "Right here. Right now. Contemporary Fiction at TTL is set in the world we actually live in — complicated, contradictory, full of screens and traffic and feeling. These are stories about people navigating real life with more grace, or less, than we expect. Literary without being cold. Human without being obvious.",
  },
  "Historical Fiction": {
    label: "Historical Fiction",
    cover: "/genre-cards/HISTORICAL%20FICTION/genre-historical.jpg",
    emoji: "📜",
    accent: "#C9A84C",
    accentDim: "rgba(201,168,76,0.28)",
    lore: "The past was never as clean as the textbooks made it. Historical Fiction at TTL drops readers into the smell and noise of other centuries — the politics, the fashions, the violence, the beauty. These writers have done the research so you can feel the cobblestones underfoot and believe, for a chapter at a time, that you were there.",
  },
  "Serialized Fiction": {
    label: "Serialized Fiction",
    cover: "/genre-cards/SERIALIZED%20FICTION/genre-serial.jpg",
    emoji: "📚",
    accent: "#84b0f5",
    accentDim: "rgba(132,176,245,0.28)",
    lore: "The oldest form of storytelling — delivered one chapter at a time. Serialized Fiction at TTL is written to be followed, anticipated, and discussed. These authors are building something chapter by chapter and inviting you along for the whole ride. Start from the beginning. The wait between installments is part of the experience.",
  },
  "Fan Fiction": {
    label: "Fan Fiction",
    cover: "/genre-cards/FAN%20FICTION/genre-fanfic.jpg",
    emoji: "✨",
    accent: "#f472b6",
    accentDim: "rgba(244,114,182,0.28)",
    lore: "Love is transformative — and so is fan fiction. TTL welcomes transformative works that honor existing worlds while building something new inside them. These writers know their source material the way a composer knows a key — deeply enough to play something it's never played before. Fandoms are communities. This is where their writers live.",
  },
  "Slice Of Life": {
    label: "Slice of Life",
    cover: "/genre-cards/SLICE%20OF%20LIFE/genre-sliceoflife.jpg",
    emoji: "🌿",
    accent: "#4ade80",
    accentDim: "rgba(74,222,128,0.28)",
    lore: "Nothing explodes. Nobody saves the world. And yet. Slice of Life fiction at TTL finds the extraordinary inside the everyday — the conversation that changed everything, the afternoon that felt like it lasted a year, the small decision that quietly redirected a life. These are stories that make you feel less alone in your own ordinary.",
  },
  "Dark Academia": {
    label: "Dark Academia",
    cover: "/genre-cards/DARK%20ACADEMIA/genre-darkacademia.jpg",
    emoji: "🕰️",
    accent: "#a8a29e",
    accentDim: "rgba(168,162,158,0.28)",
    lore: "Old libraries. Secret societies. The dangerous idea that knowledge is worth any price. Dark Academia at TTL is drenched in candlelight, Latin mottos, and the specific madness of people who love learning too much and too personally. Something is always being buried — whether it's a body, a truth, or someone's better judgment.",
  },
  "Multi-Cultural": {
    label: "Multi-Cultural",
    cover: "/genre-cards/MULTICULTURAL/genre-multicultural.jpg",
    emoji: "🌍",
    accent: "#fb923c",
    accentDim: "rgba(251,146,60,0.28)",
    lore: "The world is not one story — it never was. Multi-Cultural fiction at TTL amplifies the breadth of human experience: family structures that don't fit Western templates, mythologies that predate Europe, communities whose stories have been systematically overlooked. This shelf is not a footnote. It's the main text.",
  },
  "Black Stories": {
    label: "Black Stories",
    cover: "/genre-cards/BLACK%20STORIES/genre-blackstories.jpg",
    emoji: "✊",
    accent: "#fbbf24",
    accentDim: "rgba(251,191,36,0.28)",
    lore: "Joy. Grief. Power. Survival. Black fiction at TTL is not defined by struggle alone — it is defined by the full range of Black life, told by Black writers on their own terms. These stories are not here to educate outsiders. They are here because they are extraordinary literature and because every story deserves a shelf that feels like home.",
  },
  "Latin Stories": {
    label: "Latin Stories",
    cover: "/genre-cards/LATIN%20VOICES/genre-latin.jpg",
    emoji: "🌺",
    accent: "#f97316",
    accentDim: "rgba(249,115,22,0.28)",
    lore: "Magical realism. Immigration. Family as landscape. Latin fiction at TTL carries the weight and warmth of the Americas in both languages and the spaces between them. These stories know that home is a complicated concept and that the past is never finished with you. Bold, lyrical, specific — and impossible to put down.",
  },
  "AAPI Authors": {
    label: "AAPI Authors",
    cover: "/genre-cards/AAPI/genre-aapi.jpg",
    emoji: "🌸",
    accent: "#e879f9",
    accentDim: "rgba(232,121,249,0.28)",
    lore: "Across fifty countries and thousands of years of storytelling tradition, AAPI authors at TTL bring a breadth that no single label can contain. Mythology and modernity. Diaspora and rootedness. Honor and rebellion. These writers are not a monolith — they are a library unto themselves, and this is where you begin.",
  },
  "Indigenous Stories": {
    label: "Indigenous Stories",
    cover: "/genre-cards/INDEGINOUS%20VOICES/genre-indigenous.jpg",
    emoji: "🌾",
    accent: "#86efac",
    accentDim: "rgba(134,239,172,0.28)",
    lore: "The oldest stories on this continent are still being written. Indigenous fiction at TTL honors oral traditions and written ones, contemporary voices and ancient ones, the land as character and the community as protagonist. These writers are not relics — they are living authors building on living traditions. This shelf exists because silence was never the answer.",
  },
  "LGBTQ+ Fiction": {
    label: "LGBTQ+ Fiction",
    cover: "/genre-cards/LGBTQ%2B%20VOICES/genre-lgbtq.jpg",
    emoji: "🏳️‍🌈",
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.28)",
    lore: "Love in all its forms. Identity in all its complexity. LGBTQ+ fiction at TTL is not defined by coming-out stories alone — though those matter too. It is defined by the full spectrum of queer experience: joy, desire, grief, chosen family, community, survival, and the particular clarity that comes from knowing exactly who you are.",
  },
  "Adult 18+": {
    label: "Adult 18+",
    cover: "/genre-cards/ADULT/genre-adult.jpg",
    emoji: "🔞",
    accent: "#f43f5e",
    accentDim: "rgba(244,63,94,0.28)",
    lore: "Mature fiction for adult readers. This shelf contains explicit content — sexual, violent, or both — written with craft and intention. TTL's Adult 18+ section is not a loophole or an afterthought. It is a serious literary space where writers can explore the full range of adult experience without softening the edges.",
  },
};

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
function setUnlocksStore(next: Unlocks) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ttl_unlocks", JSON.stringify(next));
}
function getJar(): AuthorJar {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem("ttl_author_jar");
  return raw ? (JSON.parse(raw) as AuthorJar) : {};
}
function setJarStore(next: AuthorJar) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ttl_author_jar", JSON.stringify(next));
}

// =========================
// Demo Data
// =========================
const DEMO_AUTHORS: Author[] = [
  { slug: "a-rivera",  name: "A. Rivera",  tagline: "Slow-burn mystery with heart.",     genres: ["Crime & Thrillers", "Cozy"],          image: "/images/author-1.jpg" },
  { slug: "j-holloway",name: "J. Holloway",tagline: "Dark academia + modern folklore.",  genres: ["Dark Academia", "Fantasy"],           image: "/images/author-2.jpg" },
  { slug: "m-chen",   name: "M. Chen",     tagline: "Soft sci-fi, big emotions.",        genres: ["Sci-Fi", "Young Adult"],              image: "/images/author-3.jpg" },
  { slug: "s-gomez",  name: "S. Gomez",    tagline: "Thrillers that don't let go.",      genres: ["Crime & Thrillers"],                  image: "/images/author-4.jpg" },
  { slug: "d-cedeno", name: "Daniel Cedeno",tagline: "Worlds that refuse to stay quiet.",genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"], image: "/images/author-5.jpg" },
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
    content: `STARS DON'T APOLOGIZE — PART 1\n\nEveryone thinks space is silent.\nIt isn't.\n\nIt hums.\nIt remembers.\n\nWhen the signal finally hit my receiver, it carried a voice I wasn't ready to hear.\n\n"Don't come looking for me," it said.\n\nBut the stars don't apologize.\n\nAnd neither do I.\n`,
  },
];

// =========================
// Helpers
// =========================
function normalizeBadge(b: string | null | undefined): "Serial" | "Exclusive" | "Early Access" {
  if (b === "Exclusive" || b === "Early Access" || b === "Serial") return b;
  return "Serial";
}
function guessGenres(row: SupabaseStoryRow, allGenres: string[]): string[] {
  const hay = `${row.title} ${row.description ?? ""} ${row.author_name}`.toLowerCase();
  const matches = allGenres.filter(g => hay.includes(g.toLowerCase()));
  return matches.length ? matches : ["Serialized Fiction"];
}
function mapRow(row: SupabaseStoryRow, allGenres: string[]): Story {
  return {
    slug: row.slug, title: row.title, author: row.author_name,
    badge: normalizeBadge(row.badge),
    description: row.description ?? "A new story is waiting.",
    cover: row.cover_url || "/images/cover-1.jpg",
    genres: guessGenres(row, allGenres),
    teaser: row.description ?? "Preview coming soon.",
    content: "Chapters load dynamically from Supabase.",
    addedAt: row.created_at ?? undefined,
  };
}

// Converts URL slug back to genre name e.g. "dark-academia" → "Dark Academia"
function slugToGenre(slug: string): string {
  return decodeURIComponent(slug)
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace("Sci Fi", "Sci-Fi")
    .replace("Lgbtq ", "LGBTQ+ ")
    .replace("Aapi", "AAPI")
    .replace("18 ", "18+")
    .replace("&Amp;", "&");
}

// =========================
// Styles — extends TRR system exactly
// =========================
const GENRE_PAGE_STYLES = `
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

    /* Genre accent — overridden per-genre via inline style on root */
    --genre-accent: #C9A84C;
    --genre-accent-dim: rgba(201,168,76,0.28);
  }

  .gp-root {
    min-height: 100vh;
    background: var(--ink-bg);
    font-family: 'Syne', sans-serif;
    color: var(--text-main);
    position: relative;
    overflow-x: hidden;
  }

  .gp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.35;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

  /* ── NAV ── */
  .gp-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 40;
    background: rgba(8,8,8,0.96);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--ink-border-gold);
    box-shadow: 0 2px 40px rgba(0,0,0,0.7);
  }

  .gp-nav-accent-line {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--genre-accent), transparent);
  }

  .gp-nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .gp-nav-left { display: flex; align-items: center; gap: 32px; min-width: 0; }

  .gp-nav-brand {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none; flex-shrink: 0;
  }

  .gp-nav-logo {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 700; color: #000;
  }

  .gp-nav-brand-main {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 400;
    color: var(--gold-light); letter-spacing: 0.02em;
  }

  .gp-nav-brand-sub {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.32);
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  .gp-nav-links { display: flex; align-items: center; gap: 2px; }

  .gp-nav-link {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-dim); text-decoration: none;
    padding: 6px 14px; border-radius: 4px;
    border: 1px solid transparent;
    transition: all 0.2s; white-space: nowrap;
  }

  .gp-nav-link:hover {
    color: var(--gold-light);
    border-color: var(--ink-border-gold);
    background: var(--gold-glow);
  }

  .gp-nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  .gp-nav-ink {
    display: flex; align-items: center; gap: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    color: var(--gold-light);
    border: 1px solid var(--gold-dim);
    background: var(--gold-glow);
    padding: 6px 14px; border-radius: 999px;
    white-space: nowrap;
  }

  .gp-nav-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }

  .gp-nav-members {
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    color: #fff; background: var(--blue);
    border: none; padding: 6px 18px; border-radius: 999px;
    text-decoration: none; white-space: nowrap;
    transition: opacity 0.2s;
  }

  .gp-nav-members:hover { opacity: 0.88; }

  .gp-nav-spacer { height: 74px; }

  /* ── HERO ── */
  .gp-hero {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--ink-border);
    min-height: 480px;
    display: flex;
    align-items: flex-end;
  }

  .gp-hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .gp-hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    opacity: 0.35;
  }

  .gp-hero-bg-fallback {
    width: 100%;
    height: 100%;
    background: linear-gradient(160deg, #0e1a30, #060d1e);
  }

  /* Dark gradient over image so text is always readable */
  .gp-hero-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(
      to top,
      rgba(10,10,10,0.98) 0%,
      rgba(10,10,10,0.75) 35%,
      rgba(10,10,10,0.35) 70%,
      rgba(10,10,10,0.15) 100%
    );
  }

  .gp-hero-inner {
    position: relative;
    z-index: 2;
    max-width: 1400px;
    margin: 0 auto;
    padding: 80px 40px 56px;
    width: 100%;
  }

  .gp-hero-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .gp-breadcrumb-link {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--text-faint); text-decoration: none;
    transition: color 0.2s;
  }

  .gp-breadcrumb-link:hover { color: var(--gold-light); }

  .gp-breadcrumb-sep {
    font-size: 10px; color: var(--text-faint); opacity: 0.4;
  }

  .gp-breadcrumb-current {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--genre-accent);
  }

  .gp-hero-emoji {
    font-size: 40px;
    display: block;
    margin-bottom: 16px;
    line-height: 1;
  }

  .gp-hero-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase;
    color: var(--genre-accent); display: block; margin-bottom: 14px;
    opacity: 0.85;
  }

  .gp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(56px, 8vw, 108px);
    font-weight: 300; line-height: 0.92;
    color: var(--text-main); margin-bottom: 24px;
  }

  .gp-hero-lore {
    font-family: 'Syne', sans-serif;
    font-size: 14px; color: var(--text-dim);
    max-width: 580px; line-height: 1.85;
    margin-bottom: 36px;
  }

  .gp-hero-stats {
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
  }

  .gp-hero-stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .gp-hero-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 300;
    color: var(--genre-accent); line-height: 1;
  }

  .gp-hero-stat-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--text-faint);
  }

  /* ── WRAP ── */
  .gp-wrap {
    position: relative; z-index: 1;
    max-width: 1400px; margin: 0 auto;
    padding: 64px 40px 96px;
  }

  /* ── SECTION ── */
  .gp-section { margin-bottom: 72px; }

  .gp-section-accent {
    display: flex; align-items: center; gap: 12px; margin-bottom: 6px;
  }

  .gp-section-bar {
    width: 4px; height: 22px; border-radius: 2px;
    background: var(--genre-accent); flex-shrink: 0;
  }

  .gp-section-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--genre-accent); display: block; margin-bottom: 5px;
    opacity: 0.75;
  }

  .gp-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 40px; font-weight: 300;
    color: var(--text-main); line-height: 1;
  }

  .gp-divider {
    height: 1px;
    background: linear-gradient(to right, var(--genre-accent-dim), transparent);
    margin: 20px 0 28px;
  }

  /* ── STORY GRID ── */
  .gp-story-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .gp-story-card {
    position: relative;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 24px;
    cursor: pointer;
    transition: background 0.25s, border-color 0.25s, transform 0.2s;
    overflow: hidden;
  }

  .gp-story-card:hover {
    background: var(--ink-surface2);
    border-color: var(--genre-accent-dim);
    transform: translateY(-3px);
  }

  .gp-story-card::before {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, var(--genre-accent), transparent);
    transform: scaleX(0); transition: transform 0.35s ease;
    transform-origin: left;
  }

  .gp-story-card:hover::before { transform: scaleX(1); }

  .gp-story-inner { display: flex; gap: 20px; }

  .gp-story-cover {
    width: 64px; height: 92px;
    flex-shrink: 0; border-radius: 8px;
    border: 1px solid var(--ink-border-gold);
    overflow: hidden;
    background: linear-gradient(135deg, #1e1e26, #2a2a38);
  }

  .gp-story-cover img { width: 100%; height: 100%; object-fit: cover; }

  .gp-story-body { flex: 1; min-width: 0; }

  .gp-story-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px; margin-bottom: 6px;
  }

  .gp-story-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 400;
    color: var(--text-main); line-height: 1.2;
  }

  .gp-story-author {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: var(--text-dim); margin-bottom: 10px;
  }

  .gp-story-desc {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: var(--text-faint);
    line-height: 1.65; margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .gp-story-footer {
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px;
  }

  .gp-story-genres { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }

  .gp-genre-tag {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--blue-bright);
    border: 1px solid var(--blue-dim);
    background: var(--blue-dim);
    padding: 3px 9px; border-radius: 999px;
  }

  .gp-story-hint {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(232,228,218,0.18); margin-top: 10px;
  }

  /* ── BADGE ── */
  .gp-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 999px; flex-shrink: 0;
  }
  .gp-badge-exclusive { border: 1px solid var(--gold-dim); color: var(--gold-light); background: var(--gold-glow); }
  .gp-badge-early { border: 1px solid rgba(232,228,218,0.25); color: rgba(232,228,218,0.8); background: rgba(232,228,218,0.08); }
  .gp-badge-serial { border: 1px solid var(--blue-dim); color: var(--blue-bright); background: var(--blue-dim); }

  /* ── UNLOCK BUTTON ── */
  .gp-unlock-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 6px 14px; border-radius: 6px; cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--genre-accent-dim);
    color: var(--genre-accent);
    background: rgba(0,0,0,0.2);
  }

  .gp-unlock-btn:hover { opacity: 0.8; }
  .gp-unlock-btn:disabled,
  .gp-unlock-btn.unlocked {
    border-color: var(--ink-border);
    color: var(--text-faint);
    cursor: default; background: transparent;
  }

  /* ── AUTHOR CARDS ── */
  .gp-authors-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .gp-author-card {
    display: block; text-decoration: none;
    position: relative;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px; padding: 28px 24px;
    overflow: hidden;
    transition: background 0.25s, border-color 0.25s, transform 0.2s;
  }

  .gp-author-card::before {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, var(--genre-accent), transparent);
    transform: scaleX(0); transition: transform 0.35s ease;
    transform-origin: left;
  }

  .gp-author-card:hover {
    background: var(--ink-surface2);
    border-color: var(--genre-accent-dim);
    transform: translateY(-3px);
  }

  .gp-author-card:hover::before { transform: scaleX(1); }

  .gp-author-avatar {
    width: 54px; height: 54px; border-radius: 10px;
    background: linear-gradient(135deg, #1e1e26, #2a2a38);
    border: 1px solid var(--genre-accent-dim);
    overflow: hidden; margin-bottom: 18px;
  }

  .gp-author-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .gp-author-avatar-initial {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300;
    color: var(--genre-accent);
  }

  .gp-author-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 400;
    color: var(--text-main); line-height: 1.15; margin-bottom: 5px;
  }

  .gp-author-tagline {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: var(--text-dim);
    line-height: 1.55; margin-bottom: 16px;
  }

  .gp-author-genres { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }

  .gp-author-tips {
    display: flex; gap: 6px; align-items: center;
    margin-bottom: 16px; flex-wrap: wrap;
  }

  .gp-tip-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-dim);
    border: 1px solid var(--ink-border);
    background: transparent;
    padding: 5px 10px; border-radius: 6px;
    cursor: pointer; transition: all 0.2s;
  }

  .gp-tip-btn:hover {
    color: var(--genre-accent);
    border-color: var(--genre-accent-dim);
    background: rgba(0,0,0,0.2);
  }

  .gp-jar-count {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: var(--text-faint); margin-left: auto;
  }

  .gp-author-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--ink-border);
  }

  .gp-author-profile-link {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-faint);
  }

  .gp-author-arrow {
    font-size: 14px; color: transparent;
    transition: color 0.25s, transform 0.25s;
  }

  .gp-author-card:hover .gp-author-arrow {
    color: var(--genre-accent);
    transform: translate(2px, -2px);
  }

  /* ── MODAL ── */
  .gp-modal-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }

  .gp-modal-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(10px);
    cursor: pointer; border: none;
    width: 100%; height: 100%;
  }

  .gp-modal {
    position: relative; z-index: 10;
    width: 100%; max-width: 720px;
    background: var(--ink-surface);
    border: 1px solid var(--genre-accent-dim);
    border-radius: 16px; overflow: hidden;
    max-height: 90vh;
    display: flex; flex-direction: column;
  }

  .gp-modal-top-accent {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--genre-accent), transparent);
  }

  .gp-modal-header {
    padding: 28px 32px;
    border-bottom: 1px solid var(--ink-border);
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
  }

  .gp-modal-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--genre-accent); margin-bottom: 8px; opacity: 0.75;
  }

  .gp-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: var(--text-main); margin-bottom: 4px;
  }

  .gp-modal-author {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: var(--text-dim);
  }

  .gp-modal-close {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-dim);
    border: 1px solid var(--ink-border);
    background: var(--ink-surface2);
    padding: 8px 16px; border-radius: 8px;
    cursor: pointer; flex-shrink: 0; transition: all 0.2s;
  }

  .gp-modal-close:hover { color: var(--text-main); border-color: var(--ink-border-gold); }

  .gp-modal-body { flex: 1; overflow-y: auto; padding: 28px 32px; }

  .gp-modal-footer {
    padding: 20px 32px;
    border-top: 1px solid var(--ink-border);
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }

  .gp-modal-hint {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: var(--text-faint); letter-spacing: 0.08em;
  }

  .gp-locked-panel {
    border: 1px solid var(--ink-border);
    padding: 24px; border-radius: 12px;
    background: var(--ink-surface2);
  }

  .gp-teaser-box {
    border: 1px solid var(--blue-dim);
    background: var(--blue-dim);
    padding: 20px; margin: 16px 0; border-radius: 10px;
  }

  .gp-teaser-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--blue-bright); margin-bottom: 10px;
  }

  .gp-teaser-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.75); line-height: 1.75;
  }

  .gp-unlock-row {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px; margin-top: 20px;
  }

  .gp-unlock-info {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: var(--text-dim);
  }

  .gp-full-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 300;
    line-height: 1.9;
    color: rgba(232,228,218,0.85);
    white-space: pre-wrap;
  }

  /* ── EMPTY STATE ── */
  .gp-empty {
    padding: 64px 32px; text-align: center;
    border: 1px solid var(--ink-border);
    border-radius: 16px;
    background: var(--ink-surface);
  }

  .gp-empty-icon { font-size: 40px; margin-bottom: 16px; display: block; }

  .gp-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: var(--text-main); margin-bottom: 10px;
  }

  .gp-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 13px; color: var(--text-dim); line-height: 1.7;
  }

  /* ── BUTTONS ── */
  .gp-btn-primary {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #000;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    border: none; padding: 13px 28px; border-radius: 8px;
    text-decoration: none; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    font-weight: 700; transition: opacity 0.2s;
  }

  .gp-btn-primary:hover { opacity: 0.88; }

  .gp-btn-ghost {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(232,228,218,0.6);
    background: transparent;
    border: 1px solid rgba(232,228,218,0.15);
    padding: 13px 28px; border-radius: 8px;
    text-decoration: none; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    transition: all 0.2s;
  }

  .gp-btn-ghost:hover {
    color: var(--gold-light);
    border-color: var(--gold-dim);
    background: var(--gold-glow);
  }

  /* ── FOOTER ── */
  .gp-footer {
    margin-top: 72px; padding: 40px 0 24px;
    border-top: 1px solid var(--genre-accent-dim);
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }

  .gp-footer-brand { display: flex; align-items: center; gap: 12px; }

  .gp-footer-logo {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 700; color: #000;
  }

  .gp-footer-brand-main {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 400; color: var(--gold-light);
  }

  .gp-footer-brand-sub {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: var(--text-faint);
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  .gp-footer-copy {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.12em;
    color: var(--text-faint); text-transform: uppercase;
  }

  .gp-footer-actions { display: flex; gap: 10px; }

  /* ── STATUS ── */
  .gp-status {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: var(--text-dim);
    padding: 20px;
    border: 1px solid var(--ink-border);
    border-radius: 10px; letter-spacing: 0.06em;
    background: var(--ink-surface);
    margin-bottom: 12px;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .gp-nav-inner { padding: 0 24px; }
    .gp-nav-links { display: none; }
    .gp-wrap { padding: 48px 24px 72px; }
    .gp-hero-inner { padding: 56px 24px 40px; }
    .gp-story-grid { grid-template-columns: 1fr; }
    .gp-authors-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px) {
    .gp-hero-title { font-size: 52px; }
    .gp-authors-grid { grid-template-columns: 1fr; }
  }
`;

// =========================
// Badge Component
// =========================
function GPBadge({ label }: { label: Story["badge"] }) {
  const cls =
    label === "Exclusive" ? "gp-badge gp-badge-exclusive" :
    label === "Early Access" ? "gp-badge gp-badge-early" :
    "gp-badge gp-badge-serial";
  return <span className={cls}>{label}</span>;
}

// =========================
// Author Avatar
// =========================
function GPAuthorAvatar({ author }: { author: Author }) {
  const [failed, setFailed] = useState(false);
  const initial = author.name.split(" ")[1]?.[0] ?? author.name[0];
  return (
    <div className="gp-author-avatar">
      {failed || !author.image
        ? <div className="gp-author-avatar-initial">{initial}</div>
        : <img src={author.image} alt={author.name} onError={() => setFailed(true)} />
      }
    </div>
  );
}

// =========================
// Story Cover
// =========================
function GPStoryCover({ story }: { story: Story }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="gp-story-cover">
      {!failed && story.cover && (
        <img src={story.cover} alt={story.title} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

// =========================
// Reader Modal
// =========================
function GPReaderModal({
  open, story, isUnlocked, inkCost, canUnlock, onClose, onUnlock,
}: {
  open: boolean; story: Story | null; isUnlocked: boolean;
  inkCost: number; canUnlock: boolean; onClose: () => void; onUnlock: () => void;
}) {
  if (!open || !story) return null;
  return (
    <div className="gp-modal-overlay" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} className="gp-modal-backdrop" aria-label="Close" />
      <div className="gp-modal">
        <div className="gp-modal-top-accent" />
        <div className="gp-modal-header">
          <div>
            <div className="gp-modal-eyebrow">The Tiniest Library — The Reading Room</div>
            <div className="gp-modal-title">{story.title}</div>
            <div className="gp-modal-author">by {story.author}</div>
            {story.genres?.length ? (
              <div className="gp-story-genres" style={{ marginTop: 10 }}>
                {story.genres.slice(0, 5).map(g => (
                  <span key={g} className="gp-genre-tag">{g}</span>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="gp-modal-close">Close ✕</button>
        </div>

        <div className="gp-modal-body">
          {!isUnlocked ? (
            <div className="gp-locked-panel">
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(232,228,218,0.35)", marginBottom: 12 }}>
                This story is locked
              </div>
              <div className="gp-teaser-box">
                <div className="gp-teaser-label">Teaser</div>
                <div className="gp-teaser-text">{story.teaser ?? story.description}</div>
              </div>
              <div className="gp-unlock-row">
                <span className="gp-unlock-info">
                  Unlock costs <strong style={{ color: "var(--genre-accent)" }}>{inkCost}</strong> Ink
                </span>
                <button
                  type="button" disabled={!canUnlock} onClick={onUnlock}
                  className="gp-unlock-btn"
                  style={!canUnlock ? { borderColor: "var(--ink-border)", color: "var(--text-faint)", cursor: "default", background: "transparent" } : {}}
                >
                  {canUnlock ? "Unlock & Read" : "Need more Ink"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--genre-accent)", opacity: 0.7, marginBottom: 16 }}>
                Full Text
              </div>
              <div className="gp-full-text">{story.content ?? "No content yet."}</div>
            </div>
          )}
        </div>

        <div className="gp-modal-footer">
          <span className="gp-modal-hint">Press ESC to close</span>
          <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer"
            className="gp-btn-ghost" style={{ fontSize: "9px", padding: "8px 18px", borderRadius: "8px" }}>
            Members Site →
          </a>
        </div>
      </div>
    </div>
  );
}

// =========================
// Main Genre Page Component
// Props-based — wrap in Next.js page component below
// =========================
function GenrePageContent({ genreSlug }: { genreSlug: string }) {
  // Resolve genre name from URL slug
  const genreName = useMemo(() => slugToGenre(genreSlug), [genreSlug]);
  const meta = GENRE_META[genreName] ?? {
    label: genreName,
    cover: "",
    emoji: "📖",
    accent: "#C9A84C",
    accentDim: "rgba(201,168,76,0.28)",
    lore: `Stories in the ${genreName} genre — discover something new.`,
  };

  // State
  const [ink, setInk] = useState<number>(DEFAULT_INK);
  const [unlocks, setUnlocksState] = useState<Unlocks>({});
  const [jar, setJarState] = useState<AuthorJar>({});
  const [stories, setStories] = useState<Story[]>(DEMO_STORIES);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [openStorySlug, setOpenStorySlug] = useState<string | null>(null);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [openingInk, setOpeningInk] = useState<number | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setInk(getInk());
    setUnlocksState(getUnlocks());
    setJarState(getJar());
  }, []);

  // Persist
  useEffect(() => setInkStore(ink), [ink]);
  useEffect(() => setUnlocksStore(unlocks), [unlocks]);
  useEffect(() => setJarStore(jar), [jar]);

  // ESC key
  useEffect(() => {
    if (!openStorySlug) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenStorySlug(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [openStorySlug]);

  // Load stories from Supabase
  useEffect(() => {
    async function load() {
      try {
        setStoriesLoading(true);
        const { data, error } = await supabase
          .from("stories")
          .select("id, slug, title, author_name, description, cover_url, badge, is_published, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (error) { setStoriesError(error.message); setStories(DEMO_STORIES); return; }
        if (data && data.length > 0) {
          setStories((data as SupabaseStoryRow[]).map(r => mapRow(r, Object.keys(GENRE_META))));
        } else {
          setStories(DEMO_STORIES);
        }
      } catch {
        setStoriesError("Could not reach Supabase.");
        setStories(DEMO_STORIES);
      } finally {
        setStoriesLoading(false);
      }
    }
    load();
  }, []);

  // Stripe ink credit on return
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
    setTimeout(() => alert(`✅ ${amount} Ink added!`), 200);
  }, []);

  // Filter stories & authors to this genre
  const genreStories = useMemo(
    () => stories.filter(s => (s.genres ?? []).includes(genreName)),
    [stories, genreName]
  );

  const genreAuthors = useMemo(
    () => DEMO_AUTHORS.filter(a => a.genres.includes(genreName)),
    [genreName]
  );

  const activeStory = useMemo(
    () => openStorySlug ? stories.find(s => s.slug === openStorySlug) ?? null : null,
    [openStorySlug, stories]
  );

  const activeUnlocked = useMemo(
    () => activeStory ? Boolean(unlocks[activeStory.slug]) : false,
    [activeStory, unlocks]
  );

  const activeCanUnlock = useMemo(() => ink >= DEFAULT_UNLOCK_COST, [ink]);

  const unlockStory = (slug: string, cost = DEFAULT_UNLOCK_COST) => {
    if (ink < cost) { alert(`You need ${cost} Ink to unlock this.`); return; }
    setInk(v => v - cost);
    setUnlocksState(u => ({ ...u, [slug]: true }));
  };

  const tipAuthor = (authorSlug: string, amount: number) => {
    if (ink < amount) { alert("Not enough Ink."); return; }
    setInk(v => v - amount);
    setJarState(j => ({ ...j, [authorSlug]: (j[authorSlug] ?? 0) + amount }));
    alert(`Tipped ${amount} Ink!`);
  };

  const buyInk = (amount: number) => {
    const url = STRIPE_LINKS[amount];
    if (!url) { alert("Checkout link not found."); return; }
    setIsOpeningCheckout(true);
    setOpeningInk(amount);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => { setIsOpeningCheckout(false); setOpeningInk(null); }, 2500);
  };

  return (
    <>
      <style>{GENRE_PAGE_STYLES}</style>
      <div
        className="gp-root"
        style={{
          "--genre-accent": meta.accent,
          "--genre-accent-dim": meta.accentDim,
        } as React.CSSProperties}
      >
        {/* ── NAV ── */}
        <nav className="gp-nav">
          <div className="gp-nav-accent-line" />
          <div className="gp-nav-inner">
            <div className="gp-nav-left">
              <a href="/reading-room" className="gp-nav-brand">
                <div className="gp-nav-logo">TTL</div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                  <span className="gp-nav-brand-main">The Tiniest Library</span>
                  <span className="gp-nav-brand-sub">The Reading Room</span>
                </div>
              </a>
              <div className="gp-nav-links">
                <a href="/reading-room" className="gp-nav-link">Reading Room</a>
                <a href="/reading-room/authors" className="gp-nav-link">Authors</a>
                <a href="/reading-room/stories" className="gp-nav-link">All Stories</a>
                <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="gp-nav-link">Members Site</a>
              </div>
            </div>
            <div className="gp-nav-right">
              <div className="gp-nav-ink">
                <span>✒️</span>
                <span>{ink} Ink</span>
              </div>
              <div className="gp-nav-divider" />
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="gp-nav-members">
                Members →
              </a>
            </div>
          </div>
        </nav>
        <div className="gp-nav-spacer" />

        {/* ── MODAL ── */}
        <GPReaderModal
          open={Boolean(openStorySlug)} story={activeStory}
          isUnlocked={activeUnlocked} inkCost={DEFAULT_UNLOCK_COST}
          canUnlock={activeCanUnlock}
          onClose={() => setOpenStorySlug(null)}
          onUnlock={() => { if (activeStory) unlockStory(activeStory.slug); }}
        />

        {/* ── HERO ── */}
        <div className="gp-hero">
          <div className="gp-hero-bg">
            {meta.cover
              ? <img src={meta.cover} alt={meta.label} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              : <div className="gp-hero-bg-fallback" />
            }
          </div>
          <div className="gp-hero-overlay" />
          <div className="gp-hero-inner">
            {/* Breadcrumb */}
            <div className="gp-hero-breadcrumb">
              <a href="/reading-room" className="gp-breadcrumb-link">Reading Room</a>
              <span className="gp-breadcrumb-sep">›</span>
              <a href="/reading-room/stories" className="gp-breadcrumb-link">Browse Stories</a>
              <span className="gp-breadcrumb-sep">›</span>
              <span className="gp-breadcrumb-current">{meta.label}</span>
            </div>

            <span className="gp-hero-emoji">{meta.emoji}</span>
            <span className="gp-hero-eyebrow">The Tiniest Library — Genre</span>
            <h1 className="gp-hero-title">{meta.label}</h1>
            <p className="gp-hero-lore">{meta.lore}</p>

            <div className="gp-hero-stats">
              <div className="gp-hero-stat">
                <span className="gp-hero-stat-num">{genreStories.length}</span>
                <span className="gp-hero-stat-label">Stories</span>
              </div>
              <div className="gp-hero-stat">
                <span className="gp-hero-stat-num">{genreAuthors.length}</span>
                <span className="gp-hero-stat-label">Authors</span>
              </div>
              <div className="gp-hero-stat">
                <span className="gp-hero-stat-num">{ink}</span>
                <span className="gp-hero-stat-label">Your Ink</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="gp-wrap">

          {/* ── STORIES ── */}
          <div className="gp-section">
            <div className="gp-section-accent">
              <div className="gp-section-bar" />
              <div>
                <span className="gp-section-eyebrow">Read</span>
                <h2 className="gp-section-title">{meta.label} Stories</h2>
              </div>
            </div>
            <div className="gp-divider" />

            {storiesLoading && <div className="gp-status">Loading stories…</div>}
            {storiesError && <div className="gp-status" style={{ borderColor: "var(--genre-accent-dim)", color: "var(--genre-accent)" }}>Using fallback stories. ({storiesError})</div>}

            {genreStories.length > 0 ? (
              <div className="gp-story-grid">
                {genreStories.map(story => {
                  const isUnlocked = Boolean(unlocks[story.slug]);
                  const canUnlock = ink >= DEFAULT_UNLOCK_COST;
                  return (
                    <div
                      key={story.slug}
                      role="button" tabIndex={0}
                      onClick={() => setOpenStorySlug(story.slug)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setOpenStorySlug(story.slug); }}
                      className="gp-story-card"
                    >
                      <div className="gp-story-inner">
                        <GPStoryCover story={story} />
                        <div className="gp-story-body">
                          <div className="gp-story-header">
                            <div className="gp-story-title">{story.title}</div>
                            <GPBadge label={story.badge} />
                          </div>
                          <div className="gp-story-author">by {story.author}</div>
                          <div className="gp-story-desc">{story.description}</div>
                          <div className="gp-story-footer">
                            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, color: "var(--text-faint)" }}>
                              {isUnlocked ? "✓ Unlocked" : `${DEFAULT_UNLOCK_COST} Ink to unlock`}
                            </span>
                            <button
                              type="button"
                              disabled={isUnlocked || !canUnlock}
                              className={`gp-unlock-btn${isUnlocked ? " unlocked" : ""}`}
                              onClick={e => { e.stopPropagation(); unlockStory(story.slug); }}
                            >
                              {isUnlocked ? "Unlocked" : canUnlock ? "Unlock" : "Need Ink"}
                            </button>
                          </div>
                          {story.genres?.length ? (
                            <div className="gp-story-genres">
                              {story.genres.slice(0, 3).map(g => (
                                <span key={g} className="gp-genre-tag">{g}</span>
                              ))}
                            </div>
                          ) : null}
                          <div className="gp-story-hint">Click to open reader →</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !storiesLoading && (
              <div className="gp-empty">
                <span className="gp-empty-icon">{meta.emoji}</span>
                <div className="gp-empty-title">No {meta.label} stories yet.</div>
                <p className="gp-empty-text">
                  Be the first to write in this genre. Apply to join The Writer's Room and claim your founding spot.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                  <a href="https://www.the-tiniest-library.com/new-page-1" target="_blank" rel="noopener noreferrer" className="gp-btn-primary">
                    Apply to Write →
                  </a>
                  <a href="/reading-room/stories" className="gp-btn-ghost">Browse All Stories</a>
                </div>
              </div>
            )}
          </div>

          {/* ── AUTHORS ── */}
          <div className="gp-section">
            <div className="gp-section-accent">
              <div className="gp-section-bar" />
              <div>
                <span className="gp-section-eyebrow">Discover</span>
                <h2 className="gp-section-title">{meta.label} Authors</h2>
              </div>
            </div>
            <div className="gp-divider" />

            {genreAuthors.length > 0 ? (
              <div className="gp-authors-grid">
                {genreAuthors.map(author => (
                  <a key={author.slug} href={`/reading-room/authors/${author.slug}`} className="gp-author-card">
                    <GPAuthorAvatar author={author} />
                    <div className="gp-author-name">{author.name}</div>
                    <div className="gp-author-tagline">{author.tagline}</div>
                    <div className="gp-author-genres">
                      {author.genres.map(g => (
                        <span key={g} className="gp-genre-tag">{g}</span>
                      ))}
                    </div>
                    <div className="gp-author-tips" onClick={e => e.preventDefault()}>
                      <button type="button" onClick={e => { e.preventDefault(); tipAuthor(author.slug, 10); }} className="gp-tip-btn">Tip 10</button>
                      <button type="button" onClick={e => { e.preventDefault(); tipAuthor(author.slug, 25); }} className="gp-tip-btn">Tip 25</button>
                      <span className="gp-jar-count">Jar: <strong style={{ color: "var(--text-dim)" }}>{jar[author.slug] ?? 0}</strong></span>
                    </div>
                    <div className="gp-author-footer">
                      <span className="gp-author-profile-link">🪶 Writer profile</span>
                      <span className="gp-author-arrow">↗</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="gp-empty">
                <span className="gp-empty-icon">🪶</span>
                <div className="gp-empty-title">No {meta.label} authors yet.</div>
                <p className="gp-empty-text">The founding writer spots for this genre are still open. Apply to claim yours.</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                  <a href="https://www.the-tiniest-library.com/new-page-1" target="_blank" rel="noopener noreferrer" className="gp-btn-primary">
                    Apply to Write →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── BROWSE OTHER GENRES ── */}
          <div className="gp-section">
            <div className="gp-section-accent">
              <div className="gp-section-bar" />
              <div>
                <span className="gp-section-eyebrow">Explore</span>
                <h2 className="gp-section-title">Other Genres</h2>
              </div>
            </div>
            <div className="gp-divider" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(GENRE_META)
                .filter(([key]) => key !== genreName)
                .map(([key, m]) => (
                  <a
                    key={key}
                    href={`/reading-room/genres/${encodeURIComponent(key.toLowerCase().replace(/\s+/g, "-").replace(/[+]/g, "").replace(/&/g, "and"))}`}
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
                      color: "var(--text-dim)", textDecoration: "none",
                      padding: "7px 16px", borderRadius: 999,
                      border: "1px solid var(--ink-border)",
                      background: "transparent",
                      transition: "all 0.2s",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.color = m.accent;
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = m.accentDim;
                      (e.currentTarget as HTMLAnchorElement).style.background = `${m.accentDim}`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-dim)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--ink-border)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </a>
                ))
              }
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="gp-footer">
            <div className="gp-footer-brand">
              <div className="gp-footer-logo">TTL</div>
              <div>
                <div className="gp-footer-brand-main">The Tiniest Library</div>
                <div className="gp-footer-brand-sub">The Reading Room</div>
              </div>
            </div>
            <span className="gp-footer-copy">© {new Date().getFullYear()} The Tiniest Library. All rights reserved.</span>
            <div className="gp-footer-actions">
              <a href="/reading-room/stories" className="gp-btn-ghost" style={{ fontSize: "9px", padding: "8px 18px", borderRadius: 8 }}>
                ← All Stories
              </a>
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="gp-btn-primary" style={{ fontSize: "9px", padding: "8px 18px", borderRadius: 8 }}>
                Members Site →
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// =========================
// Next.js Page Export
// File goes at: app/reading-room/genres/[genre]/page.tsx
// =========================
export default async function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre } = await params;
  return <GenrePageContent genreSlug={genre} />;
}
