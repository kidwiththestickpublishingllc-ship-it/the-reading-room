"use client";
import { useState } from "react";

const MOODS = [
  { emoji: "🌑", label: "Dark", genres: ["Horror", "Thriller", "Dark Fantasy", "Gothic"], color: "#9B2335" },
  { emoji: "🌹", label: "Romantic", genres: ["Romance", "Contemporary Fiction", "Latin Stories"], color: "#C9A84C" },
  { emoji: "⚡", label: "Thrilling", genres: ["Thriller", "Action", "Mystery", "Crime"], color: "#6495ED" },
  { emoji: "🌀", label: "Weird", genres: ["Sci-Fi", "LitRPG", "Fantasy", "Surreal"], color: "#9B59B6" },
  { emoji: "🌤️", label: "Hopeful", genres: ["Young Adult", "Coming of Age", "Inspirational"], color: "#4ade80" },
];

interface MoodSelectorProps {
  onMoodSelect: (genres: string[]) => void;
}

export default function MoodSelector({ onMoodSelect }: MoodSelectorProps) {
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const handleMood = (mood: typeof MOODS[0]) => {
    if (activeMood === mood.label) {
      setActiveMood(null);
      onMoodSelect([]);
    } else {
      setActiveMood(mood.label);
      onMoodSelect(mood.genres);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "rgba(201,168,76,0.6)", marginBottom: 16 }}>
        What are you in the mood for?
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        {MOODS.map(mood => {
          const active = activeMood === mood.label;
          return (
            <button key={mood.label} onClick={() => handleMood(mood)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 999,
              border: `1px solid ${active ? mood.color : "rgba(255,255,255,0.1)"}`,
              background: active ? `${mood.color}22` : "transparent",
              color: active ? mood.color : "rgba(232,228,218,0.6)",
              fontFamily: "'Times New Roman', serif",
              fontSize: 12, letterSpacing: "0.1em",
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: active ? `0 0 16px ${mood.color}44` : "none",
            }}>
              <span style={{ fontSize: 16 }}>{mood.emoji}</span>
              {mood.label}
            </button>
          );
        })}
      </div>
      {activeMood && (
        <div style={{ marginTop: 12, fontSize: 10, color: "rgba(232,228,218,0.3)", letterSpacing: "0.08em" }}>
          Showing stories that match <span style={{ color: "#C9A84C" }}>{activeMood}</span> — <button onClick={() => { setActiveMood(null); onMoodSelect([]); }} style={{ background: "none", border: "none", color: "rgba(232,228,218,0.4)", cursor: "pointer", fontSize: 10, textDecoration: "underline", padding: 0 }}>clear</button>
        </div>
      )}
    </div>
  );
}