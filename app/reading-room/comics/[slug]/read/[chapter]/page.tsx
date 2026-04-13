"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// COMIC / MANGA READER — The Reading Room / TTL
// Route: /reading-room/comics/[slug]/read/[chapter]
// Features:
//   - Vertical scroll mode (Webtoon style)
//   - Horizontal tap/click mode (traditional manga)
//   - Full-screen immersive — UI hidden until hover
//   - Teal green accent on pure dark background
//   - Reading mode toggle persistent in localStorage
//   - Keyboard navigation (arrows, escape)
//   - Touch swipe support for horizontal mode
//   - First chapter free, subsequent chapters cost 10 Ink
// =============================================================

// ─── Types ────────────────────────────────────────────────────
type ReadMode = "vertical" | "horizontal";

type ChapterPage = {
  index: number;
  src: string;
  alt: string;
};

type ChapterMeta = {
  number: number;
  title: string;
  series: string;
  seriesSlug: string;
  type: "comics" | "manga";
  totalChapters: number;
  inkCost: number;
  isFree: boolean;
};

// ─── Constants ────────────────────────────────────────────────
const INK_KEY = "ttl_ink";
const UNLOCKS_KEY = "ttl_comic_unlocks";
const READ_MODE_KEY = "ttl_comic_read_mode";
const DEFAULT_INK = 250;
const INK_PER_CHAPTER = 10;

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
function setUnlockStore(key: string) {
  const u = getUnlocks();
  u[key] = true;
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(u));
}
function getReadMode(): ReadMode {
  if (typeof window === "undefined") return "vertical";
  return (localStorage.getItem(READ_MODE_KEY) as ReadMode) || "vertical";
}
function setReadModeStore(m: ReadMode) {
  localStorage.setItem(READ_MODE_KEY, m);
}

// ─── Demo Pages (placeholder panels) ─────────────────────────
function buildDemoPages(count: number, genre: string): ChapterPage[] {
  const palettes: Record<string, string[]> = {
    default: ["#0a1f1f", "#2DD4BF", "#0F766E"],
    manga:   ["#0a0f1a", "#60A5FA", "#1E3A5F"],
    horror:  ["#1a0a0a", "#EF4444", "#7F1D1D"],
    fantasy: ["#1a0e2e", "#A78BFA", "#4C1D95"],
  };
  const [bg, accent] = palettes[genre] || palettes.default;
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    src: "",
    alt: `Page ${i + 1}`,
  }));
}

// ─── Placeholder Panel ────────────────────────────────────────
function PlaceholderPanel({ index, total, accent = "#2DD4BF" }: { index: number; total: number; accent?: string }) {
  const symbols = ["◈", "⬡", "△", "◇", "⬢", "○"];
  const symbol = symbols[index % symbols.length];
  return (
    <div style={{
      width: "100%",
      aspectRatio: "2/3",
      background: `linear-gradient(160deg, #0a1a1a 0%, #050f0f 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      position: "relative",
      overflow: "hidden",
      borderRadius: 2,
    }}>
      {/* Background texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle at ${30 + (index * 17) % 40}% ${20 + (index * 13) % 60}%, ${accent}12 0%, transparent 55%)`,
      }} />
      {/* Panel number */}
      <div style={{
        position: "absolute", top: 20, left: 20,
        fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700,
        color: `${accent}50`, letterSpacing: "0.15em",
      }}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
      {/* Center glyph */}
      <span style={{ fontSize: 64, color: `${accent}30`, lineHeight: 1 }}>{symbol}</span>
      <span style={{
        fontFamily: "Cormorant Garamond, serif", fontSize: 15,
        color: `${accent}40`, fontStyle: "italic",
        letterSpacing: "0.05em",
      }}>
        Panel {index + 1}
      </span>
      {/* Bottom bar hint */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(to right, transparent, ${accent}30, transparent)`,
      }} />
    </div>
  );
}

// ─── Ink Gate ─────────────────────────────────────────────────
function InkGate({ cost, ink, onUnlock, onBack, seriesTitle, chapterNum }: {
  cost: number; ink: number; onUnlock: () => void; onBack: () => void;
  seriesTitle: string; chapterNum: number;
}) {
  const canAfford = ink >= cost;
  return (
    <div style={{
      minHeight: "100vh", background: "#050f0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Cormorant Garamond, serif",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 420, width: "100%", textAlign: "center",
        background: "rgba(45,212,191,0.04)",
        border: "1px solid rgba(45,212,191,0.15)",
        borderRadius: 20, padding: "48px 40px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <h2 style={{
          margin: "0 0 8px", fontSize: 28, fontWeight: 700,
          color: "#f0ece2", lineHeight: 1.2,
        }}>
          {seriesTitle}
        </h2>
        <p style={{
          margin: "0 0 32px", fontSize: 18, fontStyle: "italic",
          color: "rgba(240,236,226,0.45)",
        }}>
          Chapter {chapterNum}
        </p>

        <div style={{
          background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 32,
        }}>
          <div style={{
            fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(45,212,191,0.6)", marginBottom: 8,
          }}>Unlock Cost</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#2DD4BF", lineHeight: 1 }}>
            {cost} <span style={{ fontSize: 20, color: "rgba(45,212,191,0.6)" }}>Ink</span>
          </div>
          <div style={{
            fontFamily: "Syne, sans-serif", fontSize: 12,
            color: canAfford ? "rgba(45,212,191,0.5)" : "#EF4444",
            marginTop: 8,
          }}>
            Your balance: {ink} Ink
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={onUnlock}
            disabled={!canAfford}
            style={{
              width: "100%", padding: "14px 24px",
              background: canAfford ? "#2DD4BF" : "rgba(255,255,255,0.06)",
              color: canAfford ? "#000" : "rgba(255,255,255,0.25)",
              border: "none", borderRadius: 99,
              fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: canAfford ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: canAfford ? "0 0 24px rgba(45,212,191,0.3)" : "none",
            }}
          >
            {canAfford ? `Unlock for ${cost} Ink →` : "Not Enough Ink"}
          </button>

          {!canAfford && (
            <a href="/reading-room/buy-ink" style={{
              display: "block", width: "100%", padding: "14px 24px",
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#C9A84C", borderRadius: 99,
              fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              textDecoration: "none", transition: "all 0.2s",
            }}>
              Buy More Ink 🖋
            </a>
          )}

          <button onClick={onBack} style={{
            background: "transparent", border: "none",
            fontFamily: "Syne, sans-serif", fontSize: 12,
            color: "rgba(240,236,226,0.3)", cursor: "pointer",
            letterSpacing: "0.08em", padding: "8px",
            transition: "color 0.2s",
          }}>
            ← Back to Series
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal Reader ────────────────────────────────────────
function HorizontalReader({ pages, currentPage, onPageChange, accent }: {
  pages: ChapterPage[]; currentPage: number;
  onPageChange: (p: number) => void; accent: string;
}) {
  const touchStart = useRef<number | null>(null);

  const prev = useCallback(() => {
    if (currentPage > 0) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const next = useCallback(() => {
    if (currentPage < pages.length - 1) onPageChange(currentPage + 1);
  }, [currentPage, pages.length, onPageChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStart.current = null;
  };

  const page = pages[currentPage];

  return (
    <div
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Page display */}
      <div style={{ maxWidth: 700, width: "100%", margin: "0 auto", padding: "0 60px" }}>
        {page.src ? (
          <img src={page.src} alt={page.alt} style={{ width: "100%", display: "block", borderRadius: 4 }} />
        ) : (
          <PlaceholderPanel index={currentPage} total={pages.length} accent={accent} />
        )}
      </div>

      {/* Left tap zone */}
      <button onClick={prev} disabled={currentPage === 0} style={{
        position: "absolute", left: 0, top: 0, width: "20%", height: "100%",
        background: "transparent", border: "none", cursor: currentPage === 0 ? "default" : "w-resize",
        opacity: 0,
      }} aria-label="Previous page" />

      {/* Right tap zone */}
      <button onClick={next} disabled={currentPage === pages.length - 1} style={{
        position: "absolute", right: 0, top: 0, width: "20%", height: "100%",
        background: "transparent", border: "none", cursor: currentPage === pages.length - 1 ? "default" : "e-resize",
        opacity: 0,
      }} aria-label="Next page" />
    </div>
  );
}

// ─── Vertical Reader ──────────────────────────────────────────
function VerticalReader({ pages, accent }: { pages: ChapterPage[]; accent: string }) {
  return (
    <div style={{ width: "100%", maxWidth: 720, margin: "0 auto", padding: "20px 0 80px" }}>
      {pages.map((page, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          {page.src ? (
            <img src={page.src} alt={page.alt} style={{ width: "100%", display: "block" }} />
          ) : (
            <PlaceholderPanel index={i} total={pages.length} accent={accent} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Reader Page ─────────────────────────────────────────
export default function ComicReaderPage() {
  // In real use, these come from route params + Supabase
  const DEMO_META: ChapterMeta = {
    number: 1,
    title: "The Signal",
    series: "Iron Meridian",
    seriesSlug: "iron-meridian",
    type: "comics",
    totalChapters: 8,
    inkCost: INK_PER_CHAPTER,
    isFree: true, // Chapter 1 is always free
  };
  const DEMO_PAGE_COUNT = 18;
  const ACCENT = "#2DD4BF";

  const [meta] = useState<ChapterMeta>(DEMO_META);
  const [pages] = useState<ChapterPage[]>(buildDemoPages(DEMO_PAGE_COUNT, "default"));
  const [readMode, setReadMode] = useState<ReadMode>("vertical");
  const [currentPage, setCurrentPage] = useState(0);
  const [uiVisible, setUiVisible] = useState(false);
  const [ink, setInk] = useState(DEFAULT_INK);
  const [unlocked, setUnlocked] = useState(true); // chapter 1 free
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInk(getInk());
    const mode = getReadMode();
    setReadMode(mode);
    // Check if this chapter is unlocked
    const unlockKey = `${meta.seriesSlug}-ch${meta.number}`;
    const isUnlocked = meta.isFree || getUnlocks()[unlockKey];
    setUnlocked(isUnlocked);
    setMounted(true);
  }, []);

  // Auto-hide UI
  const showUI = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 2800);
  }, []);

  useEffect(() => {
    const handler = () => showUI();
    window.addEventListener("mousemove", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [showUI]);

  // Escape key → back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleModeToggle = (mode: ReadMode) => {
    setReadMode(mode);
    setReadModeStore(mode);
    setCurrentPage(0);
  };

  const handleUnlock = () => {
    const newInk = ink - meta.inkCost;
    setInk(newInk);
    setInkStore(newInk);
    setUnlockStore(`${meta.seriesSlug}-ch${meta.number}`);
    setUnlocked(true);
  };

  if (!mounted) return null;

  // ── Ink Gate ──
  if (!unlocked) {
    return (
      <InkGate
        cost={meta.inkCost}
        ink={ink}
        onUnlock={handleUnlock}
        onBack={() => window.history.back()}
        seriesTitle={meta.series}
        chapterNum={meta.number}
      />
    );
  }

  const progress = readMode === "horizontal"
    ? Math.round(((currentPage + 1) / pages.length) * 100)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reader-root {
          min-height: 100vh;
          background: #050f0f;
          color: #f0ece2;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Top HUD ── */
        .reader-hud {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 24px;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(to bottom, rgba(5,15,15,0.95), transparent);
          backdrop-filter: blur(8px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .reader-hud.hidden {
          opacity: 0; transform: translateY(-8px); pointer-events: none;
        }

        .reader-hud-left { display: flex; align-items: center; gap: 14px; }
        .reader-back {
          width: 36px; height: 36px; border-radius: 99px;
          background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #2DD4BF; font-size: 16px; cursor: pointer;
          text-decoration: none; transition: all 0.2s;
          font-family: 'Syne', sans-serif;
        }
        .reader-back:hover { background: rgba(45,212,191,0.18); }

        .reader-title-group { display: flex; flex-direction: column; gap: 1px; }
        .reader-series {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(45,212,191,0.7);
        }
        .reader-chapter {
          font-family: 'Cormorant Garamond', serif; font-size: 15px;
          color: rgba(240,236,226,0.8); font-style: italic;
        }

        .reader-hud-right { display: flex; align-items: center; gap: 10px; }

        /* Mode toggle */
        .reader-mode-toggle {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 99px; padding: 3px;
          gap: 2px;
        }
        .reader-mode-btn {
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 99px; border: none; cursor: pointer;
          transition: all 0.2s;
        }
        .reader-mode-btn.active {
          background: #2DD4BF; color: #000;
        }
        .reader-mode-btn.inactive {
          background: transparent; color: rgba(240,236,226,0.4);
        }
        .reader-mode-btn.inactive:hover { color: rgba(45,212,191,0.8); }

        .reader-ink {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          color: #C9A84C; border: 1px solid rgba(201,168,76,0.25);
          background: rgba(201,168,76,0.06); padding: 5px 14px; border-radius: 99px;
          letter-spacing: 0.06em;
        }

        /* ── Bottom HUD ── */
        .reader-bottom {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          padding: 16px 24px 20px;
          background: linear-gradient(to top, rgba(5,15,15,0.95), transparent);
          backdrop-filter: blur(8px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .reader-bottom.hidden {
          opacity: 0; transform: translateY(8px); pointer-events: none;
        }

        .reader-progress-row {
          display: flex; align-items: center; gap: 14px;
          max-width: 720px; margin: 0 auto;
        }
        .reader-page-count {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          color: rgba(45,212,191,0.6); letter-spacing: 0.08em;
          white-space: nowrap; min-width: 60px;
        }
        .reader-progress-bar {
          flex: 1; height: 3px; background: rgba(255,255,255,0.08); border-radius: 99px;
          overflow: hidden;
        }
        .reader-progress-fill {
          height: 100%; background: #2DD4BF; border-radius: 99px;
          transition: width 0.3s ease;
        }

        .reader-nav-row {
          display: flex; justify-content: center; gap: 10px; margin-top: 12px;
        }
        .reader-nav-btn {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 8px 24px; border-radius: 99px;
          border: 1px solid rgba(45,212,191,0.2);
          background: rgba(45,212,191,0.06); color: #2DD4BF;
          cursor: pointer; transition: all 0.2s;
        }
        .reader-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .reader-nav-btn:not(:disabled):hover {
          background: rgba(45,212,191,0.15); border-color: rgba(45,212,191,0.4);
        }
        .reader-nav-btn.next-chapter {
          background: #2DD4BF; color: #000; border-color: #2DD4BF;
        }

        /* ── Scroll hint ── */
        .reader-scroll-hint {
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(45,212,191,0.35);
          animation: fadeHint 3s ease forwards;
          pointer-events: none;
        }
        @keyframes fadeHint {
          0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; }
        }

        /* ── Vertical content area ── */
        .reader-vertical-wrap {
          padding-top: 60px;
          cursor: pointer;
        }

        /* ── Horizontal content area ── */
        .reader-horizontal-wrap {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Chapter end card ── */
        .chapter-end {
          max-width: 420px; margin: 40px auto 0; padding: 48px 32px;
          text-align: center;
          background: rgba(45,212,191,0.04);
          border: 1px solid rgba(45,212,191,0.12);
          border-radius: 20px;
        }
        .chapter-end h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 700; color: #f0ece2; margin-bottom: 8px;
        }
        .chapter-end p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-style: italic; color: rgba(240,236,226,0.45);
          margin-bottom: 28px;
        }
        .chapter-end-btn {
          display: inline-block; padding: 12px 32px; border-radius: 99px;
          background: #2DD4BF; color: #000; text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          transition: opacity 0.2s; border: none; cursor: pointer;
        }
        .chapter-end-btn:hover { opacity: 0.85; }

        @media (max-width: 640px) {
          .reader-hud { padding: 0 16px; }
          .reader-bottom { padding: 12px 16px 16px; }
          .reader-mode-btn { padding: 5px 10px; font-size: 9px; }
        }
      `}</style>

      <div className="reader-root">

        {/* ── Top HUD ── */}
        <div className={`reader-hud ${uiVisible ? "" : "hidden"}`}>
          <div className="reader-hud-left">
            <a href={`/reading-room/comics`} className="reader-back">←</a>
            <div className="reader-title-group">
              <span className="reader-series">{meta.series}</span>
              <span className="reader-chapter">Ch.{meta.number} — {meta.title}</span>
            </div>
          </div>
          <div className="reader-hud-right">
            <div className="reader-mode-toggle">
              <button
                className={`reader-mode-btn ${readMode === "vertical" ? "active" : "inactive"}`}
                onClick={() => handleModeToggle("vertical")}
              >
                ↕ Scroll
              </button>
              <button
                className={`reader-mode-btn ${readMode === "horizontal" ? "active" : "inactive"}`}
                onClick={() => handleModeToggle("horizontal")}
              >
                ↔ Flip
              </button>
            </div>
            <div className="reader-ink">🖋 {ink}</div>
          </div>
        </div>

        {/* ── Vertical mode ── */}
        {readMode === "vertical" && (
          <div className="reader-vertical-wrap" onClick={showUI}>
            <VerticalReader pages={pages} accent={ACCENT} />
            {/* Chapter end card */}
            <div className="chapter-end">
              <h3>End of Chapter {meta.number}</h3>
              <p>{meta.series} continues…</p>
              {meta.number < meta.totalChapters ? (
                <a
                  href={`/reading-room/comics/${meta.seriesSlug}/read/${meta.number + 1}`}
                  className="chapter-end-btn"
                >
                  Next Chapter — {INK_PER_CHAPTER} Ink →
                </a>
              ) : (
                <a href={`/reading-room/comics`} className="chapter-end-btn">
                  Back to Library →
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Horizontal mode ── */}
        {readMode === "horizontal" && (
          <div className="reader-horizontal-wrap">
            <HorizontalReader
              pages={pages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              accent={ACCENT}
            />
          </div>
        )}

        {/* ── Bottom HUD ── */}
        <div className={`reader-bottom ${uiVisible ? "" : "hidden"}`}>
          {readMode === "horizontal" && (
            <div className="reader-progress-row">
              <span className="reader-page-count">
                {currentPage + 1} / {pages.length}
              </span>
              <div className="reader-progress-bar">
                <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="reader-page-count" style={{ textAlign: "right" }}>
                {progress}%
              </span>
            </div>
          )}
          <div className="reader-nav-row">
            {readMode === "horizontal" ? (
              <>
                <button
                  className="reader-nav-btn"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ← Prev
                </button>
                {currentPage < pages.length - 1 ? (
                  <button
                    className="reader-nav-btn"
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next →
                  </button>
                ) : (
                  <a
                    href={`/reading-room/comics/${meta.seriesSlug}/read/${meta.number + 1}`}
                    className="reader-nav-btn next-chapter"
                  >
                    Next Chapter →
                  </a>
                )}
              </>
            ) : (
              <a href={`/reading-room/comics`} className="reader-nav-btn">
                ← Back to Library
              </a>
            )}
          </div>
        </div>

        {/* ── Scroll hint (vertical mode only, first load) ── */}
        {readMode === "vertical" && mounted && (
          <div className="reader-scroll-hint">Scroll to read · Hover for controls</div>
        )}

      </div>
    </>
  );
}
