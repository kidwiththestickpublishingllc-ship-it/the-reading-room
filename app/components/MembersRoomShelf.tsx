"use client";

/**
 * MembersRoomShelf.tsx
 * ─────────────────────────────────────────────────────────────────
 * Virtual bookshelf. Stories displayed as book spines pulled from
 * chapter_unlocks. Three sections: Reading Now, Completed, Want To Read.
 * Members can add stories to their Want To Read list.
 * Light/dark aware.
 *
 * Place at: app/components/MembersRoomShelf.tsx
 *
 * HOW TO WIRE into app/members/page.tsx:
 * 1. Add import:
 *    import MembersRoomShelf from "@/app/components/MembersRoomShelf";
 *
 * 2. Replace the stories tab block:
 *    {activeTab === "stories" && (
 *      <MembersRoomShelf
 *        profileId={profile.id}
 *        theme="dark"
 *      />
 *    )}
 *
 * TABLE NEEDED:
 * create table if not exists reading_list (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users not null,
 *   story_slug text not null,
 *   story_title text not null,
 *   story_author text,
 *   cover_url text,
 *   genre text,
 *   genre_accent text default '#C9A84C',
 *   added_at timestamptz default now(),
 *   unique(user_id, story_slug)
 * );
 * alter table reading_list enable row level security;
 * create policy "users see own list"
 *   on reading_list for select using (auth.uid() = user_id);
 * create policy "users can add"
 *   on reading_list for insert with check (auth.uid() = user_id);
 * create policy "users can remove"
 *   on reading_list for delete using (auth.uid() = user_id);
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ShelfStory {
  slug: string;
  title: string;
  author: string;
  cover: string | null;
  genre: string | null;
  accent: string;
  chaptersRead: number;
  totalChapters: number;
  lastRead: string | null;
}

interface WantToRead {
  id: string;
  story_slug: string;
  story_title: string;
  story_author: string | null;
  cover_url: string | null;
  genre: string | null;
  genre_accent: string;
  added_at: string;
}

interface MembersRoomShelfProps {
  profileId: string;
  theme?: "dark" | "light";
}

const GENRE_COLORS: Record<string, string> = {
  "Fantasy": "#8B5CF6",
  "Sci-Fi": "#6495ED",
  "Romance": "#E879A0",
  "Crime & Thrillers": "#EF4444",
  "Dark Academia": "#8B7355",
  "Young Adult": "#10B981",
  "Horror Mystery": "#6B7280",
  "Cozy": "#F59E0B",
  "Adventure": "#F97316",
  "Historical Fiction": "#92400E",
  "Contemporary Fiction": "#0EA5E9",
  "LitRPG": "#7C3AED",
};

function getAccent(genre: string | null): string {
  return GENRE_COLORS[genre ?? ""] ?? "#C9A84C";
}

const SHELF_STYLES = `
  .shelf-root { width: 100%; }

  /* Section header */
  .shelf-section { margin-bottom: 36px; }
  .shelf-section-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  }
  .shelf-section-bar {
    width: 3px; height: 28px; border-radius: 2px; flex-shrink: 0;
  }
  .shelf-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 300; line-height: 1;
  }
  .shelf-section-count {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 999px; border: 1px solid;
  }

  /* Book spine row */
  .shelf-spines {
    display: flex; gap: 8px; flex-wrap: wrap;
  }

  /* Individual spine */
  .shelf-spine {
    width: 44px; cursor: pointer;
    transition: transform 0.2s;
    flex-shrink: 0; position: relative;
  }
  .shelf-spine:hover { transform: translateY(-6px) scale(1.04); }
  .shelf-spine-book {
    width: 44px; height: 140px; border-radius: 3px 6px 6px 3px;
    overflow: hidden; position: relative;
    box-shadow: 2px 3px 8px rgba(0,0,0,0.4);
  }
  .shelf-spine-cover { width: 100%; height: 100%; object-fit: cover; }
  .shelf-spine-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    writing-mode: vertical-rl; text-orientation: mixed;
    font-family: 'Cormorant Garamond', serif;
    font-size: 10px; font-weight: 300; text-align: center;
    padding: 8px 4px; line-height: 1.2;
    overflow: hidden;
  }
  .shelf-spine-progress {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px;
  }
  .shelf-spine-title {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.06em;
    margin-top: 5px; text-align: center;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .shelf-spine-tooltip {
    position: absolute; bottom: 155px; left: 50%;
    transform: translateX(-50%);
    background: rgba(10,8,5,0.95);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 10px; padding: 10px 14px;
    min-width: 160px; z-index: 10;
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s;
    white-space: nowrap;
  }
  .shelf-spine:hover .shelf-spine-tooltip { opacity: 1; }
  .shelf-spine-tooltip-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px; color: rgba(232,228,218,0.9);
    margin-bottom: 3px;
  }
  .shelf-spine-tooltip-author {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.45);
    margin-bottom: 5px;
  }
  .shelf-spine-tooltip-progress {
    font-family: 'Syne', sans-serif;
    font-size: 9px; color: #C9A84C;
  }

  /* Shelf base line */
  .shelf-base {
    height: 6px; border-radius: 3px;
    margin-top: 6px; margin-bottom: 24px;
  }

  /* Want to read grid */
  .shelf-wtr-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  .shelf-wtr-card {
    border-radius: 12px; overflow: hidden; border: 1px solid;
    transition: all 0.2s; text-decoration: none; display: block;
  }
  .shelf-wtr-card:hover { transform: translateY(-2px); }
  .shelf-wtr-thumb {
    height: 80px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .shelf-wtr-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .shelf-wtr-body { padding: 10px 12px; }
  .shelf-wtr-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px; font-weight: 400; line-height: 1.2;
    margin-bottom: 3px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .shelf-wtr-author {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.06em;
  }
  .shelf-wtr-remove {
    width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; background: transparent;
    border: none; cursor: pointer; transition: all 0.2s;
    position: absolute; top: 6px; right: 6px;
  }

  /* Empty state */
  .shelf-empty {
    padding: 32px 24px; text-align: center;
    border-radius: 14px; border: 1px solid;
  }
  .shelf-empty-icon { font-size: 28px; display: block; margin-bottom: 10px; }
  .shelf-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300; margin-bottom: 6px;
  }
  .shelf-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 11px; line-height: 1.65;
  }
  .shelf-empty-link {
    display: inline-block; margin-top: 14px;
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 8px 20px; border-radius: 8px; border: none;
    background: linear-gradient(135deg,#C9A84C,#8a6510);
    color: #000; font-weight: 700; text-decoration: none;
    cursor: pointer; transition: opacity 0.2s;
  }
  .shelf-empty-link:hover { opacity: 0.85; }

  /* Loading */
  .shelf-loading {
    font-family: 'Syne', sans-serif; font-size: 11px;
    text-align: center; padding: 32px 0; letter-spacing: 0.1em;
  }
`;

function SpineBook({
  story, theme,
}: {
  story: ShelfStory;
  theme: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const pct = story.totalChapters > 0
    ? Math.min((story.chaptersRead / story.totalChapters) * 100, 100) : 0;
  const isDark = theme === "dark";

  return (
    <div className="shelf-spine">
      <a href={`/reading-room/stories/${story.slug}/chapters/${story.chaptersRead || 1}`}>
        <div
          className="shelf-spine-book"
          style={{ background: `${story.accent}22`, border: `1px solid ${story.accent}44` }}
        >
          {!imgFailed && story.cover
            ? <img
                src={story.cover}
                alt={story.title}
                className="shelf-spine-cover"
                onError={() => setImgFailed(true)}
              />
            : <div
                className="shelf-spine-fallback"
                style={{ color: story.accent, fontSize: story.title.length > 20 ? 8 : 10 }}
              >
                {story.title}
              </div>
          }
          {/* Progress bar at bottom */}
          <div
            className="shelf-spine-progress"
            style={{ background: `${story.accent}33` }}
          >
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: story.accent,
              borderRadius: 99,
              transition: "width 0.4s",
            }} />
          </div>
        </div>
      </a>

      {/* Title below */}
      <div
        className="shelf-spine-title"
        style={{ color: isDark ? "rgba(232,228,218,0.4)" : "#9E8E6E" }}
      >
        {story.title}
      </div>

      {/* Tooltip on hover */}
      <div className="shelf-spine-tooltip">
        <div className="shelf-spine-tooltip-title">{story.title}</div>
        <div className="shelf-spine-tooltip-author">by {story.author}</div>
        <div className="shelf-spine-tooltip-progress">
          {story.chaptersRead} of {story.totalChapters} chapters · {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
}

export default function MembersRoomShelf({
  profileId, theme = "dark",
}: MembersRoomShelfProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "rgba(232,228,218,0.9)" : "#1A1612";
  const textFaint = isDark ? "rgba(232,228,218,0.3)" : "#9E8E6E";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(201,168,76,0.2)";
  const surfaceColor = isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF";
  const gold = isDark ? "#C9A84C" : "#8A6510";
  const goldDim = isDark ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.15)";

  const [reading, setReading] = useState<ShelfStory[]>([]);
  const [completed, setCompleted] = useState<ShelfStory[]>([]);
  const [wantToRead, setWantToRead] = useState<WantToRead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShelf = useCallback(async () => {
    setLoading(true);
    try {
      // Get all unlocks with story data
      const { data: unlocks } = await supabase
        .from("chapter_unlocks")
        .select(`
          chapter_id, created_at,
          chapters(
            chapter_number, story_id,
            stories(id, slug, title, author_name, cover_url, genre, is_published)
          )
        `)
        .eq("user_id", profileId);

      // Get total chapter counts per story
      const { data: chapterCounts } = await supabase
        .from("chapters")
        .select("story_id");

      const countByStory: Record<string, number> = {};
      (chapterCounts ?? []).forEach((c: any) => {
        countByStory[c.story_id] = (countByStory[c.story_id] ?? 0) + 1;
      });

      // Group unlocks by story
      const storyMap: Record<string, ShelfStory> = {};
      const lastReadMap: Record<string, string> = {};

      (unlocks ?? []).forEach((u: any) => {
        const ch = u.chapters;
        const story = ch?.stories;
        if (!story?.is_published) return;

        const slug = story.slug;
        const chNum = ch.chapter_number;

        if (!storyMap[slug]) {
          storyMap[slug] = {
            slug,
            title: story.title,
            author: story.author_name ?? "",
            cover: story.cover_url ?? null,
            genre: story.genre ?? null,
            accent: getAccent(story.genre),
            chaptersRead: 0,
            totalChapters: countByStory[story.id] ?? 0,
            lastRead: null,
          };
        }

        if (chNum > storyMap[slug].chaptersRead) {
          storyMap[slug].chaptersRead = chNum;
        }

        if (!lastReadMap[slug] || u.created_at > lastReadMap[slug]) {
          lastReadMap[slug] = u.created_at;
          storyMap[slug].lastRead = u.created_at;
        }
      });

      // Bucket into reading now vs completed
      const readingNow: ShelfStory[] = [];
      const done: ShelfStory[] = [];

      Object.values(storyMap).forEach(s => {
        if (s.totalChapters > 0 && s.chaptersRead >= s.totalChapters) {
          done.push(s);
        } else {
          readingNow.push(s);
        }
      });

      // Sort by last read
      readingNow.sort((a, b) =>
        new Date(b.lastRead ?? 0).getTime() - new Date(a.lastRead ?? 0).getTime()
      );
      done.sort((a, b) =>
        new Date(b.lastRead ?? 0).getTime() - new Date(a.lastRead ?? 0).getTime()
      );

      setReading(readingNow);
      setCompleted(done);

      // Want to read list
      const { data: wtr } = await supabase
        .from("reading_list")
        .select("*")
        .eq("user_id", profileId)
        .order("added_at", { ascending: false });

      setWantToRead((wtr ?? []) as WantToRead[]);
    } catch (err) {
      console.error("MembersRoomShelf error:", err);
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => { loadShelf(); }, [loadShelf]);

  const removeFromWTR = async (id: string) => {
    await supabase.from("reading_list").delete().eq("id", id);
    setWantToRead(prev => prev.filter(w => w.id !== id));
  };

  if (loading) {
    return (
      <>
        <style>{SHELF_STYLES}</style>
        <div className="shelf-loading" style={{ color: textFaint }}>
          Loading your shelf…
        </div>
      </>
    );
  }

  return (
    <>
      <style>{SHELF_STYLES}</style>
      <div className="shelf-root">

        {/* Currently Reading */}
        <div className="shelf-section">
          <div className="shelf-section-header">
            <div
              className="shelf-section-bar"
              style={{ background: `linear-gradient(180deg,${gold},transparent)` }}
            />
            <div className="shelf-section-title" style={{ color: textColor }}>
              Reading Now
            </div>
            {reading.length > 0 && (
              <span
                className="shelf-section-count"
                style={{ color: gold, borderColor: goldDim, background: goldDim }}
              >
                {reading.length}
              </span>
            )}
          </div>

          {reading.length === 0 ? (
            <div className="shelf-empty" style={{ borderColor, background: surfaceColor }}>
              <span className="shelf-empty-icon">📖</span>
              <div className="shelf-empty-title" style={{ color: textColor }}>
                Your shelf is empty.
              </div>
              <p className="shelf-empty-text" style={{ color: textFaint }}>
                Unlock chapters to start filling your shelf.
              </p>
              <a href="/reading-room/stories" className="shelf-empty-link">
                Browse Stories →
              </a>
            </div>
          ) : (
            <>
              <div className="shelf-spines">
                {reading.map(s => (
                  <SpineBook key={s.slug} story={s} theme={theme} />
                ))}
              </div>
              <div
                className="shelf-base"
                style={{ background: isDark ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.2)" }}
              />
            </>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div className="shelf-section">
            <div className="shelf-section-header">
              <div
                className="shelf-section-bar"
                style={{ background: `linear-gradient(180deg,#10B981,transparent)` }}
              />
              <div className="shelf-section-title" style={{ color: textColor }}>
                Completed
              </div>
              <span
                className="shelf-section-count"
                style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.08)" }}
              >
                {completed.length}
              </span>
            </div>
            <div className="shelf-spines">
              {completed.map(s => (
                <SpineBook key={s.slug} story={s} theme={theme} />
              ))}
            </div>
            <div
              className="shelf-base"
              style={{ background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.15)" }}
            />
          </div>
        )}

        {/* Want to Read */}
        <div className="shelf-section">
          <div className="shelf-section-header">
            <div
              className="shelf-section-bar"
              style={{ background: `linear-gradient(180deg,#6495ED,transparent)` }}
            />
            <div className="shelf-section-title" style={{ color: textColor }}>
              Want to Read
            </div>
            {wantToRead.length > 0 && (
              <span
                className="shelf-section-count"
                style={{ color: "#6495ED", borderColor: "rgba(100,149,237,0.25)", background: "rgba(100,149,237,0.08)" }}
              >
                {wantToRead.length}
              </span>
            )}
          </div>

          {wantToRead.length === 0 ? (
            <div className="shelf-empty" style={{ borderColor, background: surfaceColor }}>
              <span className="shelf-empty-icon">🔖</span>
              <div className="shelf-empty-title" style={{ color: textColor }}>
                Nothing queued yet.
              </div>
              <p className="shelf-empty-text" style={{ color: textFaint }}>
                Add stories to your reading list from any genre page.
              </p>
              <a href="/reading-room/genres/fantasy" className="shelf-empty-link">
                Explore Genres →
              </a>
            </div>
          ) : (
            <div className="shelf-wtr-grid">
              {wantToRead.map(w => (
                <div
                  key={w.id}
                  className="shelf-wtr-card"
                  style={{
                    borderColor: w.genre_accent ? `${w.genre_accent}33` : borderColor,
                    background: surfaceColor,
                    position: "relative",
                  }}
                >
                  <a
                    href={`/reading-room/stories/${w.story_slug}/chapters/1`}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <div
                      className="shelf-wtr-thumb"
                      style={{ background: `${w.genre_accent ?? "#C9A84C"}18` }}
                    >
                      {w.cover_url
                        ? <img src={w.cover_url} alt={w.story_title} />
                        : "📖"
                      }
                    </div>
                    <div className="shelf-wtr-body">
                      <div className="shelf-wtr-title" style={{ color: textColor }}>
                        {w.story_title}
                      </div>
                      {w.story_author && (
                        <div className="shelf-wtr-author" style={{ color: textFaint }}>
                          by {w.story_author}
                        </div>
                      )}
                    </div>
                  </a>
                  <button
                    type="button"
                    className="shelf-wtr-remove"
                    style={{ color: textFaint }}
                    onClick={() => removeFromWTR(w.id)}
                    title="Remove from list"
                    onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = textFaint)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
