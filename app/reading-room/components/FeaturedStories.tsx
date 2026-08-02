"use client";
import { useState } from "react";
import StoryStage, { StageTheme } from "./StoryStage";
import StorySocial from "./StorySocial";

type Story = {
  id?: string;
  slug: string;
  title: string;
  author: string;
  badge: "Serial" | "Exclusive" | "Early Access";
  description: string;
  cover: string;
  genres?: string[];
  teaser?: string;
  content?: string;
};

type Unlocks = Record<string, boolean>;

function RedDoorCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <a href="https://redroom.the-tiniest-library.com/" target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 24, background: "linear-gradient(135deg, #1a0505 0%, #2d0808 50%, #1a0505 100%)", border: `1px solid ${hovered ? "rgba(200,60,60,0.8)" : "rgba(180,30,30,0.5)"}`, borderLeft: "4px solid #c94c4c", borderRadius: 12, padding: "28px 32px", marginBottom: 16, textDecoration: "none", position: "relative", overflow: "hidden", transform: hovered ? "translateY(-2px)" : "translateY(0)", transition: "border-color 0.3s, transform 0.2s", boxShadow: "0 0 40px rgba(180,30,30,0.12), inset 0 0 60px rgba(180,30,30,0.04)" }}>
      <div style={{ width: 64, height: 80, flexShrink: 0, background: "linear-gradient(180deg, #3d0a0a, #1a0404)", border: "2px solid rgba(201,168,76,0.6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 0 20px rgba(201,168,76,0.2)", position: "relative" }}>
        🚪
        <div style={{ position: "absolute", right: 8, top: "50%", width: 8, height: 8, borderRadius: "50%", background: "#C9A84C", boxShadow: "0 0 6px rgba(201,168,76,0.8)" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "rgba(200,80,80,0.8)", marginBottom: 8 }}>18+ · Age Verified Access Only</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#f0ece2", marginBottom: 6, lineHeight: 1.1 }}>The Red Room</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, color: "rgba(232,228,218,0.4)", lineHeight: 1.6 }}>Adult fiction for grown readers. 29 genres. Explicit content behind a verified age gate.</div>
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "rgba(200,80,80,0.7)", border: "1px solid rgba(200,80,80,0.3)", padding: "8px 16px", borderRadius: 6, flexShrink: 0 }}>Enter →</div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" as const, background: "radial-gradient(ellipse at 20% 50%, rgba(180,30,30,0.08) 0%, transparent 70%)" }} />
    </a>
  );
}

function stageThemeFor(slug: string): StageTheme {
  if (slug.startsWith("kings-of-sorrow")) return { bgFrom: "#E8741C", bgTo: "#C25A0F", mode: "light" };
  if (slug.startsWith("when-the-spirit")) return { bgFrom: "#B0237A", bgTo: "#8A1A5E", mode: "dark" };
  if (slug.startsWith("back-to-strangers")) return { bgFrom: "#8BC34A", bgTo: "#6BA03A", mode: "light" };
  if (slug.startsWith("volver-a-ser")) return { bgFrom: "#6A2FB5", bgTo: "#4E1F8A", mode: "dark" };
  return { bgFrom: "#16263f", bgTo: "#0f1c30", mode: "dark" };
}

interface FeaturedStoriesProps {
  allGenres: string[];
  selectedGenre: string;
  setSelectedGenre: (g: string) => void;
  storiesLoading: boolean;
  storiesError: string | null;
  filteredStories: Story[];
  ink: number;
  unlocks: Unlocks;
  user: any;
  onUnlock: (slug: string, cost: number) => void;
  DEFAULT_UNLOCK_COST: number;
}

export default function FeaturedStories({
  allGenres, selectedGenre, setSelectedGenre,
  storiesLoading, storiesError, filteredStories,
  ink, unlocks, user, onUnlock, DEFAULT_UNLOCK_COST,
}: FeaturedStoriesProps) {
  return (
    <div className="ttl-section">
      <div className="ttl-section-header">
        <div>
          <div className="ttl-section-accent">
            <div className="ttl-section-bar ttl-section-bar-blue" />
            <div>
              <span className="ttl-section-eyebrow">Read</span>
              <h2 className="ttl-section-title">Featured Stories</h2>
            </div>
          </div>
        </div>
        <a href="/reading-room/stories" className="ttl-section-link">Browse All →</a>
      </div>
      <div className="ttl-divider" />
      <RedDoorCard />
      <div className="ttl-filter-bar">
        {allGenres.map(g => (
          <button key={g} type="button"
            onClick={() => {
              if (g === "All") { setSelectedGenre("All"); }
              else { window.location.href = `/reading-room/genres/${encodeURIComponent(g.toLowerCase().replace(/\s+/g, "-").replace(/[+]/g, "").replace(/&/g, "and"))}`; }
            }}
            className={`ttl-filter-btn${selectedGenre === g ? " active" : ""}`}
            style={g === "LitRPG" ? { color: "#FF69B4", borderColor: "#FF1493", boxShadow: "0 0 10px rgba(255,20,147,0.6), inset 0 0 6px rgba(255,20,147,0.15)", textShadow: "0 0 6px rgba(255,20,147,0.5)", animation: "litrpgBtnGlow 2.5s ease-in-out infinite" } : undefined}
          >{g}</button>
        ))}
      </div>
      {storiesLoading && <div className="ttl-status">Loading stories from the library…</div>}
      {storiesError && <div className="ttl-status ttl-status-warn">Using fallback stories. Supabase: {storiesError}</div>}
      <div className="ttl-stage-list">
        {filteredStories.map(story => (
          <StoryStage
            key={story.slug}
            story={{ id: story.id, slug: story.slug, title: story.title, author: story.author, description: story.description, badge: story.badge, cover: story.cover, genres: story.genres }}
            ink={ink}
            isUnlocked={Boolean(unlocks[story.slug])}
            canUnlock={ink >= DEFAULT_UNLOCK_COST}
            unlockCost={DEFAULT_UNLOCK_COST}
            onUnlock={() => onUnlock(story.slug, DEFAULT_UNLOCK_COST)}
            userId={user?.id ?? null}
            theme={stageThemeFor(story.slug)}
          />
        ))}
      </div>
    </div>
  );
}