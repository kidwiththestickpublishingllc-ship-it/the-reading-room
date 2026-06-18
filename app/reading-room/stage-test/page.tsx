"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StoryStage, { StageTheme } from "../components/StoryStage";

function themeFor(slug: string): StageTheme {
  if (slug.startsWith("fox-vs-the-world")) return { bgFrom: "#E8741C", bgTo: "#C25A0F", mode: "light" };       // sunburst orange
  if (slug.startsWith("when-the-spirit")) return { bgFrom: "#B0237A", bgTo: "#8A1A5E", mode: "dark" };          // magenta
  if (slug.startsWith("back-to-strangers")) return { bgFrom: "#8BC34A", bgTo: "#6BA03A", mode: "light" };       // light green
  if (slug.startsWith("volver-a-ser")) return { bgFrom: "#6A2FB5", bgTo: "#4E1F8A", mode: "dark" };             // royal purple
  return { bgFrom: "#16263f", bgTo: "#0f1c30", mode: "dark" };
}

export default function StageTest() {
  const [stories, setStories] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("stories")
      .select("id, slug, title, author_name, description, badge, cover_url, genre")
      .eq("is_published", true)
      .then(({ data }) => setStories(data ?? []));
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#3a5a85,#101f38)", padding: "40px 24px" }}>
      {stories.map((s) => (
        <StoryStage
          key={s.slug}
          story={{
            id: s.id, slug: s.slug, title: s.title, author: s.author_name,
            description: s.description ?? "", badge: s.badge ?? "Serial",
            cover: s.cover_url ?? undefined,
            genres: s.genre ? [s.genre] : [],
          }}
          ink={0} isUnlocked={false} canUnlock={false}
          unlockCost={25} onUnlock={() => alert("unlock " + s.slug)}
          userId={null}
          theme={themeFor(s.slug)}
        />
      ))}
    </div>
  );
}