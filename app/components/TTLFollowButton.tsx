"use client";

/**
 * TTLFollowButton.tsx
 * ─────────────────────────────────────────────────────────────────
 * Follow a writer or story. Feeds the notification bell and
 * the Chapter Drop Calendar.
 *
 * Place at: app/components/TTLFollowButton.tsx
 *
 * TABLES NEEDED (Supabase):
 * ─────────────────────────────────────────────────────────────────
 * create table follows (
 *   id uuid primary key default gen_random_uuid(),
 *   follower_id uuid references auth.users not null,
 *   target_type text not null check (target_type in ('writer','story')),
 *   target_id uuid not null,
 *   created_at timestamptz default now(),
 *   unique(follower_id, target_type, target_id)
 * );
 * alter table follows enable row level security;
 * create policy "users see own follows"
 *   on follows for select using (auth.uid() = follower_id);
 * create policy "users can follow"
 *   on follows for insert with check (auth.uid() = follower_id);
 * create policy "users can unfollow"
 *   on follows for delete using (auth.uid() = follower_id);
 * ─────────────────────────────────────────────────────────────────
 *
 * USAGE:
 * <TTLFollowButton
 *   targetType="writer"
 *   targetId={author.user_id}
 *   targetName={author.name}
 *   theme="dark"
 *   size="sm"
 * />
 *
 * <TTLFollowButton
 *   targetType="story"
 *   targetId={story.id}
 *   targetName={story.title}
 *   theme="light"
 *   size="md"
 * />
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TTLFollowButtonProps {
  targetType: "writer" | "story";
  targetId: string;
  targetName: string;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  accent?: string;
  accentDim?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

const DARK = {
  idle:    { bg: "transparent", border: "rgba(255,255,255,0.15)", color: "rgba(232,228,218,0.5)" },
  active:  { bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.4)", color: "#C9A84C" },
  hover:   { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.25)", color: "rgba(232,228,218,0.8)" },
};

const LIGHT = {
  idle:    { bg: "transparent", border: "rgba(201,168,76,0.25)", color: "#9E8E6E" },
  active:  { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.5)", color: "#8A6510" },
  hover:   { bg: "rgba(201,168,76,0.05)", border: "rgba(201,168,76,0.4)", color: "#5C4F3A" },
};

const SIZES = {
  sm: { fontSize: 8,  padding: "4px 12px",  borderRadius: 999 },
  md: { fontSize: 9,  padding: "6px 16px",  borderRadius: 8 },
  lg: { fontSize: 10, padding: "9px 22px",  borderRadius: 10 },
};

export default function TTLFollowButton({
  targetType, targetId, targetName,
  theme = "dark", size = "md",
  accent, accentDim,
  onFollowChange,
}: TTLFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);

  const t = theme === "light" ? LIGHT : DARK;
  const s = SIZES[size];
  const accentColor = accent ?? "#C9A84C";

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Check follow status
  useEffect(() => {
    if (!userId || !targetId) { setLoading(false); return; }
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(Boolean(data));
        setLoading(false);
      });
  }, [userId, targetId, targetType]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || loading) return;
    setLoading(true);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      setIsFollowing(false);
      setJustFollowed(false);
      onFollowChange?.(false);
    } else {
      await supabase
        .from("follows")
        .insert({
          follower_id: userId,
          target_type: targetType,
          target_id: targetId,
        });
      setIsFollowing(true);
      setJustFollowed(true);
      onFollowChange?.(true);
      // Reset the "just followed" state after 2s
      setTimeout(() => setJustFollowed(false), 2000);
    }
    setLoading(false);
  };

  // Not logged in — show disabled button
  if (!userId) {
    return (
      <a
        href="/reading-room/login"
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: s.fontSize, letterSpacing: "0.14em", textTransform: "uppercase",
          padding: s.padding, borderRadius: s.borderRadius,
          border: `1px solid ${t.idle.border}`,
          background: t.idle.bg, color: t.idle.color,
          textDecoration: "none", display: "inline-flex",
          alignItems: "center", gap: 5,
          transition: "all 0.2s",
        }}
      >
        + Follow
      </a>
    );
  }

  const state = isFollowing ? t.active : hovered ? t.hover : t.idle;
  const label = justFollowed
    ? `✓ Following ${targetName.split(" ")[0]}`
    : isFollowing
    ? "✓ Following"
    : `+ Follow`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
      title={isFollowing ? `Unfollow ${targetName}` : `Follow ${targetName}`}
      style={{
        fontFamily: "'Syne',sans-serif",
        fontSize: s.fontSize, letterSpacing: "0.14em", textTransform: "uppercase",
        padding: s.padding, borderRadius: s.borderRadius,
        border: `1px solid ${isFollowing ? (accent ? `${accentColor}66` : state.border) : state.border}`,
        background: state.bg, color: isFollowing ? accentColor : state.color,
        cursor: loading ? "default" : "pointer",
        transition: "all 0.2s",
        display: "inline-flex", alignItems: "center", gap: 5,
        opacity: loading ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
