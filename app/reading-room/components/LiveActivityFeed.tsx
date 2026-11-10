"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Event = { id: string; title: string; author: string; slug: string; chapter: number; at: string };

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d < 14 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

const STYLES = `
  .mon { max-width: 760px; margin: 0 auto 32px; }
  .mon-lid {
    background: #2B2E33; border-radius: 14px;
    padding: 16px 16px 20px;
    box-shadow: 0 18px 36px var(--surface-shadow);
  }
  .mon-screen {
    background: #121418; border-radius: 5px;
    padding: 22px 26px; min-height: 290px;
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    overflow: hidden;
  }
  .mon-bar {
    display: flex; align-items: center; gap: 8px;
    padding-bottom: 12px; margin-bottom: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.09);
  }
  .mon-dot { width: 8px; height: 8px; border-radius: 50%; }
  .mon-label {
    margin-left: 6px; font-size: 9.5px; letter-spacing: 0.2em;
    text-transform: uppercase; color: rgba(236,232,222,0.5);
  }
  .mon-row {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 14px; padding: 11px 0; font-size: 13px;
    color: rgba(236,232,222,0.68); text-decoration: none;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .mon-row b { color: #ECE8DE; font-weight: 600; }
  .mon-row:hover b { color: #9FD9B4; }
  .mon-live {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: #5BD98A; box-shadow: 0 0 6px #5BD98A; margin-right: 9px;
  }
  .mon-when { font-size: 11px; color: rgba(236,232,222,0.4); white-space: nowrap; }
  .mon-standby { padding: 22px 0 0; color: rgba(236,232,222,0.5); font-size: 12.5px; line-height: 2; }
  .mon-cursor {
    display: inline-block; width: 7px; height: 14px; background: #5BD98A;
    vertical-align: -2px; margin-left: 5px; animation: monBlink 1.1s steps(1) infinite;
  }
  @keyframes monBlink { 50% { opacity: 0; } }
  .mon-neck { width: 90px; height: 26px; margin: 0 auto; background: linear-gradient(#9DA3AA, #7A8086); }
  .mon-foot {
    width: 230px; height: 11px; margin: 0 auto;
    background: linear-gradient(#C8CCD1, #878D94); border-radius: 7px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.26);
  }
`;

export default function LiveActivityFeed() {
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("chapters")
      .select("id, chapter_number, created_at, stories(title, author_name, slug)")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (cancelled) return;
        setEvents((data ?? []).map((d: any) => ({
          id: String(d.id),
          title: d.stories?.title ?? "",
          author: d.stories?.author_name ?? "",
          slug: d.stories?.slug ?? "",
          chapter: d.chapter_number,
          at: d.created_at,
        })).filter((e: Event) => e.slug));
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mon">
      <style>{STYLES}</style>
      <div className="mon-lid">
        <div className="mon-screen">
          <div className="mon-bar">
            <span className="mon-dot" style={{ background: "#E05C52" }} />
            <span className="mon-dot" style={{ background: "#E3B341" }} />
            <span className="mon-dot" style={{ background: "#4FB868" }} />
            <span className="mon-label">the reading room · feed</span>
          </div>

          {events && events.length ? (
            <>
              {events.map(e => (
                <a key={e.id} className="mon-row" href={`/reading-room/stories/${e.slug}/chapters/${e.chapter}`}>
                  <span>
                    <span className="mon-live" aria-hidden="true" />
                    <b>{e.title}</b> — ch. {e.chapter} · {e.author}
                  </span>
                  <span className="mon-when">{ago(e.at)}</span>
                </a>
              ))}
              <div className="mon-standby">
                watching for the next chapter<span className="mon-cursor" aria-hidden="true" />
              </div>
            </>
          ) : (
            <div className="mon-standby">
              no chapters yet<br />
              the feed starts with the first one<span className="mon-cursor" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
      <div className="mon-neck" />
      <div className="mon-foot" />
    </div>
  );
}