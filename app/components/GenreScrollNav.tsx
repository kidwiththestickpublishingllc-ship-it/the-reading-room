"use client";

/**
 * GenreScrollNav.tsx
 * ─────────────────────────────────────────────────────────────────
 * Sticky section navigation for genre landing pages.
 * Adds: section pill nav, scroll progress bar, IntersectionObserver
 * fade-ins, and a back-to-top button.
 *
 * HOW TO USE:
 * 1. Drop this component into GenreLandingPage.tsx just before {children}
 * 2. Add id attributes to your three main sections in [genre]/page.tsx:
 *    - id="genre-stories"  on the Stories gp-section div
 *    - id="genre-authors"  on the Authors gp-section div
 *    - id="genre-lounge"   on the glp-lounge-section div (already in GenreLandingPage)
 *
 * Place at: app/components/GenreScrollNav.tsx
 *
 * FIND AND REPLACE to add IDs in [genre]/page.tsx:
 *
 * Stories section — find:
 *   <div className="gp-section">
 *     <div className="gp-section-accent">
 *       <div className="gp-section-bar" />
 *       <div>
 *         <span className="gp-section-eyebrow">Read</span>
 * Replace with:
 *   <div className="gp-section" id="genre-stories">
 *     <div className="gp-section-accent">
 *       <div className="gp-section-bar" />
 *       <div>
 *         <span className="gp-section-eyebrow">Read</span>
 *
 * Authors section — find:
 *   <div className="gp-section">
 *     <div className="gp-section-accent">
 *       <div className="gp-section-bar" />
 *       <div>
 *         <span className="gp-section-eyebrow">Discover</span>
 * Replace with:
 *   <div className="gp-section" id="genre-authors">
 *     <div className="gp-section-accent">
 *       <div className="gp-section-bar" />
 *       <div>
 *         <span className="gp-section-eyebrow">Discover</span>
 *
 * Lounge section ID is added automatically by this component.
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";

interface GenreScrollNavProps {
  genre: string;
  genreAccent: string;
  genreAccentDim: string;
}

const SECTIONS = [
  { id: "genre-stories",  label: "Stories",  emoji: "📖" },
  { id: "genre-authors",  label: "Authors",  emoji: "🪶" },
  { id: "genre-lounge",   label: "Lounge",   emoji: "🪑" },
];

const SCROLL_NAV_STYLES = `
  /* ── Progress Bar ── */
  .gsn-progress {
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    z-index: 300;
    transition: width 0.1s linear;
    pointer-events: none;
  }

  /* ── Sticky Nav ── */
  .gsn-nav {
    position: sticky;
    top: 74px;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 24px;
    background: rgba(10, 8, 5, 0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .gsn-nav::-webkit-scrollbar { display: none; }

  .gsn-pill {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: rgba(232,228,218,0.4);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .gsn-pill:hover {
    color: rgba(232,228,218,0.8);
    border-color: rgba(255,255,255,0.2);
  }

  .gsn-pill.active {
    color: var(--gsn-accent);
    border-color: var(--gsn-accent-dim);
    background: var(--gsn-accent-dim);
  }

  .gsn-pill-emoji {
    font-size: 11px;
    line-height: 1;
  }

  .gsn-sep {
    width: 1px;
    height: 14px;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  /* ── Back to Top ── */
  .gsn-top-btn {
    position: fixed;
    bottom: 100px;
    right: 28px;
    z-index: 90;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(10,8,5,0.9);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(232,228,218,0.5);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
  }

  .gsn-top-btn:hover {
    border-color: var(--gsn-accent-dim);
    color: var(--gsn-accent);
    transform: translateY(-2px);
  }

  .gsn-top-btn.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(8px);
  }

  /* ── Section fade-in ── */
  .gsn-fade {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .gsn-fade.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

export default function GenreScrollNav({
  genre, genreAccent, genreAccentDim
}: GenreScrollNavProps) {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [showTop, setShowTop] = useState(false);

  // ── Scroll progress + back-to-top visibility ────────────────
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const docHeight = doc.scrollHeight - doc.clientHeight;
      setScrollPct(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowTop(scrollTop > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Active section via IntersectionObserver ─────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );

      io.observe(el);
      observers.push(io);
    });

    return () => observers.forEach(io => io.disconnect());
  }, []);

  // ── Section fade-in via IntersectionObserver ────────────────
  useEffect(() => {
    const fadeEls = document.querySelectorAll(".gsn-fade");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fadeEls.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Smooth scroll to section ────────────────────────────────
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 130; // nav height + sticky nav height
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <style>{SCROLL_NAV_STYLES}</style>

      {/* CSS vars scoped to this component */}
      <div style={{
        "--gsn-accent": genreAccent,
        "--gsn-accent-dim": genreAccentDim,
      } as React.CSSProperties}>

        {/* ── Scroll progress bar ── */}
        <div
          className="gsn-progress"
          style={{
            width: `${scrollPct}%`,
            background: `linear-gradient(90deg, ${genreAccent}, ${genreAccentDim})`,
          }}
        />

        {/* ── Sticky pill nav ── */}
        <nav className="gsn-nav" aria-label="Genre sections">
          {SECTIONS.map((s, i) => (
            <>
              {i > 0 && <div key={`sep-${i}`} className="gsn-sep" />}
              <button
                key={s.id}
                type="button"
                className={`gsn-pill${activeSection === s.id ? " active" : ""}`}
                onClick={() => scrollTo(s.id)}
                aria-label={`Jump to ${s.label}`}
              >
                <span className="gsn-pill-emoji">{s.emoji}</span>
                {s.label}
              </button>
            </>
          ))}
        </nav>

        {/* ── Back to top ── */}
        <button
          type="button"
          className={`gsn-top-btn${showTop ? "" : " hidden"}`}
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      </div>
    </>
  );
}

/**
 * GSNFade — wrap any section in this to get the fade-in-on-scroll effect
 * Usage: <GSNFade><div className="gp-section" id="genre-stories">...</div></GSNFade>
 */
export function GSNFade({ children }: { children: React.ReactNode }) {
  return <div className="gsn-fade">{children}</div>;
}
