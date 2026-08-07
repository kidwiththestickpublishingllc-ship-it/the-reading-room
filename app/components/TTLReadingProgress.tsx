"use client";

/**
 * TTLReadingProgress.tsx
 * ─────────────────────────────────────────────────────────────────
 * Shows a reader how far through a story they are.
 * Two display modes:
 *  - 'bar'    — compact progress bar, goes on story cards
 *  - 'detail' — full chapter tracker with chapter list, goes on story pages
 *
 * Place at: app/components/TTLReadingProgress.tsx
 *
 * USAGE on story cards:
 * <TTLReadingProgress
 *   mode="bar"
 *   storySlug={story.slug}
 *   chaptersRead={3}
 *   totalChapters={10}
 *   theme="light"
 *   accent="#8B5CF6"
 * />
 *
 * USAGE on story/chapter pages:
 * <TTLReadingProgress
 *   mode="detail"
 *   storySlug={story.slug}
 *   storyTitle={story.title}
 *   chaptersRead={3}
 *   totalChapters={10}
 *   currentChapter={3}
 *   theme="dark"
 *   accent="#8B5CF6"
 * />
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";

interface TTLReadingProgressProps {
  mode?: "bar" | "detail";
  storySlug: string;
  storyTitle?: string;
  chaptersRead: number;
  totalChapters: number;
  currentChapter?: number;
  theme?: "dark" | "light";
  accent?: string;
  accentDim?: string;
}

const DARK = {
  bg:       "rgba(255,255,255,0.03)",
  border:   "rgba(255,255,255,0.08)",
  track:    "rgba(255,255,255,0.08)",
  text:     "rgba(232,228,218,0.9)",
  textSub:  "rgba(232,228,218,0.45)",
  textFaint:"rgba(232,228,218,0.25)",
  chBg:     "rgba(255,255,255,0.03)",
  chBorder: "rgba(255,255,255,0.07)",
  chRead:   "rgba(201,168,76,0.08)",
  chCurrent:"rgba(201,168,76,0.14)",
  chLink:   "#C9A84C",
};

const LIGHT = {
  bg:       "rgba(201,168,76,0.04)",
  border:   "rgba(201,168,76,0.2)",
  track:    "rgba(201,168,76,0.12)",
  text:     "#1A1612",
  textSub:  "#5C4F3A",
  textFaint:"#9E8E6E",
  chBg:     "#FAFAFA",
  chBorder: "rgba(201,168,76,0.15)",
  chRead:   "rgba(201,168,76,0.06)",
  chCurrent:"rgba(201,168,76,0.12)",
  chLink:   "#8A6510",
};

// ── Bar mode ────────────────────────────────────────────────────
function ProgressBar({
  storySlug, chaptersRead, totalChapters, theme, accent, accentDim,
}: TTLReadingProgressProps) {
  const t = theme === "light" ? LIGHT : DARK;
  const pct = totalChapters > 0 ? Math.min((chaptersRead / totalChapters) * 100, 100) : 0;
  const accentColor = accent ?? "#C9A84C";
  const nextChapter = Math.min(chaptersRead + 1, totalChapters);

  return (
    <div style={{ padding: "8px 0 4px" }}>
      {/* Labels */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "'Syne',sans-serif", fontSize: 9,
        color: t.textFaint, marginBottom: 5,
        letterSpacing: "0.1em",
      }}>
        <span>Chapter {chaptersRead} of {totalChapters}</span>
        <span style={{ color: accentColor }}>{Math.round(pct)}%</span>
      </div>
      {/* Track */}
      <div style={{
        height: 3, borderRadius: 99,
        background: t.track, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 99,
          width: `${pct}%`,
          background: pct === 100
            ? `linear-gradient(90deg, ${accentColor}, #8a6510)`
            : accentColor,
          transition: "width 0.5s ease",
        }} />
      </div>
      {/* Continue link */}
      {chaptersRead < totalChapters && (
        <a
          href={`/reading-room/stories/${storySlug}/chapters/${nextChapter}`}
          style={{
            display: "inline-block", marginTop: 6,
            fontFamily: "'Syne',sans-serif",
            fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
            color: accentColor, textDecoration: "none",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Continue reading →
        </a>
      )}
      {pct === 100 && (
        <span style={{
          display: "inline-block", marginTop: 6,
          fontFamily: "'Syne',sans-serif",
          fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
          color: accentColor,
        }}>
          ✓ Completed
        </span>
      )}
    </div>
  );
}

// ── Detail mode ────────────────────────────────────────────────
function ProgressDetail({
  storySlug, storyTitle, chaptersRead, totalChapters,
  currentChapter, theme, accent,
}: TTLReadingProgressProps) {
  const t = theme === "light" ? LIGHT : DARK;
  const [expanded, setExpanded] = useState(false);
  const pct = totalChapters > 0 ? Math.min((chaptersRead / totalChapters) * 100, 100) : 0;
  const accentColor = accent ?? "#C9A84C";

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);
  const displayChapters = expanded ? chapters : chapters.slice(0, 5);

  return (
    <div style={{
      border: `1px solid ${t.border}`,
      borderRadius: 14, overflow: "hidden",
      background: t.bg,
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
              color: accentColor, opacity: 0.75, marginBottom: 4,
            }}>
              Your Progress
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 18, fontWeight: 300, color: t.text,
            }}>
              {storyTitle}
            </div>
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 32, fontWeight: 300, color: accentColor,
          }}>
            {Math.round(pct)}%
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 99, background: t.track, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${pct}%`,
            background: pct === 100
              ? `linear-gradient(90deg, ${accentColor}, #8a6510)`
              : accentColor,
            transition: "width 0.5s ease",
          }} />
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 6,
          fontFamily: "'Syne',sans-serif", fontSize: 10,
          color: t.textFaint, letterSpacing: "0.08em",
        }}>
          <span>{chaptersRead} of {totalChapters} chapters read</span>
          {pct === 100
            ? <span style={{ color: accentColor }}>✓ Complete</span>
            : <span>{totalChapters - chaptersRead} remaining</span>
          }
        </div>
      </div>

      {/* Chapter list */}
      <div style={{ padding: "12px 20px" }}>
        <div style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
          color: t.textFaint, marginBottom: 10,
        }}>
          Chapters
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {displayChapters.map(ch => {
            const isRead = ch <= chaptersRead;
            const isCurrent = ch === currentChapter;
            const isNext = ch === chaptersRead + 1;
            return (
              <a
                key={ch}
                href={`/reading-room/stories/${storySlug}/chapters/${ch}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8, textDecoration: "none",
                  background: isCurrent ? t.chCurrent : isRead ? t.chRead : t.chBg,
                  border: `1px solid ${isCurrent ? `${accentColor}44` : t.chBorder}`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  if (!isCurrent) (e.currentTarget as HTMLAnchorElement).style.borderColor = `${accentColor}33`;
                }}
                onMouseLeave={e => {
                  if (!isCurrent) (e.currentTarget as HTMLAnchorElement).style.borderColor = t.chBorder;
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: isCurrent ? accentColor
                    : isRead ? `${accentColor}60`
                    : t.track,
                  boxShadow: isCurrent ? `0 0 6px ${accentColor}` : "none",
                }} />

                <span style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 11, color: isCurrent ? accentColor : isRead ? t.textSub : t.textFaint,
                  flex: 1,
                }}>
                  Chapter {ch}
                  {isCurrent && <span style={{ marginLeft: 8, fontSize: 9, opacity: 0.7 }}>← Reading now</span>}
                  {isNext && !isCurrent && <span style={{ marginLeft: 8, fontSize: 9, color: accentColor, opacity: 0.6 }}>← Up next</span>}
                </span>

                {isRead && !isCurrent && (
                  <span style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 9, color: `${accentColor}80`,
                  }}>✓</span>
                )}
              </a>
            );
          })}
        </div>

        {totalChapters > 5 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{
              marginTop: 8, width: "100%",
              fontFamily: "'Syne',sans-serif",
              fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
              color: t.textFaint, background: "transparent",
              border: `1px solid ${t.chBorder}`,
              borderRadius: 8, padding: "7px 0",
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = accentColor;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}44`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = t.textFaint;
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.chBorder;
            }}
          >
            {expanded ? "Show less ↑" : `Show all ${totalChapters} chapters ↓`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────
export default function TTLReadingProgress(props: TTLReadingProgressProps) {
  if (props.mode === "detail") return <ProgressDetail {...props} />;
  return <ProgressBar {...props} />;
}
