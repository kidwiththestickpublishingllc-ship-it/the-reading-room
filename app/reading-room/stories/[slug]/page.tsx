"use client";
import { useEffect } from "react";

export default function StoryPage() {
  useEffect(() => {
    const slug = window.location.pathname.split('/').filter(Boolean).pop();
    if (slug) window.location.replace(`/reading-room/stories/${slug}/chapters/1`);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: 18 }}>Opening story…</p>
    </div>
  );
}
