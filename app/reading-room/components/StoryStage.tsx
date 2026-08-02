"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import StorySocial from "./StorySocial";

type StageStory = {
  id?: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  badge: "Serial" | "Exclusive" | "Early Access";
  cover?: string;
  genres?: string[];
  teaser?: string;
};

export type StageTheme = { bgFrom: string; bgTo: string; mode: "light" | "dark" };

type PromoCard = { label: string; title: string; sub: string; href: string };

type Props = {
  story: StageStory;
  ink: number;
  isUnlocked: boolean;
  canUnlock: boolean;
  unlockCost: number;
  onUnlock: () => void;
  userId: string | null;
  theme?: StageTheme;
  promos?: PromoCard[];
};

type Writer = {
  id: string;
  name: string;
  bio: string | null;
  tagline: string | null;
  greeting: string | null;
  photo_url: string | null;
  is_founding_author: boolean | null;
};
type MediaItem = { url: string; type: string };

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E2C97E";
const DEFAULT_THEME: StageTheme = { bgFrom: "#16263f", bgTo: "#0f1c30", mode: "dark" };

const DEFAULT_PROMOS: PromoCard[] = [
  { label: "Featured", title: "Your story could live here", sub: "Promote your work in the Reading Room.", href: "/reading-room/authors" },
  { label: "18+", title: "Enter the Red Room", sub: "Adult fiction behind a verified gate.", href: "https://redroom.the-tiniest-library.com" },
  { label: "Support", title: "Buy Ink, back a writer", sub: "Every unlock pays the author directly.", href: "/reading-room/buy-ink" },
];

export default function StoryStage({
  story,
  ink,
  isUnlocked,
  canUnlock,
  unlockCost,
  onUnlock,
  userId,
  theme = DEFAULT_THEME,
  promos = DEFAULT_PROMOS,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [promo, setPromo] = useState(0);
  const [writer, setWriter] = useState<Writer | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLight = theme.mode === "light";
  const txtMain = isLight ? "#1a1208" : "#ffffff";
  const txtDim = isLight ? "rgba(26,18,8,0.85)" : "#ffffff";
  const txtFaint = isLight ? "rgba(26,18,8,0.62)" : "rgba(255,255,255,0.72)";
  const surface = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const surfaceBorder = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)";
  const divider = `${GOLD}40`;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const { data: w } = await supabase
        .from("writers")
        .select("id, name, bio, tagline, greeting, photo_url, is_founding_author")
        .eq("name", story.author)
        .eq("is_approved", true)
        .maybeSingle();
      if (!cancelled && w) {
        setWriter(w as Writer);
        const { data: m } = await supabase
          .from("story_media")
          .select("media_urls, media_type")
          .eq("author_id", w.id)
          .limit(6);
        if (!cancelled && m) {
          const items: MediaItem[] = [];
          m.forEach((row: any) => {
            const urls: string[] = row.media_urls ?? [];
            urls.forEach((u) => items.push({ url: u, type: row.media_type ?? "image" }));
          });
          setMedia(items.slice(0, 6));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, story.author]);

  useEffect(() => {
    timerRef.current = setInterval(() => setPromo((p) => (p + 1) % promos.length), 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [promos.length]);

  const openReader = () => {
    localStorage.setItem("ttl_last_read", JSON.stringify({
      slug: story.slug,
      title: story.title,
      author: story.author,
      chapter: 1,
    }));
    window.location.href = `/reading-room/stories/${story.slug}/chapters/1`;
  };
  const initial =
    story.author.split(" ").pop()?.[0]?.toUpperCase() ?? story.author[0] ?? "?";
  const isVideo = (t: string, u: string) =>
    /video/i.test(t) || /\.(mp4|webm|mov|m4v)/i.test(u);

  return (
    <div
      className="ss-stage"
      ref={rootRef}
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        border: `1px solid ${GOLD}55`,
      }}
    >
      <div className="ss-goldline" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

      {/* ZONE 1 — BOOK */}
      <div className="ss-zone ss-bay" style={{ borderRight: `1px solid ${divider}` }}>
        <div
          className={`ss-book${flipped ? " flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f); }}
        >
          <div className="ss-faces">
            <div className="ss-front" style={{ borderLeft: `5px solid ${GOLD}` }}>
              {story.cover ? (
                <>
                  <img className="ss-cover-img" src={story.cover} alt={story.title} />
                  <div className="ss-cover-scrim" />
                </>
              ) : null}
              <div className="ss-cover-content">
                <span className="ss-badge" style={{ color: GOLD_LIGHT, borderColor: `${GOLD}66` }}>{story.badge}</span>
                <div>
                  <div className="ss-cover-title">{story.title}</div>
                  <div className="ss-cover-author" style={{ color: GOLD_LIGHT }}>by {story.author}</div>
                  <div className="ss-flip-hint">↻ click to read back</div>
                </div>
              </div>
            </div>
            <div className="ss-back" style={{ borderRight: `5px solid ${GOLD}` }}>
              <div className="ss-back-label" style={{ color: GOLD }}>From the back cover</div>
              <div className="ss-back-blurb">{story.description}</div>
              <div className="ss-flip-hint" style={{ textAlign: "center" }}>↻ click to flip back</div>
            </div>
          </div>
        </div>
        <div className="ss-bay-meta">
          <span className="ss-price" style={{ color: txtMain }}>{isUnlocked ? "✓ Unlocked" : `${unlockCost} Ink to unlock`}</span>
          <div className="ss-bay-actions">
            <button type="button" className="ss-open-btn" onClick={openReader}>Open Reader →</button>
            {!isUnlocked && (
              <button type="button" className="ss-unlock-btn" disabled={!canUnlock} onClick={onUnlock} style={{ color: GOLD_LIGHT, borderColor: `${GOLD}66` }}>
                {canUnlock ? "Unlock" : "Need Ink"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 2 — AUTHOR + DESCRIPTION */}
      <div className="ss-zone ss-author-zone" style={{ borderRight: `1px solid ${divider}` }}>
        <div className="ss-zone-label" style={{ color: GOLD }}>The Author</div>
        <div className="ss-author-head">
          <div className="ss-author-photo" style={{ borderColor: `${GOLD}66` }}>
            {writer?.photo_url ? <img src={writer.photo_url} alt={story.author} /> : <span style={{ color: GOLD }}>{initial}</span>}
          </div>
          <div>
            <div className="ss-author-name" style={{ color: txtMain }}>{writer?.name ?? story.author}</div>
            <div className="ss-author-role" style={{ color: txtFaint }}>{writer?.is_founding_author ? "Founding Author" : "Author"}</div>
          </div>
        </div>
        <div className="ss-author-bio" style={{ color: txtDim }}>
          {writer?.bio || writer?.tagline || `${story.author} publishes original fiction at The Tiniest Library.`}
        </div>
        <div className="ss-desc-label" style={{ color: GOLD, borderColor: divider }}>The Story</div>
        <div className="ss-desc" style={{ color: txtDim }}>{story.description}</div>
        {story.id ? (
          <div className="ss-social-wrap">
            <StorySocial storyId={story.id} storySlug={story.slug} storyTitle={story.title} userId={userId} />
          </div>
        ) : null}
      </div>

      {/* ZONE 3 — MEDIA */}
      <div className="ss-zone ss-media-zone" style={{ borderRight: `1px solid ${divider}` }}>
        <div className="ss-zone-label" style={{ color: GOLD }}>From the World</div>
        {media.length ? (
          <div className="ss-media-box" style={{ borderColor: surfaceBorder }}>
            {isVideo(media[0].type, media[0].url) ? <video src={media[0].url} controls /> : <img src={media[0].url} alt="Story media" />}
          </div>
        ) : (
          <div className="ss-media-empty" style={{ borderColor: surfaceBorder, color: txtFaint }}>
            <span style={{ color: `${GOLD}99` }}>✦</span>
            <p>Art &amp; video from this story will live here.</p>
          </div>
        )}
        {story.genres?.length ? (
          <div className="ss-genres">
            {story.genres.slice(0, 3).map((g) => (
              <span key={g} className="ss-genre" style={{ color: txtMain, borderColor: surfaceBorder, background: surface }}>{g}</span>
            ))}
          </div>
        ) : null}
      </div>

      {/* ZONE 4 — PROMO CAROUSEL */}
      <div className="ss-zone ss-promo-zone">
        <div className="ss-zone-label" style={{ color: GOLD }}>From the Library</div>
        <div className="ss-promo-stage">
          {promos.map((p, i) => (
            <a key={i} href={p.href} className={`ss-promo${promo === i ? " active" : ""}`} style={{ borderColor: surfaceBorder, background: surface }}>
              <span className="ss-promo-label" style={{ color: GOLD_LIGHT, borderColor: `${GOLD}66` }}>{p.label}</span>
              <div className="ss-promo-title" style={{ color: txtMain }}>{p.title}</div>
              <div className="ss-promo-sub" style={{ color: txtFaint }}>{p.sub}</div>
              <div className="ss-promo-cta" style={{ color: GOLD_LIGHT }}>Learn more →</div>
            </a>
          ))}
        </div>
        <div className="ss-dots">
          {promos.map((_, i) => (
            <button key={i} className={`ss-dot${promo === i ? " active" : ""}`} onClick={() => setPromo(i)} aria-label={`promo ${i + 1}`}
              style={promo === i ? { background: GOLD } : { background: isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)" }} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .ss-stage { position: relative; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.4); display: grid; grid-template-columns: 240px 1.1fr 1fr 0.9fr; min-height: 360px; margin-bottom: 16px; }
        .ss-goldline { position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 5; }
        .ss-zone { padding: 26px 22px; display: flex; flex-direction: column; min-width: 0; }
        .ss-zone-label { font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.85; margin-bottom: 14px; }

        .ss-bay { align-items: center; justify-content: center; gap: 16px; perspective: 1600px; }
        .ss-book { position: relative; width: 168px; height: 250px; cursor: pointer; transform-style: preserve-3d; transition: transform 0.4s; }
        .ss-book:hover { transform: translateY(-6px); }
        .ss-faces { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.7s cubic-bezier(0.4,0,0.2,1); }
        .ss-book.flipped .ss-faces { transform: rotateY(180deg); }
        .ss-front, .ss-back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 4px 7px 7px 4px; overflow: hidden; box-shadow: 0 16px 36px rgba(0,0,0,0.55); }
        .ss-front { background: linear-gradient(135deg, #1f3454, #16263f); display: flex; flex-direction: column; justify-content: space-between; padding: 16px 14px; }
        .ss-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
        .ss-cover-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,18,30,0.3), rgba(10,18,30,0.88)); z-index: 1; }
        .ss-cover-content { position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; justify-content: space-between; }
        .ss-badge { align-self: flex-start; font-family: 'Source Sans 3', sans-serif; font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; border: 1px solid; background: rgba(0,0,0,0.35); padding: 3px 9px; border-radius: 999px; }
        .ss-cover-title { font-family: 'Cinzel', serif; font-size: 17px; font-weight: 600; line-height: 1.15; color: #fff; margin-bottom: 6px; text-shadow: 0 2px 6px rgba(0,0,0,0.6); }
        .ss-cover-author { font-family: 'Lora', serif; font-style: italic; font-size: 12px; }
        .ss-flip-hint { font-family: 'Source Sans 3', sans-serif; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 8px; }
        .ss-back { transform: rotateY(180deg); background: linear-gradient(160deg, #16263f, #0f1c30); border-radius: 7px 4px 4px 7px; display: flex; flex-direction: column; padding: 16px 14px; }
        .ss-back-label { font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.8; margin-bottom: 8px; }
        .ss-back-blurb { font-family: 'Lora', serif; font-size: 12px; line-height: 1.55; color: rgba(255,255,255,0.85); flex: 1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 11; -webkit-box-orient: vertical; }
        .ss-bay-meta { text-align: center; }
        .ss-price { font-family: 'Source Sans 3', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; display: block; margin-bottom: 8px; }
        .ss-bay-actions { display: flex; gap: 8px; justify-content: center; }
        .ss-open-btn { font-family: 'Source Sans 3', sans-serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; background: linear-gradient(135deg, #C9A84C, #8a6510); color: #000; }
        .ss-unlock-btn { font-family: 'Source Sans 3', sans-serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 8px 14px; border-radius: 6px; cursor: pointer; border: 1px solid; background: rgba(201,168,76,0.13); }
        .ss-unlock-btn:disabled { opacity: 0.5; cursor: default; }

        .ss-author-head { display: flex; gap: 14px; align-items: center; margin-bottom: 12px; }
        .ss-author-photo { width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(135deg, #1e2e48, #2a3f60); border: 1px solid; display: flex; align-items: center; justify-content: center; font-family: 'Cinzel', serif; font-size: 22px; overflow: hidden; }
        .ss-author-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ss-author-name { font-family: 'Lora', serif; font-size: 16px; margin-bottom: 2px; }
        .ss-author-role { font-family: 'Source Sans 3', sans-serif; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
        .ss-author-bio { font-family: 'Lora', serif; font-size: 13px; line-height: 1.55; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .ss-desc-label { font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.85; padding-top: 12px; border-top: 1px solid; margin-bottom: 8px; }
        .ss-desc { font-family: 'Lora', serif; font-size: 13px; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .ss-social-wrap { margin-top: 12px; }

        .ss-media-zone { }
        .ss-media-box { width: 100%; flex: 1; min-height: 200px; border-radius: 10px; overflow: hidden; border: 1px solid; background: #0d1726; }
        .ss-media-box video, .ss-media-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ss-media-empty { width: 100%; flex: 1; min-height: 200px; border-radius: 10px; border: 1px dashed; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
        .ss-media-empty span { font-size: 28px; }
        .ss-media-empty p { font-family: 'Source Sans 3', sans-serif; font-size: 12px; text-align: center; padding: 0 16px; }
        .ss-genres { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
        .ss-genre { font-family: 'Source Sans 3', sans-serif; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid; padding: 3px 10px; border-radius: 999px; }

        .ss-promo-zone { }
        .ss-promo-stage { flex: 1; position: relative; min-height: 200px; }
        .ss-promo { position: absolute; inset: 0; opacity: 0; transition: opacity 0.5s; pointer-events: none; border: 1px solid; border-radius: 12px; padding: 20px 18px; display: flex; flex-direction: column; text-decoration: none; }
        .ss-promo.active { opacity: 1; pointer-events: auto; }
        .ss-promo-label { align-self: flex-start; font-family: 'Source Sans 3', sans-serif; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid; padding: 3px 10px; border-radius: 999px; margin-bottom: 14px; }
        .ss-promo-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 500; line-height: 1.25; margin-bottom: 8px; }
        .ss-promo-sub { font-family: 'Lora', serif; font-size: 12.5px; line-height: 1.55; flex: 1; }
        .ss-promo-cta { font-family: 'Source Sans 3', sans-serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 12px; }
        .ss-dots { display: flex; gap: 7px; margin-top: 12px; justify-content: center; }
        .ss-dot { width: 8px; height: 8px; border-radius: 50%; cursor: pointer; transition: all 0.2s; border: none; padding: 0; }
        .ss-dot.active { width: 22px; border-radius: 4px; }

        @media (max-width: 1100px) {
          .ss-stage { grid-template-columns: 220px 1fr 1fr; }
          .ss-promo-zone { display: none; }
        }
        @media (max-width: 760px) {
          .ss-stage { grid-template-columns: 1fr; }
          .ss-zone { border-right: none !important; border-bottom: 1px solid ${GOLD}33; }
          .ss-media-zone, .ss-promo-zone { display: flex; }
        }
      `}</style>
    </div>
  );
}
