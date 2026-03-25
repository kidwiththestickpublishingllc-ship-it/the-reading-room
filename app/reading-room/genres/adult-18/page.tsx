"use client";

import { useEffect, useState } from "react";
import Adult18Gate from "../../components/Adult18Gate";
import ScarletChatWidget from "../../components/ScarletChatWidget";

// =========================
// Route: app/reading-room/genres/adult-18/page.tsx
// Adult 18+ dedicated genre page with custom styling
// Gold accents, red glow backdrop, cornflower blue tabs
// Age gated — requires verified TTL account
// =========================

// This page wraps the existing GenrePageContent with:
// 1. Adult18Gate for age verification
// 2. Custom CSS overrides for the adult aesthetic
// 3. Scarlet AI widget

const ADULT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');

  :root {
    --adult-red: #c84444;
    --adult-red-dim: rgba(200,68,68,0.2);
    --adult-red-glow: rgba(180,30,30,0.12);
    --adult-gold: #C9A84C;
    --adult-gold-light: #E2C97E;
    --adult-gold-dim: rgba(201,168,76,0.35);
    --adult-gold-glow: rgba(201,168,76,0.10);
    --adult-blue: #6495ED;
    --adult-blue-dim: rgba(100,149,237,0.22);
    --adult-blue-bright: #84b0f5;
    --adult-bg: #080305;
    --adult-surface: #0f0608;
    --adult-surface2: #180a0a;
    --adult-border: rgba(201,68,68,0.12);
    --adult-border-gold: rgba(201,168,76,0.28);
    --adult-text: #f0ece2;
    --adult-text-dim: rgba(240,232,222,0.5);
    --adult-text-faint: rgba(240,232,222,0.25);
  }

  /* Override root bg for adult section */
  .adult-root {
    min-height: 100vh;
    background: var(--adult-bg);
    background-image:
      radial-gradient(ellipse at 50% 0%, rgba(180,30,30,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 80%, rgba(180,30,30,0.08) 0%, transparent 50%);
    font-family: 'Syne', sans-serif;
    color: var(--adult-text);
    position: relative;
    overflow-x: hidden;
  }

  /* Red noise texture */
  .adult-root::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  /* NAV overrides */
  .adult-root .gp-nav {
    background: rgba(5,2,2,0.97) !important;
    border-bottom-color: rgba(201,68,68,0.25) !important;
  }
  .adult-root .gp-nav-accent-line {
    background: linear-gradient(90deg, transparent, var(--adult-red), #ff4444, var(--adult-red), transparent) !important;
  }
  .adult-root .gp-nav-ink {
    border-color: var(--adult-gold-dim) !important;
    background: var(--adult-gold-glow) !important;
  }

  /* Hero overrides */
  .adult-root .gp-hero {
    border-bottom-color: rgba(201,68,68,0.15) !important;
  }
  .adult-root .gp-hero-overlay {
    background: linear-gradient(
      to top,
      rgba(8,3,5,0.98) 0%,
      rgba(8,3,5,0.80) 35%,
      rgba(8,3,5,0.40) 70%,
      rgba(8,3,5,0.15) 100%
    ) !important;
  }

  /* Gold accent bars */
  .adult-root .gp-section-bar {
    background: var(--adult-gold) !important;
  }
  .adult-root .gp-section-eyebrow {
    color: var(--adult-gold) !important;
  }
  .adult-root .gp-divider {
    background: linear-gradient(to right, var(--adult-gold-dim), transparent) !important;
  }
  .adult-root .gp-hero-eyebrow {
    color: var(--adult-gold) !important;
  }
  .adult-root .gp-hero-stat-num {
    color: var(--adult-gold) !important;
  }
  .adult-root .gp-breadcrumb-current {
    color: var(--adult-gold) !important;
  }

  /* Story cards — red glow on hover */
  .adult-root .gp-story-card {
    background: var(--adult-surface) !important;
    border-color: rgba(201,68,68,0.1) !important;
  }
  .adult-root .gp-story-card:hover {
    background: var(--adult-surface2) !important;
    border-color: var(--adult-red-dim) !important;
    box-shadow: 0 8px 32px rgba(180,30,30,0.2) !important;
  }
  .adult-root .gp-story-card::before {
    background: linear-gradient(90deg, transparent, var(--adult-red), transparent) !important;
  }

  /* Author cards — red glow on hover */
  .adult-root .gp-author-card {
    background: var(--adult-surface) !important;
    border-color: rgba(201,68,68,0.1) !important;
  }
  .adult-root .gp-author-card:hover {
    background: var(--adult-surface2) !important;
    border-color: var(--adult-red-dim) !important;
    box-shadow: 0 8px 32px rgba(180,30,30,0.2) !important;
  }
  .adult-root .gp-author-card::before {
    background: linear-gradient(90deg, transparent, var(--adult-red), transparent) !important;
  }
  .adult-root .gp-author-card:hover .gp-author-arrow {
    color: var(--adult-gold) !important;
  }

  /* Genre tags — cornflower blue */
  .adult-root .gp-genre-tag {
    color: var(--adult-blue-bright) !important;
    border-color: var(--adult-blue-dim) !important;
    background: var(--adult-blue-dim) !important;
  }

  /* Unlock button — gold */
  .adult-root .gp-unlock-btn {
    border-color: var(--adult-gold-dim) !important;
    color: var(--adult-gold) !important;
  }

  /* Modal */
  .adult-root .gp-modal {
    background: var(--adult-surface) !important;
    border-color: var(--adult-gold-dim) !important;
  }
  .adult-root .gp-modal-top-accent {
    background: linear-gradient(90deg, transparent, var(--adult-gold), transparent) !important;
  }

  /* Other genre pills — cornflower blue on hover */
  .adult-root .gp-section:last-of-type a:hover {
    color: var(--adult-blue-bright) !important;
    border-color: var(--adult-blue-dim) !important;
    background: var(--adult-blue-dim) !important;
  }

  /* Footer */
  .adult-root .gp-footer {
    border-top-color: var(--adult-gold-dim) !important;
  }

  /* Scrollbar */
  .adult-root ::-webkit-scrollbar-thumb {
    background: var(--adult-red-dim) !important;
  }

  /* Red glow ambient light effect */
  .adult-glow-top {
    position: fixed; top: 0; left: 0; right: 0; height: 300px;
    background: radial-gradient(ellipse at 50% -50%, rgba(180,30,30,0.25) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .adult-glow-bottom {
    position: fixed; bottom: 0; right: 0; width: 400px; height: 400px;
    background: radial-gradient(ellipse at 100% 100%, rgba(180,30,30,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  /* 18+ watermark badge */
  .adult-badge {
    position: fixed; top: 80px; right: 20px; z-index: 30;
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.16em;
    text-transform: uppercase; color: rgba(201,68,68,0.6);
    border: 1px solid rgba(201,68,68,0.2); background: rgba(180,30,30,0.08);
    padding: 4px 10px; border-radius: 4px;
    display: flex; align-items: center; gap: 6px;
  }
  .adult-badge-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--adult-red); opacity: 0.7;
  }
`;

export default function Adult18Page() {
  return (
    <>
      <style>{ADULT_STYLES}</style>
      <Adult18Gate>
        <div className="adult-root">
          {/* Ambient glow effects */}
          <div className="adult-glow-top" />
          <div className="adult-glow-bottom" />

          {/* 18+ badge */}
          <div className="adult-badge">
            <div className="adult-badge-dot" />
            Adult 18+ Verified Section
          </div>

          {/* The genre page content loads here via the parent genre route */}
          {/* This page provides the visual wrapper and gate */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              padding: "120px 40px 60px",
              maxWidth: 1400,
              margin: "0 auto",
              textAlign: "center"
            }}>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 9, letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(201,168,76,0.7)",
                display: "block", marginBottom: 20
              }}>
                The Tiniest Library — Adult 18+ Section
              </span>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(56px, 8vw, 108px)",
                fontWeight: 300, color: "#f0ece2",
                lineHeight: 0.92, marginBottom: 24
              }}>
                Adult 18+
              </h1>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 14, color: "rgba(240,232,222,0.5)",
                maxWidth: 560, margin: "0 auto 40px",
                lineHeight: 1.85
              }}>
                Mature fiction for adult readers. This shelf contains explicit content — sexual, violent, or both — written with craft and intention. A serious literary space where writers explore the full range of adult experience without softening the edges.
              </p>
              <div style={{
                display: "flex", gap: 24, justifyContent: "center",
                flexWrap: "wrap", paddingTop: 32,
                borderTop: "1px solid rgba(201,68,68,0.15)"
              }}>
                {[
                  { num: "🔞", label: "Age Verified" },
                  { num: "🕯️", label: "Scarlet AI Guide" },
                  { num: "✒️", label: "Ink Economy" },
                  { num: "©", label: "Writers Own Copyright" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 28, color: "#C9A84C", lineHeight: 1, marginBottom: 4
                    }}>{s.num}</div>
                    <div style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 9, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: "rgba(240,232,222,0.3)"
                    }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 48, display: "flex", gap: 12, justifyContent: "center" }}>
                <a href="/reading-room/genres/adult-18%2B" style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                  fontWeight: 700, color: "#000",
                  background: "linear-gradient(135deg, #C9A84C, #8a6510)",
                  border: "none", padding: "13px 28px", borderRadius: 6,
                  textDecoration: "none"
                }}>
                  Browse Stories →
                </a>
                <a href="/reading-room" style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: "rgba(240,232,222,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "13px 24px", borderRadius: 6, textDecoration: "none"
                }}>
                  ← Reading Room
                </a>
              </div>
            </div>
          </div>

          {/* Scarlet AI */}
          <ScarletChatWidget />
        </div>
      </Adult18Gate>
    </>
  );
}
