"use client";
import { useEffect, useState } from "react";

type LastRead = {
  slug: string;
  title: string;
  author: string;
  chapter: number;
};

export default function ContinueReadingStrip() {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("ttl_last_read");
    if (raw) {
      try { setLastRead(JSON.parse(raw)); } catch {}
    }
  }, []);

  if (!lastRead || dismissed) return null;

  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(201,168,76,0.08), rgba(201,168,76,0.04))",
      border: "1px solid rgba(201,168,76,0.25)",
      borderLeft: "3px solid #C9A84C",
      borderRadius: 8,
      padding: "12px 20px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap" as const,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18 }}>📖</span>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "rgba(201,168,76,0.7)", marginBottom: 2 }}>Continue Reading</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#f0ece2", lineHeight: 1.2 }}>
            {lastRead.title}
            <span style={{ fontSize: 11, color: "rgba(232,228,218,0.4)", marginLeft: 8 }}>· Ch. {lastRead.chapter} · {lastRead.author}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <a href={`/reading-room/stories/${lastRead.slug}/chapters/${lastRead.chapter}`} style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase" as const,
          color: "#000", fontWeight: 700,
          background: "linear-gradient(135deg, #C9A84C, #8a6510)",
          padding: "8px 18px", borderRadius: 6,
          textDecoration: "none",
        }}>
          Jump Back In →
        </a>
        <button onClick={() => setDismissed(true)} style={{
          background: "transparent", border: "none",
          color: "rgba(232,228,218,0.3)", fontSize: 16,
          cursor: "pointer", padding: 4,
        }}>✕</button>
      </div>
    </div>
  );
}