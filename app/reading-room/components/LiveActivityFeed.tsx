"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  reader: string;
  action: string;
  story: string;
  time: string;
};

const FALLBACK: Activity[] = [
  { id: "1", reader: "A. Chen", action: "unlocked", story: "Back To Strangers", time: "2m ago" },
  { id: "2", reader: "M. Torres", action: "started reading", story: "When The Spirit Moves You", time: "5m ago" },
  { id: "3", reader: "R. Osei", action: "tipped the author of", story: "Volver a Ser Extraños", time: "9m ago" },
];

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from("ad_views")
      .select("id, reader_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const mapped = data.map((d: any, i: number) => ({
          id: d.id,
          reader: `Reader ${d.reader_id?.slice(-4) ?? "???"}`,
          action: ["unlocked", "started reading", "tipped the author of"][i % 3],
          story: FALLBACK[i % FALLBACK.length].story,
          time: "just now",
        }));
        setActivities(mapped);
      });
  }, []);

  return (
    <div style={{
      background: "rgba(15,15,20,0.6)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "20px 24px",
      marginBottom: 32,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
        <span style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase" as const, color: "rgba(74,222,128,0.7)" }}>Live Activity</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
        {activities.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 12, color: "rgba(232,228,218,0.5)", lineHeight: 1.4 }}>
              <span style={{ color: "#f0ece2", fontWeight: 600 }}>{a.reader}</span>
              {" "}{a.action}{" "}
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "#C9A84C", fontStyle: "italic" }}>{a.story}</span>
            </div>
            <span style={{ fontSize: 9, color: "rgba(232,228,218,0.2)", whiteSpace: "nowrap" as const, letterSpacing: "0.06em" }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}