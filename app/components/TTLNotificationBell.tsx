"use client";

/**
 * TTLNotificationBell.tsx
 * ─────────────────────────────────────────────────────────────────
 * Real-time notification bell for the TTL nav.
 * Notifies readers of: new chapters from followed writers/stories,
 * Reader's Letter replies, contest announcements, TTL updates.
 *
 * Place at: app/components/TTLNotificationBell.tsx
 *
 * HOW TO USE in TTLNav.tsx:
 * import TTLNotificationBell from "@/app/components/TTLNotificationBell";
 * Then add <TTLNotificationBell theme="dark" /> in the nav links area.
 *
 * TABLES NEEDED (Supabase):
 * ─────────────────────────────────────────────────────────────────
 * create table notifications (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users not null,
 *   type text not null check (type in (
 *     'new_chapter','letter_reply','contest','ttl_update','new_follower'
 *   )),
 *   title text not null,
 *   body text,
 *   href text,
 *   is_read boolean default false,
 *   created_at timestamptz default now()
 * );
 * alter table notifications enable row level security;
 * create policy "users see own notifications"
 *   on notifications for select using (auth.uid() = user_id);
 * create policy "users can mark read"
 *   on notifications for update using (auth.uid() = user_id);
 *
 * -- Function to create chapter notifications for followers
 * -- Call this from a trigger or edge function when a chapter is published:
 * create or replace function notify_chapter_followers(
 *   p_story_id uuid,
 *   p_writer_id uuid,
 *   p_chapter_title text,
 *   p_story_title text,
 *   p_chapter_num int,
 *   p_story_slug text
 * ) returns void language plpgsql security definer as $$
 * begin
 *   insert into notifications (user_id, type, title, body, href)
 *   select
 *     f.follower_id,
 *     'new_chapter',
 *     'New chapter: ' || p_story_title,
 *     p_chapter_title || ' — Chapter ' || p_chapter_num,
 *     '/reading-room/stories/' || p_story_slug || '/chapters/' || p_chapter_num
 *   from follows f
 *   where (f.target_type = 'story' and f.target_id = p_story_id)
 *      or (f.target_type = 'writer' and f.target_id = p_writer_id);
 * end;
 * $$;
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  type: "new_chapter" | "letter_reply" | "contest" | "ttl_update" | "new_follower";
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
}

interface TTLNotificationBellProps {
  theme?: "dark" | "light";
}

const TYPE_ICONS: Record<string, string> = {
  new_chapter:  "📖",
  letter_reply: "✉️",
  contest:      "🏆",
  ttl_update:   "📢",
  new_follower: "🪶",
};

const BELL_STYLES = `
  .nb-root { position: relative; }
  .nb-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px; cursor: pointer;
    font-size: 17px; position: relative;
    transition: background 0.2s;
    border: none; background: transparent;
  }
  .nb-btn-dark:hover { background: rgba(255,255,255,0.06); }
  .nb-btn-light:hover { background: rgba(201,168,76,0.08); }
  .nb-badge {
    position: absolute; top: 3px; right: 3px;
    min-width: 16px; height: 16px; border-radius: 999px;
    background: #C9A84C; color: #000;
    font-family: 'Syne', sans-serif;
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; line-height: 1;
  }
  .nb-panel {
    position: absolute; top: calc(100% + 10px); right: 0;
    width: 320px; border-radius: 16px; overflow: hidden;
    z-index: 200;
  }
  .nb-panel-dark {
    background: #141210;
    border: 1px solid rgba(201,168,76,0.25);
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
  }
  .nb-panel-light {
    background: #FFFFFF;
    border: 1px solid rgba(201,168,76,0.25);
    box-shadow: 0 8px 32px rgba(201,168,76,0.15);
  }
  .nb-accent-bar {
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .nb-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
  }
  .nb-header-title {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  }
  .nb-header-title-dark { color: rgba(232,228,218,0.5); }
  .nb-header-title-light { color: #9E8E6E; }
  .nb-mark-all {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    background: transparent; border: none; cursor: pointer;
    transition: color 0.2s; padding: 0;
  }
  .nb-mark-all-dark { color: rgba(201,168,76,0.5); }
  .nb-mark-all-dark:hover { color: #C9A84C; }
  .nb-mark-all-light { color: #9E8E6E; }
  .nb-mark-all-light:hover { color: #8A6510; }
  .nb-divider-dark { height: 1px; background: rgba(255,255,255,0.07); }
  .nb-divider-light { height: 1px; background: rgba(201,168,76,0.15); }
  .nb-list { max-height: 340px; overflow-y: auto; }
  .nb-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 18px; text-decoration: none;
    transition: background 0.15s; border-bottom: 1px solid;
  }
  .nb-item-dark { border-color: rgba(255,255,255,0.05); }
  .nb-item-dark:hover { background: rgba(255,255,255,0.03); }
  .nb-item-dark.unread { background: rgba(201,168,76,0.04); }
  .nb-item-light { border-color: rgba(201,168,76,0.1); }
  .nb-item-light:hover { background: rgba(201,168,76,0.04); }
  .nb-item-light.unread { background: rgba(201,168,76,0.06); }
  .nb-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .nb-item-title {
    font-family: 'Syne', sans-serif;
    font-size: 12px; line-height: 1.4; margin-bottom: 3px;
  }
  .nb-item-title-dark { color: rgba(232,228,218,0.85); }
  .nb-item-title-dark.unread { color: rgba(232,228,218,0.95); }
  .nb-item-title-light { color: #1A1612; }
  .nb-item-body {
    font-family: 'Syne', sans-serif;
    font-size: 10px; line-height: 1.5;
  }
  .nb-item-body-dark { color: rgba(232,228,218,0.35); }
  .nb-item-body-light { color: #9E8E6E; }
  .nb-item-time {
    font-family: 'Syne', sans-serif;
    font-size: 9px; margin-top: 4px;
  }
  .nb-item-time-dark { color: rgba(232,228,218,0.2); }
  .nb-item-time-light { color: #C4B49A; }
  .nb-unread-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #C9A84C; margin-top: 6px; flex-shrink: 0;
  }
  .nb-empty {
    padding: 28px 18px; text-align: center;
    font-family: 'Syne', sans-serif; font-size: 11px; letter-spacing: 0.06em;
  }
  .nb-empty-dark { color: rgba(232,228,218,0.25); }
  .nb-empty-light { color: #C4B49A; }
  .nb-footer {
    padding: 10px 18px;
  }
  .nb-footer-dark { border-top: 1px solid rgba(255,255,255,0.07); }
  .nb-footer-light { border-top: 1px solid rgba(201,168,76,0.15); }
  .nb-footer-link {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    text-decoration: none; display: block; text-align: center;
    transition: color 0.2s;
  }
  .nb-footer-link-dark { color: rgba(232,228,218,0.25); }
  .nb-footer-link-dark:hover { color: #C9A84C; }
  .nb-footer-link-light { color: #9E8E6E; }
  .nb-footer-link-light:hover { color: #8A6510; }
`;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TTLNotificationBell({ theme = "dark" }: TTLNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Load notifications
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifications(data as Notification[]); });
  }, [userId]);

  // Realtime new notifications
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  // Mark all as read when panel opens
  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && userId && unreadCount > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (!userId) return null;

  return (
    <>
      <style>{BELL_STYLES}</style>
      <div className="nb-root" ref={panelRef}>
        {/* Bell button */}
        <button
          type="button"
          className={`nb-btn nb-btn-${isDark ? "dark" : "light"}`}
          onClick={handleOpen}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span className="nb-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Panel */}
        {open && (
          <div className={`nb-panel nb-panel-${isDark ? "dark" : "light"}`}>
            <div className="nb-accent-bar" />

            <div className="nb-header">
              <span className={`nb-header-title nb-header-title-${isDark ? "dark" : "light"}`}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={`nb-mark-all nb-mark-all-${isDark ? "dark" : "light"}`}
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className={`nb-divider-${isDark ? "dark" : "light"}`} />

            <div className="nb-list">
              {notifications.length === 0 ? (
                <div className={`nb-empty nb-empty-${isDark ? "dark" : "light"}`}>
                  No notifications yet. Follow writers and stories to get updates.
                </div>
              ) : (
                notifications.map(n => (
                  <a
                    key={n.id}
                    href={n.href ?? "#"}
                    className={`nb-item nb-item-${isDark ? "dark" : "light"}${!n.is_read ? " unread" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="nb-icon">{TYPE_ICONS[n.type] ?? "📢"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={`nb-item-title nb-item-title-${isDark ? "dark" : "light"}${!n.is_read ? " unread" : ""}`}>
                        {n.title}
                      </div>
                      {n.body && (
                        <div className={`nb-item-body nb-item-body-${isDark ? "dark" : "light"}`}>
                          {n.body}
                        </div>
                      )}
                      <div className={`nb-item-time nb-item-time-${isDark ? "dark" : "light"}`}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.is_read && <div className="nb-unread-dot" />}
                  </a>
                ))
              )}
            </div>

            <div className={`nb-footer nb-footer-${isDark ? "dark" : "light"}`}>
              <a
                href="/reading-room/notifications"
                className={`nb-footer-link nb-footer-link-${isDark ? "dark" : "light"}`}
                onClick={() => setOpen(false)}
              >
                View all notifications →
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
