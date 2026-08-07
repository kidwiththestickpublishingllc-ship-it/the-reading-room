"use client";

/**
 * ChapterDropCalendar.tsx
 * ─────────────────────────────────────────────────────────────────
 * Visual calendar showing upcoming chapter releases.
 * Writers schedule drops in TWR. Readers see them here.
 * Creates anticipation and return visits.
 *
 * Place at: app/reading-room/drops/page.tsx
 * OR embed as a component anywhere: import ChapterDropCalendar
 *
 * TABLE NEEDED (Supabase):
 * ─────────────────────────────────────────────────────────────────
 * create table chapter_schedules (
 *   id uuid primary key default gen_random_uuid(),
 *   story_id uuid references stories not null,
 *   writer_id uuid references auth.users not null,
 *   story_title text not null,
 *   story_slug text not null,
 *   writer_name text not null,
 *   chapter_number int not null,
 *   chapter_title text,
 *   genre text,
 *   genre_accent text default '#C9A84C',
 *   scheduled_for timestamptz not null,
 *   is_published boolean default false,
 *   created_at timestamptz default now()
 * );
 * alter table chapter_schedules enable row level security;
 * create policy "anyone can read schedules"
 *   on chapter_schedules for select using (true);
 * create policy "writers can manage their own"
 *   on chapter_schedules for all
 *   using (auth.uid() = writer_id);
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";

interface ChapterDrop {
  id: string;
  story_id: string;
  story_title: string;
  story_slug: string;
  writer_name: string;
  chapter_number: number;
  chapter_title: string | null;
  genre: string | null;
  genre_accent: string;
  scheduled_for: string;
  is_published: boolean;
}

interface DayDrops {
  date: Date;
  dateStr: string;
  drops: ChapterDrop[];
}

const CDC_STYLES = `
  .cdc-root { min-height: 100vh; background: #0a0807; }
  .cdc-wrap { max-width: 980px; margin: 0 auto; padding: 48px 32px 96px; }

  /* Header */
  .cdc-header { margin-bottom: 40px; }
  .cdc-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(201,168,76,0.6); margin-bottom: 10px; display: block;
  }
  .cdc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 300;
    color: rgba(232,228,218,0.95); line-height: 1.1; margin-bottom: 6px;
  }
  .cdc-subtitle {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: rgba(232,228,218,0.35); line-height: 1.65;
  }

  /* Month nav */
  .cdc-month-nav {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 28px;
  }
  .cdc-month-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 300; color: rgba(232,228,218,0.9);
    flex: 1;
  }
  .cdc-month-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em;
    color: rgba(232,228,218,0.4);
    background: transparent; border: 1px solid rgba(255,255,255,0.1);
    padding: 7px 14px; border-radius: 8px; cursor: pointer;
    transition: all 0.2s;
  }
  .cdc-month-btn:hover {
    color: #C9A84C; border-color: rgba(201,168,76,0.3);
  }

  /* Calendar grid */
  .cdc-grid {
    display: grid; grid-template-columns: repeat(7, 1fr);
    gap: 4px; margin-bottom: 40px;
  }
  .cdc-day-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(232,228,218,0.25); text-align: center; padding: 8px 0;
  }
  .cdc-cell {
    min-height: 64px; border-radius: 10px;
    border: 1px solid transparent;
    padding: 8px 6px; position: relative;
    transition: all 0.2s; cursor: default;
  }
  .cdc-cell-empty { opacity: 0.3; }
  .cdc-cell-today {
    border-color: rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.05);
  }
  .cdc-cell-has-drops {
    border-color: rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.02);
    cursor: pointer;
  }
  .cdc-cell-has-drops:hover {
    border-color: rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.05);
  }
  .cdc-cell-selected {
    border-color: rgba(201,168,76,0.5) !important;
    background: rgba(201,168,76,0.08) !important;
  }
  .cdc-date-num {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.4);
    margin-bottom: 4px; display: block;
  }
  .cdc-date-num-today { color: #C9A84C; font-weight: 700; }
  .cdc-drop-dot {
    width: 6px; height: 6px; border-radius: 50%; margin: 1px;
    display: inline-block;
  }
  .cdc-drop-count {
    font-family: 'Syne', sans-serif;
    font-size: 9px; color: rgba(232,228,218,0.4);
    position: absolute; bottom: 5px; right: 6px;
  }

  /* Drop list */
  .cdc-drops-panel {
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 16px; overflow: hidden;
    margin-bottom: 32px;
  }
  .cdc-drops-panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(201,168,76,0.04);
    display: flex; align-items: center; gap: 12px;
  }
  .cdc-drops-panel-date {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300; color: rgba(232,228,218,0.9);
    flex: 1;
  }
  .cdc-drops-panel-count {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #C9A84C;
    border: 1px solid rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.08);
    padding: 3px 10px; border-radius: 999px;
  }
  .cdc-drop-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    text-decoration: none; transition: background 0.15s;
  }
  .cdc-drop-item:last-child { border-bottom: none; }
  .cdc-drop-item:hover { background: rgba(255,255,255,0.03); }
  .cdc-drop-accent {
    width: 3px; height: 40px; border-radius: 2px; flex-shrink: 0;
  }
  .cdc-drop-body { flex: 1; min-width: 0; }
  .cdc-drop-story {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 400; color: rgba(232,228,218,0.9);
    line-height: 1.2; margin-bottom: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cdc-drop-ch {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.4); margin-bottom: 3px;
  }
  .cdc-drop-writer {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.3);
  }
  .cdc-drop-time {
    font-family: 'Syne', sans-serif;
    font-size: 9px; color: rgba(232,228,218,0.25);
    text-align: right; flex-shrink: 0;
  }
  .cdc-drop-published {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #10B981; padding: 2px 8px;
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 999px; background: rgba(16,185,129,0.08);
  }

  /* Upcoming list */
  .cdc-upcoming { }
  .cdc-upcoming-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(232,228,218,0.25); margin-bottom: 12px; display: block;
  }
  .cdc-upcoming-item {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.015);
    text-decoration: none; margin-bottom: 6px;
    transition: all 0.2s;
  }
  .cdc-upcoming-item:hover {
    border-color: rgba(201,168,76,0.25);
    transform: translateX(3px);
  }

  /* Empty */
  .cdc-empty {
    padding: 40px 24px; text-align: center;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; background: rgba(255,255,255,0.01);
  }
  .cdc-empty-icon { font-size: 32px; display: block; margin-bottom: 12px; }
  .cdc-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300; color: rgba(232,228,218,0.6);
    margin-bottom: 6px;
  }
  .cdc-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.3); line-height: 1.65;
  }

  .cdc-loading {
    font-family: 'Syne', sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.25); text-align: center;
    padding: 40px 0; letter-spacing: 0.1em;
  }

  @media (max-width: 600px) {
    .cdc-grid { grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .cdc-cell { min-height: 48px; padding: 5px 3px; }
    .cdc-date-num { font-size: 9px; }
  }
`;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDropTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDropDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function ChapterDropCalendar() {
  const [drops, setDrops] = useState<ChapterDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load drops for current month range
  const loadDrops = useCallback(async () => {
    setLoading(true);
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);

    const { data } = await supabase
      .from("chapter_schedules")
      .select("*")
      .gte("scheduled_for", start.toISOString())
      .lte("scheduled_for", end.toISOString())
      .order("scheduled_for", { ascending: true });

    if (data) setDrops(data as ChapterDrop[]);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { loadDrops(); }, [loadDrops]);

  // Build calendar cells
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toDateString();

  // Group drops by date
  const dropsByDate: Record<string, ChapterDrop[]> = {};
  drops.forEach(d => {
    const key = new Date(d.scheduled_for).toDateString();
    if (!dropsByDate[key]) dropsByDate[key] = [];
    dropsByDate[key].push(d);
  });

  // Selected day drops
  const selectedDrops = selectedDate ? (dropsByDate[selectedDate] ?? []) : [];

  // Upcoming drops (next 7 days)
  const upcoming = drops.filter(d => {
    const date = new Date(d.scheduled_for);
    const diff = date.getTime() - Date.now();
    return diff > 0 && diff < 7 * 86400000 && !d.is_published;
  });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Calendar cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      <style>{CDC_STYLES}</style>
      <TTLNav />
      <div style={{ height: 74 }} />
      <div className="cdc-root">
        <div className="cdc-wrap">

          {/* Header */}
          <div className="cdc-header">
            <span className="cdc-eyebrow">The Reading Room</span>
            <div className="cdc-title">Chapter Drop Calendar 📅</div>
            <div className="cdc-subtitle">
              Upcoming chapters from writers across the library. Follow a writer to get notified when they drop.
            </div>
          </div>

          {/* Month navigation */}
          <div className="cdc-month-nav">
            <div className="cdc-month-label">
              {MONTH_NAMES[month]} {year}
            </div>
            <button type="button" className="cdc-month-btn" onClick={prevMonth}>← Prev</button>
            <button type="button" className="cdc-month-btn" onClick={() => setCurrentMonth(new Date())}>Today</button>
            <button type="button" className="cdc-month-btn" onClick={nextMonth}>Next →</button>
          </div>

          {loading ? (
            <div className="cdc-loading">Loading the calendar…</div>
          ) : (
            <>
              {/* Calendar grid */}
              <div className="cdc-grid">
                {/* Day labels */}
                {DAY_LABELS.map(d => (
                  <div key={d} className="cdc-day-label">{d}</div>
                ))}

                {/* Cells */}
                {cells.map((day, i) => {
                  if (!day) return (
                    <div key={`empty-${i}`} className="cdc-cell cdc-cell-empty" />
                  );
                  const cellDate = new Date(year, month, day);
                  const dateStr = cellDate.toDateString();
                  const isToday = dateStr === todayStr;
                  const dayDrops = dropsByDate[dateStr] ?? [];
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div
                      key={day}
                      className={`cdc-cell${isToday ? " cdc-cell-today" : ""}${dayDrops.length > 0 ? " cdc-cell-has-drops" : ""}${isSelected ? " cdc-cell-selected" : ""}`}
                      onClick={() => dayDrops.length > 0 && setSelectedDate(isSelected ? null : dateStr)}
                    >
                      <span className={`cdc-date-num${isToday ? " cdc-date-num-today" : ""}`}>
                        {day}
                      </span>
                      {dayDrops.slice(0, 3).map(drop => (
                        <span
                          key={drop.id}
                          className="cdc-drop-dot"
                          style={{ background: drop.genre_accent ?? "#C9A84C" }}
                        />
                      ))}
                      {dayDrops.length > 3 && (
                        <span className="cdc-drop-count">+{dayDrops.length - 3}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected day panel */}
              {selectedDate && selectedDrops.length > 0 && (
                <div className="cdc-drops-panel">
                  <div className="cdc-drops-panel-header">
                    <div className="cdc-drops-panel-date">
                      {formatDropDate(selectedDrops[0].scheduled_for)}
                    </div>
                    <span className="cdc-drops-panel-count">
                      {selectedDrops.length} drop{selectedDrops.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {selectedDrops.map(drop => (
                    <a
                      key={drop.id}
                      href={drop.is_published
                        ? `/reading-room/stories/${drop.story_slug}/chapters/${drop.chapter_number}`
                        : "#"
                      }
                      className="cdc-drop-item"
                      style={{ pointerEvents: drop.is_published ? "auto" : "none" }}
                    >
                      <div
                        className="cdc-drop-accent"
                        style={{ background: drop.genre_accent ?? "#C9A84C" }}
                      />
                      <div className="cdc-drop-body">
                        <div className="cdc-drop-story">{drop.story_title}</div>
                        <div className="cdc-drop-ch">
                          Chapter {drop.chapter_number}
                          {drop.chapter_title && ` — ${drop.chapter_title}`}
                        </div>
                        <div className="cdc-drop-writer">by {drop.writer_name}</div>
                      </div>
                      <div className="cdc-drop-time">
                        {drop.is_published
                          ? <span className="cdc-drop-published">Live now</span>
                          : formatDropTime(drop.scheduled_for)
                        }
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Upcoming this week */}
              {upcoming.length > 0 && (
                <div className="cdc-upcoming">
                  <span className="cdc-upcoming-label">Dropping this week</span>
                  {upcoming.map(drop => {
                    const dropDate = new Date(drop.scheduled_for);
                    const daysUntil = Math.ceil((dropDate.getTime() - Date.now()) / 86400000);
                    return (
                      <div key={drop.id} className="cdc-upcoming-item">
                        <div
                          style={{
                            width: 3, height: 36, borderRadius: 2, flexShrink: 0,
                            background: drop.genre_accent ?? "#C9A84C",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cdc-drop-story">{drop.story_title}</div>
                          <div className="cdc-drop-ch">
                            Chapter {drop.chapter_number} · by {drop.writer_name}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "'Syne',sans-serif", fontSize: 10,
                          color: drop.genre_accent ?? "#C9A84C", flexShrink: 0,
                          letterSpacing: "0.08em",
                        }}>
                          {daysUntil === 0 ? "Today"
                            : daysUntil === 1 ? "Tomorrow"
                            : `In ${daysUntil} days`
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {drops.length === 0 && (
                <div className="cdc-empty">
                  <span className="cdc-empty-icon">📅</span>
                  <div className="cdc-empty-title">No drops scheduled yet.</div>
                  <p className="cdc-empty-text">
                    Writers schedule their chapter drops in the Writer's Room.
                    Follow writers you love to see their upcoming drops here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <TTLFooter />
      </div>
    </>
  );
}
