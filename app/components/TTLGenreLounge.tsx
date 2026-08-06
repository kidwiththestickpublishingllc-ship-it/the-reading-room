"use client";

/**
 * TTLGenreLounge.tsx
 * ─────────────────────────────────────────────────────────────────
 * Genre-scoped community space. Drop below the stories grid on any
 * genre landing page.
 * Place at: app/components/TTLGenreLounge.tsx
 *
 * DESIGN PRINCIPLES:
 *  • Recency-ordered, no algorithm. Follows = chronological.
 *  • No ads in the feed. Ever.
 *  • Gate: must have at least 1 Ink purchase to post (real person filter)
 *  • 5 posts/day for readers, 10/day for writers (DB enforced)
 *  • Writers get a "Writer" badge — community anchors
 *  • Readers can flag posts — TTL reviews centrally
 *  • Realtime: new posts appear live via Supabase channel
 *  • No DMs here — social is public and topical only
 *
 * TABLES NEEDED (Supabase):
 * ─────────────────────────────────────────────────────────────────
 * create table genre_posts (
 *   id uuid primary key default gen_random_uuid(),
 *   genre text not null,
 *   author_id uuid references auth.users not null,
 *   author_name text not null,
 *   author_is_writer boolean default false,
 *   body text not null check (char_length(body) between 1 and 600),
 *   flagged boolean default false,
 *   flag_count int default 0,
 *   created_at timestamptz default now()
 * );
 * alter table genre_posts enable row level security;
 * create policy "anyone can read unflagged posts"
 *   on genre_posts for select
 *   using (not flagged);
 * create policy "authed users can insert"
 *   on genre_posts for insert
 *   with check (auth.uid() = author_id);
 *
 * create table genre_post_flags (
 *   id uuid primary key default gen_random_uuid(),
 *   post_id uuid references genre_posts not null,
 *   flagger_id uuid references auth.users not null,
 *   created_at timestamptz default now(),
 *   unique(post_id, flagger_id)
 * );
 * alter table genre_post_flags enable row level security;
 * create policy "authed users can flag"
 *   on genre_post_flags for insert
 *   with check (auth.uid() = flagger_id);
 *
 * -- RPC: check if reader can post (has ink purchase, daily limit)
 * create or replace function can_post_in_lounge(
 *   p_user_id uuid,
 *   p_genre text
 * ) returns json language plpgsql security definer as $$
 * declare
 *   v_has_purchase bool;
 *   v_is_writer bool;
 *   v_daily_limit int;
 *   v_posts_today int;
 * begin
 *   -- must have at least one ink purchase
 *   select exists(
 *     select 1 from ink_purchases where user_id = p_user_id limit 1
 *   ) into v_has_purchase;
 *
 *   -- is this person a writer?
 *   select exists(
 *     select 1 from writers where user_id = p_user_id and status = 'approved' limit 1
 *   ) into v_is_writer;
 *
 *   v_daily_limit := case when v_is_writer then 10 else 5 end;
 *
 *   -- posts today in any genre lounge
 *   select count(*) into v_posts_today
 *   from genre_posts
 *   where author_id = p_user_id
 *     and created_at > now() - interval '24 hours';
 *
 *   return json_build_object(
 *     'can_post',     v_has_purchase and v_posts_today < v_daily_limit,
 *     'has_purchase', v_has_purchase,
 *     'is_writer',    v_is_writer,
 *     'posts_today',  v_posts_today,
 *     'daily_limit',  v_daily_limit,
 *     'remaining',    greatest(0, v_daily_limit - v_posts_today)
 *   );
 * end;
 * $$;
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────
interface Post {
  id: string;
  genre: string;
  author_id: string;
  author_name: string;
  author_is_writer: boolean;
  body: string;
  flagged: boolean;
  flag_count: number;
  created_at: string;
}

interface PostPermission {
  can_post: boolean;
  has_purchase: boolean;
  is_writer: boolean;
  posts_today: number;
  daily_limit: number;
  remaining: number;
}

interface TTLGenreLoungeProps {
  genre: string;          // e.g. "Fantasy"
  genreAccent: string;    // e.g. "#8B5CF6"
  genreAccentDim: string; // e.g. "rgba(139,92,246,0.2)"
}

const MAX_POST = 600;
const LOUNGE_STYLES = `
  .lounge-root {
    margin-top: 0;
  }
  .lounge-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 24px; flex-wrap: wrap;
  }
  .lounge-title-row { display: flex; align-items: center; gap: 10px; }
  .lounge-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--lounge-accent);
    box-shadow: 0 0 6px var(--lounge-accent);
    animation: lounge-pulse 2s ease-in-out infinite;
  }
  @keyframes lounge-pulse {
    0%,100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  .lounge-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: rgba(232,228,218,0.95); line-height: 1.1;
  }
  .lounge-subtitle {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.35);
    line-height: 1.65; margin-top: 4px;
    max-width: 400px;
  }
  .lounge-count-pill {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--lounge-accent);
    border: 1px solid var(--lounge-accent-dim);
    background: var(--lounge-accent-dim);
    padding: 4px 12px; border-radius: 999px;
    white-space: nowrap; align-self: flex-start; margin-top: 4px;
  }

  /* Compose box */
  .lounge-compose {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; overflow: hidden;
    background: rgba(255,255,255,0.02);
    margin-bottom: 24px; transition: border-color 0.2s;
  }
  .lounge-compose:focus-within {
    border-color: var(--lounge-accent-dim);
  }
  .lounge-compose-inner { padding: 16px 18px; }
  .lounge-compose-textarea {
    width: 100%; background: transparent;
    border: none; outline: none; resize: none;
    font-family: 'Syne', sans-serif;
    font-size: 13px; color: rgba(232,228,218,0.8);
    line-height: 1.65; min-height: 80px;
    box-sizing: border-box;
  }
  .lounge-compose-textarea::placeholder { color: rgba(232,228,218,0.2); }
  .lounge-compose-footer {
    padding: 10px 18px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .lounge-compose-meta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.25);
  }
  .lounge-post-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg, var(--lounge-accent), var(--lounge-accent-dark, #5a3db8));
    border: none; padding: 8px 20px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .lounge-post-btn:hover { opacity: 0.85; }
  .lounge-post-btn:disabled { opacity: 0.3; cursor: default; }

  /* Gate message */
  .lounge-gate {
    padding: 16px 18px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; margin-bottom: 24px;
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: rgba(232,228,218,0.35);
    line-height: 1.65;
  }
  .lounge-gate a {
    color: var(--lounge-accent); text-decoration: none;
  }
  .lounge-gate a:hover { text-decoration: underline; }

  /* Feed */
  .lounge-feed { display: flex; flex-direction: column; gap: 10px; }

  /* Post card */
  .lounge-post {
    padding: 16px 18px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    background: rgba(255,255,255,0.015);
    transition: border-color 0.2s;
  }
  .lounge-post:hover { border-color: rgba(255,255,255,0.12); }
  .lounge-post-header {
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px;
    margin-bottom: 10px;
  }
  .lounge-post-author-row { display: flex; align-items: center; gap: 8px; }
  .lounge-post-author {
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 500;
    color: rgba(232,228,218,0.75); letter-spacing: 0.04em;
  }
  .lounge-writer-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--lounge-accent);
    border: 1px solid var(--lounge-accent-dim);
    background: var(--lounge-accent-dim);
    padding: 2px 8px; border-radius: 999px;
  }
  .lounge-post-time {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.2);
  }
  .lounge-post-body {
    font-family: 'Syne', sans-serif;
    font-size: 13px; color: rgba(232,228,218,0.65);
    line-height: 1.7;
  }
  .lounge-post-actions {
    display: flex; gap: 10px; margin-top: 12px; align-items: center;
  }
  .lounge-flag-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(232,228,218,0.2);
    background: transparent; border: none;
    cursor: pointer; padding: 0; transition: color 0.2s;
  }
  .lounge-flag-btn:hover { color: rgba(255,80,80,0.6); }
  .lounge-flag-btn.flagged { color: rgba(255,80,80,0.5); cursor: default; }

  /* Empty */
  .lounge-empty {
    padding: 40px 24px; text-align: center;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    background: rgba(255,255,255,0.01);
  }
  .lounge-empty-icon { font-size: 32px; display: block; margin-bottom: 12px; }
  .lounge-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300;
    color: rgba(232,228,218,0.7); margin-bottom: 6px;
  }
  .lounge-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.3);
    line-height: 1.7;
  }

  /* Loading */
  .lounge-loading {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.25);
    text-align: center; padding: 32px 0; letter-spacing: 0.1em;
  }

  /* Notice bar */
  .lounge-notice {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.1em;
    color: rgba(232,228,218,0.3);
    padding: 10px 14px; margin-bottom: 16px;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; background: rgba(255,255,255,0.01);
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────
export default function TTLGenreLounge({
  genre, genreAccent, genreAccentDim
}: TTLGenreLoungeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftBody, setDraftBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [permission, setPermission] = useState<PostPermission | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isWriter, setIsWriter] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);

      // Get display name from writers or profiles table
      const { data: writer } = await supabase
        .from("writers")
        .select("name, status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (writer) {
        setUserName(writer.name ?? data.user.email ?? "Reader");
        setIsWriter(writer.status === "approved");
      } else {
        setUserName(data.user.email?.split("@")[0] ?? "Reader");
      }
    });
  }, []);

  // ── Check post permission ──────────────────────────────────────
  const checkPermission = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.rpc("can_post_in_lounge", {
      p_user_id: userId,
      p_genre: genre,
    });
    if (data) setPermission(data as PostPermission);
  }, [userId, genre]);

  useEffect(() => { checkPermission(); }, [checkPermission]);

  // ── Load posts ────────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("genre_posts")
      .select("*")
      .eq("genre", genre)
      .eq("flagged", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }, [genre]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // ── Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`genre-lounge-${genre}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "genre_posts",
          filter: `genre=eq.${genre}`,
        },
        (payload) => {
          const newPost = payload.new as Post;
          if (!newPost.flagged) {
            setPosts(prev => [newPost, ...prev]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [genre]);

  // ── Post ──────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!userId || !draftBody.trim() || posting) return;
    setPosting(true);
    try {
      await supabase.from("genre_posts").insert({
        genre,
        author_id: userId,
        author_name: userName,
        author_is_writer: isWriter,
        body: draftBody.trim(),
      });
      setDraftBody("");
      await checkPermission();
    } finally {
      setPosting(false);
    }
  };

  // ── Flag ──────────────────────────────────────────────────────
  const handleFlag = async (postId: string) => {
    if (!userId || flagged.has(postId)) return;
    setFlagged(prev => new Set(prev).add(postId));
    await supabase.from("genre_post_flags").insert({
      post_id: postId,
      flagger_id: userId,
    });
    // Increment flag count locally
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, flag_count: p.flag_count + 1 } : p
    ));
  };

  const canPost = permission?.can_post && draftBody.trim().length > 0 && !posting;

  return (
    <>
      <style>{LOUNGE_STYLES}</style>
      <div
        className="lounge-root"
        style={{
          "--lounge-accent": genreAccent,
          "--lounge-accent-dim": genreAccentDim,
          "--lounge-accent-dark": genreAccent,
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="lounge-header">
          <div>
            <div className="lounge-title-row">
              <div className="lounge-live-dot" />
              <div className="lounge-title">{genre} Lounge</div>
            </div>
            <div className="lounge-subtitle">
              A space for readers and writers in this genre.
              Recency-ordered. No algorithm. No ads.
            </div>
          </div>
          <span className="lounge-count-pill">
            {posts.length} post{posts.length !== 1 ? "s" : ""} · Live
          </span>
        </div>

        {/* Compose or gate */}
        {!userId ? (
          <div className="lounge-gate">
            <a href="/reading-room/login">Sign in</a> to join the conversation.
          </div>
        ) : !permission ? null : !permission.has_purchase ? (
          <div className="lounge-gate">
            Unlock at least one chapter to post in the Lounge —
            it keeps the conversation genuine.{" "}
            <a href="/reading-room/stories">Browse stories →</a>
          </div>
        ) : (
          <>
            {permission.remaining === 0 ? (
              <div className="lounge-notice">
                You've reached your {permission.daily_limit} post{permission.daily_limit !== 1 ? "s" : ""} for today.
                Come back tomorrow — good thoughts keep.
              </div>
            ) : (
              <div className="lounge-compose">
                <div className="lounge-compose-inner">
                  <textarea
                    className="lounge-compose-textarea"
                    placeholder={`What's on your mind in ${genre}? A story rec, a thought, a question for writers…`}
                    value={draftBody}
                    onChange={e => setDraftBody(e.target.value.slice(0, MAX_POST))}
                    rows={3}
                  />
                </div>
                <div className="lounge-compose-footer">
                  <span className="lounge-compose-meta">
                    {draftBody.length}/{MAX_POST} ·{" "}
                    {permission.remaining} post{permission.remaining !== 1 ? "s" : ""} left today
                    {isWriter && " · Writer"}
                  </span>
                  <button
                    type="button"
                    className="lounge-post-btn"
                    disabled={!canPost}
                    onClick={handlePost}
                  >
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Feed */}
        {loading ? (
          <div className="lounge-loading">Loading the lounge…</div>
        ) : posts.length === 0 ? (
          <div className="lounge-empty">
            <span className="lounge-empty-icon">🪑</span>
            <div className="lounge-empty-title">The lounge is quiet.</div>
            <p className="lounge-empty-text">
              Be the first to say something in {genre}.
              Readers and writers are waiting for the conversation to start.
            </p>
          </div>
        ) : (
          <div className="lounge-feed">
            {posts.map(post => (
              <div key={post.id} className="lounge-post">
                <div className="lounge-post-header">
                  <div className="lounge-post-author-row">
                    <span className="lounge-post-author">{post.author_name}</span>
                    {post.author_is_writer && (
                      <span className="lounge-writer-badge">Writer</span>
                    )}
                  </div>
                  <span className="lounge-post-time">{timeAgo(post.created_at)}</span>
                </div>
                <div className="lounge-post-body">{post.body}</div>
                <div className="lounge-post-actions">
                  {userId && userId !== post.author_id && (
                    <button
                      type="button"
                      className={`lounge-flag-btn${flagged.has(post.id) ? " flagged" : ""}`}
                      onClick={() => handleFlag(post.id)}
                      disabled={flagged.has(post.id)}
                      title="Flag for review"
                    >
                      {flagged.has(post.id) ? "Flagged" : "Flag"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
