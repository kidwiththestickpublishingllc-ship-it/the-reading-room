"use client";

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
      <div className="ttl-filter-bar">
        {allGenres.map(g => (
          <button key={g} type="button"
            onClick={() => {
              if (g === "All") { setSelectedGenre("All"); }
              else { window.location.href = `/reading-room/genres/${encodeURIComponent(g.toLowerCase().replace(/\s+/g, "-").replace(/[+]/g, "").replace(/&/g, "and"))}`; }
            }}
            className={`ttl-filter-btn${selectedGenre === g ? " active" : ""}`}
            style={g === "LitRPG" ? { color: "#C2187F" } : undefined}
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