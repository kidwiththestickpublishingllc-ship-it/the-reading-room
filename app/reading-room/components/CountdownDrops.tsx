"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Drop = { title: string; author: string; slug: string; drop_date: string };

function useCountdown(target: string) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setLeft("out now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 48) { setLeft(`${Math.floor(h / 24)} days`); return; }
      setLeft(`${h}h ${m}m`);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [target]);
  return left;
}

const STYLES = `
  .cd-cork {
    --cork: #C2995F; --cork-frame: #A9762F;
    position: relative;
    border: 14px solid var(--cork-frame); border-radius: 3px;
    padding: 28px 24px 32px; margin-bottom: 30px;
    background-color: var(--cork);
    background-image:
      radial-gradient(circle at 18% 28%, rgba(0,0,0,0.055) 0.9px, transparent 1.1px),
      radial-gradient(circle at 68% 62%, rgba(0,0,0,0.045) 0.8px, transparent 1px);
    background-size: 13px 13px, 19px 19px;
    box-shadow: 0 14px 34px var(--surface-shadow), inset 0 0 60px rgba(0,0,0,0.14);
  }
  :root[data-theme="dark"] .cd-cork { --cork: #3B2E20; --cork-frame: #241A11; }

  .cd-title {
    font-family: 'Caveat', cursive; font-weight: 700;
    font-size: 27px; color: #2B1E0E; margin: 0 0 18px;
  }
  :root[data-theme="dark"] .cd-title { color: #EFE7D7; }

  .cd-notes { display: flex; flex-wrap: wrap; gap: 20px; }
  .cd-note {
    position: relative; width: 206px; min-height: 176px;
    padding: 22px 16px 16px; box-sizing: border-box;
    font-family: 'Caveat', cursive; color: #241F10;
    box-shadow: 3px 7px 14px rgba(0,0,0,0.3);
    display: flex; flex-direction: column; justify-content: space-between;
    text-decoration: none;
  }
  .cd-note:nth-child(3n+1) { background: #F4E07C; transform: rotate(-1.9deg); }
  .cd-note:nth-child(3n+2) { background: #A9D9F2; transform: rotate(1.5deg); }
  .cd-note:nth-child(3n+3) { background: #BFE3AE; transform: rotate(-1deg); }
  .cd-pin {
    position: absolute; top: -8px; left: 50%; margin-left: -7px;
    width: 14px; height: 14px; border-radius: 50%;
    box-shadow: 0 3px 5px rgba(0,0,0,0.45);
  }
  .cd-h { font-size: 20px; font-weight: 700; line-height: 1.2; }
  .cd-by { font-size: 16px; color: rgba(36,31,16,0.66); margin-top: 4px; }
  .cd-when {
    font-size: 23px; font-weight: 700; margin-top: 14px;
    color: #8E2020;
  }
  .cd-when.live { color: #1F6B3C; }

  @media (max-width: 760px) {
    .cd-note { width: 100%; transform: none !important; }
  }
`;

function DropNote({ drop }: { drop: Drop }) {
  const left = useCountdown(drop.drop_date);
  const live = left === "out now";
  const inner = (
    <>
      <span className="cd-pin" aria-hidden="true"
        style={{ background: `radial-gradient(circle at 34% 30%, #ffffff99, ${live ? "#1F6B3C" : "#8E2020"} 60%, #00000055)` }} />
      <div>
        <div className="cd-h">{drop.title}</div>
        <div className="cd-by">{drop.author}</div>
      </div>
      <div className={`cd-when${live ? " live" : ""}`}>{live ? "out now →" : left}</div>
    </>
  );
  return live
    ? <a className="cd-note" href={`/reading-room/stories/${drop.slug}/chapters/1`}>{inner}</a>
    : <div className="cd-note">{inner}</div>;
}

export default function CountdownDrops() {
  const [drops, setDrops] = useState<Drop[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("chapters")
      .select("chapter_number, publish_at, stories(title, author_name, slug)")
      .gt("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: true })
      .limit(4)
      .then(({ data }) => {
        if (cancelled) return;
        const mapped = (data ?? []).map((d: any) => ({
          title: `${d.stories?.title} — Ch. ${d.chapter_number}`,
          author: d.stories?.author_name ?? "",
          slug: d.stories?.slug ?? "",
          drop_date: d.publish_at,
        })).filter((d: Drop) => d.slug);
        setDrops(mapped);
      });
    return () => { cancelled = true; };
  }, []);

  if (drops === null) return null;

  return (
    <div className="cd-cork">
      <style>{STYLES}</style>
      <h3 className="cd-title">Coming up</h3>
      <div className="cd-notes">
        {drops.length ? (
          drops.map((d, i) => <DropNote key={i} drop={d} />)
        ) : (
          <div className="cd-note">
            <span className="cd-pin" aria-hidden="true"
              style={{ background: "radial-gradient(circle at 34% 30%, #ffffff99, #8E2020 60%, #00000055)" }} />
            <div>
              <div className="cd-h">Nothing scheduled</div>
              <div className="cd-by">New chapters go up as writers finish them.</div>
            </div>
            <div className="cd-when" style={{ fontSize: 18 }}>check back</div>
          </div>
        )}
      </div>
    </div>
  );
}