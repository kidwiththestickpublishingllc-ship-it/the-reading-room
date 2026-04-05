"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =========================
// Route: app/reading-room/stories/[slug]/chapters/[chapter]/page.tsx
// TTL Immersive Chapter Reader — Multimedia Edition
// Supports: Text, Audio narration, Images, Comics/Manga panels, Video
// =========================

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  is_free: boolean;
  ink_cost: number;
  audio_url?: string | null;
  video_url?: string | null;
  media_urls?: string[] | null;
  media_type?: string | null;
};

type Story = {
  id: string;
  title: string;
  author_name: string;
  slug: string;
  cover_url: string | null;
  description: string | null;
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@400;500;600&family=Source+Sans+3:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --font-reading: 'Lora', Georgia, serif;
    --font-display: 'Cinzel', serif;
    --font-ui: 'Source Sans 3', sans-serif;
  }

  .reader-root { min-height: 100vh; transition: background 0.4s ease, color 0.4s ease; }

  .reader-root.dark {
    background: #0d0d0d; color: #e8e0d0;
    --bg: #0d0d0d; --bg2: #151515; --bg3: #1e1e1e;
    --text: #e8e0d0; --text-muted: rgba(232,224,208,0.5); --text-dim: rgba(232,224,208,0.28);
    --gold: #C9A84C; --gold-dim: rgba(201,168,76,0.3);
    --border: rgba(255,255,255,0.07); --border-gold: rgba(201,168,76,0.2);
    --overlay: rgba(0,0,0,0.85);
  }

  .reader-root.light {
    background: #faf7f2; color: #1a1a1a;
    --bg: #faf7f2; --bg2: #f2ede4; --bg3: #e8e0d0;
    --text: #1a1a1a; --text-muted: rgba(26,26,26,0.55); --text-dim: rgba(26,26,26,0.3);
    --gold: #8a6510; --gold-dim: rgba(138,101,16,0.25);
    --border: rgba(0,0,0,0.08); --border-gold: rgba(138,101,16,0.2);
    --overlay: rgba(250,247,242,0.92);
  }

  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }

  .fade-in { animation: fadeIn 0.5s ease forwards; }

  /* TOP BAR */
  .reader-topbar {
    position:fixed; top:0; left:0; right:0; z-index:50; height:56px;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 32px; background:var(--overlay); backdrop-filter:blur(16px);
    border-bottom:1px solid var(--border);
    transition:opacity 0.3s ease, transform 0.3s ease;
  }
  .reader-topbar.hidden { opacity:0; transform:translateY(-100%); pointer-events:none; }
  .topbar-left { display:flex; align-items:center; gap:16px; min-width:0; }
  .topbar-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .topbar-back {
    font-family:var(--font-ui); font-size:12px; letter-spacing:0.12em; text-transform:uppercase;
    color:var(--text-muted); text-decoration:none; padding:6px 12px; border-radius:6px;
    border:1px solid var(--border); background:transparent; cursor:pointer; transition:all 0.2s; white-space:nowrap;
  }
  .topbar-back:hover { color:var(--gold); border-color:var(--gold-dim); }
  .topbar-story-title {
    font-family:var(--font-ui); font-size:13px; color:var(--text-muted);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:300px;
  }
  .topbar-chapter-num { font-family:var(--font-display); font-size:11px; letter-spacing:0.2em; color:var(--gold); opacity:0.8; white-space:nowrap; }
  .mode-toggle {
    width:36px; height:36px; border-radius:50%; border:1px solid var(--border);
    background:var(--bg2); cursor:pointer; transition:all 0.2s;
    display:flex; align-items:center; justify-content:center; font-size:16px;
  }
  .mode-toggle:hover { border-color:var(--gold-dim); }
  .font-btn {
    font-family:var(--font-ui); font-size:13px; font-weight:500;
    width:32px; height:32px; border-radius:6px; border:1px solid var(--border);
    background:var(--bg2); color:var(--text-muted); cursor:pointer; transition:all 0.2s;
    display:flex; align-items:center; justify-content:center;
  }
  .font-btn:hover { color:var(--gold); border-color:var(--gold-dim); }
  .ink-pill {
    font-family:var(--font-ui); font-size:12px; font-weight:500; letter-spacing:0.06em;
    padding:5px 12px; border-radius:999px; border:1px solid var(--gold-dim);
    background:transparent; color:var(--gold); white-space:nowrap;
  }

  /* MEDIA BUTTONS */
  .media-btn {
    width:32px; height:32px; border-radius:6px; border:1px solid var(--border);
    background:var(--bg2); color:var(--text-muted); cursor:pointer; transition:all 0.2s;
    display:flex; align-items:center; justify-content:center; font-size:15px; position:relative;
  }
  .media-btn:hover { color:var(--gold); border-color:var(--gold-dim); }
  .media-btn.active { border-color:var(--gold); color:var(--gold); background:rgba(201,168,76,0.1); }
  .media-btn-dot {
    position:absolute; top:-3px; right:-3px; width:8px; height:8px;
    border-radius:50%; background:var(--gold); border:2px solid var(--bg);
  }

  /* PROGRESS BAR */
  .reader-progress { position:fixed; top:56px; left:0; right:0; z-index:49; height:2px; background:var(--border); }
  .reader-progress-fill { height:100%; background:var(--gold); transition:width 0.1s linear; }

  /* MAIN CONTENT */
  .reader-main { max-width:680px; margin:0 auto; padding:120px 24px 200px; }
  .chapter-header { margin-bottom:56px; text-align:center; }
  .chapter-eyebrow {
    font-family:var(--font-display); font-size:10px; letter-spacing:0.4em; text-transform:uppercase;
    color:var(--gold); opacity:0.75; display:block; margin-bottom:20px;
  }
  .chapter-title {
    font-family:var(--font-display); font-size:clamp(22px,4vw,32px); font-weight:500;
    line-height:1.3; color:var(--text); margin-bottom:24px;
  }
  .chapter-divider { width:48px; height:1px; background:var(--gold-dim); margin:0 auto; }
  .chapter-content { font-family:var(--font-reading); font-size:19px; line-height:1.85; color:var(--text); transition:font-size 0.2s ease; }
  .chapter-content p { margin-bottom:1.6em; }
  .chapter-content p:first-child::first-letter {
    font-family:var(--font-display); font-size:3.2em; font-weight:600;
    float:left; line-height:0.85; margin-right:8px; margin-top:6px; color:var(--gold);
  }

  /* LOCK GATE */
  .lock-gate {
    margin-top:48px; border-radius:16px; padding:48px 40px; text-align:center;
    border:1px solid var(--border-gold); background:var(--bg2); position:relative; overflow:hidden;
  }
  .lock-gate::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, var(--gold), transparent); }
  .lock-icon { font-size:32px; margin-bottom:20px; display:block; }
  .lock-title { font-family:var(--font-display); font-size:20px; font-weight:500; color:var(--text); margin-bottom:10px; }
  .lock-sub { font-family:var(--font-ui); font-size:14px; color:var(--text-muted); line-height:1.65; margin-bottom:28px; max-width:360px; margin-left:auto; margin-right:auto; }
  .lock-btn {
    font-family:var(--font-ui); font-size:12px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase;
    padding:14px 32px; border-radius:8px; border:none; cursor:pointer;
    background:linear-gradient(135deg, #C9A84C, #8a6510); color:#000; transition:opacity 0.2s;
  }
  .lock-btn:hover:not(:disabled) { opacity:0.85; }
  .lock-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .lock-btn-ghost {
    font-family:var(--font-ui); font-size:12px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase;
    padding:14px 24px; border-radius:8px; border:1px solid var(--border-gold);
    background:transparent; color:var(--gold); cursor:pointer; transition:all 0.2s;
    margin-left:10px; text-decoration:none; display:inline-block;
  }
  .content-fade { position:relative; }
  .content-fade::after { content:''; position:absolute; bottom:0; left:0; right:0; height:120px; background:linear-gradient(to bottom, transparent, var(--bg)); pointer-events:none; }

  /* BOTTOM NAV */
  .reader-bottom {
    position:fixed; bottom:0; left:0; right:0; z-index:50; padding:16px 32px;
    background:var(--overlay); backdrop-filter:blur(16px); border-top:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    transition:opacity 0.3s ease, transform 0.3s ease;
  }
  .reader-bottom.hidden { opacity:0; transform:translateY(100%); pointer-events:none; }
  .reader-bottom.has-audio { padding-bottom:88px; }
  .nav-btn {
    font-family:var(--font-ui); font-size:12px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase;
    padding:10px 20px; border-radius:8px; border:1px solid var(--border);
    background:var(--bg2); color:var(--text-muted); cursor:pointer; transition:all 0.2s;
    display:flex; align-items:center; gap:8px;
  }
  .nav-btn:hover:not(:disabled) { color:var(--gold); border-color:var(--gold-dim); }
  .nav-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .chapter-position { font-family:var(--font-ui); font-size:12px; color:var(--text-dim); letter-spacing:0.1em; }

  /* CHAPTER DRAWER */
  .chapters-drawer {
    position:fixed; top:0; right:0; bottom:0; z-index:60; width:min(360px,90vw);
    background:var(--bg2); border-left:1px solid var(--border);
    transform:translateX(100%); transition:transform 0.35s ease; overflow-y:auto; padding:24px 0;
  }
  .chapters-drawer.open { transform:translateX(0); }
  .drawer-overlay { position:fixed; inset:0; z-index:59; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); display:none; }
  .drawer-overlay.open { display:block; }
  .drawer-header { padding:0 24px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .drawer-title { font-family:var(--font-display); font-size:13px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); opacity:0.8; }
  .drawer-close { width:32px; height:32px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
  .drawer-close:hover { color:var(--text); }
  .chapter-list { padding:12px 0; }
  .chapter-list-item {
    display:flex; align-items:flex-start; gap:14px; padding:14px 24px; cursor:pointer;
    border:none; background:transparent; width:100%; text-align:left;
    font-family:var(--font-ui); font-size:12px; color:var(--text-muted);
    border-bottom:1px solid var(--border); transition:all 0.15s;
  }
  .chapter-list-item:last-child { border-bottom:none; }
  .chapter-list-item:hover { background:var(--bg3); color:var(--text); }
  .chapter-list-item.active { background:var(--bg3); }
  .chapter-num-badge { font-family:var(--font-display); font-size:10px; letter-spacing:0.1em; color:var(--gold); opacity:0.7; min-width:24px; padding-top:2px; flex-shrink:0; }
  .chapter-list-title { font-family:var(--font-ui); font-size:13px; color:var(--text-muted); line-height:1.5; flex:1; }
  .chapter-list-item.active .chapter-list-title { color:var(--text); }
  .chapter-lock-icon { font-size:11px; color:var(--text-dim); flex-shrink:0; padding-top:3px; }

  /* MEDIA PANEL */
  .media-panel {
    position:fixed; top:0; right:0; bottom:0; z-index:55; width:min(480px,95vw);
    background:var(--bg); border-left:1px solid var(--border-gold);
    transform:translateX(100%); transition:transform 0.35s ease;
    display:flex; flex-direction:column; overflow:hidden;
  }
  .media-panel.open { transform:translateX(0); }
  .media-panel-header {
    padding:20px 24px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    background:var(--bg2); flex-shrink:0;
  }
  .media-panel-title { font-family:var(--font-display); font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:var(--gold); }
  .media-panel-close { width:32px; height:32px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
  .media-panel-close:hover { color:var(--text); border-color:var(--border-gold); }
  .media-panel-body { flex:1; overflow-y:auto; padding:24px; }
  .media-gallery { display:flex; flex-direction:column; gap:16px; }
  .media-gallery-item { border-radius:12px; overflow:hidden; border:1px solid var(--border); cursor:pointer; transition:transform 0.2s; }
  .media-gallery-item:hover { transform:scale(1.01); }
  .media-gallery-item img { width:100%; height:auto; display:block; }
  .manga-grid { display:flex; flex-direction:column; gap:4px; }
  .manga-panel { width:100%; cursor:pointer; transition:opacity 0.2s; }
  .manga-panel:hover { opacity:0.9; }
  .manga-panel img { width:100%; height:auto; display:block; }
  .panel-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-top:1px solid var(--border); margin-top:16px; }
  .panel-nav-btn { font-family:var(--font-ui); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; padding:8px 16px; border-radius:6px; border:1px solid var(--border); background:var(--bg2); color:var(--text-muted); cursor:pointer; transition:all 0.2s; }
  .panel-nav-btn:hover:not(:disabled) { color:var(--gold); border-color:var(--gold-dim); }
  .panel-nav-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .panel-counter { font-family:var(--font-display); font-size:11px; color:var(--text-dim); letter-spacing:0.1em; }
  .video-container { border-radius:12px; overflow:hidden; border:1px solid var(--border); }
  .video-container video { width:100%; display:block; }
  .video-container iframe { width:100%; aspect-ratio:16/9; border:none; display:block; }
  .media-empty { text-align:center; padding:48px 24px; color:var(--text-dim); }
  .media-empty-icon { font-size:40px; display:block; margin-bottom:16px; }
  .media-empty-text { font-family:var(--font-ui); font-size:13px; line-height:1.6; }

  /* AUDIO PLAYER */
  .audio-player {
    position:fixed; bottom:64px; left:0; right:0; z-index:51;
    background:var(--bg2); border-top:1px solid var(--border-gold);
    padding:12px 24px; display:flex; align-items:center; gap:16px;
    animation:slideUp 0.35s ease forwards;
  }
  .audio-play-btn {
    width:40px; height:40px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg, var(--gold), #8a6510);
    border:none; color:#000; font-size:16px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:opacity 0.2s;
  }
  .audio-play-btn:hover { opacity:0.85; }
  .audio-info { min-width:0; flex-shrink:0; max-width:140px; }
  .audio-title { font-family:var(--font-ui); font-size:12px; font-weight:600; color:var(--text); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .audio-author { font-family:var(--font-ui); font-size:10px; color:var(--text-muted); letter-spacing:0.06em; }
  .audio-progress-wrap { flex:1; display:flex; flex-direction:column; gap:4px; min-width:0; }
  .audio-progress { width:100%; height:4px; border-radius:2px; background:var(--border); cursor:pointer; appearance:none; outline:none; }
  .audio-progress::-webkit-slider-thumb { appearance:none; width:12px; height:12px; border-radius:50%; background:var(--gold); cursor:pointer; }
  .audio-time { font-family:var(--font-ui); font-size:10px; color:var(--text-dim); display:flex; justify-content:space-between; }
  .audio-close { width:28px; height:28px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .audio-close:hover { color:var(--text); border-color:var(--border-gold); }

  /* LIGHTBOX */
  .lightbox { position:fixed; inset:0; z-index:100; background:rgba(0,0,0,0.95); display:flex; align-items:center; justify-content:center; padding:24px; }
  .lightbox-img { max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; }
  .lightbox-close { position:absolute; top:20px; right:20px; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; }

  /* LOADING */
  .reader-loading { min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:16px; }
  .spinner { width:32px; height:32px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.8s linear infinite; }
  .loading-text { font-family:var(--font-ui); font-size:13px; color:var(--text-muted); letter-spacing:0.1em; }
  .empty-content { font-family:var(--font-reading); font-size:18px; font-style:italic; color:var(--text-muted); line-height:1.8; text-align:center; padding:48px 0; }

  @media (max-width:600px) {
    .reader-main { padding:100px 20px 200px; }
    .reader-topbar { padding:0 16px; }
    .reader-bottom { padding:12px 16px; }
    .topbar-story-title { display:none; }
    .media-panel { width:100vw; }
  }
`;

function formatContent(text: string): string {
  return text.split(/\n\n+/).filter(p => p.trim()).map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`).join('');
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// =========================
// Audio Player
// =========================
function AudioPlayer({ url, title, author, onClose }: { url: string; title: string; author: string; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => { if (!audioRef.current) return; setCurrent(audioRef.current.currentTime); setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0); }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
      />
      <button className="audio-play-btn" onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
      <div className="audio-info">
        <div className="audio-title">{title}</div>
        <div className="audio-author">{author}</div>
      </div>
      <div className="audio-progress-wrap">
        <input type="range" min="0" max="100" value={progress} className="audio-progress"
          onChange={e => { if (!audioRef.current) return; audioRef.current.currentTime = (Number(e.target.value) / 100) * audioRef.current.duration; setProgress(Number(e.target.value)); }}
        />
        <div className="audio-time"><span>{formatTime(current)}</span><span>{formatTime(duration)}</span></div>
      </div>
      <button className="audio-close" onClick={onClose}>✕</button>
    </div>
  );
}

// =========================
// Media Panel
// =========================
function MediaPanel({ chapter, open, onClose }: { chapter: Chapter; open: boolean; onClose: () => void }) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [panelIndex, setPanelIndex] = useState(0);
  const isComic = chapter.media_type === 'comic' || chapter.media_type === 'manga';
  const mediaUrls = chapter.media_urls || [];

  return (
    <>
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <button className="lightbox-close">✕</button>
          <img src={lightboxImg} className="lightbox-img" alt="Full view" />
        </div>
      )}
      <div className={`media-panel${open ? ' open' : ''}`}>
        <div className="media-panel-header">
          <span className="media-panel-title">
            {isComic ? '🖼 Panels' : chapter.video_url ? '🎬 Video' : '🖼 Artwork'}
          </span>
          <button className="media-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="media-panel-body">
          {/* Video */}
          {chapter.video_url && (
            <div className="video-container" style={{ marginBottom: mediaUrls.length ? 24 : 0 }}>
              {chapter.video_url.includes('youtube') || chapter.video_url.includes('youtu.be') ? (
                <iframe src={chapter.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} allowFullScreen title="Chapter video" />
              ) : chapter.video_url.includes('vimeo') ? (
                <iframe src={chapter.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')} allowFullScreen title="Chapter video" />
              ) : (
                <video controls src={chapter.video_url} />
              )}
            </div>
          )}

          {/* Illustrations */}
          {mediaUrls.length > 0 && !isComic && (
            <div className="media-gallery">
              {mediaUrls.map((url, i) => (
                <div key={i} className="media-gallery-item" onClick={() => setLightboxImg(url)}>
                  <img src={url} alt={`Artwork ${i + 1}`} />
                </div>
              ))}
            </div>
          )}

          {/* Comics/Manga */}
          {mediaUrls.length > 0 && isComic && (
            <>
              <div className="manga-grid">
                <div className="manga-panel" onClick={() => setLightboxImg(mediaUrls[panelIndex])}>
                  <img src={mediaUrls[panelIndex]} alt={`Panel ${panelIndex + 1}`} />
                </div>
              </div>
              <div className="panel-nav">
                <button className="panel-nav-btn" disabled={panelIndex === 0} onClick={() => setPanelIndex(i => i - 1)}>← Prev</button>
                <span className="panel-counter">{panelIndex + 1} / {mediaUrls.length}</span>
                <button className="panel-nav-btn" disabled={panelIndex === mediaUrls.length - 1} onClick={() => setPanelIndex(i => i + 1)}>Next →</button>
              </div>
            </>
          )}

          {/* Empty */}
          {!chapter.video_url && mediaUrls.length === 0 && (
            <div className="media-empty">
              <span className="media-empty-icon">🖼</span>
              <p className="media-empty-text">No media added to this chapter yet.<br />Writers can add artwork, comics, or video from the Writer Dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// =========================
// Main Reader
// =========================
function ChapterReaderContent({ storySlug, chapterNum }: { storySlug: string; chapterNum: number }) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState(19);
  const [uiHidden, setUiHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mediaPanelOpen, setMediaPanelOpen] = useState(false);
  const [audioVisible, setAudioVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [ink, setInk] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('ink_balance').eq('id', session.user.id).single();
          if (profile) setInk(profile.ink_balance ?? 0);
        }
        const { data: storyData } = await supabase.from('stories').select('*').eq('slug', storySlug).single();
        if (!storyData) { setError('Story not found.'); return; }
        setStory(storyData);
        const { data: chaptersData } = await supabase.from('chapters').select('*').eq('story_id', storyData.id).order('chapter_number');
        if (chaptersData) setAllChapters(chaptersData);
        const thisChapter = chaptersData?.find(c => c.chapter_number === chapterNum) ?? null;
        setChapter(thisChapter);
        if (thisChapter) {
          if (thisChapter.is_free) { setUnlocked(true); }
          else if (session) {
            const { data: unlockData } = await supabase.from('chapter_unlocks').select('id').eq('user_id', session.user.id).eq('chapter_id', thisChapter.id).single();
            setUnlocked(!!unlockData);
          }
        }
      } catch { setError('Something went wrong loading this chapter.'); }
      finally { setLoading(false); }
    }
    load();
  }, [storySlug, chapterNum]);

  useEffect(() => {
    let lastY = 0; let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docH = document.documentElement.scrollHeight - window.innerHeight;
          setScrollProgress(docH > 0 ? (scrollTop / docH) * 100 : 0);
          if (scrollTop > lastY + 10 && scrollTop > 200) setUiHidden(true);
          else if (scrollTop < lastY - 10) setUiHidden(false);
          lastY = scrollTop; ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const unlockChapter = async () => {
    if (!chapter) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Please sign in to unlock chapters.'); return; }
    if (ink < chapter.ink_cost) { alert(`You need ${chapter.ink_cost} Ink.`); return; }
    setUnlocking(true);
    try {
      await supabase.rpc('increment_ink', { user_id: session.user.id, amount: -chapter.ink_cost });
      await supabase.from('chapter_unlocks').insert({ user_id: session.user.id, chapter_id: chapter.id });
      setInk(v => v - chapter.ink_cost);
      setUnlocked(true);
    } catch { alert('Something went wrong. Please try again.'); }
    finally { setUnlocking(false); }
  };

  const prevChapter = allChapters.find(c => c.chapter_number === chapterNum - 1);
  const nextChapter = allChapters.find(c => c.chapter_number === chapterNum + 1);
  const hasMedia = chapter && (chapter.media_urls?.length || chapter.video_url);
  const hasAudio = chapter?.audio_url;

  if (loading) return (
    <><style>{STYLES}</style>
    <div className="reader-root dark reader-loading"><div className="spinner" /><p className="loading-text">Opening chapter…</p></div></>
  );

  if (error || !chapter || !story) return (
    <><style>{STYLES}</style>
    <div className="reader-root dark reader-loading"><p className="loading-text">{error ?? 'Chapter not found.'}</p></div></>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className={`reader-root ${mode}`}>

        {/* Top bar */}
        <header className={`reader-topbar${uiHidden ? ' hidden' : ''}`}>
          <div className="topbar-left">
            <a href={`/reading-room/stories/${storySlug}`} className="topbar-back">← Back</a>
            <span className="topbar-story-title">{story.title}</span>
            <span className="topbar-chapter-num">Chapter {chapterNum} of {allChapters.length}</span>
          </div>
          <div className="topbar-right">
            <button className="font-btn" onClick={() => setFontSize(v => Math.max(15, v - 1))}>A−</button>
            <button className="font-btn" onClick={() => setFontSize(v => Math.min(26, v + 1))}>A+</button>
            <button className="mode-toggle" onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}>
              {mode === 'dark' ? '☀️' : '🌙'}
            </button>
            {hasAudio && (
              <button className={`media-btn${audioVisible ? ' active' : ''}`} onClick={() => setAudioVisible(v => !v)} title="Listen to narration">
                🎵{!audioVisible && <span className="media-btn-dot" />}
              </button>
            )}
            <button className={`media-btn${mediaPanelOpen ? ' active' : ''}`} onClick={() => setMediaPanelOpen(v => !v)} title="View artwork & media">
              🖼{hasMedia && !mediaPanelOpen && <span className="media-btn-dot" />}
            </button>
            <div className="ink-pill">✒️ {ink} Ink</div>
            <button className="font-btn" onClick={() => setDrawerOpen(true)} title="All chapters">☰</button>
          </div>
        </header>

        {/* Progress */}
        <div className="reader-progress"><div className="reader-progress-fill" style={{ width: `${scrollProgress}%` }} /></div>

        {/* Content */}
        <main className="reader-main">
          <div className="chapter-header fade-in">
            <span className="chapter-eyebrow">{story.author_name} — Chapter {chapterNum}</span>
            <h1 className="chapter-title">{chapter.title}</h1>
            <div className="chapter-divider" />
          </div>

          {unlocked ? (
            chapter.content ? (
              <div className="chapter-content fade-in" style={{ fontSize }}
                dangerouslySetInnerHTML={{ __html: formatContent(chapter.content) }} />
            ) : <p className="empty-content">Sergio is still writing this chapter — check back soon.</p>
          ) : (
            <>
              {chapter.content && (
                <div className="content-fade" style={{ maxHeight: 280, overflow: 'hidden' }}>
                  <div className="chapter-content" style={{ fontSize }}
                    dangerouslySetInnerHTML={{ __html: formatContent(chapter.content.slice(0, 600) + '…') }} />
                </div>
              )}
              <div className="lock-gate fade-in">
                <span className="lock-icon">🔒</span>
                <h3 className="lock-title">This chapter is locked</h3>
                <p className="lock-sub">
                  Unlock Chapter {chapterNum} for {chapter.ink_cost} Ink and continue reading uninterrupted.
                  {ink < chapter.ink_cost && <span style={{ display:'block', marginTop:8, color:'var(--gold)', fontSize:13 }}>You have {ink} Ink — you need {chapter.ink_cost - ink} more.</span>}
                </p>
                <div>
                  <button className="lock-btn" disabled={unlocking || ink < chapter.ink_cost} onClick={unlockChapter}>
                    {unlocking ? 'Unlocking…' : `Unlock for ${chapter.ink_cost} Ink`}
                  </button>
                  <a href="/reading-room/buy-ink" className="lock-btn-ghost">Buy Ink</a>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Bottom nav */}
        <nav className={`reader-bottom${uiHidden ? ' hidden' : ''}${audioVisible ? ' has-audio' : ''}`}>
          <button className="nav-btn" disabled={!prevChapter}
            onClick={() => prevChapter && (window.location.href = `/reading-room/stories/${storySlug}/chapters/${prevChapter.chapter_number}`)}>
            ← Previous
          </button>
          <span className="chapter-position">{chapterNum} / {allChapters.length}</span>
          <button className="nav-btn" disabled={!nextChapter}
            onClick={() => nextChapter && (window.location.href = `/reading-room/stories/${storySlug}/chapters/${nextChapter.chapter_number}`)}>
            Next →
          </button>
        </nav>

        {/* Audio player */}
        {audioVisible && chapter.audio_url && (
          <AudioPlayer url={chapter.audio_url} title={chapter.title} author={story.author_name} onClose={() => setAudioVisible(false)} />
        )}

        {/* Media panel */}
        <MediaPanel chapter={chapter} open={mediaPanelOpen} onClose={() => setMediaPanelOpen(false)} />
        <div className={`drawer-overlay${mediaPanelOpen ? ' open' : ''}`} onClick={() => setMediaPanelOpen(false)} />

        {/* Chapter drawer */}
        <div className={`drawer-overlay${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />
        <div className={`chapters-drawer${drawerOpen ? ' open' : ''}`}>
          <div className="drawer-header">
            <span className="drawer-title">Chapters</span>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>
          <div className="chapter-list">
            {allChapters.map(ch => (
              <button key={ch.id} className={`chapter-list-item${ch.chapter_number === chapterNum ? ' active' : ''}`}
                onClick={() => { setDrawerOpen(false); window.location.href = `/reading-room/stories/${storySlug}/chapters/${ch.chapter_number}`; }}>
                <span className="chapter-num-badge">{ch.chapter_number}</span>
                <span className="chapter-list-title">{ch.title}</span>
                {!ch.is_free && <span className="chapter-lock-icon">🔒</span>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

// =========================
// Next.js Page Export
// File: app/reading-room/stories/[slug]/chapters/[chapter]/page.tsx
// =========================
export default async function ChapterPage({ params }: { params: Promise<{ slug: string; chapter: string }> }) {
  const { slug, chapter } = await params;
  return <ChapterReaderContent storySlug={slug} chapterNum={parseInt(chapter, 10)} />;
}
