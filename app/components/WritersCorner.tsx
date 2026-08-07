"use client";

/**
 * WritersCorner.tsx
 * ─────────────────────────────────────────────────────────────────
 * Pinned writer presence card inside the Genre Lounge.
 * Writers post a status update ("Writing Chapter 12 this week —
 * ask me anything") and readers reply in a thread below it.
 *
 * Replaces the empty state when an active writer is present.
 * Multiple writers can have active corners in the same genre.
 *
 * Place at: app/components/WritersCorner.tsx
 *
 * HOW TO USE in TTLGenreLounge.tsx:
 * Import and render above the main feed:
 *   <WritersCorner genre={genre} genreAccent={genreAccent} genreAccentDim={genreAccentDim} />
 *
 * TABLES NEEDED (Supabase):
 * ─────────────────────────────────────────────────────────────────
 * create table writer_corner_posts (
 *   id uuid primary key default gen_random_uuid(),
 *   genre text not null,
 *   writer_id uuid references auth.users not null,
 *   writer_name text not null,
 *   writer_avatar text,
 *   status_text text not null check (char_length(status_text) between 1 and 280),
 *   is_active boolean default true,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * );
 * alter table writer_corner_posts enable row level security;
 * create policy "anyone can read active corner posts"
 *   on writer_corner_posts for select using (is_active = true);
 * create policy "writers can insert their own"
 *   on writer_corner_posts for insert
 *   with check (auth.uid() = writer_id);
 * create policy "writers can update their own"
 *   on writer_corner_posts for update
 *   using (auth.uid() = writer_id);
 *
 * create table writer_corner_replies (
 *   id uuid primary key default gen_random_uuid(),
 *   corner_post_id uuid references writer_corner_posts not null,
 *   author_id uuid references auth.users not null,
 *   author_name text not null,
 *   author_is_writer boolean default false,
 *   body text not null check (char_length(body) between 1 and 400),
 *   created_at timestamptz default now()
 * );
 * alter table writer_corner_replies enable row level security;
 * create policy "anyone can read replies"
 *   on writer_corner_replies for select using (true);
 * create policy "authed users can reply"
 *   on writer_corner_replies for insert
 *   with check (auth.uid() = author_id);
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────
interface CornerPost {
  id: string;
  genre: string;
  writer_id: string;
  writer_name: string;
  writer_avatar: string | null;
  status_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CornerReply {
  id: string;
  corner_post_id: string;
  author_id: string;
  author_name: string;
  author_is_writer: boolean;
  body: string;
  created_at: string;
}

interface WritersCornerProps {
  genre: string;
  genreAccent: string;
  genreAccentDim: string;
}

const MAX_REPLY = 400;
const MAX_STATUS = 280;

const WC_STYLES = `
  .wc-root { margin-bottom: 32px; }

  /* ── Writer's Corner header ── */
  .wc-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }
  .wc-header-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--wc-accent); opacity: 0.75;
  }
  .wc-header-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, var(--wc-accent-dim), transparent);
  }

  /* ── Corner card ── */
  .wc-card {
    border: 1px solid var(--wc-accent-dim);
    border-radius: 14px; overflow: hidden;
    background: rgba(255,255,255,0.02);
    margin-bottom: 12px;
  }
  .wc-card-accent {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--wc-accent), transparent);
  }
  .wc-card-body { padding: 20px 22px; }

  /* Writer identity */
  .wc-writer-row {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 14px;
  }
  .wc-avatar {
    width: 44px; height: 44px; border-radius: 10px;
    background: linear-gradient(135deg, #1e1e26, #2a2a38);
    border: 1px solid var(--wc-accent-dim);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
  }
  .wc-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .wc-avatar-init {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 300; color: var(--wc-accent);
  }
  .wc-writer-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 400;
    color: rgba(232,228,218,0.9); line-height: 1.2;
  }
  .wc-writer-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--wc-accent);
    border: 1px solid var(--wc-accent-dim);
    background: var(--wc-accent-dim);
    padding: 2px 8px; border-radius: 999px;
    display: inline-block; margin-top: 3px;
  }
  .wc-writer-time {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.2);
    margin-left: auto; flex-shrink: 0;
  }

  /* Status text */
  .wc-status {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.75); line-height: 1.65;
    margin-bottom: 16px;
  }

  /* Replies */
  .wc-replies { border-top: 1px solid rgba(255,255,255,0.06); }
  .wc-reply-count {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(232,228,218,0.25);
    padding: 10px 22px;
    cursor: pointer; transition: color 0.2s;
    display: flex; align-items: center; gap: 8px;
  }
  .wc-reply-count:hover { color: rgba(232,228,218,0.5); }
  .wc-reply-count-arrow { font-size: 10px; transition: transform 0.2s; }
  .wc-reply-count-arrow.open { transform: rotate(180deg); }

  .wc-reply-list { padding: 0 22px 16px; display: flex; flex-direction: column; gap: 10px; }
  .wc-reply {
    padding: 10px 14px;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    background: rgba(255,255,255,0.015);
  }
  .wc-reply-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
  }
  .wc-reply-author {
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 500;
    color: rgba(232,228,218,0.65);
  }
  .wc-reply-writer-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--wc-accent);
    border: 1px solid var(--wc-accent-dim);
    background: var(--wc-accent-dim);
    padding: 1px 7px; border-radius: 999px;
  }
  .wc-reply-time {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.2);
    margin-left: auto;
  }
  .wc-reply-body {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: rgba(232,228,218,0.55);
    line-height: 1.65;
  }

  /* Reply compose */
  .wc-compose {
    padding: 12px 22px 18px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .wc-compose-textarea {
    width: 100%; background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 10px 14px;
    font-family: 'Syne', sans-serif; font-size: 12px;
    color: rgba(232,228,218,0.75); line-height: 1.6;
    resize: none; box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .wc-compose-textarea:focus {
    outline: none; border-color: var(--wc-accent-dim);
  }
  .wc-compose-textarea::placeholder { color: rgba(232,228,218,0.2); }
  .wc-compose-footer {
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px;
    margin-top: 8px;
  }
  .wc-compose-meta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.2);
  }
  .wc-reply-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg, var(--wc-accent), #8a6510);
    border: none; padding: 7px 18px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .wc-reply-btn:hover { opacity: 0.85; }
  .wc-reply-btn:disabled { opacity: 0.3; cursor: default; }

  /* Writer's own compose box */
  .wc-writer-compose {
    border: 1px dashed var(--wc-accent-dim);
    border-radius: 14px; padding: 20px 22px;
    margin-bottom: 12px;
    background: rgba(255,255,255,0.01);
  }
  .wc-writer-compose-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--wc-accent); opacity: 0.7; margin-bottom: 10px;
  }
  .wc-writer-compose-textarea {
    width: 100%; background: transparent;
    border: none; outline: none; resize: none;
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.65); line-height: 1.65;
    box-sizing: border-box;
  }
  .wc-writer-compose-textarea::placeholder {
    color: rgba(232,228,218,0.2); font-style: italic;
  }
  .wc-writer-compose-footer {
    display: flex; align-items: center;
    justify-content: space-between; margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  /* Gate */
  .wc-gate {
    font-family: 'Syne', sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.3); padding: 10px 0;
  }
  .wc-gate a { color: var(--wc-accent); text-decoration: none; }

  /* Loading */
  .wc-loading {
    font-family: 'Syne', sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.25); padding: 16px 0;
    letter-spacing: 0.1em;
  }
`;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Single Corner Card ───────────────────────────────────────────
function CornerCard({
  post, userId, userName, isWriter, genreAccent, genreAccentDim,
}: {
  post: CornerPost;
  userId: string | null;
  userName: string;
  isWriter: boolean;
  genreAccent: string;
  genreAccentDim: string;
}) {
  const [replies, setReplies] = useState<CornerReply[]>([]);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyCount, setReplyCount] = useState(0);

  // Load reply count
  useEffect(() => {
    supabase
      .from("writer_corner_replies")
      .select("id", { count: "exact", head: true })
      .eq("corner_post_id", post.id)
      .then(({ count }) => setReplyCount(count ?? 0));
  }, [post.id]);

  // Load replies when expanded
  useEffect(() => {
    if (!repliesOpen) return;
    supabase
      .from("writer_corner_replies")
      .select("*")
      .eq("corner_post_id", post.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setReplies(data as CornerReply[]); });
  }, [repliesOpen, post.id]);

  const handleReply = async () => {
    if (!userId || !draft.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await supabase
        .from("writer_corner_replies")
        .insert({
          corner_post_id: post.id,
          author_id: userId,
          author_name: userName,
          author_is_writer: isWriter,
          body: draft.trim(),
        })
        .select()
        .single();
      if (data) {
        setReplies(prev => [...prev, data as CornerReply]);
        setReplyCount(c => c + 1);
        setDraft("");
        setRepliesOpen(true);
      }
    } finally {
      setPosting(false);
    }
  };

  const initial = post.writer_name.split(" ")[1]?.[0] ?? post.writer_name[0];

  return (
    <div className="wc-card">
      <div className="wc-card-accent" />
      <div className="wc-card-body">
        <div className="wc-writer-row">
          <div className="wc-avatar">
            {post.writer_avatar
              ? <img src={post.writer_avatar} alt={post.writer_name} />
              : <span className="wc-avatar-init">{initial}</span>
            }
          </div>
          <div>
            <div className="wc-writer-name">{post.writer_name}</div>
            <span className="wc-writer-badge">Writer</span>
          </div>
          <span className="wc-writer-time">{timeAgo(post.updated_at)}</span>
        </div>
        <div className="wc-status">"{post.status_text}"</div>
      </div>

      {/* Replies toggle */}
      <div className="wc-replies">
        <div
          className="wc-reply-count"
          role="button"
          tabIndex={0}
          onClick={() => setRepliesOpen(v => !v)}
          onKeyDown={e => { if (e.key === "Enter") setRepliesOpen(v => !v); }}
        >
          {replyCount > 0
            ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
            : "No replies yet — be the first"
          }
          <span className={`wc-reply-count-arrow${repliesOpen ? " open" : ""}`}>▾</span>
        </div>

        {repliesOpen && (
          <>
            {replies.length > 0 && (
              <div className="wc-reply-list">
                {replies.map(r => (
                  <div key={r.id} className="wc-reply">
                    <div className="wc-reply-header">
                      <span className="wc-reply-author">{r.author_name}</span>
                      {r.author_is_writer && (
                        <span className="wc-reply-writer-badge">Writer</span>
                      )}
                      <span className="wc-reply-time">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="wc-reply-body">{r.body}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply compose */}
            <div className="wc-compose">
              {!userId ? (
                <div className="wc-gate">
                  <a href="/reading-room/login">Sign in</a> to reply.
                </div>
              ) : (
                <>
                  <textarea
                    className="wc-compose-textarea"
                    placeholder={`Reply to ${post.writer_name}…`}
                    value={draft}
                    onChange={e => setDraft(e.target.value.slice(0, MAX_REPLY))}
                    rows={2}
                  />
                  <div className="wc-compose-footer">
                    <span className="wc-compose-meta">
                      {draft.length}/{MAX_REPLY}
                    </span>
                    <button
                      type="button"
                      className="wc-reply-btn"
                      disabled={!draft.trim() || posting}
                      onClick={handleReply}
                    >
                      {posting ? "Posting…" : "Reply"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Writer's own compose box ─────────────────────────────────────
function WriterComposeBox({
  genre, userId, userName, writerAvatar, onPosted, genreAccent, genreAccentDim,
}: {
  genre: string;
  userId: string;
  userName: string;
  writerAvatar: string | null;
  onPosted: (post: CornerPost) => void;
  genreAccent: string;
  genreAccentDim: string;
}) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      // Deactivate any previous corner post by this writer in this genre
      await supabase
        .from("writer_corner_posts")
        .update({ is_active: false })
        .eq("writer_id", userId)
        .eq("genre", genre);

      const { data } = await supabase
        .from("writer_corner_posts")
        .insert({
          genre,
          writer_id: userId,
          writer_name: userName,
          writer_avatar: writerAvatar,
          status_text: draft.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (data) {
        onPosted(data as CornerPost);
        setDraft("");
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="wc-writer-compose">
      <div className="wc-writer-compose-label">
        Post to your Writer's Corner in {genre}
      </div>
      <textarea
        className="wc-writer-compose-textarea"
        placeholder="What are you working on? Share a status, ask readers a question, or start a conversation…"
        value={draft}
        onChange={e => setDraft(e.target.value.slice(0, MAX_STATUS))}
        rows={3}
      />
      <div className="wc-writer-compose-footer">
        <span className="wc-compose-meta" style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, color: "rgba(232,228,218,0.2)" }}>
          {draft.length}/{MAX_STATUS}
        </span>
        <button
          type="button"
          className="wc-reply-btn"
          disabled={!draft.trim() || posting}
          onClick={handlePost}
        >
          {posting ? "Posting…" : "Pin to Corner"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function WritersCorner({
  genre, genreAccent, genreAccentDim,
}: WritersCornerProps) {
  const [posts, setPosts] = useState<CornerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [isWriter, setIsWriter] = useState(false);
  const [writerAvatar, setWriterAvatar] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: writer } = await supabase
        .from("writers")
        .select("name, status, avatar_url")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (writer) {
        setUserName(writer.name ?? data.user.email ?? "Reader");
        setIsWriter(writer.status === "approved");
        setWriterAvatar(writer.avatar_url ?? null);
      } else {
        setUserName(data.user.email?.split("@")[0] ?? "Reader");
      }
    });
  }, []);

  // Load active corner posts for this genre
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("writer_corner_posts")
      .select("*")
      .eq("genre", genre)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });
    if (data) setPosts(data as CornerPost[]);
    setLoading(false);
  }, [genre]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  if (loading) return (
    <div style={{ "--wc-accent": genreAccent, "--wc-accent-dim": genreAccentDim } as React.CSSProperties}>
      <style>{WC_STYLES}</style>
      <div className="wc-loading">Loading Writer's Corner…</div>
    </div>
  );

  if (posts.length === 0 && !isWriter) return null;

  return (
    <>
      <style>{WC_STYLES}</style>
      <div
        className="wc-root"
        style={{ "--wc-accent": genreAccent, "--wc-accent-dim": genreAccentDim } as React.CSSProperties}
      >
        {/* Writer's Corner label */}
        {(posts.length > 0 || isWriter) && (
          <div className="wc-header">
            <span className="wc-header-label">Writer's Corner</span>
            <div className="wc-header-line" />
          </div>
        )}

        {/* Writer's own compose box */}
        {isWriter && userId && (
          <WriterComposeBox
            genre={genre}
            userId={userId}
            userName={userName}
            writerAvatar={writerAvatar}
            genreAccent={genreAccent}
            genreAccentDim={genreAccentDim}
            onPosted={post => setPosts(prev => [post, ...prev.filter(p => p.writer_id !== userId)])}
          />
        )}

        {/* Active corner posts */}
        {posts.map(post => (
          <CornerCard
            key={post.id}
            post={post}
            userId={userId}
            userName={userName}
            isWriter={isWriter}
            genreAccent={genreAccent}
            genreAccentDim={genreAccentDim}
          />
        ))}
      </div>
    </>
  );
}
