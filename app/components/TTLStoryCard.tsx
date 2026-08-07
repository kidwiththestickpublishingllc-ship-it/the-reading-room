"use client";

/**
 * TTLStoryCard.tsx
 * ─────────────────────────────────────────────────────────────────
 * Universal story card. Use this everywhere a story is displayed:
 * genre pages, browse page, search results, shelf, spotlight.
 *
 * Place at: app/components/TTLStoryCard.tsx
 *
 * PROPS:
 *  story        — the story object
 *  theme        — 'dark' | 'light' (default: 'dark')
 *  size         — 'sm' | 'md' | 'lg' (default: 'md')
 *  isUnlocked   — boolean
 *  canUnlock    — boolean (reader has enough ink)
 *  inkCost      — number
 *  onUnlock     — () => void
 *  onRead       — () => void
 *  showProgress — boolean — show reading progress bar
 *  chaptersRead — number
 *  totalChapters— number
 *  accent       — genre accent color (optional override)
 *  accentDim    — genre accent dim color (optional override)
 *
 * USAGE:
 * <TTLStoryCard
 *   story={story}
 *   theme="light"
 *   size="md"
 *   isUnlocked={false}
 *   canUnlock={true}
 *   inkCost={10}
 *   onUnlock={() => unlockStory(story.slug)}
 *   onRead={() => router.push(`/reading-room/stories/${story.slug}/chapters/1`)}
 * />
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────
export interface TTLStory {
  slug: string;
  title: string;
  author: string;
  description: string;
  cover?: string | null;
  badge?: "Serial" | "Exclusive" | "Early Access" | null;
  genres?: string[];
  teaser?: string;
  addedAt?: string;
}

interface TTLStoryCardProps {
  story: TTLStory;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  isUnlocked?: boolean;
  canUnlock?: boolean;
  inkCost?: number;
  onUnlock?: () => void;
  onRead?: () => void;
  showProgress?: boolean;
  chaptersRead?: number;
  totalChapters?: number;
  accent?: string;
  accentDim?: string;
}

// ─── Theme tokens ─────────────────────────────────────────────────
const DARK = {
  bg:          "#141210",
  bgHover:     "#1e1a16",
  border:      "rgba(255,255,255,0.08)",
  borderHover: "rgba(201,168,76,0.35)",
  borderTop:   "#C9A84C",
  text:        "rgba(232,228,218,0.95)",
  textSub:     "rgba(232,228,218,0.5)",
  textFaint:   "rgba(232,228,218,0.25)",
  badge: {
    exclusive:   { bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.4)", color: "#C9A84C" },
    early:       { bg: "rgba(232,228,218,0.06)", border: "rgba(232,228,218,0.2)", color: "rgba(232,228,218,0.7)" },
    serial:      { bg: "rgba(100,149,237,0.1)", border: "rgba(100,149,237,0.3)", color: "#6495ED" },
  },
  unlockBtn:   { bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.4)", color: "#C9A84C" },
  readBtn:     { bg: "linear-gradient(135deg,#C9A84C,#8a6510)", color: "#000" },
  tag:         { bg: "rgba(100,149,237,0.08)", border: "rgba(100,149,237,0.2)", color: "#6495ED" },
  progress:    { track: "rgba(255,255,255,0.08)", fill: "#C9A84C" },
  shadow:      "0 4px 24px rgba(0,0,0,0.4)",
};

const LIGHT = {
  bg:          "#FFFFFF",
  bgHover:     "#FFFDF7",
  border:      "rgba(201,168,76,0.25)",
  borderHover: "rgba(201,168,76,0.6)",
  borderTop:   "#C9A84C",
  text:        "#1A1612",
  textSub:     "#5C4F3A",
  textFaint:   "#9E8E6E",
  badge: {
    exclusive:   { bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.4)", color: "#8A6510" },
    early:       { bg: "rgba(90,80,60,0.06)", border: "rgba(90,80,60,0.2)", color: "#5C4F3A" },
    serial:      { bg: "rgba(60,90,160,0.08)", border: "rgba(60,90,160,0.25)", color: "#3C5AA0" },
  },
  unlockBtn:   { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.5)", color: "#8A6510" },
  readBtn:     { bg: "linear-gradient(135deg,#C9A84C,#8a6510)", color: "#000" },
  tag:         { bg: "rgba(60,90,160,0.06)", border: "rgba(60,90,160,0.2)", color: "#3C5AA0" },
  progress:    { track: "rgba(201,168,76,0.15)", fill: "#C9A84C" },
  shadow:      "0 2px 16px rgba(201,168,76,0.1)",
};

// Size configs
const SIZES = {
  sm: { coverH: 80,  titleSize: 14, bodyP: "12px 14px", coverW: 64  },
  md: { coverH: 120, titleSize: 18, bodyP: "14px 18px", coverW: 90  },
  lg: { coverH: 180, titleSize: 24, bodyP: "20px 24px", coverW: 140 },
};

function BadgeEl({ label, t }: { label: TTLStory["badge"]; t: typeof DARK }) {
  if (!label) return null;
  const s = label === "Exclusive" ? t.badge.exclusive
          : label === "Early Access" ? t.badge.early
          : t.badge.serial;
  return (
    <span style={{
      fontFamily: "'Syne',sans-serif",
      fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase",
      padding: "2px 9px", borderRadius: 999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

export default function TTLStoryCard({
  story, theme = "dark", size = "md",
  isUnlocked = false, canUnlock = false, inkCost = 10,
  onUnlock, onRead,
  showProgress = false, chaptersRead = 0, totalChapters = 0,
  accent, accentDim,
}: TTLStoryCardProps) {
  const t = theme === "light" ? LIGHT : DARK;
  const s = SIZES[size];
  const [coverFailed, setCoverFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const progressPct = totalChapters > 0
    ? Math.min((chaptersRead / totalChapters) * 100, 100) : 0;

  const accentColor = accent ?? "#C9A84C";
  const accentDimColor = accentDim ?? "rgba(201,168,76,0.2)";

  return (
    <div
      role="article"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.bgHover : t.bg,
        border: `1px solid ${hovered ? t.borderHover : t.border}`,
        borderTop: `2px solid ${hovered ? accentColor : t.borderTop}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all 0.25s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? t.shadow : "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onRead}
    >
      {/* Cover + Body row */}
      <div style={{ display: "flex", gap: 0 }}>

        {/* Cover */}
        <div style={{
          width: s.coverW, minWidth: s.coverW,
          height: s.coverH + 40,
          background: `linear-gradient(135deg, #1e1a16, #2a2318)`,
          overflow: "hidden", flexShrink: 0, position: "relative",
        }}>
          {!coverFailed && story.cover ? (
            <img
              src={story.cover}
              alt={story.title}
              onError={() => setCoverFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover",
                transform: hovered ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.4s ease",
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 28, color: accentColor, opacity: 0.4,
            }}>
              📖
            </div>
          )}
          {/* Unlock overlay on cover */}
          {!isUnlocked && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: 32,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              display: "flex", alignItems: "flex-end",
              justifyContent: "center", paddingBottom: 6,
            }}>
              <span style={{
                fontFamily: "'Syne',sans-serif", fontSize: 8,
                letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)",
              }}>
                🔒 {inkCost} Ink
              </span>
            </div>
          )}
          {isUnlocked && (
            <div style={{
              position: "absolute", top: 6, right: 6,
              background: "rgba(0,0,0,0.6)", borderRadius: 6,
              padding: "2px 7px",
              fontFamily: "'Syne',sans-serif", fontSize: 8,
              color: accentColor, letterSpacing: "0.1em",
            }}>
              ✓
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: s.bodyP, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: s.titleSize, fontWeight: 400,
              color: t.text, lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {story.title}
            </div>
            <BadgeEl label={story.badge} t={t} />
          </div>

          {/* Author */}
          <div style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 10, color: t.textSub,
            letterSpacing: "0.06em", marginBottom: 8,
          }}>
            by {story.author}
          </div>

          {/* Description */}
          {size !== "sm" && (
            <div style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 11, color: t.textFaint,
              lineHeight: 1.65, marginBottom: 10,
              display: "-webkit-box",
              WebkitLineClamp: size === "lg" ? 4 : 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
              flex: 1,
            }}>
              {story.description}
            </div>
          )}

          {/* Genre tags */}
          {story.genres?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {story.genres.slice(0, size === "sm" ? 1 : 3).map(g => (
                <span key={g} style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "2px 8px", borderRadius: 999,
                  background: t.tag.bg, border: `1px solid ${t.tag.border}`,
                  color: t.tag.color,
                }}>
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
            {isUnlocked ? (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onRead?.(); }}
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase",
                  padding: "6px 16px", borderRadius: 8, border: "none",
                  background: t.readBtn.bg, color: t.readBtn.color,
                  cursor: "pointer", fontWeight: 700,
                }}
              >
                Read →
              </button>
            ) : (
              <button
                type="button"
                disabled={!canUnlock}
                onClick={e => { e.stopPropagation(); onUnlock?.(); }}
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase",
                  padding: "6px 16px", borderRadius: 8,
                  border: `1px solid ${canUnlock ? t.unlockBtn.border : "rgba(255,255,255,0.1)"}`,
                  background: canUnlock ? t.unlockBtn.bg : "transparent",
                  color: canUnlock ? t.unlockBtn.color : t.textFaint,
                  cursor: canUnlock ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
              >
                {canUnlock ? `Unlock · ${inkCost} Ink` : "Need Ink"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reading progress bar */}
      {showProgress && isUnlocked && totalChapters > 0 && (
        <div style={{ padding: "8px 18px 12px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "'Syne',sans-serif", fontSize: 9,
            color: t.textFaint, marginBottom: 4, letterSpacing: "0.1em",
          }}>
            <span>Chapter {chaptersRead} of {totalChapters}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div style={{
            height: 2, borderRadius: 99,
            background: t.progress.track, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${progressPct}%`,
              background: t.progress.fill,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
