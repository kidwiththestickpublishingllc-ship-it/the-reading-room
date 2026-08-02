"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Drop = {
  title: string;
  author: string;
  slug: string;
  drop_date: string;
};

function useCountdown(target: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Out now!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 48) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [target]);

  return timeLeft;
}

function DropCard({ drop }: { drop: Drop }) {
  const timeLeft = useCountdown(drop.drop_date);
  const isLive = timeLeft === "Out now!";

  return (
    <div style={{
      background: "rgba(15,15,20,0.6)",
      border: `1px solid ${isLive ? "rgba(74,222,128,0.3)" : "rgba(201,168,76,0.15)"}`,
      borderRadius: 10, padding: "16px 20px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: isLive ? "#4ade80" : "rgba(201,168,76,0.6)", marginBottom: 4 }}>
          {isLive ? "🟢 Live Now" : "⏳ Dropping Soon"}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#f0ece2", lineHeight: 1.2 }}>{drop.title}</div>
        <div style={{ fontSize: 10, color: "rgba(232,228,218,0.4)", marginTop: 2 }}>by {drop.author}</div>
      </div>
      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: isLive ? "#4ade80" : "#C9A84C", fontWeight: 300 }}>{timeLeft}</div>
        {isLive && (
          <a href={`/reading-room/stories/${drop.slug}/chapters/1`} style={{
            fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" as const,
            color: "#4ade80", textDecoration: "none",
            border: "1px solid rgba(74,222,128,0.3)",
            padding: "4px 12px", borderRadius: 6, display: "inline-block", marginTop: 6,
          }}>Read Now →</a>
        )}
      </div>
    </div>
  );
}

const FALLBACK_DROPS: Drop[] = [
  { title: "Back To Strangers — Ch. 4", author: "Sergio Lastre", slug: "back-to-strangers", drop_date: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString() },
  { title: "When The Spirit Moves You — Ch. 2", author: "Chris Knopf", slug: "when-the-spirit-moves-you", drop_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
];

export default function CountdownDrops() {
  const [drops, setDrops] = useState<Drop[]>(FALLBACK_DROPS);

  useEffect(() => {
    supabase
      .from("chapters")
      .select("title, created_at, story_id, stories(title, author_name, slug)")
      .gt("created_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const mapped = data.map((d: any) => ({
          title: `${d.stories?.title} — Ch. ${d.title}`,
          author: d.stories?.author_name ?? "",
          slug: d.stories?.slug ?? "",
          drop_date: d.created_at,
        })).filter(d => d.slug);
        if (mapped.length > 0) setDrops(mapped);
      });
  }, []);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "rgba(201,168,76,0.6)", marginBottom: 12 }}>
        Upcoming Drops
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {drops.map((drop, i) => <DropCard key={i} drop={drop} />)}
      </div>
    </div>
  );
}