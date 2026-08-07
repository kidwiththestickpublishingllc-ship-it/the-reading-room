"use client";

/**
 * MemberProfileRoom.tsx
 * ─────────────────────────────────────────────────────────────────
 * Personal member room at /members/[username].
 * MySpace energy — each member's space is theirs.
 * Features: banner image, accent color picker, currently reading
 * strip, virtual bookshelf preview, music embed (SoundCloud/Spotify),
 * reading mood, visitor log, note wall.
 * Light/dark aware.
 *
 * Place at: app/components/MemberProfileRoom.tsx
 *
 * HOW TO USE:
 * Create app/members/[username]/page.tsx:
 *
 * "use client";
 * import MemberProfileRoom from "@/app/components/MemberProfileRoom";
 * export default function MemberRoomPage() {
 *   const username = typeof window !== "undefined"
 *     ? window.location.pathname.split("/").pop() ?? ""
 *     : "";
 *   return <MemberProfileRoom username={username} />;
 * }
 *
 * TABLES NEEDED:
 * ─────────────────────────────────────────────────────────────────
 * -- Add columns to profiles table:
 * alter table profiles
 *   add column if not exists username text unique,
 *   add column if not exists banner_url text,
 *   add column if not exists accent_color text default '#C9A84C',
 *   add column if not exists music_embed text,
 *   add column if not exists reading_mood text,
 *   add column if not exists bio text,
 *   add column if not exists room_theme text default 'dark';
 *
 * -- Visitor log
 * create table if not exists member_visits (
 *   id uuid primary key default gen_random_uuid(),
 *   visited_id uuid references auth.users not null,
 *   visitor_id uuid references auth.users not null,
 *   visitor_name text,
 *   visitor_avatar text,
 *   visited_at timestamptz default now(),
 *   unique(visited_id, visitor_id)
 * );
 * alter table member_visits enable row level security;
 * create policy "profile owner sees visitors"
 *   on member_visits for select using (auth.uid() = visited_id);
 * create policy "authed users can visit"
 *   on member_visits for insert with check (auth.uid() = visitor_id);
 * create policy "authed users can update visit time"
 *   on member_visits for update using (auth.uid() = visitor_id);
 *
 * -- Room note wall
 * create table if not exists room_notes (
 *   id uuid primary key default gen_random_uuid(),
 *   room_owner_id uuid references auth.users not null,
 *   author_id uuid references auth.users not null,
 *   author_name text not null,
 *   author_avatar text,
 *   note text not null check (char_length(note) between 1 and 200),
 *   created_at timestamptz default now()
 * );
 * alter table room_notes enable row level security;
 * create policy "anyone can read notes"
 *   on room_notes for select using (true);
 * create policy "authed users can leave notes"
 *   on room_notes for insert with check (auth.uid() = author_id);
 * create policy "room owner can delete notes"
 *   on room_notes for delete
 *   using (auth.uid() = room_owner_id or auth.uid() = author_id);
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";

// ─── Types ────────────────────────────────────────────────────────
interface MemberProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  accent_color: string;
  music_embed: string | null;
  reading_mood: string | null;
  bio: string | null;
  room_theme: "dark" | "light";
  membership_tier: "free" | "gold" | "founding";
  ink_balance: number;
}

interface Visit {
  id: string;
  visitor_name: string | null;
  visitor_avatar: string | null;
  visited_at: string;
}

interface RoomNote {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  note: string;
  created_at: string;
}

interface CurrentlyReading {
  slug: string;
  title: string;
  author: string;
  cover: string | null;
  chapter: number;
}

interface MemberProfileRoomProps {
  username: string;
}

const ACCENT_OPTIONS = [
  "#C9A84C", "#8B5CF6", "#6495ED", "#E879A0",
  "#10B981", "#F59E0B", "#EF4444", "#F97316",
  "#0EA5E9", "#EC4899",
];

const MOOD_OPTIONS = [
  { value: "adventurous", label: "Adventurous", icon: "⚔️" },
  { value: "romantic",    label: "Romantic",    icon: "💫" },
  { value: "mysterious",  label: "Mysterious",  icon: "🌑" },
  { value: "cozy",        label: "Cozy",        icon: "🍂" },
  { value: "inspired",    label: "Inspired",    icon: "✨" },
  { value: "dark",        label: "Dark",        icon: "🕯️" },
];

const TIER_LABELS: Record<string, string> = {
  free: "Reader",
  gold: "Gold Member",
  founding: "Founding Member",
};

const ROOM_STYLES = `
  .mpr-root { min-height: 100vh; }

  /* Banner */
  .mpr-banner {
    height: 220px; position: relative; overflow: hidden;
  }
  .mpr-banner-img { width: 100%; height: 100%; object-fit: cover; }
  .mpr-banner-fallback {
    width: 100%; height: 100%;
  }
  .mpr-banner-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%);
  }

  /* Profile header */
  .mpr-profile-header {
    max-width: 900px; margin: 0 auto;
    padding: 0 32px;
    position: relative; margin-top: -40px;
    display: flex; align-items: flex-end;
    gap: 20px; flex-wrap: wrap; margin-bottom: 32px;
  }
  .mpr-avatar {
    width: 80px; height: 80px; border-radius: 14px;
    border: 3px solid; overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 300;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    background: #1a1612;
  }
  .mpr-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mpr-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 300; line-height: 1.1;
  }
  .mpr-username {
    font-family: 'Syne', sans-serif;
    font-size: 11px; letter-spacing: 0.1em; margin-top: 3px;
  }
  .mpr-tier-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 999px; border: 1px solid;
    display: inline-block; margin-top: 5px;
  }
  .mpr-header-actions {
    margin-left: auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  }
  .mpr-action-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 7px 16px; border-radius: 8px; cursor: pointer;
    transition: all 0.2s;
  }

  /* Layout */
  .mpr-layout {
    max-width: 900px; margin: 0 auto;
    padding: 0 32px 80px;
    display: grid; grid-template-columns: 1fr 280px; gap: 24px;
  }
  @media (max-width: 700px) {
    .mpr-layout { grid-template-columns: 1fr; }
    .mpr-sidebar { order: -1; }
  }

  /* Section */
  .mpr-section { margin-bottom: 24px; }
  .mpr-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .mpr-section-line { flex: 1; height: 1px; }

  /* Bio */
  .mpr-bio {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 300; font-style: italic;
    line-height: 1.65;
  }

  /* Mood */
  .mpr-mood {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 999px; border: 1px solid;
    font-family: 'Syne', sans-serif; font-size: 11px;
  }

  /* Currently reading */
  .mpr-reading-card {
    display: flex; gap: 14px; align-items: center;
    padding: 14px; border-radius: 12px; border: 1px solid;
    text-decoration: none; transition: all 0.2s;
  }
  .mpr-reading-card:hover { transform: translateX(3px); }
  .mpr-reading-thumb {
    width: 44px; height: 60px; border-radius: 6px;
    overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .mpr-reading-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .mpr-reading-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 400; line-height: 1.2; margin-bottom: 3px;
  }
  .mpr-reading-ch {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.06em;
  }

  /* Music embed */
  .mpr-music-box {
    border-radius: 12px; overflow: hidden; border: 1px solid;
    padding: 14px;
  }
  .mpr-music-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
  }
  .mpr-music-iframe { width: 100%; border: none; border-radius: 8px; }

  /* Sidebar cards */
  .mpr-sidebar-card {
    border-radius: 14px; overflow: hidden; border: 1px solid;
    margin-bottom: 16px;
  }
  .mpr-sidebar-card-top { height: 2px; }
  .mpr-sidebar-card-inner { padding: 16px; }
  .mpr-sidebar-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    margin-bottom: 12px;
  }

  /* Stats */
  .mpr-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .mpr-stat {
    padding: 10px; border-radius: 8px; border: 1px solid; text-align: center;
  }
  .mpr-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 300; display: block; margin-bottom: 2px;
  }
  .mpr-stat-label {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
  }

  /* Visitor log */
  .mpr-visitor {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0; border-bottom: 1px solid;
  }
  .mpr-visitor:last-child { border-bottom: none; }
  .mpr-visitor-avatar {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 12px;
    overflow: hidden; flex-shrink: 0;
  }
  .mpr-visitor-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mpr-visitor-name {
    font-family: 'Syne', sans-serif; font-size: 11px; flex: 1;
  }
  .mpr-visitor-time {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.06em;
  }

  /* Note wall */
  .mpr-note {
    padding: 10px 14px; border-radius: 10px; border: 1px solid;
    margin-bottom: 8px; position: relative;
  }
  .mpr-note-author {
    font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 500;
    margin-bottom: 4px; display: flex; align-items: center; gap: 6px;
  }
  .mpr-note-text {
    font-family: 'Syne', sans-serif; font-size: 12px; line-height: 1.6;
  }
  .mpr-note-time {
    font-family: 'Syne', sans-serif; font-size: 9px; margin-top: 4px;
  }
  .mpr-note-del {
    position: absolute; top: 6px; right: 8px;
    background: transparent; border: none; cursor: pointer;
    font-size: 11px; opacity: 0.4; transition: opacity 0.2s; padding: 0;
  }
  .mpr-note-del:hover { opacity: 0.9; }

  /* Note compose */
  .mpr-note-compose { margin-top: 12px; }
  .mpr-note-textarea {
    width: 100%; background: transparent; border: 1px solid;
    border-radius: 8px; padding: 8px 12px; resize: none;
    font-family: 'Syne', sans-serif; font-size: 12px;
    outline: none; box-sizing: border-box; transition: border-color 0.2s;
  }
  .mpr-note-submit {
    margin-top: 6px; width: 100%;
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg,#C9A84C,#8a6510);
    border: none; padding: 8px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .mpr-note-submit:hover { opacity: 0.85; }
  .mpr-note-submit:disabled { opacity: 0.3; cursor: default; }

  /* Edit mode */
  .mpr-edit-panel {
    padding: 20px; border-radius: 14px; border: 1px solid;
    margin-bottom: 24px;
  }
  .mpr-edit-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    margin-bottom: 6px; display: block;
  }
  .mpr-edit-input {
    width: 100%; background: transparent; border: 1px solid;
    border-radius: 8px; padding: 8px 12px;
    font-family: 'Syne', sans-serif; font-size: 12px;
    outline: none; box-sizing: border-box; margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .mpr-edit-textarea {
    width: 100%; background: transparent; border: 1px solid;
    border-radius: 8px; padding: 8px 12px; resize: none;
    font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 300;
    outline: none; box-sizing: border-box; margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .mpr-accent-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .mpr-accent-swatch {
    width: 24px; height: 24px; border-radius: 50%;
    cursor: pointer; border: 2px solid transparent;
    transition: transform 0.15s; flex-shrink: 0;
  }
  .mpr-accent-swatch:hover { transform: scale(1.15); }
  .mpr-accent-swatch.selected { border-color: rgba(255,255,255,0.8); }
  .mpr-save-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg,#C9A84C,#8a6510);
    border: none; padding: 10px 24px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .mpr-save-btn:hover { opacity: 0.85; }

  /* Loading */
  .mpr-loading {
    min-height: 60vh; display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 12px; letter-spacing: 0.1em;
  }

  /* Not found */
  .mpr-notfound {
    min-height: 60vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300;
  }
`;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function parseMusicEmbed(url: string): string | null {
  if (!url) return null;
  // SoundCloud
  if (url.includes("soundcloud.com")) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23C9A84C&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  }
  // Spotify track/playlist
  if (url.includes("spotify.com")) {
    const match = url.match(/spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/);
    if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  }
  return null;
}

export default function MemberProfileRoom({ username }: MemberProfileRoomProps) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notes, setNotes] = useState<RoomNote[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<CurrentlyReading | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [unlockCount, setUnlockCount] = useState(0);

  // Edit state
  const [editBio, setEditBio] = useState("");
  const [editAccent, setEditAccent] = useState("#C9A84C");
  const [editMusic, setEditMusic] = useState("");
  const [editMood, setEditMood] = useState("");
  const [saving, setSaving] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      setCurrentUser({
        id: data.user.id,
        name: p?.full_name ?? data.user.email?.split("@")[0] ?? "Reader",
        avatar: p?.avatar_url ?? null,
      });
    });
  }, []);

  // Load member profile
  const loadMember = useCallback(async () => {
    if (!username) return;
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!data) { setNotFound(true); setLoading(false); return; }
    setMember(data as MemberProfile);
    setEditBio(data.bio ?? "");
    setEditAccent(data.accent_color ?? "#C9A84C");
    setEditMusic(data.music_embed ?? "");
    setEditMood(data.reading_mood ?? "");

    // Load unlock count
    const { count } = await supabase
      .from("chapter_unlocks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.id);
    setUnlockCount(count ?? 0);

    // Currently reading (most recent unlock)
    const { data: recent } = await supabase
      .from("chapter_unlocks")
      .select("chapters(chapter_number, stories(slug, title, author_name, cover_url))")
      .eq("user_id", data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const ch = (recent as any).chapters;
      const s = ch?.stories;
      if (s) {
        setCurrentlyReading({
          slug: s.slug,
          title: s.title,
          author: s.author_name ?? "",
          cover: s.cover_url ?? null,
          chapter: ch.chapter_number,
        });
      }
    }

    // Visitor log
    const { data: v } = await supabase
      .from("member_visits")
      .select("*")
      .eq("visited_id", data.id)
      .order("visited_at", { ascending: false })
      .limit(8);
    setVisits((v ?? []) as Visit[]);

    // Notes
    const { data: n } = await supabase
      .from("room_notes")
      .select("*")
      .eq("room_owner_id", data.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotes((n ?? []) as RoomNote[]);

    setLoading(false);

    // Log visit
    if (currentUser && currentUser.id !== data.id) {
      await supabase.from("member_visits").upsert({
        visited_id: data.id,
        visitor_id: currentUser.id,
        visitor_name: currentUser.name,
        visitor_avatar: currentUser.avatar,
        visited_at: new Date().toISOString(),
      }, { onConflict: "visited_id,visitor_id" });
    }
  }, [username, currentUser]);

  useEffect(() => { loadMember(); }, [loadMember]);

  const isOwner = currentUser?.id === member?.id;
  const accent = member?.accent_color ?? "#C9A84C";
  const accentDim = `${accent}33`;
  const isDark = (member?.room_theme ?? "dark") === "dark";
  const bg = isDark ? "#0a0807" : "#FAF7F2";
  const surface = isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(201,168,76,0.2)";
  const textColor = isDark ? "rgba(232,228,218,0.9)" : "#1A1612";
  const textSub = isDark ? "rgba(232,228,218,0.5)" : "#5C4F3A";
  const textFaint = isDark ? "rgba(232,228,218,0.25)" : "#9E8E6E";

  const saveProfile = async () => {
    if (!member) return;
    setSaving(true);
    await supabase.from("profiles").update({
      bio: editBio,
      accent_color: editAccent,
      music_embed: editMusic,
      reading_mood: editMood,
    }).eq("id", member.id);
    setMember(prev => prev ? {
      ...prev,
      bio: editBio, accent_color: editAccent,
      music_embed: editMusic, reading_mood: editMood,
    } : prev);
    setEditing(false);
    setSaving(false);
  };

  const postNote = async () => {
    if (!noteDraft.trim() || !currentUser || !member || postingNote) return;
    setPostingNote(true);
    const { data } = await supabase
      .from("room_notes")
      .insert({
        room_owner_id: member.id,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_avatar: currentUser.avatar,
        note: noteDraft.trim(),
      })
      .select()
      .single();
    if (data) setNotes(prev => [data as RoomNote, ...prev]);
    setNoteDraft("");
    setPostingNote(false);
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("room_notes").delete().eq("id", noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const musicSrc = parseMusicEmbed(member?.music_embed ?? "");
  const moodObj = MOOD_OPTIONS.find(m => m.value === member?.reading_mood);
  const displayName = member?.full_name ?? member?.email?.split("@")[0] ?? username;

  if (loading) {
    return (
      <>
        <style>{ROOM_STYLES}</style>
        <TTLNav />
        <div style={{ height: 74 }} />
        <div className="mpr-loading" style={{ background: bg, color: textFaint }}>
          Opening room…
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <style>{ROOM_STYLES}</style>
        <TTLNav />
        <div style={{ height: 74 }} />
        <div className="mpr-notfound" style={{ background: bg, color: textSub }}>
          <span>🚪</span>
          <span>Room not found.</span>
          <a href="/members" style={{ fontSize: 14, color: accent, fontFamily: "'Syne',sans-serif", textDecoration: "none" }}>
            ← Back to Members
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{ROOM_STYLES}</style>
      <TTLNav />
      <div style={{ height: 74 }} />
      <div className="mpr-root" style={{ background: bg }}>

        {/* Banner */}
        <div
          className="mpr-banner"
          style={{
            background: member?.banner_url
              ? undefined
              : `linear-gradient(135deg, ${accent}33, ${accent}11)`,
          }}
        >
          {member?.banner_url && (
            <img src={member.banner_url} alt="" className="mpr-banner-img" />
          )}
          <div className="mpr-banner-overlay" />
        </div>

        {/* Profile header */}
        <div className="mpr-profile-header">
          <div
            className="mpr-avatar"
            style={{ borderColor: accent }}
          >
            {member?.avatar_url
              ? <img src={member.avatar_url} alt={displayName} />
              : <span style={{ color: accent }}>{displayName[0]}</span>
            }
          </div>
          <div>
            <div className="mpr-name" style={{ color: textColor }}>{displayName}</div>
            {member?.username && (
              <div className="mpr-username" style={{ color: textFaint }}>
                @{member.username}
              </div>
            )}
            <span
              className="mpr-tier-badge"
              style={{ color: accent, borderColor: accentDim, background: accentDim }}
            >
              {TIER_LABELS[member?.membership_tier ?? "free"]}
            </span>
          </div>
          <div className="mpr-header-actions">
            {isOwner ? (
              <button
                type="button"
                className="mpr-action-btn"
                style={{
                  background: editing ? "transparent" : `linear-gradient(135deg,${accent},#8a6510)`,
                  color: editing ? textFaint : "#000",
                  border: editing ? `1px solid ${border}` : "none",
                  fontFamily: "'Syne',sans-serif", fontSize: 9,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                }}
                onClick={() => setEditing(v => !v)}
              >
                {editing ? "Cancel" : "Edit Room"}
              </button>
            ) : currentUser ? (
              <a
                href={`/members`}
                style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 9,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: textFaint, textDecoration: "none",
                }}
              >
                ← Members
              </a>
            ) : null}
          </div>
        </div>

        <div className="mpr-layout">
          {/* Main column */}
          <div>

            {/* Edit panel */}
            {editing && isOwner && (
              <div className="mpr-edit-panel" style={{ borderColor: accentDim, background: `${accent}08` }}>
                <span className="mpr-edit-label" style={{ color: accent }}>Your Bio</span>
                <textarea
                  className="mpr-edit-textarea"
                  placeholder="Say something about yourself as a reader…"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value.slice(0, 300))}
                  rows={3}
                  style={{ color: textColor, borderColor: border }}
                />

                <span className="mpr-edit-label" style={{ color: accent }}>Music Link (SoundCloud or Spotify)</span>
                <input
                  type="url"
                  className="mpr-edit-input"
                  placeholder="https://soundcloud.com/… or https://open.spotify.com/…"
                  value={editMusic}
                  onChange={e => setEditMusic(e.target.value)}
                  style={{ color: textColor, borderColor: border }}
                />

                <span className="mpr-edit-label" style={{ color: accent }}>Reading Mood</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setEditMood(m.value)}
                      style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 10,
                        padding: "5px 12px", borderRadius: 999, cursor: "pointer",
                        border: `1px solid ${editMood === m.value ? accent : border}`,
                        background: editMood === m.value ? accentDim : "transparent",
                        color: editMood === m.value ? accent : textFaint,
                        transition: "all 0.2s",
                      }}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                <span className="mpr-edit-label" style={{ color: accent }}>Room Accent Color</span>
                <div className="mpr-accent-row">
                  {ACCENT_OPTIONS.map(c => (
                    <div
                      key={c}
                      className={`mpr-accent-swatch${editAccent === c ? " selected" : ""}`}
                      style={{ background: c }}
                      onClick={() => setEditAccent(c)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="mpr-save-btn"
                  disabled={saving}
                  onClick={saveProfile}
                >
                  {saving ? "Saving…" : "Save Room"}
                </button>
              </div>
            )}

            {/* Bio */}
            {member?.bio && (
              <div className="mpr-section">
                <div className="mpr-section-title" style={{ color: accent }}>
                  About
                  <div className="mpr-section-line" style={{ background: accentDim }} />
                </div>
                <div className="mpr-bio" style={{ color: textSub }}>
                  "{member.bio}"
                </div>
              </div>
            )}

            {/* Reading mood */}
            {moodObj && (
              <div className="mpr-section">
                <div
                  className="mpr-mood"
                  style={{ borderColor: accentDim, color: accent, background: accentDim }}
                >
                  <span>{moodObj.icon}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11 }}>
                    Currently feeling {moodObj.label}
                  </span>
                </div>
              </div>
            )}

            {/* Currently reading */}
            {currentlyReading && (
              <div className="mpr-section">
                <div className="mpr-section-title" style={{ color: accent }}>
                  Reading Now
                  <div className="mpr-section-line" style={{ background: accentDim }} />
                </div>
                <a
                  href={`/reading-room/stories/${currentlyReading.slug}/chapters/${currentlyReading.chapter}`}
                  className="mpr-reading-card"
                  style={{ borderColor: accentDim, background: surface }}
                >
                  <div
                    className="mpr-reading-thumb"
                    style={{ background: accentDim }}
                  >
                    {currentlyReading.cover
                      ? <img src={currentlyReading.cover} alt={currentlyReading.title} />
                      : "📖"
                    }
                  </div>
                  <div>
                    <div className="mpr-reading-title" style={{ color: textColor }}>
                      {currentlyReading.title}
                    </div>
                    <div className="mpr-reading-ch" style={{ color: textFaint }}>
                      by {currentlyReading.author} · Chapter {currentlyReading.chapter}
                    </div>
                  </div>
                  <span style={{ marginLeft: "auto", color: accent, fontSize: 18 }}>→</span>
                </a>
              </div>
            )}

            {/* Music embed */}
            {musicSrc && (
              <div className="mpr-section">
                <div className="mpr-section-title" style={{ color: accent }}>
                  Now Playing 🎵
                  <div className="mpr-section-line" style={{ background: accentDim }} />
                </div>
                <div className="mpr-music-box" style={{ borderColor: accentDim, background: surface }}>
                  <iframe
                    className="mpr-music-iframe"
                    src={musicSrc}
                    height="120"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Note wall */}
            <div className="mpr-section">
              <div className="mpr-section-title" style={{ color: accent }}>
                Leave a Note 📝
                <div className="mpr-section-line" style={{ background: accentDim }} />
              </div>

              {notes.map(note => (
                <div
                  key={note.id}
                  className="mpr-note"
                  style={{ borderColor: border, background: surface }}
                >
                  <div className="mpr-note-author" style={{ color: textSub }}>
                    {note.author_name}
                    <span style={{ color: textFaint, fontWeight: 400, marginLeft: 4 }}>
                      · {timeAgo(note.created_at)}
                    </span>
                  </div>
                  <div className="mpr-note-text" style={{ color: textColor }}>
                    {note.note}
                  </div>
                  {(isOwner || currentUser?.id === note.author_id) && (
                    <button
                      type="button"
                      className="mpr-note-del"
                      style={{ color: textFaint }}
                      onClick={() => deleteNote(note.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {currentUser && !isOwner && (
                <div className="mpr-note-compose">
                  <textarea
                    className="mpr-note-textarea"
                    placeholder={`Leave ${displayName} a note…`}
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value.slice(0, 200))}
                    rows={2}
                    style={{ color: textColor, borderColor: border }}
                  />
                  <button
                    type="button"
                    className="mpr-note-submit"
                    disabled={!noteDraft.trim() || postingNote}
                    onClick={postNote}
                  >
                    {postingNote ? "Posting…" : "Leave Note"}
                  </button>
                </div>
              )}

              {!currentUser && (
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, color: textFaint, marginTop: 8 }}>
                  <a href="/reading-room/login" style={{ color: accent }}>Sign in</a> to leave a note.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="mpr-sidebar">

            {/* Stats */}
            <div className="mpr-sidebar-card" style={{ borderColor: border, background: surface }}>
              <div
                className="mpr-sidebar-card-top"
                style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }}
              />
              <div className="mpr-sidebar-card-inner">
                <div className="mpr-sidebar-card-title" style={{ color: accent }}>
                  Reading Stats
                </div>
                <div className="mpr-stats">
                  <div className="mpr-stat" style={{ borderColor: border }}>
                    <span className="mpr-stat-num" style={{ color: textColor }}>{unlockCount}</span>
                    <span className="mpr-stat-label" style={{ color: textFaint }}>Chapters</span>
                  </div>
                  <div className="mpr-stat" style={{ borderColor: border }}>
                    <span className="mpr-stat-num" style={{ color: textColor }}>
                      {member?.ink_balance ?? 0}
                    </span>
                    <span className="mpr-stat-label" style={{ color: textFaint }}>Ink Left</span>
                  </div>
                  <div className="mpr-stat" style={{ borderColor: border }}>
                    <span className="mpr-stat-num" style={{ color: textColor }}>{notes.length}</span>
                    <span className="mpr-stat-label" style={{ color: textFaint }}>Notes</span>
                  </div>
                  <div className="mpr-stat" style={{ borderColor: border }}>
                    <span className="mpr-stat-num" style={{ color: textColor }}>{visits.length}</span>
                    <span className="mpr-stat-label" style={{ color: textFaint }}>Visitors</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visitor log */}
            {visits.length > 0 && (
              <div className="mpr-sidebar-card" style={{ borderColor: border, background: surface }}>
                <div
                  className="mpr-sidebar-card-top"
                  style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }}
                />
                <div className="mpr-sidebar-card-inner">
                  <div className="mpr-sidebar-card-title" style={{ color: accent }}>
                    Recent Visitors
                  </div>
                  {visits.map((v, i) => (
                    <div
                      key={v.id}
                      className="mpr-visitor"
                      style={{ borderBottomColor: i < visits.length - 1 ? border : "transparent" }}
                    >
                      <div
                        className="mpr-visitor-avatar"
                        style={{ background: accentDim, color: accent }}
                      >
                        {v.visitor_avatar
                          ? <img src={v.visitor_avatar} alt={v.visitor_name ?? ""} />
                          : (v.visitor_name?.[0] ?? "?")
                        }
                      </div>
                      <span className="mpr-visitor-name" style={{ color: textSub }}>
                        {v.visitor_name ?? "Anonymous"}
                      </span>
                      <span className="mpr-visitor-time" style={{ color: textFaint }}>
                        {timeAgo(v.visited_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shelf preview link */}
            <div
              className="mpr-sidebar-card"
              style={{ borderColor: border, background: surface }}
            >
              <div
                className="mpr-sidebar-card-top"
                style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }}
              />
              <div className="mpr-sidebar-card-inner">
                <div className="mpr-sidebar-card-title" style={{ color: accent }}>
                  Bookshelf
                </div>
                <a
                  href="/members"
                  style={{
                    display: "block", textAlign: "center", padding: "10px",
                    fontFamily: "'Syne',sans-serif", fontSize: 9,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: accent, textDecoration: "none",
                    border: `1px solid ${accentDim}`, borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                >
                  View Full Shelf →
                </a>
              </div>
            </div>

          </div>
        </div>

        <TTLFooter />
      </div>
    </>
  );
}
