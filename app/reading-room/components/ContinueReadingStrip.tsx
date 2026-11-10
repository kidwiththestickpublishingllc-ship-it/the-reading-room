"use client";
import { useEffect, useState } from "react";

type LastRead = { slug: string; title: string; author: string; chapter: number };

const STYLES = `
  .cr-board {
    position: relative;
    background: #F7F7F4;
    background-image: linear-gradient(177deg, rgba(255,255,255,0.92), rgba(226,229,227,0.5));
    border: 12px solid #2A2A28;
    border-radius: 14px;
    padding: 26px 30px 30px;
    margin-bottom: 26px;
    box-shadow:
      0 16px 34px var(--surface-shadow),
      inset 0 1px 0 rgba(255,255,255,0.95),
      inset 0 -20px 34px rgba(0,0,0,0.05);
  }
  :root[data-theme="dark"] .cr-board {
    background: #22312B; background-image: none; border-color: #4A3A28;
    box-shadow: 0 16px 34px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3);
  }

  .cr-kicker {
    font-family: 'Caveat', cursive; font-weight: 700;
    font-size: 20px; color: #2F4F8F; margin-bottom: 6px;
  }
  :root[data-theme="dark"] .cr-kicker { color: #9FC2F0; }

  .cr-title {
    font-family: 'Caveat', cursive; font-weight: 700;
    font-size: clamp(30px, 4.4vw, 46px); line-height: 1.05;
    color: #16161A; margin: 0 0 6px;
  }
  :root[data-theme="dark"] .cr-title { color: #F2EFE6; }

  .cr-meta {
    font-family: 'Caveat', cursive; font-size: 21px;
    color: #2E6B45; margin-bottom: 22px;
  }
  :root[data-theme="dark"] .cr-meta { color: #9FD9B4; }

  .cr-go {
    position: relative; display: inline-block;
    font-family: 'Caveat', cursive; font-weight: 700;
    font-size: 27px; color: #9E3030;
    text-decoration: none; padding: 4px 16px;
  }
  .cr-go::after {
    content: ""; position: absolute; inset: -8px -16px;
    border: 2.5px solid currentColor;
    border-radius: 52% 48% 47% 53% / 59% 41% 57% 43%;
    transform: rotate(-1.4deg); opacity: 0.85; pointer-events: none;
  }
  .cr-go:hover { transform: rotate(-0.8deg); }
  :root[data-theme="dark"] .cr-go { color: #F0A8A8; }

  .cr-x {
    position: absolute; top: 12px; right: 14px;
    background: transparent; border: none; cursor: pointer;
    font-family: 'Caveat', cursive; font-size: 20px;
    color: rgba(30,30,30,0.4); padding: 4px 8px;
  }
  .cr-x:hover { color: rgba(30,30,30,0.75); }
  :root[data-theme="dark"] .cr-x { color: rgba(240,236,226,0.45); }
`;

export default function ContinueReadingStrip() {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ttl_last_read");
      if (raw) setLastRead(JSON.parse(raw));
    } catch {}
  }, []);

  if (!lastRead || dismissed) return null;

  return (
    <div className="cr-board">
      <style>{STYLES}</style>
      <button className="cr-x" onClick={() => setDismissed(true)} aria-label="Dismiss">wipe ✕</button>
      <div className="cr-kicker">you were reading —</div>
      <h3 className="cr-title">{lastRead.title}</h3>
      <div className="cr-meta">chapter {lastRead.chapter} · {lastRead.author}</div>
      <a className="cr-go" href={`/reading-room/stories/${lastRead.slug}/chapters/${lastRead.chapter}`}>
        pick it back up →
      </a>
    </div>
  );
}