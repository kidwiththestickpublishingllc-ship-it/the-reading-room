"use client";

// ============================================================
// StorySocial.tsx
// Drop into: app/reading-room/components/StorySocial.tsx
//
// Usage on a story card:
//   <StorySocial storyId={story.id} storySlug={story.slug} storyTitle={story.title} userId={userId} />
//
// Props:
//   storyId    — UUID from stories.id (Supabase)
//   storySlug  — slug for share URL
//   storyTitle — for share text
//   userId     — auth.uid() from session, null if not logged in
// ============================================================

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const STYLES = `
  .ttl-social {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 12px;
    margin-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    position: relative;
  }

  .ttl-social-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(232,228,218,0.4);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 5px 12px;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }

  .ttl-social-btn:hover {
    color: rgba(232,228,218,0.8);
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
  }

  .ttl-social-btn.liked {
    color: #f87171;
    border-color: rgba(248,113,113,0.3);
    background: rgba(248,113,113,0.08);
  }

  .ttl-social-btn.liked:hover {
    background: rgba(248,113,113,0.14);
  }

  .ttl-social-btn.commented {
    color: #C9A84C;
    border-color: rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.08);
  }

  .ttl-social-btn.shared {
    color: #4ade80;
    border-color: rgba(74,222,128,0.3);
    background: rgba(74,222,128,0.08);
  }

  .ttl-social-sep {
    width: 1px;
    height: 14px;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  /* Comment drawer */
  .ttl-comment-drawer {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #111111;
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    z-index: 50;
    overflow: hidden;
    animation: ttl-drawer-in 0.2s ease;
  }

  @keyframes ttl-drawer-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ttl-comment-drawer-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ttl-comment-drawer-title {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(201,168,76,0.7);
  }

  .ttl-comment-close {
    background: none;
    border: none;
    color: rgba(232,228,218,0.3);
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
    transition: color 0.15s;
  }

  .ttl-comment-close:hover { color: rgba(232,228,218,0.7); }

  .ttl-comment-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 8px 0;
  }

  .ttl-comment-item {
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .ttl-comment-item:last-child { border-bottom: none; }

  .ttl-comment-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .ttl-comment-author {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: rgba(232,228,218,0.8);
  }

  .ttl-comment-date {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    color: rgba(232,228,218,0.25);
  }

  .ttl-comment-text {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: rgba(232,228,218,0.55);
    line-height: 1.6;
  }

  .ttl-comment-empty {
    padding: 20px 16px;
    text-align: center;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: rgba(232,228,218,0.25);
    font-style: italic;
  }

  .ttl-comment-input-row {
    padding: 12px 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .ttl-comment-input {
    flex: 1;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    color: rgba(232,228,218,0.85);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 8px 12px;
    outline: none;
    resize: none;
    min-height: 36px;
    max-height: 80px;
    transition: border-color 0.15s;
    font-size: 12px;
  }

  .ttl-comment-input:focus {
    border-color: rgba(201,168,76,0.35);
  }

  .ttl-comment-input::placeholder {
    color: rgba(232,228,218,0.2);
  }

  .ttl-comment-submit {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #000;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none;
    border-radius: 6px;
    padding: 8px 14px;
    cursor: pointer;
    transition: opacity 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ttl-comment-submit:hover { opacity: 0.88; }
  .ttl-comment-submit:disabled { opacity: 0.35; cursor: not-allowed; }

  .ttl-comment-login-prompt {
    padding: 16px;
    text-align: center;
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    color: rgba(232,228,218,0.35);
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .ttl-comment-login-link {
    color: #C9A84C;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
    font-size: inherit;
    padding: 0;
  }
`;

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name?: string;
}

interface StorySocialProps {
  storyId: string;
  storySlug: string;
  storyTitle: string;
  userId: string | null;
}

export default function StorySocial({ storyId, storySlug, storyTitle, userId }: StorySocialProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shared, setShared] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Load like count + whether current user liked
  useEffect(() => {
    async function loadLikes() {
      const { count } = await supabase
        .from("story_likes")
        .select("*", { count: "exact", head: true })
        .eq("story_id", storyId);
      setLikeCount(count ?? 0);

      if (userId) {
        const { data } = await supabase
          .from("story_likes")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", userId)
          .maybeSingle();
        setLiked(!!data);
      }
    }
    loadLikes();
  }, [storyId, userId]);

  // Load comment count
  useEffect(() => {
    async function loadCommentCount() {
      const { count } = await supabase
        .from("story_comments")
        .select("*", { count: "exact", head: true })
        .eq("story_id", storyId);
      setCommentCount(count ?? 0);
    }
    loadCommentCount();
  }, [storyId]);

  // Load comments when drawer opens
  useEffect(() => {
    if (!showComments) return;
    async function loadComments() {
      setLoadingComments(true);
      const { data } = await supabase
        .from("story_comments")
        .select("id, content, created_at, user_id")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true });

      // Enrich with display names from profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap: Record<string, string> = {};
        profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name ?? "Reader"; });

        setComments(data.map((c: any) => ({ ...c, display_name: profileMap[c.user_id] ?? "Reader" })));
      } else {
        setComments([]);
      }
      setLoadingComments(false);
    }
    loadComments();
  }, [showComments, storyId]);

  // Close drawer on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setShowComments(false);
      }
    }
    if (showComments) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showComments]);

  async function handleLike() {
    if (!userId) {
      window.location.href = "/members";
      return;
    }
    if (liking) return;
    setLiking(true);

    if (liked) {
      await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", userId);
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      await supabase
        .from("story_likes")
        .insert({ story_id: storyId, user_id: userId });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
    setLiking(false);
  }

  async function handleComment() {
    if (!userId || !commentText.trim()) return;
    setSubmitting(true);
    await supabase
      .from("story_comments")
      .insert({ story_id: storyId, user_id: userId, content: commentText.trim() });
    setCommentText("");
    setCommentCount(c => c + 1);
    // Reload comments
    const { data } = await supabase
      .from("story_comments")
      .select("id, content, created_at, user_id")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });
    const userIds = [...new Set((data ?? []).map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    const profileMap: Record<string, string> = {};
    profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name ?? "Reader"; });
    setComments((data ?? []).map((c: any) => ({ ...c, display_name: profileMap[c.user_id] ?? "Reader" })));
    setSubmitting(false);
  }

  const shareUrl = `https://read.the-tiniest-library.com/reading-room/stories/${storySlug}/chapters/1`;

  async function handleNativeShare() {
    // On mobile, this opens the OS share sheet — includes Instagram, TikTok, Messages, etc.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: storyTitle,
          text: `Reading "${storyTitle}" on The Tiniest Library`,
          url: shareUrl,
        });
        return true;
      } catch {
        return false; // user cancelled or share failed — fall back to menu
      }
    }
    return false; // no native share (desktop) — caller shows the menu
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  function fmtDate(ts: string) {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="ttl-social" ref={drawerRef}>

        {/* Like */}
        <button
          className={`ttl-social-btn${liked ? " liked" : ""}`}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleLike(); }}
          title={userId ? (liked ? "Unlike" : "Like this story") : "Join free to like stories"}
        >
          <span>{liked ? "❤️" : "🤍"}</span>
          <span>{likeCount > 0 ? likeCount : ""}</span>
          <span>{liked ? "Liked" : "Like"}</span>
        </button>

        <div className="ttl-social-sep" />

        {/* Comment */}
        <button
          className={`ttl-social-btn${showComments ? " commented" : ""}`}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowComments(v => !v); }}
          title="Read and leave comments"
        >
          <span>💬</span>
          <span>{commentCount > 0 ? commentCount : ""}</span>
          <span>{commentCount === 1 ? "Comment" : "Comments"}</span>
        </button>

        <div className="ttl-social-sep" />

        {/* Share */}
        <div style={{ position: "relative" }}>
          <button
            className={`ttl-social-btn${shared ? " shared" : ""}`}
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              const didNativeShare = await handleNativeShare();
              if (!didNativeShare) setShared(s => !s);
            }}
            title="Share this story"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>
          {shared && (
            <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "#111", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 4, minWidth: 180, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
              <button onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Reading "${storyTitle}" on The Tiniest Library`)}&url=${encodeURIComponent(shareUrl)}`, '_blank'); setShared(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "none", border: "none", color: "#f0ece2", cursor: "pointer", fontSize: 12, borderRadius: 6, textAlign: "left", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                𝕏 Share on X / Twitter
              </button>
              <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, 'fbshare', 'width=600,height=500,scrollbars=yes'); setShared(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "none", border: "none", color: "#f0ece2", cursor: "pointer", fontSize: 12, borderRadius: 6, textAlign: "left", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                📘 Share on Facebook
              </button>
              <button onClick={async () => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    try { await navigator.share({ title: storyTitle, text: `Reading "${storyTitle}" on The Tiniest Library`, url: shareUrl }); } catch {}
                  } else {
                    await handleCopyLink();
                    alert("Link copied! Open Instagram and paste it into your Story, bio, or DM.");
                  }
                  setShared(false);
                }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "none", border: "none", color: "#E1306C", cursor: "pointer", fontSize: 12, borderRadius: 6, textAlign: "left", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(225,48,108,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                📸 Instagram &amp; Stories
              </button>
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "2px 0" }} />
              <button onClick={async () => { await handleCopyLink(); setShared(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "none", border: "none", color: "#C9A84C", cursor: "pointer", fontSize: 12, borderRadius: 6, textAlign: "left", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                🔗 Copy Link
              </button>
            </div>
          )}
        </div>

        {/* Comment drawer */}
        {showComments && (
          <div className="ttl-comment-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ttl-comment-drawer-header">
              <span className="ttl-comment-drawer-title">
                {commentCount} {commentCount === 1 ? "Comment" : "Comments"} — {storyTitle}
              </span>
              <button className="ttl-comment-close" onClick={() => setShowComments(false)}>×</button>
            </div>

            <div className="ttl-comment-list">
              {loadingComments ? (
                <div className="ttl-comment-empty">Loading…</div>
              ) : comments.length === 0 ? (
                <div className="ttl-comment-empty">No comments yet. Be the first. 🕯️</div>
              ) : comments.map(c => (
                <div key={c.id} className="ttl-comment-item">
                  <div className="ttl-comment-meta">
                    <span className="ttl-comment-author">{c.display_name}</span>
                    <span className="ttl-comment-date">{fmtDate(c.created_at)}</span>
                  </div>
                  <div className="ttl-comment-text">{c.content}</div>
                </div>
              ))}
            </div>

            {userId ? (
              <div className="ttl-comment-input-row">
                <textarea
                  className="ttl-comment-input"
                  placeholder="Share your thoughts…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  rows={1}
                />
                <button
                  className="ttl-comment-submit"
                  disabled={submitting || !commentText.trim()}
                  onClick={handleComment}
                >
                  {submitting ? "…" : "Post"}
                </button>
              </div>
            ) : (
              <div className="ttl-comment-login-prompt">
                <button
                  className="ttl-comment-login-link"
                  onClick={() => window.location.href = "/members"}
                >
                  Join free
                </button>
                {" "}to leave a comment
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
