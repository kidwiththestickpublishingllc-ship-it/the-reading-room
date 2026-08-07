"use client";

/**
 * TTLSearchOverlay.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full-screen search overlay. Opens on Ctrl+K or CMD+K.
 * Searches stories, authors, and genres instantly.
 * Light and dark mode aware.
 *
 * Place at: app/components/TTLSearchOverlay.tsx
 *
 * HOW TO USE:
 * Add to TTLNav.tsx so it's available on every page:
 *
 * 1. Import at top of TTLNav.tsx:
 *    import TTLSearchOverlay from "@/app/components/TTLSearchOverlay";
 *
 * 2. Add state in TTLNav component:
 *    const [searchOpen, setSearchOpen] = useState(false);
 *
 * 3. Add keyboard shortcut handler in TTLNav useEffect:
 *    useEffect(() => {
 *      const fn = (e: KeyboardEvent) => {
 *        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 *          e.preventDefault();
 *          setSearchOpen(true);
 *        }
 *      };
 *      window.addEventListener('keydown', fn);
 *      return () => window.removeEventListener('keydown', fn);
 *    }, []);
 *
 * 4. Add search button to nav (find the nav links area):
 *    <button onClick={() => setSearchOpen(true)} className="ttl-search-trigger">
 *      🔍 Search
 *    </button>
 *
 * 5. Render at bottom of TTLNav return:
 *    <TTLSearchOverlay
 *      open={searchOpen}
 *      onClose={() => setSearchOpen(false)}
 *      theme="dark"
 *    />
 *
 * FIND AND REPLACE for TTLNav.tsx — search button style:
 * Add to your nav styles:
 * .ttl-search-trigger {
 *   font-family: 'Syne', sans-serif;
 *   font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
 *   color: rgba(232,228,218,0.45);
 *   background: rgba(255,255,255,0.04);
 *   border: 1px solid rgba(255,255,255,0.1);
 *   padding: 6px 14px; border-radius: 8px;
 *   cursor: pointer; transition: all 0.2s;
 *   display: flex; align-items: center; gap: 7px;
 * }
 * .ttl-search-trigger:hover {
 *   color: rgba(232,228,218,0.8);
 *   border-color: rgba(201,168,76,0.3);
 * }
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────
interface SearchResult {
  type: "story" | "author" | "genre";
  title: string;
  subtitle: string;
  href: string;
  image?: string | null;
  badge?: string | null;
  accent?: string;
}

interface TTLSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
}

// ─── Genre meta for genre results ─────────────────────────────────
const GENRE_ACCENTS: Record<string, string> = {
  "Fantasy": "#8B5CF6",
  "Sci-Fi": "#6495ED",
  "Romance": "#E879A0",
  "Crime & Thrillers": "#EF4444",
  "Dark Academia": "#8B7355",
  "Young Adult": "#10B981",
  "Horror Mystery": "#6B7280",
  "Cozy": "#F59E0B",
};

const ALL_GENRES = [
  "Fantasy", "Sci-Fi", "Romance", "Crime & Thrillers", "Dark Academia",
  "Young Adult", "Horror Mystery", "Cozy", "Adventure", "Historical Fiction",
  "Contemporary Fiction", "Fan Fiction", "Serialized Fiction", "Slice of Life",
  "Multi-Cultural", "Black Stories", "Latin Stories", "AAPI Authors",
  "Indigenous Stories", "LGBTQ+ Fiction", "New Adult", "Children's Literature",
  "Poems & Memoirs", "LitRPG",
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[+]/g, "").replace(/&/g, "and");
}

// ─── Styles ───────────────────────────────────────────────────────
const SEARCH_STYLES = `
  .tso-overlay {
    position: fixed; inset: 0; z-index: 500;
    display: flex; align-items: flex-start;
    justify-content: center; padding: 80px 24px 24px;
  }
  .tso-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(16px);
    cursor: pointer; border: none;
    width: 100%; height: 100%;
  }
  .tso-panel {
    position: relative; z-index: 10;
    width: 100%; max-width: 640px;
    border-radius: 18px; overflow: hidden;
    display: flex; flex-direction: column;
    max-height: calc(100vh - 120px);
  }
  .tso-panel-dark {
    background: #141210;
    border: 1px solid rgba(201,168,76,0.25);
    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
  }
  .tso-panel-light {
    background: #FFFFFF;
    border: 1px solid rgba(201,168,76,0.3);
    box-shadow: 0 24px 80px rgba(201,168,76,0.15);
  }
  .tso-accent-bar {
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .tso-input-row {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 20px;
  }
  .tso-search-icon { font-size: 18px; flex-shrink: 0; opacity: 0.5; }
  .tso-input {
    flex: 1; background: transparent;
    border: none; outline: none;
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300;
  }
  .tso-input-dark { color: rgba(232,228,218,0.9); }
  .tso-input-dark::placeholder { color: rgba(232,228,218,0.2); }
  .tso-input-light { color: #1A1612; }
  .tso-input-light::placeholder { color: #9E8E6E; }
  .tso-close {
    font-family: 'Syne', sans-serif; font-size: 9px;
    letter-spacing: 0.14em; text-transform: uppercase;
    padding: 6px 12px; border-radius: 8px;
    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  .tso-close-dark {
    color: rgba(232,228,218,0.35);
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
  }
  .tso-close-dark:hover { color: rgba(232,228,218,0.7); }
  .tso-close-light {
    color: #9E8E6E;
    border: 1px solid rgba(201,168,76,0.2);
    background: transparent;
  }
  .tso-close-light:hover { color: #5C4F3A; }
  .tso-divider-dark { height: 1px; background: rgba(255,255,255,0.07); }
  .tso-divider-light { height: 1px; background: rgba(201,168,76,0.15); }
  .tso-results { flex: 1; overflow-y: auto; padding: 8px 0 16px; }
  .tso-section-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    padding: 10px 20px 6px;
  }
  .tso-section-label-dark { color: rgba(232,228,218,0.25); }
  .tso-section-label-light { color: #9E8E6E; }
  .tso-result {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 20px; cursor: pointer;
    transition: background 0.15s; text-decoration: none;
  }
  .tso-result-dark:hover { background: rgba(255,255,255,0.04); }
  .tso-result-light:hover { background: rgba(201,168,76,0.05); }
  .tso-result-active-dark { background: rgba(255,255,255,0.06) !important; }
  .tso-result-active-light { background: rgba(201,168,76,0.08) !important; }
  .tso-result-thumb {
    width: 36px; height: 36px; border-radius: 8px;
    flex-shrink: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .tso-result-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .tso-result-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-weight: 400; line-height: 1.2;
  }
  .tso-result-title-dark { color: rgba(232,228,218,0.9); }
  .tso-result-title-light { color: #1A1612; }
  .tso-result-sub {
    font-family: 'Syne', sans-serif;
    font-size: 10px; margin-top: 2px;
  }
  .tso-result-sub-dark { color: rgba(232,228,218,0.35); }
  .tso-result-sub-light { color: #9E8E6E; }
  .tso-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 999px; margin-left: auto; flex-shrink: 0;
  }
  .tso-empty {
    padding: 32px 20px; text-align: center;
    font-family: 'Syne', sans-serif; font-size: 12px; letter-spacing: 0.08em;
  }
  .tso-empty-dark { color: rgba(232,228,218,0.25); }
  .tso-empty-light { color: #9E8E6E; }
  .tso-shortcut {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 20px;
    border-top: 1px solid;
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.08em;
  }
  .tso-shortcut-dark { border-color: rgba(255,255,255,0.07); color: rgba(232,228,218,0.2); }
  .tso-shortcut-light { border-color: rgba(201,168,76,0.15); color: #9E8E6E; }
  .tso-kbd {
    font-family: 'Syne', sans-serif; font-size: 9px;
    padding: 2px 7px; border-radius: 5px;
  }
  .tso-kbd-dark { background: rgba(255,255,255,0.08); color: rgba(232,228,218,0.4); }
  .tso-kbd-light { background: rgba(201,168,76,0.1); color: #8A6510; }
`;

// ─── Component ────────────────────────────────────────────────────
export default function TTLSearchOverlay({
  open, onClose, theme = "dark",
}: TTLSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setActiveIdx(v => Math.min(v + 1, results.length - 1));
      if (e.key === "ArrowUp") setActiveIdx(v => Math.max(v - 1, 0));
      if (e.key === "Enter" && results[activeIdx]) {
        window.location.href = results[activeIdx].href;
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, results, activeIdx, onClose]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);

    const out: SearchResult[] = [];

    try {
      // Search stories
      const { data: stories } = await supabase
        .from("stories")
        .select("slug, title, author_name, cover_url, badge, genre")
        .eq("is_published", true)
        .or(`title.ilike.%${q}%,author_name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(5);

      (stories ?? []).forEach((s: any) => {
        out.push({
          type: "story",
          title: s.title,
          subtitle: `by ${s.author_name}`,
          href: `/reading-room/stories/${s.slug}/chapters/1`,
          image: s.cover_url,
          badge: s.badge,
          accent: GENRE_ACCENTS[s.genre] ?? "#C9A84C",
        });
      });

      // Search authors (writers table)
      const { data: authors } = await supabase
        .from("writers")
        .select("slug, name, avatar_url, genres")
        .eq("status", "approved")
        .ilike("name", `%${q}%`)
        .limit(4);

      (authors ?? []).forEach((a: any) => {
        out.push({
          type: "author",
          title: a.name,
          subtitle: (a.genres ?? []).slice(0, 2).join(", ") || "Writer",
          href: `/reading-room/authors/${a.slug}`,
          image: a.avatar_url,
        });
      });

      // Genre matches
      const genreMatches = ALL_GENRES.filter(g =>
        g.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 3);

      genreMatches.forEach(g => {
        out.push({
          type: "genre",
          title: g,
          subtitle: "Browse genre",
          href: `/reading-room/genres/${slugify(g)}`,
          accent: GENRE_ACCENTS[g] ?? "#C9A84C",
        });
      });

    } catch (err) {
      console.error("TTLSearch error:", err);
    }

    setResults(out);
    setActiveIdx(0);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 220);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  if (!open) return null;

  // Group results
  const stories = results.filter(r => r.type === "story");
  const authors = results.filter(r => r.type === "author");
  const genres = results.filter(r => r.type === "genre");

  let idx = 0;
  const getIdx = () => idx++;

  const thumbStyle = (r: SearchResult) => ({
    background: r.accent
      ? `${r.accent}22`
      : isDark ? "rgba(255,255,255,0.05)" : "rgba(201,168,76,0.08)",
    border: `1px solid ${r.accent ? `${r.accent}44` : isDark ? "rgba(255,255,255,0.08)" : "rgba(201,168,76,0.15)"}`,
  });

  const ResultRow = ({ r }: { r: SearchResult }) => {
    const i = getIdx();
    const isActive = i === activeIdx;
    return (
      <a
        href={r.href}
        className={`tso-result tso-result-${isDark ? "dark" : "light"}${isActive ? ` tso-result-active-${isDark ? "dark" : "light"}` : ""}`}
        onClick={onClose}
      >
        {/* Thumb */}
        <div className="tso-result-thumb" style={thumbStyle(r)}>
          {r.image
            ? <img src={r.image} alt={r.title} />
            : r.type === "story" ? "📖"
            : r.type === "author" ? "🪶"
            : "✦"
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`tso-result-title tso-result-title-${isDark ? "dark" : "light"}`}
            style={{ color: isActive && r.accent ? r.accent : undefined }}>
            {r.title}
          </div>
          <div className={`tso-result-sub tso-result-sub-${isDark ? "dark" : "light"}`}>
            {r.subtitle}
          </div>
        </div>

        {/* Badge */}
        {r.badge && (
          <span
            className="tso-badge"
            style={{
              background: `${r.accent ?? "#C9A84C"}18`,
              border: `1px solid ${r.accent ?? "#C9A84C"}44`,
              color: r.accent ?? "#C9A84C",
            }}
          >
            {r.badge}
          </span>
        )}
        {r.type === "genre" && (
          <span
            className="tso-badge"
            style={{
              background: `${r.accent ?? "#C9A84C"}18`,
              border: `1px solid ${r.accent ?? "#C9A84C"}44`,
              color: r.accent ?? "#C9A84C",
            }}
          >
            Genre
          </span>
        )}
      </a>
    );
  };

  return (
    <>
      <style>{SEARCH_STYLES}</style>
      <div className="tso-overlay" role="dialog" aria-modal="true" aria-label="Search TTL">
        <button type="button" className="tso-backdrop" onClick={onClose} aria-label="Close search" />

        <div className={`tso-panel tso-panel-${isDark ? "dark" : "light"}`}>
          <div className="tso-accent-bar" />

          {/* Input row */}
          <div className="tso-input-row">
            <span className="tso-search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className={`tso-input tso-input-${isDark ? "dark" : "light"}`}
              placeholder="Search stories, authors, genres…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className={`tso-close tso-close-${isDark ? "dark" : "light"}`}
              onClick={onClose}
            >
              ESC
            </button>
          </div>

          <div className={`tso-divider-${isDark ? "dark" : "light"}`} />

          {/* Results */}
          <div className="tso-results">
            {loading && (
              <div className={`tso-empty tso-empty-${isDark ? "dark" : "light"}`}>
                Searching…
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className={`tso-empty tso-empty-${isDark ? "dark" : "light"}`}>
                No results for "{query}"
              </div>
            )}

            {!loading && !query && (
              <div className={`tso-empty tso-empty-${isDark ? "dark" : "light"}`}>
                Start typing to search stories, authors, and genres
              </div>
            )}

            {/* Stories */}
            {stories.length > 0 && (
              <>
                <div className={`tso-section-label tso-section-label-${isDark ? "dark" : "light"}`}>
                  Stories
                </div>
                {stories.map((r, i) => <ResultRow key={`s-${i}`} r={r} />)}
              </>
            )}

            {/* Authors */}
            {authors.length > 0 && (
              <>
                <div className={`tso-section-label tso-section-label-${isDark ? "dark" : "light"}`}>
                  Authors
                </div>
                {authors.map((r, i) => <ResultRow key={`a-${i}`} r={r} />)}
              </>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <>
                <div className={`tso-section-label tso-section-label-${isDark ? "dark" : "light"}`}>
                  Genres
                </div>
                {genres.map((r, i) => <ResultRow key={`g-${i}`} r={r} />)}
              </>
            )}
          </div>

          {/* Keyboard shortcuts footer */}
          <div className={`tso-shortcut tso-shortcut-${isDark ? "dark" : "light"}`}>
            <kbd className={`tso-kbd tso-kbd-${isDark ? "dark" : "light"}`}>↑↓</kbd>
            <span>Navigate</span>
            <kbd className={`tso-kbd tso-kbd-${isDark ? "dark" : "light"}`} style={{ marginLeft: 8 }}>↵</kbd>
            <span>Open</span>
            <kbd className={`tso-kbd tso-kbd-${isDark ? "dark" : "light"}`} style={{ marginLeft: 8 }}>ESC</kbd>
            <span>Close</span>
            <span style={{ marginLeft: "auto" }}>
              <kbd className={`tso-kbd tso-kbd-${isDark ? "dark" : "light"}`}>Ctrl K</kbd>
              <span style={{ marginLeft: 4 }}>to open anywhere</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
