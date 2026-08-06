"use client";

/**
 * GenreLandingPage.tsx
 * ─────────────────────────────────────────────────────────────────
 * Enhanced wrapper that sits ABOVE the existing genre page content.
 * It adds the personalization layer, live activity, new-this-week
 * shelf, Page AI context, and connects ReadersLetter + TTLGenreLounge.
 *
 * HOW TO USE:
 * In app/reading-room/genres/[genre]/page.tsx, replace the opening
 * section of GenrePageContent's return with:
 *
 *   <GenreLandingPage
 *     genre={genreName}
 *     genreAccent={meta.accent}
 *     genreAccentDim={meta.accentDim}
 *     genreEmoji={meta.emoji}
 *     ink={ink}
 *     onInkSpent={(amt) => setInk(v => v - amt)}
 *   >
 *     {/* existing hero + stories + authors + genre pills goes here *\/}
 *   </GenreLandingPage>
 *
 * Place at: app/components/GenreLandingPage.tsx
 *
 * TABLES USED:
 *  - chapter_unlocks  (existing)
 *  - stories          (existing)
 *  - chapters         (existing)
 *  - genre_posts      (new — see TTLGenreLounge.tsx)
 *  - reader_letters   (new — see ReadersLetter.tsx)
 *  - reading_sessions (optional — for live reader count)
 *
 * SUPABASE RPC NEEDED:
 *  get_genre_activity(p_genre text) → {
 *    live_readers: int,
 *    new_chapters_today: int,
 *    latest_chapter: { story_title, chapter_title, author_name, created_at }
 *  }
 *
 * Run this SQL:
 * ─────────────────────────────────────────────────────────────────
 * create or replace function get_genre_activity(p_genre text)
 * returns json language plpgsql security definer as $$
 * declare
 *   v_live int;
 *   v_new_today int;
 *   v_latest json;
 * begin
 *   -- approximate live readers: sessions active in last 5 mins
 *   -- (requires a reading_sessions table with last_seen timestamptz)
 *   select count(*) into v_live
 *   from reading_sessions rs
 *   join stories s on s.id = rs.story_id
 *   where s.genre = p_genre
 *     and rs.last_seen > now() - interval '5 minutes';
 *
 *   -- chapters published in this genre in last 7 days
 *   select count(*) into v_new_today
 *   from chapters c
 *   join stories s on s.id = c.story_id
 *   where s.genre = p_genre
 *     and s.is_published = true
 *     and c.created_at > now() - interval '7 days';
 *
 *   -- most recent chapter drop
 *   select json_build_object(
 *     'story_title', s.title,
 *     'chapter_title', c.title,
 *     'author_name', s.author_name,
 *     'created_at', c.created_at
 *   ) into v_latest
 *   from chapters c
 *   join stories s on s.id = c.story_id
 *   where s.genre = p_genre and s.is_published = true
 *   order by c.created_at desc limit 1;
 *
 *   return json_build_object(
 *     'live_readers',      coalesce(v_live, 0),
 *     'new_chapters_week', coalesce(v_new_today, 0),
 *     'latest_chapter',    v_latest
 *   );
 * end;
 * $$;
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import TTLGenreLounge from "@/app/components/TTLGenreLounge";
import ReadersLetter from "@/app/components/ReadersLetter";

// ─── Types ────────────────────────────────────────────────────────
interface GenreLandingPageProps {
  genre: string;
  genreAccent: string;
  genreAccentDim: string;
  genreEmoji: string;
  /** Reader's current Ink balance */
  ink: number;
  /** Called when ink is spent (tip via Reader's Letter) */
  onInkSpent?: (amount: number) => void;
  children: ReactNode;
}

interface ReaderProfile {
  name: string;
  lastStoryTitle: string | null;
  lastChapterNum: number | null;
  readingStreak: number;
  unlocksInGenre: number;
}

interface ActivityData {
  live_readers: number;
  new_chapters_week: number;
  latest_chapter: {
    story_title: string;
    chapter_title: string;
    author_name: string;
    created_at: string;
  } | null;
}

interface NewChapter {
  id: string;
  story_id: string;
  title: string;
  chapter_number: number;
  story_title: string;
  author_name: string;
  cover_url: string | null;
  story_slug: string;
  created_at: string;
}

interface LetterTarget {
  writerId: string;
  writerName: string;
  writerAvatar?: string;
}

const GLP_STYLES = `
  /* ── Welcome Strip ── */
  .glp-welcome {
    margin-bottom: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.015);
  }
  .glp-welcome-inner {
    max-width: 1600px; margin: 0 auto;
    padding: 14px 32px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }
  .glp-welcome-greeting {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.45);
    letter-spacing: 0.06em;
  }
  .glp-welcome-greeting strong {
    color: rgba(232,228,218,0.75); font-weight: 500;
  }
  .glp-welcome-streak {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--glp-accent);
    border: 1px solid var(--glp-accent-dim);
    background: var(--glp-accent-dim);
    padding: 3px 12px; border-radius: 999px;
  }
  .glp-welcome-resume {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.35);
    letter-spacing: 0.04em;
  }
  .glp-welcome-resume a {
    color: var(--glp-accent); text-decoration: none;
    border-bottom: 1px solid var(--glp-accent-dim);
    padding-bottom: 1px; transition: opacity 0.2s;
  }
  .glp-welcome-resume a:hover { opacity: 0.75; }

  /* ── Activity Ticker ── */
  .glp-ticker {
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(0,0,0,0.2);
    overflow: hidden;
  }
  .glp-ticker-inner {
    max-width: 1600px; margin: 0 auto;
    padding: 10px 32px;
    display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
  }
  .glp-ticker-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.1em;
    color: rgba(232,228,218,0.35);
  }
  .glp-ticker-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--glp-accent); opacity: 0.7;
    flex-shrink: 0;
  }
  .glp-ticker-sep {
    color: rgba(255,255,255,0.1); font-size: 14px;
  }

  /* ── New This Week ── */
  .glp-new-section {
    padding: 32px 0 0;
  }
  .glp-new-header {
    max-width: 1600px; margin: 0 auto;
    padding: 0 32px 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .glp-new-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--glp-accent); opacity: 0.7;
  }
  .glp-new-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300;
    color: rgba(232,228,218,0.85);
  }
  .glp-new-scroll {
    display: flex; gap: 12px; overflow-x: auto;
    padding: 0 32px 20px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    max-width: 1600px; margin: 0 auto;
  }
  .glp-new-scroll::-webkit-scrollbar { display: none; }
  .glp-new-card {
    flex-shrink: 0; width: 220px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; overflow: hidden;
    background: rgba(255,255,255,0.02);
    text-decoration: none;
    transition: border-color 0.2s, transform 0.2s;
    display: block;
  }
  .glp-new-card:hover {
    border-color: var(--glp-accent-dim);
    transform: translateY(-2px);
  }
  .glp-new-card-thumb {
    width: 100%; height: 110px;
    background: rgba(255,255,255,0.04);
    overflow: hidden; position: relative;
  }
  .glp-new-card-thumb img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.3s;
  }
  .glp-new-card:hover .glp-new-card-thumb img { transform: scale(1.04); }
  .glp-new-card-thumb-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
  }
  .glp-new-card-body { padding: 12px 14px; }
  .glp-new-card-ch {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--glp-accent); opacity: 0.8; margin-bottom: 4px;
  }
  .glp-new-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px; font-weight: 400;
    color: rgba(232,228,218,0.85); line-height: 1.3;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .glp-new-card-author {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.3);
  }

  /* ── Page AI ── */
  .glp-ai-fab {
    position: fixed; bottom: 28px; right: 28px; z-index: 100;
  }
  .glp-ai-btn {
    width: 52px; height: 52px; border-radius: 14px;
    background: linear-gradient(135deg, var(--glp-accent), #8a6510);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .glp-ai-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(0,0,0,0.6);
  }
  .glp-ai-panel {
    position: fixed; bottom: 92px; right: 28px; z-index: 100;
    width: 340px; max-height: 480px;
    background: #1a1410;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 16px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
  }
  .glp-ai-panel-header {
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; gap: 10px;
  }
  .glp-ai-panel-icon { font-size: 18px; }
  .glp-ai-panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 300;
    color: rgba(232,228,218,0.9); flex: 1;
  }
  .glp-ai-panel-close {
    font-family: 'Syne', sans-serif; font-size: 9px;
    color: rgba(232,228,218,0.3); background: transparent;
    border: none; cursor: pointer; padding: 0;
    transition: color 0.2s;
  }
  .glp-ai-panel-close:hover { color: rgba(232,228,218,0.7); }
  .glp-ai-messages {
    flex: 1; overflow-y: auto; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .glp-ai-msg {
    font-family: 'Syne', sans-serif; font-size: 12px;
    line-height: 1.65; max-width: 90%;
  }
  .glp-ai-msg-page {
    align-self: flex-start;
    color: rgba(232,228,218,0.7);
    background: rgba(255,255,255,0.05);
    padding: 10px 14px; border-radius: 0 10px 10px 10px;
  }
  .glp-ai-msg-user {
    align-self: flex-end;
    color: rgba(232,228,218,0.85);
    background: var(--glp-accent-dim);
    padding: 10px 14px; border-radius: 10px 0 10px 10px;
  }
  .glp-ai-msg-typing {
    align-self: flex-start;
    color: rgba(232,228,218,0.35);
    font-style: italic; font-size: 11px; padding: 6px 0;
  }
  .glp-ai-input-row {
    padding: 12px 18px;
    border-top: 1px solid rgba(255,255,255,0.07);
    display: flex; gap: 8px;
  }
  .glp-ai-input {
    flex: 1; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 8px 12px;
    font-family: 'Syne', sans-serif; font-size: 12px;
    color: rgba(232,228,218,0.8);
    outline: none; transition: border-color 0.2s;
  }
  .glp-ai-input:focus { border-color: var(--glp-accent-dim); }
  .glp-ai-input::placeholder { color: rgba(232,228,218,0.2); }
  .glp-ai-send {
    font-family: 'Syne', sans-serif; font-size: 9px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg, var(--glp-accent), #8a6510);
    border: none; padding: 8px 14px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s; white-space: nowrap;
  }
  .glp-ai-send:hover { opacity: 0.85; }
  .glp-ai-send:disabled { opacity: 0.35; cursor: default; }

  /* ── Lounge Section ── */
  .glp-lounge-section {
    padding: 56px 32px 0;
    max-width: 1600px; margin: 0 auto;
  }
  .glp-section-accent { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
  .glp-section-bar {
    width: 3px; height: 42px; border-radius: 2px; flex-shrink: 0; margin-top: 4px;
    background: linear-gradient(180deg, var(--glp-accent), transparent);
  }
  .glp-section-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--glp-accent); display: block; margin-bottom: 4px;
  }
  .glp-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 300;
    color: rgba(232,228,218,0.95); line-height: 1.1;
  }
  .glp-divider {
    height: 1px; background: rgba(255,255,255,0.07);
    margin-bottom: 24px;
  }

  /* ── Letter badge on author cards ── */
  .glp-letter-earned {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #C9A84C;
    border: 1px solid rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.06);
    padding: 2px 8px; border-radius: 999px;
    display: inline-block; margin-bottom: 10px;
    cursor: pointer; transition: background 0.2s;
  }
  .glp-letter-earned:hover { background: rgba(201,168,76,0.14); }
`;

// ─── Page AI chat hook ─────────────────────────────────────────────
interface ChatMessage { role: "page" | "user"; content: string; }

function usePageAI(genre: string) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "page",
      content: `Welcome to the ${genre} section. I'm Page — I can help you find a story, explain how Ink works, or just tell you what's been popular here lately. What are you looking for?`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = useCallback(async () => {
    if (!draft.trim() || thinking) return;
    const userMsg = draft.trim();
    setDraft("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setThinking(true);

    try {
      const systemPrompt = `You are Page, the reading assistant for The Tiniest Library's ${genre} genre section. 
You are warm, literary, and brief. You know about the platform: stories cost Ink to unlock (10 Ink per chapter), 
readers get 250 free Ink on signup, and writers keep 70-80% of revenue. 
The platform values writer copyright, authentic community, and earned connection.
Keep responses under 80 words. Be helpful and specific to ${genre} fiction.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages
              .filter(m => m.role !== "page" || messages.indexOf(m) > 0)
              .map(m => ({
                role: m.role === "page" ? "assistant" : "user",
                content: m.content,
              })),
            { role: "user", content: userMsg },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "I didn't quite catch that — try again?";
      setMessages(prev => [...prev, { role: "page", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "page", content: "Something went wrong on my end. Try again in a moment." }]);
    } finally {
      setThinking(false);
    }
  }, [draft, thinking, messages, genre]);

  return { open, setOpen, messages, draft, setDraft, send, thinking };
}

// ─── Main Component ────────────────────────────────────────────────
export default function GenreLandingPage({
  genre, genreAccent, genreAccentDim, genreEmoji,
  ink, onInkSpent, children,
}: GenreLandingPageProps) {
  const [profile, setProfile] = useState<ReaderProfile | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [newChapters, setNewChapters] = useState<NewChapter[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [earnedLetterWriters, setEarnedLetterWriters] = useState<Set<string>>(new Set());
  const [letterTarget, setLetterTarget] = useState<LetterTarget | null>(null);
  const pageAI = usePageAI(genre);

  // ── Auth ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // ── Reader profile in this genre ────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    async function loadProfile() {
      try {
        // Get reader's name
        const { data: writer } = await supabase
          .from("writers")
          .select("name")
          .eq("user_id", userId)
          .maybeSingle();

        // Get unlocks in this genre
        const { data: unlocks } = await supabase
          .from("chapter_unlocks")
          .select("chapter_id, chapters(story_id, chapter_number, stories(genre, title, author_name))")
          .eq("user_id", userId);

        const genreUnlocks = (unlocks ?? []).filter((u: any) =>
          u.chapters?.stories?.genre === genre
        );

        // Most recent unlock in genre
        const lastUnlock = genreUnlocks[genreUnlocks.length - 1] as any;

        // Reading streak (simplified: days with any unlock in last 30 days)
        const { data: recentUnlocks } = await supabase
          .from("chapter_unlocks")
          .select("created_at")
          .eq("user_id", userId)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("created_at", { ascending: false });

        const uniqueDays = new Set(
          (recentUnlocks ?? []).map((u: any) =>
            new Date(u.created_at).toDateString()
          )
        );

        setProfile({
          name: writer?.name ?? "Reader",
          lastStoryTitle: lastUnlock?.chapters?.stories?.title ?? null,
          lastChapterNum: lastUnlock?.chapters?.chapter_number ?? null,
          readingStreak: uniqueDays.size,
          unlocksInGenre: genreUnlocks.length,
        });
      } catch (err) {
        console.error("GenreLandingPage profile error:", err);
      }
    }
    loadProfile();
  }, [userId, genre]);

  // ── Genre activity ───────────────────────────────────────────────
  useEffect(() => {
    supabase.rpc("get_genre_activity", { p_genre: genre })
      .then(({ data }) => { if (data) setActivity(data as ActivityData); });
  }, [genre]);

  // ── New chapters this week ───────────────────────────────────────
  useEffect(() => {
    supabase
      .from("chapters")
      .select(`
        id, title, chapter_number, story_id, created_at,
        stories(title, author_name, cover_url, slug, genre, is_published)
      `)
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        const filtered = (data ?? []).filter(
          (c: any) => c.stories?.genre === genre && c.stories?.is_published
        );
        setNewChapters(filtered.map((c: any) => ({
          id: c.id,
          story_id: c.story_id,
          title: c.title,
          chapter_number: c.chapter_number,
          story_title: c.stories?.title ?? "",
          author_name: c.stories?.author_name ?? "",
          cover_url: c.stories?.cover_url ?? null,
          story_slug: c.stories?.slug ?? c.story_id,
          created_at: c.created_at,
        })));
      });
  }, [genre]);

  // ── Check which writers reader has earned a letter for ──────────
  useEffect(() => {
    if (!userId) return;
    // Get all writers whose stories the reader has unlocked ≥3 chapters from
    supabase
      .from("chapter_unlocks")
      .select("chapters(story_id, stories(author_id))")
      .eq("user_id", userId)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((u: any) => {
          const authorId = u.chapters?.stories?.author_id;
          if (authorId) counts[authorId] = (counts[authorId] ?? 0) + 1;
        });
        const earned = new Set(
          Object.entries(counts)
            .filter(([, count]) => count >= 3)
            .map(([id]) => id)
        );
        setEarnedLetterWriters(earned);
      });
  }, [userId]);

  const timeAgoShort = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <>
      <style>{GLP_STYLES}</style>
      <div style={{ "--glp-accent": genreAccent, "--glp-accent-dim": genreAccentDim } as React.CSSProperties}>

        {/* ── Personalized Welcome Strip ────────────────────────── */}
        {profile && (
          <div className="glp-welcome">
            <div className="glp-welcome-inner">
              <div>
                <div className="glp-welcome-greeting">
                  Welcome back, <strong>{profile.name}</strong>
                  {profile.unlocksInGenre > 0 && (
                    <span style={{ color: "rgba(232,228,218,0.35)", marginLeft: 8 }}>
                      · {profile.unlocksInGenre} chapter{profile.unlocksInGenre !== 1 ? "s" : ""} unlocked in {genre}
                    </span>
                  )}
                </div>
                {profile.lastStoryTitle && profile.lastChapterNum && (
                  <div className="glp-welcome-resume" style={{ marginTop: 4 }}>
                    Resume:{" "}
                    <a href={`/reading-room/stories/${profile.lastStoryTitle?.toLowerCase().replace(/\s+/g, "-")}/chapters/${profile.lastChapterNum}`}>
                      {profile.lastStoryTitle} — Chapter {profile.lastChapterNum}
                    </a>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {profile.readingStreak > 1 && (
                  <span className="glp-welcome-streak">
                    🔥 {profile.readingStreak}-day streak
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Activity Ticker ──────────────────────────────── */}
        {activity && (
          <div className="glp-ticker">
            <div className="glp-ticker-inner">
              {activity.live_readers > 0 && (
                <span className="glp-ticker-pill">
                  <span className="glp-ticker-dot" />
                  {activity.live_readers} reading now
                </span>
              )}
              {activity.live_readers > 0 && activity.new_chapters_week > 0 && (
                <span className="glp-ticker-sep">·</span>
              )}
              {activity.new_chapters_week > 0 && (
                <span className="glp-ticker-pill">
                  <span className="glp-ticker-dot" />
                  {activity.new_chapters_week} new chapter{activity.new_chapters_week !== 1 ? "s" : ""} this week
                </span>
              )}
              {activity.latest_chapter && (
                <>
                  <span className="glp-ticker-sep">·</span>
                  <span className="glp-ticker-pill">
                    <span className="glp-ticker-dot" />
                    Latest: <span style={{ color: "rgba(232,228,218,0.5)", marginLeft: 4 }}>
                      {activity.latest_chapter.story_title} by {activity.latest_chapter.author_name}
                    </span>
                    <span style={{ color: "rgba(232,228,218,0.2)", marginLeft: 4 }}>
                      · {timeAgoShort(activity.latest_chapter.created_at)} ago
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── New This Week shelf ───────────────────────────────── */}
        {newChapters.length > 0 && (
          <div className="glp-new-section">
            <div className="glp-new-header">
              <div>
                <span className="glp-new-eyebrow">Fresh Drops</span>
                <div className="glp-new-title">New in {genre} This Week</div>
              </div>
            </div>
            <div className="glp-new-scroll">
              {newChapters.map(ch => (
                <a
                  key={ch.id}
                  href={`/reading-room/stories/${ch.story_slug}/chapters/${ch.chapter_number}`}
                  className="glp-new-card"
                >
                  <div className="glp-new-card-thumb">
                    {ch.cover_url
                      ? <img src={ch.cover_url} alt={ch.story_title} />
                      : <div className="glp-new-card-thumb-fallback">{genreEmoji}</div>
                    }
                  </div>
                  <div className="glp-new-card-body">
                    <div className="glp-new-card-ch">Chapter {ch.chapter_number}</div>
                    <div className="glp-new-card-title">{ch.story_title}</div>
                    <div className="glp-new-card-author">by {ch.author_name}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Existing page content (hero, stories, authors, etc.) ─ */}
        {/*
          Author cards inside children can trigger Reader's Letter.
          Pass earnedLetterWriters down via context or
          add a data attribute to author cards and intercept clicks.
          
          For a clean integration, author cards should call:
          window.dispatchEvent(new CustomEvent('open-readers-letter', {
            detail: { writerId, writerName, writerAvatar }
          }))
          
          This component listens for that event below.
        */}
        {children}

        {/* ── Genre Lounge ─────────────────────────────────────── */}
        <div className="glp-lounge-section">
          <div className="glp-section-accent">
            <div className="glp-section-bar" />
            <div>
              <span className="glp-section-eyebrow">Community</span>
              <div className="glp-section-title">{genre} Lounge</div>
            </div>
          </div>
          <div className="glp-divider" />
          <TTLGenreLounge
            genre={genre}
            genreAccent={genreAccent}
            genreAccentDim={genreAccentDim}
          />
        </div>

        {/* ── Page AI FAB ───────────────────────────────────────── */}
        <div className="glp-ai-fab">
          {pageAI.open && (
            <div className="glp-ai-panel">
              <div className="glp-ai-panel-header">
                <span className="glp-ai-panel-icon">📖</span>
                <span className="glp-ai-panel-title">Page · {genre}</span>
                <button
                  type="button"
                  className="glp-ai-panel-close"
                  onClick={() => pageAI.setOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="glp-ai-messages">
                {pageAI.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`glp-ai-msg ${m.role === "page" ? "glp-ai-msg-page" : "glp-ai-msg-user"}`}
                  >
                    {m.content}
                  </div>
                ))}
                {pageAI.thinking && (
                  <div className="glp-ai-msg glp-ai-msg-typing">Page is thinking…</div>
                )}
              </div>
              <div className="glp-ai-input-row">
                <input
                  type="text"
                  className="glp-ai-input"
                  placeholder="Ask Page anything…"
                  value={pageAI.draft}
                  onChange={e => pageAI.setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") pageAI.send(); }}
                />
                <button
                  type="button"
                  className="glp-ai-send"
                  onClick={pageAI.send}
                  disabled={!pageAI.draft.trim() || pageAI.thinking}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            className="glp-ai-btn"
            onClick={() => pageAI.setOpen(v => !v)}
            title="Ask Page"
            aria-label="Open Page AI assistant"
          >
            📖
          </button>
        </div>

        {/* ── Reader's Letter modal ─────────────────────────────── */}
        <LetterEventListener
          userId={userId}
          ink={ink}
          onInkSpent={onInkSpent}
          letterTarget={letterTarget}
          setLetterTarget={setLetterTarget}
          earnedLetterWriters={earnedLetterWriters}
        />

      </div>
    </>
  );
}

// ─── Letter Event Listener ────────────────────────────────────────
// Listens for custom events dispatched by author cards
// so ReadersLetter can be triggered from anywhere inside children.
// Author card usage:
//   window.dispatchEvent(new CustomEvent('open-readers-letter', {
//     detail: { writerId: 'uuid', writerName: 'Chris Knopf', writerAvatar: 'url' }
//   }))
function LetterEventListener({
  userId, ink, onInkSpent, letterTarget, setLetterTarget, earnedLetterWriters,
}: {
  userId: string | null;
  ink: number;
  onInkSpent?: (amt: number) => void;
  letterTarget: LetterTarget | null;
  setLetterTarget: (t: LetterTarget | null) => void;
  earnedLetterWriters: Set<string>;
}) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as LetterTarget;
      if (detail?.writerId) setLetterTarget(detail);
    };
    window.addEventListener("open-readers-letter", handler);
    return () => window.removeEventListener("open-readers-letter", handler);
  }, [setLetterTarget]);

  if (!letterTarget || !userId) return null;

  return (
    <ReadersLetter
      writerId={letterTarget.writerId}
      writerName={letterTarget.writerName}
      writerAvatar={letterTarget.writerAvatar}
      readerInk={ink}
      onInkSpent={onInkSpent}
      open={Boolean(letterTarget)}
      onClose={() => setLetterTarget(null)}
    />
  );
}
