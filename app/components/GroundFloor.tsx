"use client";

// app/reading-room/components/GroundFloor.tsx
// Replaces HeroSection. The first screen is a work, not a wordmark.
// Reads the newest published story and the opening of its first chapter,
// so it fills itself as the catalogue grows and never renders empty.
// Prefix: gf-

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Floor from "./Floor";
import Surface from "./Surface";

type Story = {
  slug: string;
  title: string;
  author_name: string | null;
  description: string | null;
  cover_url: string | null;
  badge: string | null;
  genre: string | null;
};

type Chapter = {
  chapter_number: number;
  title: string | null;
  content: string | null;
  is_free: boolean;
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');
  .gf-row { display: flex; flex-wrap: wrap; gap: 48px; align-items: flex-start; }
  .gf-coverwrap { flex: 0 0 270px; max-width: 100%; position: relative; transform: rotate(-1.4deg); }
  .gf-tape {
    position: absolute; top: -13px; left: 50%; margin-left: -42px;
    width: 84px; height: 26px; z-index: 2; transform: rotate(-2deg);
    background: rgba(214,201,164,0.75);
    border-left: 1px solid var(--edge, rgba(46,41,34,0.14));
    border-right: 1px solid var(--edge, rgba(46,41,34,0.14));
  }
  .gf-cover {
    aspect-ratio: 2 / 3; width: 100%;
    background: linear-gradient(170deg, #2B2420 0%, #171310 100%);
    border: 8px solid var(--plate, #F8F2E2);
    box-shadow: 0 14px 34px var(--surface-shadow, rgba(46,41,34,0.18));
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 24px; box-sizing: border-box; overflow: hidden;
  }
  .gf-cover img { position: absolute; inset: 8px; width: calc(100% - 16px); height: calc(100% - 16px); object-fit: cover; }
  .gf-cover-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 29px; line-height: 1.12; font-weight: 300; color: #F4F1EA;
  }
  .gf-cover-by { font-size: 11px; color: rgba(244,241,234,0.6); margin-top: 11px; letter-spacing: 0.05em; }

  .gf-main { flex: 999 1 440px; min-width: 0; }
  .gf-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    margin: 0 0 8px; font-size: clamp(34px, 5vw, 52px);
    line-height: 1.06; font-weight: 300; letter-spacing: -0.01em;
    color: var(--text-main, #1a1008);
  }
  .gf-by { font-size: 13.5px; color: var(--text-dim, rgba(26,16,8,0.75)); margin-bottom: 26px; }
  .gf-by a { color: var(--gold, #8A6510); }

  .gf-excerpt {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 21px; line-height: 1.78; margin: 0;
    color: var(--text-main, #1a1008);
  }

  .gf-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; align-items: center; }
  .gf-btn, .gf-btn-ghost {
    text-decoration: none; font-size: 12.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 16px 30px; border-radius: 2px; display: inline-block;
  }
  .gf-btn { background: #2A2520; color: #FAF6EC; }
  .gf-btn:hover { background: #1B1714; }
  .gf-btn-ghost { color: var(--text-main, #1a1008); border: 1px solid var(--edge, rgba(46,41,34,0.3)); }
  .gf-btn-ghost:hover { border-color: var(--gold, #8A6510); }

  .gf-hand {
    font-family: 'Caveat', cursive; font-size: 21px;
    color: var(--gold, #8A6510); margin-left: 6px;
  }

  .gf-empty { text-align: center; padding: 30px 10px; }
  .gf-empty-big { font-family: 'Caveat', cursive; font-size: 40px; color: var(--gold, #8A6510); line-height: 1.1; }
  .gf-empty-sub { font-size: 14px; color: var(--text-dim, rgba(26,16,8,0.75)); line-height: 1.7; margin: 12px auto 20px; max-width: 48ch; }

  .gf-skel { height: 300px; opacity: 0.35; }

  @media (max-width: 900px) {
    .gf-row { gap: 28px; }
    .gf-coverwrap { flex: 0 0 180px; margin: 0 auto; transform: none; }
    .gf-tape { display: none; }
    .gf-excerpt { font-size: 18px; }
    .gf-btn, .gf-btn-ghost { padding: 14px 22px; }
    .gf-hand { margin-left: 0; }
  }
`;

// Strip tags and collapse whitespace, then cut on a word boundary.
function excerptFrom(html: string | null, max = 340): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export default function GroundFloor() {
  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: s } = await supabase
          .from("stories")
          .select("slug, title, author_name, description, cover_url, badge, genre")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled || !s) { setLoading(false); return; }
        setStory(s as Story);

        const { data: storyRow } = await supabase
          .from("stories").select("id").eq("slug", s.slug).single();

        if (storyRow) {
          const { data: c } = await supabase
            .from("chapters")
            .select("chapter_number, title, content, is_free")
            .eq("story_id", storyRow.id)
            .order("chapter_number")
            .limit(1)
            .maybeSingle();
          if (!cancelled && c) setChapter(c as Chapter);
        }
      } catch { /* fall through to the invitation */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Nothing published yet: invite rather than show an empty box ──
  if (!loading && !story) {
    return (
      <Floor name="Ground Floor" slug="The Tiniest Library" number={1}>
        <style>{STYLES}</style>
        <Surface span={12}>
          <div className="gf-empty">
            <div className="gf-empty-big">the shelf is waiting</div>
            <p className="gf-empty-sub">
              We&rsquo;re reading submissions for the Founding 100. Keep your copyright,
              earn from chapter one, writers from thirteen up.
            </p>
            <a className="gf-btn" href="https://write.the-tiniest-library.com/apply">Apply to write</a>
          </div>
        </Surface>
      </Floor>
    );
  }

  const authorSlug = (story?.author_name ?? "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const readHref = story
    ? `/reading-room/stories/${story.slug}/chapters/${chapter?.chapter_number ?? 1}`
    : "#";

  return (
    <Floor name="Ground Floor" slug="The Tiniest Library" number={1}>
      <style>{STYLES}</style>

      <Surface span={12} label={story?.genre ? `Now reading · ${story.genre}` : "Now reading"}>
        {loading ? (
          <div className="gf-skel" />
        ) : (
          <div className="gf-row">

            <div className="gf-coverwrap">
              <span className="gf-tape" aria-hidden="true" />
              <div className="gf-cover" style={{ position: "relative" }}>
                {story?.cover_url ? (
                  <img src={story.cover_url} alt={`Cover of ${story.title}`} />
                ) : (
                  <>
                    <div className="gf-cover-title">{story?.title}</div>
                    <div className="gf-cover-by">{story?.author_name}</div>
                  </>
                )}
              </div>
            </div>

            <div className="gf-main">
              <h1 className="gf-title">{story?.title}</h1>
              <div className="gf-by">
                by <a href={`/reading-room/authors/${authorSlug}`}>{story?.author_name}</a>
                {story?.badge ? ` · ${story.badge}` : ""}
              </div>

              <Surface kind="plate" span={12} style={{ maxWidth: "58ch" }}>
                <p className="gf-excerpt">
                  {excerptFrom(chapter?.content ?? null) || story?.description || ""}
                </p>
              </Surface>

              <div className="gf-actions">
                <a className="gf-btn" href={readHref}>Start reading — free</a>
                <a className="gf-btn-ghost" href={`/reading-room/stories/${story?.slug}`}>All chapters</a>
                {chapter?.is_free && <span className="gf-hand">chapter one is always free</span>}
              </div>
            </div>

          </div>
        )}
      </Surface>
    </Floor>
  );
}
