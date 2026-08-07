"use client";

/**
 * MembersRoomFeed.tsx
 * ─────────────────────────────────────────────────────────────────
 * Replaces the raw Discussions tab in app/members/page.tsx.
 * Real-time via Supabase channels on forum_posts UPDATE + INSERT.
 * Pulls from forum_posts + genre_posts + writer_announcements.
 * Filter by room. Junction table likes with toggle.
 * Writer badges. Light/dark aware.
 *
 * Place at: app/components/MembersRoomFeed.tsx
 *
 * HOW TO WIRE into app/members/page.tsx:
 * 1. Add import at top:
 *    import MembersRoomFeed from "@/app/components/MembersRoomFeed";
 *
 * 2. In the Discussions tab render, replace all the raw forum JSX with:
 *    <MembersRoomFeed
 *      profileId={profile.id}
 *      profileName={profile.full_name ?? profile.email.split("@")[0]}
 *      profileAvatar={profile.avatar_url}
 *      theme={theme}
 *    />
 *
 * FIND in app/members/page.tsx (the old compose + post list):
 *   {activeTab === "forum" && (
 * REPLACE entire forum tab block with:
 *   {activeTab === "forum" && (
 *     <MembersRoomFeed
 *       profileId={profile.id}
 *       profileName={profile.full_name ?? profile.email.split("@")[0]}
 *       profileAvatar={profile.avatar_url ?? null}
 *       theme="dark"
 *     />
 *   )}
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────
interface FeedPost {
  id: string;
  source: "forum" | "genre" | "announcement";
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_is_writer: boolean;
  content: string;
  genre: string | null;
  post_type: string | null;
  story_title: string | null;
  story_rating: number | null;
  likes: number;
  user_liked: boolean;
  created_at: string;
}

interface MembersRoomFeedProps {
  profileId: string;
  profileName: string;
  profileAvatar: string | null;
  theme?: "dark" | "light";
}

type FilterRoom = "all" | "forum" | "genre" | "announcement";
type SortMode = "recent" | "trending";

const MAX_POST = 500;

// ─── Theme tokens ─────────────────────────────────────────────────
const DARK = {
  bg:        "#0f0d0a",
  surface:   "rgba(255,255,255,0.02)",
  surface2:  "rgba(255,255,255,0.05)",
  border:    "rgba(255,255,255,0.08)",
  borderHov: "rgba(201,168,76,0.3)",
  text:      "rgba(232,228,218,0.9)",
  textSub:   "rgba(232,228,218,0.5)",
  textFaint: "rgba(232,228,218,0.25)",
  gold:      "#C9A84C",
  goldDim:   "rgba(201,168,76,0.2)",
  pill: {
    idle:    { bg: "transparent", border: "rgba(255,255,255,0.1)", color: "rgba(232,228,218,0.4)" },
    active:  { bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.4)", color: "#C9A84C" },
  },
  input:     { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", color: "rgba(232,228,218,0.8)" },
  btn:       { bg: "linear-gradient(135deg,#C9A84C,#8a6510)", color: "#000" },
  liked:     "#C9A84C",
  unliked:   "rgba(232,228,218,0.25)",
};

const LIGHT = {
  bg:        "#FAF7F2",
  surface:   "#FFFFFF",
  surface2:  "#F5F0E8",
  border:    "rgba(201,168,76,0.2)",
  borderHov: "rgba(201,168,76,0.5)",
  text:      "#1A1612",
  textSub:   "#5C4F3A",
  textFaint: "#9E8E6E",
  gold:      "#8A6510",
  goldDim:   "rgba(201,168,76,0.15)",
  pill: {
    idle:    { bg: "transparent", border: "rgba(201,168,76,0.2)", color: "#9E8E6E" },
    active:  { bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.4)", color: "#8A6510" },
  },
  input:     { bg: "#FFFFFF", border: "rgba(201,168,76,0.25)", color: "#1A1612" },
  btn:       { bg: "linear-gradient(135deg,#C9A84C,#8a6510)", color: "#000" },
  liked:     "#8A6510",
  unliked:   "#9E8E6E",
};

const FEED_STYLES = `
  .mrf-root { width: 100%; }

  /* Controls */
  .mrf-controls {
    display: flex; align-items: center;
    justify-content: space-between;
    gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .mrf-pills { display: flex; gap: 5px; flex-wrap: wrap; }
  .mrf-pill {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 999px;
    cursor: pointer; transition: all 0.2s; border: 1px solid;
  }
  .mrf-sort {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 999px;
    cursor: pointer; transition: all 0.2s; border: 1px solid;
    background: transparent;
  }

  /* Compose */
  .mrf-compose {
    border-radius: 14px; overflow: hidden;
    margin-bottom: 24px; transition: border-color 0.2s;
    border: 1px solid;
  }
  .mrf-compose:focus-within { }
  .mrf-compose-inner { padding: 14px 18px; }
  .mrf-compose-textarea {
    width: 100%; background: transparent;
    border: none; outline: none; resize: none;
    font-family: 'Syne', sans-serif; font-size: 13px;
    line-height: 1.65; min-height: 72px;
    box-sizing: border-box;
  }
  .mrf-compose-footer {
    padding: 10px 18px;
    border-top: 1px solid;
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px; flex-wrap: wrap;
  }
  .mrf-compose-meta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.06em;
  }
  .mrf-post-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    font-weight: 700; color: #000;
    border: none; padding: 8px 20px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .mrf-post-btn:hover { opacity: 0.85; }
  .mrf-post-btn:disabled { opacity: 0.3; cursor: default; }

  /* Post type toggle */
  .mrf-type-row {
    display: flex; gap: 6px; margin-bottom: 10px;
  }
  .mrf-type-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 999px; border: 1px solid;
    background: transparent; cursor: pointer; transition: all 0.2s;
  }

  /* Feed */
  .mrf-feed { display: flex; flex-direction: column; gap: 10px; }

  /* Post card */
  .mrf-post {
    border-radius: 14px; overflow: hidden;
    border: 1px solid; transition: border-color 0.2s;
  }
  .mrf-post-accent { height: 2px; }
  .mrf-post-body { padding: 16px 20px; }
  .mrf-post-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 12px;
  }
  .mrf-avatar {
    width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0; border: 1px solid;
  }
  .mrf-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mrf-avatar-init {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px; font-weight: 300;
  }
  .mrf-author-name {
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 500; line-height: 1.2;
  }
  .mrf-post-meta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; margin-top: 2px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .mrf-writer-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 1px 8px; border-radius: 999px;
    border: 1px solid; display: inline-block;
  }
  .mrf-source-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 1px 8px; border-radius: 999px;
    border: 1px solid rgba(100,149,237,0.3);
    background: rgba(100,149,237,0.08);
    color: #6495ED; display: inline-block;
  }
  .mrf-post-time {
    font-family: 'Syne', sans-serif;
    font-size: 10px; margin-left: auto; flex-shrink: 0;
  }
  .mrf-post-content {
    font-family: 'Syne', sans-serif;
    font-size: 13px; line-height: 1.7;
  }
  .mrf-story-rec {
    margin-top: 12px; padding: 12px 16px;
    border-radius: 10px; border: 1px solid;
  }
  .mrf-story-rec-label {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    margin-bottom: 6px; display: block;
  }
  .mrf-story-rec-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 400; line-height: 1.2;
  }
  .mrf-stars { letter-spacing: 2px; font-size: 12px; margin-top: 4px; display: block; }
  .mrf-post-actions {
    display: flex; align-items: center; gap: 14px;
    margin-top: 14px; padding-top: 12px; border-top: 1px solid;
  }
  .mrf-like-btn {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.1em;
    background: transparent; border: none;
    cursor: pointer; transition: all 0.2s; padding: 0;
  }
  .mrf-like-btn:disabled { cursor: default; }
  .mrf-like-icon { font-size: 14px; transition: transform 0.15s; }
  .mrf-like-btn:not(:disabled):hover .mrf-like-icon { transform: scale(1.2); }

  /* Announcement */
  .mrf-announcement {
    border-radius: 14px; overflow: hidden; border: 1px solid;
  }
  .mrf-announcement-top { height: 2px; }
  .mrf-announcement-inner { padding: 16px 20px; }
  .mrf-announcement-label {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 8px; display: block;
  }
  .mrf-announcement-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 300; line-height: 1.55;
  }

  /* Empty */
  .mrf-empty {
    padding: 40px 24px; text-align: center;
    border-radius: 14px; border: 1px solid;
  }
  .mrf-empty-icon { font-size: 28px; display: block; margin-bottom: 10px; }
  .mrf-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300; margin-bottom: 6px;
  }
  .mrf-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 11px; line-height: 1.65;
  }

  /* Loading */
  .mrf-loading {
    font-family: 'Syne', sans-serif; font-size: 11px;
    text-align: center; padding: 32px 0; letter-spacing: 0.1em;
  }

  /* New post pulse */
  @keyframes mrf-slide-in {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mrf-new-post { animation: mrf-slide-in 0.3s ease; }
`;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ─── Component ────────────────────────────────────────────────────
export default function MembersRoomFeed({
  profileId, profileName, profileAvatar, theme = "dark",
}: MembersRoomFeedProps) {
  const t = theme === "light" ? LIGHT : DARK;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [postType, setPostType] = useState<"discussion" | "story_recommendation">("discussion");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyRating, setStoryRating] = useState(5);
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState<FilterRoom>("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load posts ──────────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const allPosts: FeedPost[] = [];

    // forum_posts
    const { data: forum } = await supabase
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    (forum ?? []).forEach((p: any) => {
      allPosts.push({
        id: p.id, source: "forum",
        author_id: p.author_id,
        author_name: p.author_name ?? "Member",
        author_avatar: p.author_avatar,
        author_is_writer: false,
        content: p.content,
        genre: null,
        post_type: p.post_type,
        story_title: p.story_title,
        story_rating: p.story_rating,
        likes: p.likes ?? 0,
        user_liked: false,
        created_at: p.created_at,
      });
    });

    // genre_posts
    const { data: genre } = await supabase
      .from("genre_posts")
      .select("*")
      .eq("flagged", false)
      .order("created_at", { ascending: false })
      .limit(20);

    (genre ?? []).forEach((p: any) => {
      allPosts.push({
        id: p.id, source: "genre",
        author_id: p.author_id,
        author_name: p.author_name ?? "Member",
        author_avatar: null,
        author_is_writer: p.author_is_writer ?? false,
        content: p.body,
        genre: p.genre,
        post_type: "discussion",
        story_title: null,
        story_rating: null,
        likes: 0,
        user_liked: false,
        created_at: p.created_at,
      });
    });

    // writer_announcements
    const { data: announcements } = await supabase
      .from("writer_announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    (announcements ?? []).forEach((a: any) => {
      allPosts.push({
        id: a.id, source: "announcement",
        author_id: a.writer_id ?? "",
        author_name: a.writer_name ?? "Writer",
        author_avatar: null,
        author_is_writer: true,
        content: a.content ?? a.message ?? "",
        genre: null,
        post_type: "announcement",
        story_title: null,
        story_rating: null,
        likes: 0,
        user_liked: false,
        created_at: a.created_at,
      });
    });

    // Check which forum posts current user has liked
    if (allPosts.length > 0) {
      const forumIds = allPosts.filter(p => p.source === "forum").map(p => p.id);
      if (forumIds.length > 0) {
        const { data: userLikes } = await supabase
          .from("forum_post_likes")
          .select("post_id")
          .eq("user_id", profileId)
          .in("post_id", forumIds);
        const likedSet = new Set((userLikes ?? []).map((l: any) => l.post_id));
        setLikedIds(likedSet);
        allPosts.forEach(p => {
          if (likedSet.has(p.id)) p.user_liked = true;
        });
      }
    }

    // Sort
    allPosts.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setPosts(allPosts);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // ── Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel("mrf-forum-live")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "forum_posts",
      }, (payload) => {
        setPosts(prev => prev.map(p =>
          p.id === payload.new.id ? { ...p, likes: payload.new.likes } : p
        ));
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "forum_posts",
      }, (payload) => {
        const newPost = payload.new as any;
        const fp: FeedPost = {
          id: newPost.id, source: "forum",
          author_id: newPost.author_id,
          author_name: newPost.author_name ?? "Member",
          author_avatar: newPost.author_avatar,
          author_is_writer: false,
          content: newPost.content,
          genre: null,
          post_type: newPost.post_type,
          story_title: newPost.story_title,
          story_rating: newPost.story_rating,
          likes: 0, user_liked: false,
          created_at: newPost.created_at,
        };
        setPosts(prev => [fp, ...prev]);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Like handler ────────────────────────────────────────────────
  const handleLike = async (postId: string, source: string) => {
    if (source !== "forum") return; // only forum posts have likes
    const alreadyLiked = likedIds.has(postId);

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes: alreadyLiked ? Math.max(p.likes - 1, 0) : p.likes + 1, user_liked: !alreadyLiked }
        : p
    ));
    setLikedIds(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(postId) : next.add(postId);
      return next;
    });

    // DB via RPC
    await supabase.rpc("toggle_post_like", {
      p_post_id: postId,
      p_user_id: profileId,
    });
  };

  // ── Post ────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const insertData: any = {
        author_id: profileId,
        author_name: profileName,
        author_avatar: profileAvatar,
        content: draft.trim(),
        post_type: postType,
        likes: 0,
      };
      if (postType === "story_recommendation") {
        insertData.story_title = storyTitle.trim();
        insertData.story_rating = storyRating;
      }
      await supabase.from("forum_posts").insert(insertData);
      setDraft(""); setStoryTitle(""); setStoryRating(5);
    } finally {
      setPosting(false);
    }
  };

  // ── Filter + sort ───────────────────────────────────────────────
  const filtered = posts.filter(p => {
    if (filter === "forum") return p.source === "forum";
    if (filter === "genre") return p.source === "genre";
    if (filter === "announcement") return p.source === "announcement";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "trending") return b.likes - a.likes;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const FILTERS: { key: FilterRoom; label: string }[] = [
    { key: "all", label: "All Rooms" },
    { key: "forum", label: "Members" },
    { key: "genre", label: "Lounges" },
    { key: "announcement", label: "Writers" },
  ];

  return (
    <>
      <style>{FEED_STYLES}</style>
      <div className="mrf-root">

        {/* Controls */}
        <div className="mrf-controls">
          <div className="mrf-pills">
            {FILTERS.map(f => {
              const s = filter === f.key ? t.pill.active : t.pill.idle;
              return (
                <button
                  key={f.key}
                  type="button"
                  className="mrf-pill"
                  style={{ background: s.bg, borderColor: s.border, color: s.color }}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="mrf-sort"
            style={{
              ...(sort === "trending" ? t.pill.active : t.pill.idle),
              borderColor: sort === "trending" ? t.pill.active.border : t.pill.idle.border,
            }}
            onClick={() => setSort(v => v === "recent" ? "trending" : "recent")}
          >
            {sort === "recent" ? "↓ Recent" : "🔥 Trending"}
          </button>
        </div>

        {/* Compose */}
        <div
          className="mrf-compose"
          style={{
            background: t.surface,
            borderColor: t.border,
          }}
        >
          <div className="mrf-compose-inner">
            <div className="mrf-type-row">
              {["discussion", "story_recommendation"].map(pt => (
                <button
                  key={pt}
                  type="button"
                  className="mrf-type-btn"
                  style={{
                    borderColor: postType === pt ? t.gold : t.border,
                    color: postType === pt ? t.gold : t.textFaint,
                    background: postType === pt ? t.goldDim : "transparent",
                  }}
                  onClick={() => setPostType(pt as any)}
                >
                  {pt === "discussion" ? "💬 Discussion" : "📚 Story Rec"}
                </button>
              ))}
            </div>

            {postType === "story_recommendation" && (
              <div style={{ marginBottom: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Story title…"
                  value={storyTitle}
                  onChange={e => setStoryTitle(e.target.value)}
                  style={{
                    flex: 1, minWidth: 140,
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 16, fontWeight: 300,
                    background: t.input.bg, border: `1px solid ${t.input.border}`,
                    borderRadius: 8, padding: "7px 12px",
                    color: t.input.color, outline: "none",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStoryRating(n)}
                      style={{
                        fontSize: 18, background: "transparent", border: "none",
                        cursor: "pointer", padding: "2px",
                        color: n <= storyRating ? "#C9A84C" : t.textFaint,
                        transition: "transform 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              className="mrf-compose-textarea"
              placeholder={postType === "discussion"
                ? "Share your thoughts with the TTL community…"
                : "What made this story worth reading?"}
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, MAX_POST))}
              rows={3}
              style={{ color: t.input.color }}
            />
          </div>
          <div
            className="mrf-compose-footer"
            style={{ borderTopColor: t.border }}
          >
            <span className="mrf-compose-meta" style={{ color: t.textFaint }}>
              {draft.length}/{MAX_POST}
            </span>
            <button
              type="button"
              className="mrf-post-btn"
              style={{ background: t.btn.bg, color: t.btn.color }}
              disabled={!draft.trim() || posting}
              onClick={handlePost}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="mrf-loading" style={{ color: t.textFaint }}>
            Loading the room…
          </div>
        ) : sorted.length === 0 ? (
          <div className="mrf-empty" style={{ borderColor: t.border, background: t.surface }}>
            <span className="mrf-empty-icon">🪑</span>
            <div className="mrf-empty-title" style={{ color: t.text }}>Nothing here yet.</div>
            <p className="mrf-empty-text" style={{ color: t.textFaint }}>
              Be the first to start a conversation.
            </p>
          </div>
        ) : (
          <div className="mrf-feed">
            {sorted.map(post => {
              const initial = post.author_name[0];
              const isAnnouncement = post.source === "announcement";
              const isGenre = post.source === "genre";

              if (isAnnouncement) {
                return (
                  <div
                    key={post.id}
                    className="mrf-announcement"
                    style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.04)" }}
                  >
                    <div className="mrf-announcement-top" style={{ background: `linear-gradient(90deg,transparent,${t.gold},transparent)` }} />
                    <div className="mrf-announcement-inner">
                      <span className="mrf-announcement-label" style={{ color: t.gold }}>
                        Writer Announcement · {post.author_name}
                      </span>
                      <div className="mrf-announcement-text" style={{ color: t.text }}>
                        {post.content}
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, color: t.textFaint, marginTop: 8 }}>
                        {timeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={post.id}
                  className={`mrf-post${post.source === "forum" ? " mrf-new-post" : ""}`}
                  style={{ borderColor: t.border, background: t.surface }}
                >
                  <div
                    className="mrf-post-accent"
                    style={{
                      background: post.author_is_writer
                        ? `linear-gradient(90deg,transparent,${t.gold},transparent)`
                        : "transparent",
                    }}
                  />
                  <div className="mrf-post-body">
                    <div className="mrf-post-header">
                      <div
                        className="mrf-avatar"
                        style={{
                          background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#F5F0E8",
                          borderColor: post.author_is_writer ? t.goldDim : t.border,
                        }}
                      >
                        {post.author_avatar
                          ? <img src={post.author_avatar} alt={post.author_name} />
                          : <span className="mrf-avatar-init" style={{ color: t.gold }}>{initial}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mrf-author-name" style={{ color: t.text }}>
                          {post.author_name}
                        </div>
                        <div className="mrf-post-meta" style={{ color: t.textFaint }}>
                          {post.author_is_writer && (
                            <span
                              className="mrf-writer-badge"
                              style={{ color: t.gold, borderColor: t.goldDim, background: t.goldDim }}
                            >
                              Writer
                            </span>
                          )}
                          {isGenre && post.genre && (
                            <span className="mrf-source-badge">{post.genre} Lounge</span>
                          )}
                          <span>{timeAgo(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mrf-post-content" style={{ color: t.text }}>
                      {post.content}
                    </div>

                    {post.post_type === "story_recommendation" && post.story_title && (
                      <div
                        className="mrf-story-rec"
                        style={{ borderColor: t.goldDim, background: t.goldDim }}
                      >
                        <span className="mrf-story-rec-label" style={{ color: t.gold }}>
                          Story Recommendation
                        </span>
                        <div className="mrf-story-rec-title" style={{ color: t.text }}>
                          {post.story_title}
                        </div>
                        {post.story_rating && (
                          <span className="mrf-stars" style={{ color: "#C9A84C" }}>
                            {stars(post.story_rating)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mrf-post-actions" style={{ borderTopColor: t.border }}>
                      {post.source === "forum" ? (
                        <button
                          type="button"
                          className="mrf-like-btn"
                          style={{ color: post.user_liked ? t.liked : t.unliked }}
                          onClick={() => handleLike(post.id, post.source)}
                        >
                          <span className="mrf-like-icon">
                            {post.user_liked ? "♥" : "♡"}
                          </span>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11 }}>
                            {post.likes > 0 ? post.likes : ""}
                          </span>
                        </button>
                      ) : (
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, color: t.textFaint }}>
                          {isGenre ? "Genre Lounge post" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
