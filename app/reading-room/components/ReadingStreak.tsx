"use client";
import { useEffect, useState } from "react";

function getStreak(): { count: number; lastDate: string } {
  const raw = localStorage.getItem("ttl_reading_streak");
  return raw ? JSON.parse(raw) : { count: 0, lastDate: "" };
}

function updateStreak(): number {
  const today = new Date().toDateString();
  const streak = getStreak();
  if (streak.lastDate === today) return streak.count;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const newCount = streak.lastDate === yesterday.toDateString() ? streak.count + 1 : 1;
  localStorage.setItem("ttl_reading_streak", JSON.stringify({ count: newCount, lastDate: today }));
  return newCount;
}

export default function ReadingStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(updateStreak());
  }, []);

  if (streak < 2) return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(255,140,0,0.08)",
      border: "1px solid rgba(255,140,0,0.25)",
      borderRadius: 999, padding: "6px 16px",
      marginBottom: 24,
    }}>
      <span style={{ fontSize: 18 }}>🔥</span>
      <span style={{
        fontFamily: "'Times New Roman', serif",
        fontSize: 12, color: "#FFA500",
        letterSpacing: "0.08em",
      }}>
        {streak} day streak — keep it going!
      </span>
    </div>
  );
}