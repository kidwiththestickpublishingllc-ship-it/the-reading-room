"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// Route: /reading-room/authors/[slug]/page.tsx
// Individual author profile — Supabase + mock fallback
// =========================

const SQUARESPACE_READING_ROOM = "/members";
const DEFAULT_INK = 250;

type Story = {
  slug: string;
  title: string;
  badge: "Serial" | "Exclusive" | "Early Access";
  description: string;
  teaser: string;
  genres: string[];
};

type AuthorData = {
  slug: string;
  name: string;
  initial: string;
  role: string;
  genres: string[];
  tagline: string;
  bio: string;
  achievements: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  photo_url?: string;
  storiesCount: number;
  inkJar: number;
  stories: Story[];
  accentColor: string;
  accentDim: string;
  is_founding_author?: boolean;
};

// Accent colors by genre — first genre wins
const GENRE_ACCENTS: Record<string, [string, string]> = {
  "Fantasy":              ["#a78bfa", "rgba(167,139,250,0.22)"],
  "Sci-Fi":               ["#60a5fa", "rgba(96,165,250,0.22)"],
  "Horror Mystery":       ["#f87171", "rgba(248,113,113,0.22)"],
  "Crime & Thrillers":    ["#fbbf24", "rgba(251,191,36,0.22)"],
  "Romance":              ["#fb7185", "rgba(251,113,133,0.22)"],
  "Young Adult":          ["#34d399", "rgba(52,211,153,0.22)"],
  "Dark Academia":        ["#a8a29e", "rgba(168,162,158,0.22)"],
  "Cozy":                 ["#d97706", "rgba(217,119,6,0.22)"],
  "Serialized Fiction":   ["#84b0f5", "rgba(132,176,245,0.22)"],
  "Contemporary Fiction": ["#6495ED", "rgba(100,149,237,0.22)"],
  "Historical Fiction":   ["#C9A84C", "rgba(201,168,76,0.22)"],
  "Adventure":            ["#22d3ee", "rgba(34,211,238,0.22)"],
};

function getAccent(genres: string[]): [string, string] {
  for (const g of genres) {
    if (GENRE_ACCENTS[g]) return GENRE_ACCENTS[g];
  }
  return ["#C9A84C", "rgba(201,168,76,0.22)"];
}

// =========================
// Mock fallback authors
// =========================
const MOCK_AUTHORS: Record<string, AuthorData> = {
  "a-rivera": {
    slug: "a-rivera", name: "A. Rivera", initial: "R", role: "Founding Author",
    genres: ["Crime & Thrillers", "Cozy"], tagline: "Slow-burn mystery with heart.",
    bio: "A. Rivera writes cozy mysteries with teeth — stories set in quiet towns where nothing is ever quite what it seems. Known for morally complex detectives and endings that linger long after the last page.\n\nBased in the Northeast, Rivera draws heavily from small-town New England geography and the particular silence of places with long memories.",
    achievements: "Shortlisted for the TTL Founding Author Prize. Three serials completed with a combined 2,400+ reader unlocks. 'Lanterns Over Hartford' was TTL's most-tipped story of Q1 2026.",
    twitter: "https://twitter.com", storiesCount: 3, inkJar: 140, is_founding_author: true,
    accentColor: "#fbbf24", accentDim: "rgba(251,191,36,0.22)",
    stories: [
      { slug: "lanterns-over-hartford", title: "Lanterns Over Hartford", badge: "Serial", description: "A cozy mystery told in weekly chapters.", teaser: "Lanterns appeared overnight across the riverwalk — each one with a name nobody claimed.", genres: ["Cozy", "Crime & Thrillers"] },
      { slug: "the-last-ferry", title: "The Last Ferry", badge: "Exclusive", description: "A detective. A missing passenger. A ferry that runs on a route no map acknowledges.", teaser: "The ferry manifest listed twenty-two passengers. Twenty-one made it to shore.", genres: ["Crime & Thrillers"] },
    ],
  },
  "j-holloway": {
    slug: "j-holloway", name: "J. Holloway", initial: "H", role: "Founding Author",
    genres: ["Dark Academia", "Fantasy"], tagline: "Dark academia + modern folklore.",
    bio: "J. Holloway writes about secret societies, haunted libraries, and the particular madness of people who love learning too much. Their prose has been described as 'Donna Tartt with a folklore obsession.'\n\nHolloway's work sits at the intersection of the literary and the uncanny.",
    achievements: "Featured in TTL's inaugural author spotlight. 'The Quiet Stairwell' accumulated 180 reader unlocks in its first week.",
    instagram: "https://instagram.com", storiesCount: 2, inkJar: 210, is_founding_author: true,
    accentColor: "#a8a29e", accentDim: "rgba(168,162,158,0.22)",
    stories: [
      { slug: "the-quiet-stairwell", title: "The Quiet Stairwell", badge: "Exclusive", description: "A private campus, a hidden society, and a truth that changes everything.", teaser: "There was a stairwell no map acknowledged — yet every scholarship kid eventually heard about it.", genres: ["Dark Academia", "Fantasy"] },
    ],
  },
  "m-chen": {
    slug: "m-chen", name: "M. Chen", initial: "C", role: "Founding Author",
    genres: ["Sci-Fi", "Young Adult"], tagline: "Soft sci-fi, big emotions.",
    bio: "M. Chen writes science fiction that cares more about what people feel than what spaceships look like. Themes of distance, memory, and the gravity of small choices show up in everything they write.",
    achievements: "Four completed serials. 'Stars Don't Apologize' is TTL's highest-rated story by reader score.",
    website: "https://example.com", storiesCount: 4, inkJar: 95, is_founding_author: true,
    accentColor: "#60a5fa", accentDim: "rgba(96,165,250,0.22)",
    stories: [
      { slug: "stars-dont-apologize", title: "Stars Don't Apologize", badge: "Serial", description: "A tender sci-fi serial about distance, hope, and the gravity of choices.", teaser: "The message arrived late — eight minutes late — like light that had to cross a hard truth.", genres: ["Sci-Fi", "Young Adult"] },
    ],
  },
  "s-gomez": {
    slug: "s-gomez", name: "S. Gomez", initial: "G", role: "Author",
    genres: ["Crime & Thrillers"], tagline: "Thrillers that don't let go.",
    bio: "S. Gomez writes tightly-plotted crime fiction with an emphasis on consequence. Their stories move fast and leave marks.",
    achievements: "Two stories published on TTL. 'The 3AM Edition' broke 100 unlocks in two weeks.",
    storiesCount: 2, inkJar: 60,
    accentColor: "#f87171", accentDim: "rgba(248,113,113,0.22)",
    stories: [
      { slug: "the-3am-edition", title: "The 3AM Edition", badge: "Serial", description: "A night-desk reporter gets a tip that will either make her career or end it.", teaser: "She printed it.", genres: ["Crime & Thrillers"] },
    ],
  },
  "d-cedeno": {
    slug: "d-cedeno", name: "Daniel Cedeno", initial: "D", role: "Founding Author",
    genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"], tagline: "Worlds that refuse to stay quiet.",
    bio: "Daniel Cedeno builds worlds that feel like they existed before the first page and will keep going after the last. Creator of the Fox Vs. The World universe.\n\nCedeno's work is rooted in the specificity of place and the universality of not knowing who you are yet.",
    achievements: "Founder of The Tiniest Library and The Reading Room. Fox Vs. The World is TTL's flagship serialized story.",
    website: "https://www.the-tiniest-library.com", twitter: "https://twitter.com", instagram: "https://instagram.com",
    storiesCount: 5, inkJar: 380, is_founding_author: true,
    accentColor: "#C9A84C", accentDim: "rgba(201,168,76,0.22)",
    stories: [
      { slug: "fox-vs-the-world", title: "Fox Vs. The World", badge: "Early Access", description: "A first look at a world that refuses to stay quiet.", teaser: "The sky above Hartford wasn't supposed to flicker like a broken screen… but tonight it did.", genres: ["Sci-Fi", "Young Adult", "Serialized Fiction"] },
    ],
  },
  "e-walsh": {
    slug: "e-walsh", name: "E. Walsh", initial: "W", role: "Author",
    genres: ["Romance", "Contemporary Fiction"], tagline: "Love stories that don't flinch.",
    bio: "E. Walsh writes romance that refuses to be comfortable. Their contemporary fiction is achingly honest about desire, grief, and the complicated arithmetic of two people deciding to stay.",
    achievements: "Debut serial launching Q2 2026. Most-anticipated new author by reader sign-ups.",
    instagram: "https://instagram.com", storiesCount: 1, inkJar: 45,
    accentColor: "#fb7185", accentDim: "rgba(251,113,133,0.22)",
    stories: [
      { slug: "what-we-call-staying", title: "What We Call Staying", badge: "Serial", description: "Two people. One apartment they can't afford to keep.", teaser: "We never talked about leaving. We just got very good at not talking about staying.", genres: ["Romance", "Contemporary Fiction"] },
    ],
  },
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --gold: #C9A84C; --gold-light: #E2C97E; --gold-dim: rgba(201,168,76,0.38);
    --gold-glow: rgba(201,168,76,0.13); --blue: #6495ED; --blue-dim: rgba(100,149,237,0.22);
    --blue-bright: #84b0f5; --ink-bg: #0a0a0a; --ink-surface: #111111;
    --ink-surface2: #181818; --ink-border: rgba(255,255,255,0.07);
    --ink-border-gold: rgba(201,168,76,0.26); --text-main: #f0ece2;
    --text-dim: rgba(232,228,218,0.45); --text-faint: rgba(232,228,218,0.25);
    --author-accent: #C9A84C; --author-accent-dim: rgba(201,168,76,0.22);
  }
  .ap-root { min-height: 100vh; background: var(--ink-bg); font-family: 'Syne', sans-serif; color: var(--text-main); overflow-x: hidden; }
  .ap-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 40; background: rgba(8,8,8,0.96); backdrop-filter: blur(20px); border-bottom: 1px solid var(--ink-border-gold); box-shadow: 0 2px 40px rgba(0,0,0,0.7); }
  .ap-nav-accent { height: 2px; background: linear-gradient(90deg, transparent, var(--author-accent), transparent); }
  .ap-nav-inner { max-width: 1400px; margin: 0 auto; padding: 0 40px; height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .ap-nav-left { display: flex; align-items: center; gap: 32px; }
  .ap-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .ap-nav-logo { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, var(--gold), #8a6510); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #000; }
  .ap-nav-brand-main { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 400; color: var(--gold-light); }
  .ap-nav-brand-sub { font-size: 10px; color: rgba(255,255,255,0.32); letter-spacing: 0.1em; text-transform: uppercase; }
  .ap-nav-links { display: flex; align-items: center; gap: 2px; }
  .ap-nav-link { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-dim); text-decoration: none; padding: 6px 14px; border-radius: 4px; border: 1px solid transparent; transition: all 0.2s; }
  .ap-nav-link:hover { color: var(--gold-light); border-color: var(--ink-border-gold); background: var(--gold-glow); }
  .ap-nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ap-nav-ink { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--gold-light); border: 1px solid var(--gold-dim); background: var(--gold-glow); padding: 6px 14px; border-radius: 999px; }
  .ap-nav-members { font-size: 11px; font-weight: 700; color: #fff; background: var(--blue); border: none; padding: 6px 18px; border-radius: 999px; text-decoration: none; transition: opacity 0.2s; }
  .ap-nav-members:hover { opacity: 0.88; }
  .ap-spacer { height: 72px; }
  .ap-loading { max-width: 600px; margin: 140px auto; text-align: center; padding: 0 40px; }
  .ap-loading-text { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: var(--text-dim); }
  .ap-hero { position: relative; border-bottom: 1px solid var(--ink-border); padding: 72px 40px 56px; }
  .ap-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--author-accent), transparent); }
  .ap-hero-inner { max-width: 1400px; margin: 0 auto; }
  .ap-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 40px; flex-wrap: wrap; }
  .ap-breadcrumb-link { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-faint); text-decoration: none; transition: color 0.2s; }
  .ap-breadcrumb-link:hover { color: var(--gold-light); }
  .ap-breadcrumb-sep { font-size: 10px; color: var(--text-faint); opacity: 0.4; }
  .ap-breadcrumb-current { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--author-accent); }
  .ap-hero-layout { display: flex; gap: 48px; align-items: flex-start; flex-wrap: wrap; }
  .ap-hero-left { flex-shrink: 0; }
  .ap-avatar-wrap { width: 120px; height: 120px; border-radius: 16px; background: linear-gradient(135deg, #1a1a24, #252535); border: 2px solid var(--author-accent); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 300; color: var(--author-accent); margin-bottom: 16px; box-shadow: 0 0 40px var(--author-accent-dim); overflow: hidden; }
  .ap-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .ap-role-badge { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--author-accent); border: 1px solid var(--author-accent-dim); padding: 4px 12px; border-radius: 999px; display: inline-block; background: var(--author-accent-dim); }
  .ap-hero-right { flex: 1; min-width: 280px; }
  .ap-hero-eyebrow { font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--author-accent); display: block; margin-bottom: 12px; opacity: 0.8; }
  .ap-hero-name { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 6vw, 88px); font-weight: 300; line-height: 0.92; color: var(--text-main); margin-bottom: 16px; }
  .ap-hero-tagline { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic; font-weight: 300; color: rgba(232,228,218,0.55); margin-bottom: 24px; line-height: 1.5; }
  .ap-hero-genres { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 28px; }
  .ap-genre-tag { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--blue-bright); border: 1px solid var(--blue-dim); background: var(--blue-dim); padding: 4px 12px; border-radius: 999px; }
  .ap-tip-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 16px 20px; border: 1px solid var(--ink-border); border-radius: 10px; background: var(--ink-surface); margin-bottom: 16px; }
  .ap-tip-label { font-size: 11px; color: var(--text-faint); letter-spacing: 0.08em; margin-right: 4px; }
  .ap-tip-btn { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); border: 1px solid var(--ink-border); background: transparent; padding: 7px 14px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
  .ap-tip-btn:hover { color: var(--author-accent); border-color: var(--author-accent-dim); background: var(--author-accent-dim); }
  .ap-tip-jar { margin-left: auto; font-size: 11px; color: var(--text-faint); }
  .ap-tip-jar strong { color: var(--author-accent); }
  .ap-tip-msg { font-size: 11px; color: var(--author-accent); padding: 8px 14px; border-radius: 6px; background: var(--author-accent-dim); border: 1px solid var(--author-accent-dim); margin-bottom: 16px; }
  .ap-socials { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .ap-social-link { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-dim); border: 1px solid var(--ink-border); padding: 6px 14px; border-radius: 6px; text-decoration: none; transition: all 0.2s; }
  .ap-social-link:hover { color: var(--author-accent); border-color: var(--author-accent-dim); background: var(--author-accent-dim); }
  .ap-hero-stats { display: flex; gap: 32px; flex-wrap: wrap; padding-top: 28px; margin-top: 28px; border-top: 1px solid var(--ink-border); }
  .ap-hero-stat { display: flex; flex-direction: column; gap: 3px; }
  .ap-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: var(--author-accent); line-height: 1; }
  .ap-stat-label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-faint); }
  .ap-main { max-width: 1400px; margin: 0 auto; padding: 64px 40px 96px; }
  .ap-grid { display: grid; grid-template-columns: 1fr 380px; gap: 40px; }
  .ap-section { margin-bottom: 56px; }
  .ap-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .ap-section-bar { width: 4px; height: 22px; border-radius: 2px; background: var(--author-accent); flex-shrink: 0; }
  .ap-section-eyebrow { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--author-accent); opacity: 0.75; display: block; margin-bottom: 4px; }
  .ap-section-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: var(--text-main); line-height: 1; }
  .ap-divider { height: 1px; background: linear-gradient(to right, var(--author-accent-dim), transparent); margin: 18px 0 24px; }
  .ap-bio { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; line-height: 1.9; color: rgba(232,228,218,0.78); white-space: pre-line; }
  .ap-achievements { font-family: 'Syne', sans-serif; font-size: 13px; line-height: 1.8; color: var(--text-dim); padding: 20px 24px; border: 1px solid var(--author-accent-dim); border-left: 3px solid var(--author-accent); border-radius: 0 8px 8px 0; background: var(--ink-surface); }
  .ap-story-list { display: flex; flex-direction: column; gap: 12px; }
  .ap-story-card { background: var(--ink-surface); border: 1px solid var(--ink-border); border-radius: 10px; padding: 20px 22px; transition: background 0.2s, border-color 0.2s, transform 0.2s; position: relative; overflow: hidden; }
  .ap-story-card:hover { background: var(--ink-surface2); border-color: var(--author-accent-dim); transform: translateX(4px); }
  .ap-story-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--author-accent); transform: scaleY(0); transition: transform 0.3s; transform-origin: bottom; }
  .ap-story-card:hover::before { transform: scaleY(1); }
  .ap-story-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .ap-story-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: var(--text-main); line-height: 1.2; }
  .ap-story-desc { font-size: 12px; color: var(--text-faint); line-height: 1.65; margin-bottom: 12px; }
  .ap-story-teaser { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-style: italic; color: rgba(232,228,218,0.45); line-height: 1.6; padding-top: 10px; border-top: 1px solid var(--ink-border); }
  .ap-story-genres { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  .ap-badge { font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; flex-shrink: 0; }
  .ap-badge-exclusive { border: 1px solid var(--gold-dim); color: var(--gold-light); background: var(--gold-glow); }
  .ap-badge-early { border: 1px solid rgba(232,228,218,0.25); color: rgba(232,228,218,0.8); background: rgba(232,228,218,0.08); }
  .ap-badge-serial { border: 1px solid var(--blue-dim); color: var(--blue-bright); background: var(--blue-dim); }
  .ap-sidebar { display: flex; flex-direction: column; gap: 20px; }
  .ap-sidebar-card { background: var(--ink-surface); border: 1px solid var(--ink-border); border-radius: 10px; padding: 22px; position: relative; overflow: hidden; }
  .ap-sidebar-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--author-accent), transparent); }
  .ap-sidebar-title { font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--author-accent); margin-bottom: 14px; opacity: 0.8; }
  .ap-sidebar-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--ink-border); }
  .ap-sidebar-row:last-child { border-bottom: none; padding-bottom: 0; }
  .ap-sidebar-label { font-size: 11px; color: var(--text-faint); }
  .ap-sidebar-val { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; color: var(--author-accent); }
  .ap-not-found { max-width: 600px; margin: 120px auto; text-align: center; padding: 0 40px; }
  .ap-not-found-title { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; color: var(--text-main); margin-bottom: 16px; }
  .ap-not-found-text { font-size: 14px; color: var(--text-dim); line-height: 1.7; margin-bottom: 32px; }
  .ap-footer { max-width: 1400px; margin: 0 auto; padding: 40px 40px 32px; border-top: 1px solid var(--author-accent-dim); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .ap-footer-brand { display: flex; align-items: center; gap: 12px; }
  .ap-footer-logo { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, var(--gold), #8a6510); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #000; }
  .ap-footer-brand-main { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; color: var(--gold-light); }
  .ap-footer-brand-sub { font-size: 10px; color: var(--text-faint); letter-spacing: 0.1em; text-transform: uppercase; }
  .ap-footer-copy { font-size: 10px; letter-spacing: 0.12em; color: var(--text-faint); text-transform: uppercase; }
  .ap-footer-actions { display: flex; gap: 10px; }
  .ap-btn-primary { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #000; background: linear-gradient(135deg, var(--gold), #8a6510); border: none; padding: 10px 22px; border-radius: 8px; text-decoration: none; cursor: pointer; font-weight: 700; transition: opacity 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .ap-btn-primary:hover { opacity: 0.88; }
  .ap-btn-ghost { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(232,228,218,0.6); background: transparent; border: 1px solid rgba(232,228,218,0.15); padding: 10px 22px; border-radius: 8px; text-decoration: none; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .ap-btn-ghost:hover { color: var(--gold-light); border-color: var(--gold-dim); background: var(--gold-glow); }
  @media (max-width: 1000px) { .ap-grid { grid-template-columns: 1fr; } }
  @media (max-width: 700px) { .ap-nav-links { display: none; } .ap-hero, .ap-main { padding-left: 24px; padding-right: 24px; } .ap-hero-layout { flex-direction: column; gap: 28px; } }
`;

function Badge({ label }: { label: Story["badge"] }) {
  const cls = label === "Exclusive" ? "ap-badge ap-badge-exclusive" : label === "Early Access" ? "ap-badge ap-badge-early" : "ap-badge ap-badge-serial";
  return <span className={cls}>{label}</span>;
}

function AuthorProfileContent({ slug }: { slug: string }) {
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [jar, setJar] = useState(0);
  const [ink, setInk] = useState(DEFAULT_INK);
  const [tipMsg, setTipMsg] = useState("");

  useEffect(() => {
    setInk(Number(window.localStorage.getItem("ttl_ink") ?? DEFAULT_INK));
    const raw = window.localStorage.getItem("ttl_author_jar");
    const parsed = raw ? JSON.parse(raw) : {};
    setJar(parsed[slug] ?? 0);
  }, [slug]);

  useEffect(() => {
    async function load() {
      try {
        // Try Supabase first
        const { data: writerData, error } = await supabase
          .from("writers")
          .select("*")
          .eq("slug", slug)
          .eq("is_approved", true)
          .single();

        if (error || !writerData) {
          console.log("Supabase error:", error, "writerData:", writerData);
          // Fall back to mock
          // Fall back to mock
          const mock = MOCK_AUTHORS[slug];
          if (mock) {
            setAuthor({ ...mock, inkJar: jar });
          } else {
            setNotFound(true);
          }
          setLoading(false);
          return;
        }

        // Fetch their stories
        const { data: storiesData } = await supabase
          .from("stories")
          .select("slug, title, badge, description, is_published")
          .eq("author_id", writerData.id)
          .eq("is_published", true);

        const [accentColor, accentDim] = getAccent(writerData.genres ?? []);
        const initial = writerData.name.split(" ").pop()?.[0]?.toUpperCase() ?? writerData.name[0];

        const mapped: AuthorData = {
          slug: writerData.slug ?? slug,
          name: writerData.name,
          initial,
          role: writerData.is_founding_author ? "Founding Author" : "Author",
          genres: writerData.genres ?? [],
          tagline: writerData.tagline ?? "A writer at The Tiniest Library.",
          bio: writerData.bio ?? "",
          achievements: writerData.greeting ?? "",
          website: writerData.website_url,
          twitter: writerData.twitter_url,
          instagram: writerData.instagram_url,
          photo_url: writerData.photo_url,
          storiesCount: storiesData?.length ?? 0,
          inkJar: jar,
          is_founding_author: writerData.is_founding_author,
          accentColor,
          accentDim,
          stories: (storiesData ?? []).map((s: any) => ({
            slug: s.slug,
            title: s.title,
            badge: (s.badge as Story["badge"]) ?? "Serial",
            description: s.description ?? "",
            teaser: s.description ?? "",
            genres: [],
          })),
        };

        setAuthor(mapped);
        setJar(prev => prev || 0);
      } catch {
        const mock = MOCK_AUTHORS[slug];
        if (mock) setAuthor({ ...mock, inkJar: jar });
        else setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const tipAuthor = (amount: number) => {
    if (ink < amount) { setTipMsg("Not enough Ink."); setTimeout(() => setTipMsg(""), 2000); return; }
    const newInk = ink - amount;
    const newJar = jar + amount;
    setInk(newInk);
    setJar(newJar);
    window.localStorage.setItem("ttl_ink", String(newInk));
    const raw = window.localStorage.getItem("ttl_author_jar");
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[slug] = newJar;
    window.localStorage.setItem("ttl_author_jar", JSON.stringify(parsed));
    setTipMsg(`✓ Tipped ${amount} Ink to ${author?.name}!`);
    setTimeout(() => setTipMsg(""), 3000);
  };

  const accentColor = author?.accentColor ?? "#C9A84C";
  const accentDim = author?.accentDim ?? "rgba(201,168,76,0.22)";

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="ap-root">
        <div className="ap-loading"><p className="ap-loading-text">Loading profile…</p></div>
      </div>
    </>
  );

  if (notFound || !author) return (
    <>
      <style>{STYLES}</style>
      <div className="ap-root">
        <div className="ap-not-found">
          <div className="ap-not-found-title">Author not found.</div>
          <p className="ap-not-found-text">This profile doesn't exist yet or the link may be incorrect.</p>
          <a href="/reading-room/authors" className="ap-btn-ghost">← Back to Authors</a>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ap-root" style={{ "--author-accent": accentColor, "--author-accent-dim": accentDim } as React.CSSProperties}>
        <nav className="ap-nav">
          <div className="ap-nav-accent" />
          <div className="ap-nav-inner">
            <div className="ap-nav-left">
              <a href="/reading-room" className="ap-nav-brand">
                <div className="ap-nav-logo">TTL</div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                  <span className="ap-nav-brand-main">The Tiniest Library</span>
                  <span className="ap-nav-brand-sub">The Reading Room</span>
                </div>
              </a>
              <div className="ap-nav-links">
                <a href="/reading-room" className="ap-nav-link">Reading Room</a>
                <a href="/reading-room/authors" className="ap-nav-link">Authors</a>
                <a href="/reading-room/stories" className="ap-nav-link">All Stories</a>
                <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ap-nav-link">Members Site</a>
              </div>
            </div>
            <div className="ap-nav-right">
              <div className="ap-nav-ink"><span>✒️</span><span>{ink} Ink</span></div>
              <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ap-nav-members">Members →</a>
            </div>
          </div>
        </nav>
        <div className="ap-spacer" />

        <div className="ap-hero">
          <div className="ap-hero-inner">
            <div className="ap-breadcrumb">
              <a href="/reading-room" className="ap-breadcrumb-link">Reading Room</a>
              <span className="ap-breadcrumb-sep">›</span>
              <a href="/reading-room/authors" className="ap-breadcrumb-link">Authors</a>
              <span className="ap-breadcrumb-sep">›</span>
              <span className="ap-breadcrumb-current">{author.name}</span>
            </div>
            <div className="ap-hero-layout">
              <div className="ap-hero-left">
                <div className="ap-avatar-wrap">
                  {author.photo_url
                    ? <img src={author.photo_url} alt={author.name} />
                    : author.initial
                  }
                </div>
                <div className="ap-role-badge">{author.role}</div>
              </div>
              <div className="ap-hero-right">
                <span className="ap-hero-eyebrow">The Tiniest Library — Author</span>
                <h1 className="ap-hero-name">{author.name}</h1>
                <p className="ap-hero-tagline">"{author.tagline}"</p>
                <div className="ap-hero-genres">
                  {author.genres.map(g => <span key={g} className="ap-genre-tag">{g}</span>)}
                </div>
                <div className="ap-tip-row">
                  <span className="ap-tip-label">Tip this author</span>
                  {[10, 25, 50].map(amt => (
                    <button key={amt} type="button" className="ap-tip-btn" onClick={() => tipAuthor(amt)}>{amt} Ink</button>
                  ))}
                  <span className="ap-tip-jar">Jar: <strong>{jar}</strong> Ink</span>
                </div>
                {tipMsg && <div className="ap-tip-msg">{tipMsg}</div>}
                {(author.website || author.twitter || author.instagram) && (
                  <div className="ap-socials">
                    {author.website && <a href={author.website} target="_blank" rel="noopener noreferrer" className="ap-social-link">🌐 Website</a>}
                    {author.twitter && <a href={author.twitter} target="_blank" rel="noopener noreferrer" className="ap-social-link">𝕏 Twitter</a>}
                    {author.instagram && <a href={author.instagram} target="_blank" rel="noopener noreferrer" className="ap-social-link">📷 Instagram</a>}
                  </div>
                )}
                <div className="ap-hero-stats">
                  <div className="ap-hero-stat"><span className="ap-stat-num">{author.storiesCount}</span><span className="ap-stat-label">Stories</span></div>
                  <div className="ap-hero-stat"><span className="ap-stat-num">{jar}</span><span className="ap-stat-label">Ink Earned</span></div>
                  <div className="ap-hero-stat"><span className="ap-stat-num">{author.genres.length}</span><span className="ap-stat-label">Genres</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ap-main">
          <div className="ap-grid">
            <div>
              {author.bio && (
                <div className="ap-section">
                  <div className="ap-section-head"><div className="ap-section-bar" /><div><span className="ap-section-eyebrow">About</span><h2 className="ap-section-title">Author Bio</h2></div></div>
                  <div className="ap-divider" />
                  <p className="ap-bio">{author.bio}</p>
                </div>
              )}
              {author.achievements && (
                <div className="ap-section">
                  <div className="ap-section-head"><div className="ap-section-bar" /><div><span className="ap-section-eyebrow">Recognition</span><h2 className="ap-section-title">Achievements</h2></div></div>
                  <div className="ap-divider" />
                  <div className="ap-achievements">{author.achievements}</div>
                </div>
              )}
              {author.stories.length > 0 && (
                <div className="ap-section">
                  <div className="ap-section-head"><div className="ap-section-bar" /><div><span className="ap-section-eyebrow">Read</span><h2 className="ap-section-title">Stories by {author.name}</h2></div></div>
                  <div className="ap-divider" />
                  <div className="ap-story-list">
                    {author.stories.map(story => (
                      <div key={story.slug} className="ap-story-card">
                        <div className="ap-story-card-top">
                          <div className="ap-story-title">{story.title}</div>
                          <Badge label={story.badge} />
                        </div>
                        <p className="ap-story-desc">{story.description}</p>
                        {story.teaser && story.teaser !== story.description && (
                          <div className="ap-story-teaser">"{story.teaser}"</div>
                        )}
                        {story.genres.length > 0 && (
                          <div className="ap-story-genres">
                            {story.genres.map(g => <span key={g} className="ap-genre-tag">{g}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ap-sidebar">
              <div className="ap-sidebar-card">
                <div className="ap-sidebar-title">Author at a Glance</div>
                <div className="ap-sidebar-row"><span className="ap-sidebar-label">Stories published</span><span className="ap-sidebar-val">{author.storiesCount}</span></div>
                <div className="ap-sidebar-row"><span className="ap-sidebar-label">Ink jar total</span><span className="ap-sidebar-val">{jar}</span></div>
                <div className="ap-sidebar-row"><span className="ap-sidebar-label">Genres</span><span className="ap-sidebar-val">{author.genres.length}</span></div>
                <div className="ap-sidebar-row"><span className="ap-sidebar-label">Status</span><span className="ap-sidebar-val" style={{ fontSize: 13 }}>{author.role}</span></div>
              </div>
              <div className="ap-sidebar-card">
                <div className="ap-sidebar-title">Support this Author</div>
                <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.7, marginBottom: 14 }}>Ink tips go directly to the author. Every drop counts.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[10, 25, 50, 100].map(amt => (
                    <button key={amt} type="button" className="ap-tip-btn" style={{ textAlign: "left" }} onClick={() => tipAuthor(amt)}>Tip {amt} Ink</button>
                  ))}
                </div>
                {tipMsg && <div className="ap-tip-msg" style={{ marginTop: 10 }}>{tipMsg}</div>}
              </div>
              {author.genres.length > 0 && (
                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-title">Browse by Genre</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {author.genres.map(g => (
                      <a key={g} href={`/reading-room/genres/${encodeURIComponent(g.toLowerCase().replace(/\s+/g, "-").replace(/[+]/g, "").replace(/&/g, "and"))}`}
                        style={{ fontSize: 11, color: "var(--blue-bright)", textDecoration: "none", padding: "8px 12px", border: "1px solid var(--blue-dim)", borderRadius: 6, transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {g} <span style={{ opacity: 0.5 }}>→</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ap-footer">
          <div className="ap-footer-brand">
            <div className="ap-footer-logo">TTL</div>
            <div><div className="ap-footer-brand-main">The Tiniest Library</div><div className="ap-footer-brand-sub">The Reading Room</div></div>
          </div>
          <span className="ap-footer-copy">© {new Date().getFullYear()} The Tiniest Library</span>
          <div className="ap-footer-actions">
            <a href="/reading-room/authors" className="ap-btn-ghost">← All Authors</a>
            <a href={SQUARESPACE_READING_ROOM} target="_blank" rel="noopener noreferrer" className="ap-btn-primary">Members Site →</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AuthorProfile({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <AuthorProfileContent slug={slug} />;
}
