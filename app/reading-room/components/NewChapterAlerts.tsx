"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Alert = {
  story_title: string;
  author_name: string;
  chapter_number: number;
  story_slug: string;
  created_at: string;
};

export default function NewChapterAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("ttl_last_read");
    if (!raw) return;
    const lastRead = JSON.parse(raw);

    supabase
      .from("chapters")
      .select("chapter_number, created_at, story_id, stories(title, author_name, slug)")
      .eq("stories.slug", lastRead.slug)
      .gt("chapter_number", lastRead.chapter)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (!data) return;
        const mapped = data.map((d: any) => ({
          story_title: d.stories?.title ?? "",
          author_name: d.stories?.author_name ?? "",
          chapter_number: d.chapter_number,
          story_slug: d.stories?.slug ?? "",
          created_at: d.created_at,
        })).filter(a => a.story_title);
        setAlerts(mapped);
      });
  }, []);

  const visible = alerts.filter(a => !dismissed.includes(`${a.story_slug}-${a.chapter_number}`));
  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "rgba(100,149,237,0.7)", marginBottom: 10 }}>
        New Chapters
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {visible.map(alert => (
          <div key={`${alert.story_slug}-${alert.chapter_number}`} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(100,149,237,0.06)",
            border: "1px solid rgba(100,149,237,0.2)",
            borderLeft: "3px solid #6495ED",
            borderRadius: 8, padding: "10px 16px", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14 }}>📬</span>
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: "#f0ece2" }}>
                  {alert.story_title}
                </span>
                <span style={{ fontSize: 10, color: "rgba(232,228,218,0.4)", marginLeft: 8 }}>
                  Ch. {alert.chapter_number} · {alert.author_name}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <a href={`/reading-room/stories/${alert.story_slug}/chapters/${alert.chapter_number}`} style={{
                fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                color: "#6495ED", textDecoration: "none",
                border: "1px solid rgba(100,149,237,0.3)",
                padding: "5px 12px", borderRadius: 6,
              }}>Read →</a>
              <button onClick={() => setDismissed(d => [...d, `${alert.story_slug}-${alert.chapter_number}`])} style={{
                background: "none", border: "none", color: "rgba(232,228,218,0.3)",
                cursor: "pointer", fontSize: 12, padding: 2,
              }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}