"use client";

/**
 * TTLAuthorCard.tsx
 * ─────────────────────────────────────────────────────────────────
 * Universal author card. Use everywhere an author is displayed:
 * genre pages, author directory, story pages, search results.
 *
 * Place at: app/components/TTLAuthorCard.tsx
 *
 * PROPS:
 *  author       — the author object
 *  theme        — 'dark' | 'light' (default: 'dark')
 *  size         — 'sm' | 'md' | 'lg' (default: 'md')
 *  jar          — current tip jar amount for this author
 *  onTip        — (amount: number) => void
 *  onLetter     — () => void — opens ReadersLetter modal
 *  onFollow     — () => void
 *  isFollowing  — boolean
 *  hasEarnedLetter — boolean — reader has unlocked 3+ chapters
 *  accent       — optional color override
 *  accentDim    — optional color override
 *
 * USAGE:
 * <TTLAuthorCard
 *   author={author}
 *   theme="light"
 *   jar={jar[author.slug] ?? 0}
 *   onTip={(amt) => tipAuthor(author.slug, amt)}
 *   onLetter={() => openLetter(author)}
 *   hasEarnedLetter={earnedLetterWriters.has(author.user_id)}
 * />
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────
export interface TTLAuthor {
  slug: string;
  user_id: string;
  name: string;
  tagline: string;
  genres: string[];
  image?: string | null;
  storyCount?: number;
  latestStoryTitle?: string;
}

interface TTLAuthorCardProps {
  author: TTLAuthor;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  jar?: number;
  onTip?: (amount: number) => void;
  onLetter?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
  hasEarnedLetter?: boolean;
  accent?: string;
  accentDim?: string;
}

// ─── Theme tokens ─────────────────────────────────────────────────
const DARK = {
  bg:          "#141210",
  bgHover:     "#1e1a16",
  border:      "rgba(255,255,255,0.08)",
  borderHover: "rgba(201,168,76,0.35)",
  accentBar:   "#C9A84C",
  text:        "rgba(232,228,218,0.95)",
  textSub:     "rgba(232,228,218,0.5)",
  textFaint:   "rgba(232,228,218,0.25)",
  avatarBg:    "linear-gradient(135deg,#1e1e26,#2a2a38)",
  avatarBorder:"rgba(201,168,76,0.3)",
  tag:         { bg: "rgba(100,149,237,0.08)", border: "rgba(100,149,237,0.2)", color: "#6495ED" },
  tipBtn:      { bg: "transparent", border: "rgba(255,255,255,0.1)", color: "rgba(232,228,218,0.4)" },
  tipBtnHover: { border: "rgba(201,168,76,0.4)", color: "#C9A84C", bg: "rgba(201,168,76,0.06)" },
  letterBtn:   { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.35)", color: "#C9A84C" },
  followBtn:   { bg: "transparent", border: "rgba(255,255,255,0.15)", color: "rgba(232,228,218,0.5)" },
  followActive:{ bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.4)", color: "#C9A84C" },
  divider:     "rgba(255,255,255,0.07)",
  shadow:      "0 4px 24px rgba(0,0,0,0.4)",
  jar:         "rgba(232,228,218,0.3)",
};

const LIGHT = {
  bg:          "#FFFFFF",
  bgHover:     "#FFFDF7",
  border:      "rgba(201,168,76,0.25)",
  borderHover: "rgba(201,168,76,0.6)",
  accentBar:   "#C9A84C",
  text:        "#1A1612",
  textSub:     "#5C4F3A",
  textFaint:   "#9E8E6E",
  avatarBg:    "linear-gradient(135deg,#F5F0E8,#EDE5D0)",
  avatarBorder:"rgba(201,168,76,0.4)",
  tag:         { bg: "rgba(60,90,160,0.06)", border: "rgba(60,90,160,0.2)", color: "#3C5AA0" },
  tipBtn:      { bg: "transparent", border: "rgba(201,168,76,0.25)", color: "#9E8E6E" },
  tipBtnHover: { border: "rgba(201,168,76,0.6)", color: "#8A6510", bg: "rgba(201,168,76,0.08)" },
  letterBtn:   { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.4)", color: "#8A6510" },
  followBtn:   { bg: "transparent", border: "rgba(201,168,76,0.2)", color: "#9E8E6E" },
  followActive:{ bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.5)", color: "#8A6510" },
  divider:     "rgba(201,168,76,0.15)",
  shadow:      "0 2px 16px rgba(201,168,76,0.1)",
  jar:         "#8A6510",
};

const TIP_AMOUNTS = [10, 25, 50];

export default function TTLAuthorCard({
  author, theme = "dark", size = "md",
  jar = 0, onTip, onLetter, onFollow,
  isFollowing = false, hasEarnedLetter = false,
  accent, accentDim,
}: TTLAuthorCardProps) {
  const t = theme === "light" ? LIGHT : DARK;
  const [hovered, setHovered] = useState(false);
  const [tipHover, setTipHover] = useState<number | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const accentColor = accent ?? "#C9A84C";
  const initial = author.name.split(" ")[1]?.[0] ?? author.name[0];

  const isLg = size === "lg";
  const isSm = size === "sm";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.bgHover : t.bg,
        border: `1px solid ${hovered ? t.borderHover : t.border}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all 0.25s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? t.shadow : "none",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Gold top accent bar */}
      <div style={{
        height: 2,
        background: hovered
          ? `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
          : "transparent",
        transition: "all 0.35s",
      }} />

      {/* Card body */}
      <div style={{ padding: isLg ? "28px 24px" : isSm ? "14px 16px" : "22px 20px" }}>

        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: isLg ? 18 : 12 }}>
          {/* Avatar */}
          <div style={{
            width: isLg ? 64 : isSm ? 36 : 48,
            height: isLg ? 64 : isSm ? 36 : 48,
            borderRadius: 10, flexShrink: 0,
            background: t.avatarBg,
            border: `1px solid ${t.avatarBorder}`,
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!avatarFailed && author.image
              ? <img
                  src={author.image}
                  alt={author.name}
                  onError={() => setAvatarFailed(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              : <span style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: isLg ? 26 : isSm ? 14 : 20,
                  fontWeight: 300, color: accentColor,
                }}>
                  {initial}
                </span>
            }
          </div>

          {/* Name + tagline */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: isLg ? 24 : isSm ? 15 : 20,
              fontWeight: 400, color: t.text,
              lineHeight: 1.15, marginBottom: 4,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {author.name}
            </div>
            {!isSm && (
              <div style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 11, color: t.textSub,
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {author.tagline}
              </div>
            )}
          </div>

          {/* Follow button */}
          {!isSm && onFollow && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onFollow(); }}
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase",
                padding: "5px 12px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${isFollowing ? t.followActive.border : t.followBtn.border}`,
                background: isFollowing ? t.followActive.bg : t.followBtn.bg,
                color: isFollowing ? t.followActive.color : t.followBtn.color,
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              {isFollowing ? "✓ Following" : "+ Follow"}
            </button>
          )}
        </div>

        {/* Genre tags */}
        {author.genres?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: isSm ? 10 : 14 }}>
            {author.genres.slice(0, isSm ? 2 : 4).map(g => (
              <span key={g} style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase",
                padding: "2px 9px", borderRadius: 999,
                background: t.tag.bg, border: `1px solid ${t.tag.border}`,
                color: t.tag.color,
              }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Latest story */}
        {isLg && author.latestStoryTitle && (
          <div style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 10, color: t.textFaint,
            letterSpacing: "0.06em", marginBottom: 14,
          }}>
            Latest: <span style={{ color: t.textSub }}>{author.latestStoryTitle}</span>
          </div>
        )}

        {/* Tip + Letter actions */}
        {!isSm && (
          <>
            <div style={{
              height: 1, background: t.divider,
              margin: "14px 0",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {/* Tip buttons */}
              {TIP_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={e => { e.stopPropagation(); onTip?.(amt); }}
                  onMouseEnter={() => setTipHover(amt)}
                  onMouseLeave={() => setTipHover(null)}
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${tipHover === amt ? t.tipBtnHover.border : t.tipBtn.border}`,
                    background: tipHover === amt ? t.tipBtnHover.bg : t.tipBtn.bg,
                    color: tipHover === amt ? t.tipBtnHover.color : t.tipBtn.color,
                    transition: "all 0.2s",
                  }}
                >
                  Tip {amt}
                </button>
              ))}

              {/* Jar count */}
              {jar > 0 && (
                <span style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 10, color: t.jar,
                  marginLeft: 2,
                }}>
                  🍯 {jar}
                </span>
              )}

              {/* Reader's Letter button */}
              {onLetter && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onLetter(); }}
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${t.letterBtn.border}`,
                    background: t.letterBtn.bg,
                    color: t.letterBtn.color,
                    transition: "all 0.2s",
                    marginLeft: "auto",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  ✉️
                  {hasEarnedLetter ? "Send Letter" : "Letter"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer link */}
      <div style={{
        padding: isSm ? "8px 16px" : "12px 20px",
        borderTop: `1px solid ${t.divider}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a
          href={`/reading-room/authors/${author.slug}`}
          onClick={e => e.stopPropagation()}
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
            color: t.textFaint, textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
          onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
        >
          🪶 Writer profile
        </a>
        <span style={{
          fontSize: 14, color: hovered ? accentColor : "transparent",
          transition: "color 0.25s, transform 0.25s",
          transform: hovered ? "translate(2px,-2px)" : "none",
          display: "inline-block",
        }}>
          ↗
        </span>
      </div>
    </div>
  );
}
