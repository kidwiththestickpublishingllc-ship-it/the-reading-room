"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =========================
// Route: app/reading-room/stories/[slug]/chapters/[chapter]/page.tsx
// TTL Immersive Chapter Reader
// =========================

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  is_free: boolean;
  ink_cost: number;
};

type Story = {
  id: string;
  title: string;
  author_name: string;
  slug: string;
  cover_url: string | null;
  description: string | null;
};

// =========================
// Global Styles
// =========================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@400;500;600&family=Source+Sans+3:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --font-reading: 'Lora', Georgia, serif;
    --font-display: 'Cinzel', serif;
    --font-ui: 'Source Sans 3', sans-serif;
  }

  .reader-root {
    min-height: 100vh;
    transition: background 0.4s ease, color 0.4s ease;
  }

  /* ── DARK MODE ── */
  .reader-root.dark {
    background: #0d0d0d;
    color: #e8e0d0;
    --bg: #0d0d0d;
    --bg2: #151515;
    --bg3: #1e1e1e;
    --text: #e8e0d0;
    --text-muted: rgba(232,224,208,0.5);
    --text-dim: rgba(232,224,208,0.28);
    --gold: #C9A84C;
    --gold-dim: rgba(201,168,76,0.3);
    --border: rgba(255,255,255,0.07);
    --border-gold: rgba(201,168,76,0.2);
    --overlay: rgba(0,0,0,0.85);
  }

  /* ── LIGHT MODE ── */
  .reader-root.light {
    background: #faf7f2;
    color: #1a1a1a;
    --bg: #faf7f2;
    --bg2: #f2ede4;
    --bg3: #e8e0d0;
    --text: #1a1a1a;
    --text-muted: rgba(26,26,26,0.55);
    --text-dim: rgba(26,26,26,0.3);
    --gold: #8a6510;
    --gold-dim: rgba(138,101,16,0.25);
    --border: rgba(0,0,0,0.08);
    --border-gold: rgba(138,101,16,0.2);
    --overlay: rgba(250,247,242,0.92);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-in { animation: fadeIn 0.5s ease forwards; }

  /* ── TOP BAR ── */
  .reader-topbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    height: 56px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px;
    background: var(--overlay);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .reader-topbar.hidden {
    opacity: 0;
    transform: translateY(-100%);
    pointer-events: none;
  }

  .topbar-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
  .topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

  .topbar-back {
    font-family: var(--font-ui);
    font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-muted); text-decoration: none;
    padding: 6px 12px; border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
  }
  .topbar-back:hover { color: var(--gold); border-color: var(--gold-dim); }

  .topbar-story-title {
    font-family: var(--font-ui);
    font-size: 13px; color: var(--text-muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 300px;
  }

  .topbar-chapter-num {
    font-family: var(--font-display);
    font-size: 11px; letter-spacing: 0.2em;
    color: var(--gold); opacity: 0.8;
    white-space: nowrap;
  }

  /* Toggle button */
  .mode-toggle {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg2);
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .mode-toggle:hover { border-color: var(--gold-dim); }

  /* Font size controls */
  .font-btn {
    font-family: var(--font-ui);
    font-size: 13px; font-weight: 500;
    width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--bg2); color: var(--text-muted);
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
  }
  .font-btn:hover { color: var(--gold); border-color: var(--gold-dim); }

  /* Ink balance */
  .ink-pill {
    font-family: var(--font-ui);
    font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
    padding: 5px 12px; border-radius: 999px;
    border: 1px solid var(--gold-dim);
    background: transparent; color: var(--gold);
    white-space: nowrap;
  }

  /* ── PROGRESS BAR ── */
  .reader-progress {
    position: fixed; top: 56px; left: 0; right: 0; z-index: 49;
    height: 2px; background: var(--border);
  }
  .reader-progress-fill {
    height: 100%;
    background: var(--gold);
    transition: width 0.1s linear;
  }

  /* ── MAIN CONTENT ── */
  .reader-main {
    max-width: 680px;
    margin: 0 auto;
    padding: 120px 24px 160px;
  }

  /* Chapter header */
  .chapter-header { margin-bottom: 56px; text-align: center; }

  .chapter-eyebrow {
    font-family: var(--font-display);
    font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase;
    color: var(--gold); opacity: 0.75;
    display: block; margin-bottom: 20px;
  }

  .chapter-title {
    font-family: var(--font-display);
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 500; line-height: 1.3;
    color: var(--text);
    margin-bottom: 24px;
  }

  .chapter-divider {
    width: 48px; height: 1px;
    background: var(--gold-dim);
    margin: 0 auto;
  }

  /* Reading content */
  .chapter-content {
    font-family: var(--font-reading);
    font-size: 19px;
    line-height: 1.85;
    color: var(--text);
    transition: font-size 0.2s ease;
  }

  .chapter-content p {
    margin-bottom: 1.6em;
  }

  .chapter-content p:first-child::first-letter {
    font-family: var(--font-display);
    font-size: 3.2em;
    font-weight: 600;
    float: left;
    line-height: 0.85;
    margin-right: 8px;
    margin-top: 6px;
    color: var(--gold);
  }

  /* ── LOCK GATE ── */
  .lock-gate {
    margin-top: 48px;
    border-radius: 16px;
    padding: 48px 40px;
    text-align: center;
    border: 1px solid var(--border-gold);
    background: var(--bg2);
    position: relative;
    overflow: hidden;
  }

  .lock-gate::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  .lock-icon { font-size: 32px; margin-bottom: 20px; display: block; }

  .lock-title {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 500;
    color: var(--text); margin-bottom: 10px;
  }

  .lock-sub {
    font-family: var(--font-ui);
    font-size: 14px; color: var(--text-muted);
    line-height: 1.65; margin-bottom: 28px;
    max-width: 360px; margin-left: auto; margin-right: auto;
  }

  .lock-btn {
    font-family: var(--font-ui);
    font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 14px 32px; border-radius: 8px;
    border: none; cursor: pointer;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    color: #000; transition: opacity 0.2s;
  }
  .lock-btn:hover:not(:disabled) { opacity: 0.85; }
  .lock-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .lock-btn-ghost {
    font-family: var(--font-ui);
    font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 14px 24px; border-radius: 8px;
    border: 1px solid var(--border-gold);
    background: transparent; color: var(--gold);
    cursor: pointer; transition: all 0.2s; margin-left: 10px;
    text-decoration: none; display: inline-block;
  }

  /* Fade out before lock */
  .content-fade {
    position: relative;
  }
  .content-fade::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 120px;
    background: linear-gradient(to bottom, transparent, var(--bg));
    pointer-events: none;
  }

  /* ── BOTTOM NAV ── */
  .reader-bottom {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    padding: 16px 32px;
    background: var(--overlay);
    backdrop-filter: blur(16px);
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .reader-bottom.hidden {
    opacity: 0;
    transform: translateY(100%);
    pointer-events: none;
  }

  .nav-btn {
    font-family: var(--font-ui);
    font-size: 12px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 10px 20px; border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg2); color: var(--text-muted);
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 8px;
  }
  .nav-btn:hover:not(:disabled) { color: var(--gold); border-color: var(--gold-dim); }
  .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .chapter-position {
    font-family: var(--font-ui);
    font-size: 12px; color: var(--text-dim);
    letter-spacing: 0.1em;
  }

  /* ── CHAPTER LIST DRAWER ── */
  .chapters-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 60;
    width: min(360px, 90vw);
    background: var(--bg2);
    border-left: 1px solid var(--border);
    transform: translateX(100%);
    transition: transform 0.35s ease;
    overflow-y: auto;
    padding: 24px 0;
  }
  .chapters-drawer.open { transform: translateX(0); }

  .drawer-overlay {
    position: fixed; inset: 0; z-index: 59;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    display: none;
  }
  .drawer-overlay.open { display: block; }

  .drawer-header {
    padding: 0 24px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }

  .drawer-title {
    font-family: var(--font-display);
    font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold); opacity: 0.8;
  }

  .drawer-close {
    width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent; color: var(--text-muted);
    cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .drawer-close:hover { color: var(--text); }

  .chapter-list { padding: 12px 0; }

  .chapter-list-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 24px; cursor: pointer;
    transition: background 0.15s;
    border: none; background: transparent; width: 100%; text-align: left;
  }
  .chapter-list-item:hover { background: var(--bg3); }
  .chapter-list-item.active { background: var(--bg3); }

  .chapter-num-badge {
    font-family: var(--font-display);
    font-size: 10px; letter-spacing: 0.1em;
    color: var(--gold); opacity: 0.7;
    min-width: 24px; padding-top: 2px;
    flex-shrink: 0;
  }

  .chapter-list-title {
    font-family: var(--font-ui);
    font-size: 13px; color: var(--text-muted);
    line-height: 1.5; flex: 1;
  }
  .chapter-list-item.active .chapter-list-title { color: var(--text); }

  .chapter-lock-icon {
    font-size: 11px; color: var(--text-dim);
    flex-shrink: 0; padding-top: 3px;
  }

  /* ── LOADING ── */
  .reader-loading {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
  }
  .spinner {
    width: 32px; height: 32px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .loading-text {
    font-family: var(--font-ui);
    font-size: 13px; color: var(--text-muted);
    letter-spacing: 0.1em;
  }

  /* ── EMPTY CONTENT ── */
  .empty-content {
    font-family: var(--font-reading);
    font-size: 18px; font-style: italic;
    color: var(--text-muted); line-height: 1.8;
    text-align: center; padding: 48px 0;
  }

  @media (max-width: 600px) {
    .reader-main { padding: 100px 20px 140px; }
    .reader-topbar { padding: 0 16px; }
    .reader-bottom { padding: 12px 16px; }
    .topbar-story-title { display: none; }
  }
`;

// =========================
// Helpers
// =========================
function formatContent(text: string): string {
  return text
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

// =========================
// Main Reader Component
// =========================
function ChapterReaderContent({
  storySlug,
  chapterNum,
}: {
  storySlug: string;
  chapterNum: number;
}) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState(19);
  const [uiHidden, setUiHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [ink, setInk] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load story + chapter + ink
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Get session + ink
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('ink_balance')
            .eq('id', session.user.id)
            .single();
          if (profile) setInk(profile.ink_balance ?? 0);
        }

        // Get story
        const { data: storyData } = await supabase
          .from('stories')
          .select('*')
          .eq('slug', storySlug)
          .single();
        if (!storyData) { setError('Story not found.'); return; }
        setStory(storyData);

        // Get all chapters for this story
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .eq('story_id', storyData.id)
          .order('chapter_number');
        if (chaptersData) setAllChapters(chaptersData);

        // Get this chapter
        const thisChapter = chaptersData?.find(c => c.chapter_number === chapterNum) ?? null;
        setChapter(thisChapter);

        // Check if unlocked
        if (thisChapter && session) {
          if (thisChapter.is_free) {
            setUnlocked(true);
          } else {
            const { data: unlockData } = await supabase
              .from('chapter_unlocks')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('chapter_id', thisChapter.id)
              .single();
            setUnlocked(!!unlockData);
          }
        } else if (thisChapter?.is_free) {
          setUnlocked(true);
        }
      } catch (e) {
        setError('Something went wrong loading this chapter.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [storySlug, chapterNum]);

  // Scroll progress + UI hide
  useEffect(() => {
    let lastY = 0;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docH = document.documentElement.scrollHeight - window.innerHeight;
          setScrollProgress(docH > 0 ? (scrollTop / docH) * 100 : 0);

          // Hide UI when scrolling down, show when scrolling up
          if (scrollTop > lastY + 10 && scrollTop > 200) {
            setUiHidden(true);
          } else if (scrollTop < lastY - 10) {
            setUiHidden(false);
          }
          lastY = scrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Unlock chapter
  const unlockChapter = async () => {
    if (!chapter || !story) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Please sign in to unlock chapters.'); return; }
    if (ink < chapter.ink_cost) { alert(`You need ${chapter.ink_cost} Ink to unlock this chapter.`); return; }

    setUnlocking(true);
    try {
      await supabase.rpc('increment_ink', { user_id: session.user.id, amount: -chapter.ink_cost });
      await supabase.from('chapter_unlocks').insert({ user_id: session.user.id, chapter_id: chapter.id });
      setInk(v => v - chapter.ink_cost);
      setUnlocked(true);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  const prevChapter = allChapters.find(c => c.chapter_number === chapterNum - 1);
  const nextChapter = allChapters.find(c => c.chapter_number === chapterNum + 1);

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className={`reader-root ${mode} reader-loading`}>
          <div className="spinner" />
          <p className="loading-text">Opening chapter…</p>
        </div>
      </>
    );
  }

  if (error || !chapter || !story) {
    return (
      <>
        <style>{STYLES}</style>
        <div className={`reader-root ${mode} reader-loading`}>
          <p className="loading-text">{error ?? 'Chapter not found.'}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className={`reader-root ${mode}`}>

        {/* Top bar */}
        <header className={`reader-topbar${uiHidden ? ' hidden' : ''}`}>
          <div className="topbar-left">
            <a
              href={`/reading-room/stories/${storySlug}`}
              className="topbar-back"
            >
              ← Back
            </a>
            <span className="topbar-story-title">{story.title}</span>
            <span className="topbar-chapter-num">
              Chapter {chapterNum} of {allChapters.length}
            </span>
          </div>
          <div className="topbar-right">
            {/* Font size */}
            <button className="font-btn" onClick={() => setFontSize(v => Math.max(15, v - 1))}>A−</button>
            <button className="font-btn" onClick={() => setFontSize(v => Math.min(26, v + 1))}>A+</button>
            {/* Mode toggle */}
            <button className="mode-toggle" onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}>
              {mode === 'dark' ? '☀️' : '🌙'}
            </button>
            {/* Ink */}
            <div className="ink-pill">✒️ {ink} Ink</div>
            {/* Chapter list */}
            <button
              className="font-btn"
              onClick={() => setDrawerOpen(true)}
              title="All chapters"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Progress bar */}
        <div className="reader-progress">
          <div className="reader-progress-fill" style={{ width: `${scrollProgress}%` }} />
        </div>

        {/* Main reading area */}
        <main className="reader-main">
          <div className="chapter-header fade-in">
            <span className="chapter-eyebrow">
              {story.author_name} — Chapter {chapterNum}
            </span>
            <h1 className="chapter-title">{chapter.title}</h1>
            <div className="chapter-divider" />
          </div>

          {/* Content */}
          {unlocked ? (
            chapter.content ? (
              <div
                className="chapter-content fade-in"
                style={{ fontSize }}
                dangerouslySetInnerHTML={{ __html: formatContent(chapter.content) }}
              />
            ) : (
              <p className="empty-content">
                Sergio is still writing this chapter — check back soon.
              </p>
            )
          ) : (
            <>
              {/* Teaser — first 200 chars if no content yet */}
              {chapter.content && (
                <div className="content-fade" style={{ maxHeight: 280, overflow: 'hidden' }}>
                  <div
                    className="chapter-content"
                    style={{ fontSize }}
                    dangerouslySetInnerHTML={{
                      __html: formatContent(chapter.content.slice(0, 600) + '…')
                    }}
                  />
                </div>
              )}

              {/* Lock gate */}
              <div className="lock-gate fade-in">
                <span className="lock-icon">🔒</span>
                <h3 className="lock-title">This chapter is locked</h3>
                <p className="lock-sub">
                  Unlock Chapter {chapterNum} for {chapter.ink_cost} Ink and continue reading uninterrupted.
                  {ink < chapter.ink_cost && (
                    <span style={{ display: 'block', marginTop: 8, color: 'var(--gold)', fontSize: 13 }}>
                      You have {ink} Ink — you need {chapter.ink_cost - ink} more.
                    </span>
                  )}
                </p>
                <div>
                  <button
                    className="lock-btn"
                    disabled={unlocking || ink < chapter.ink_cost}
                    onClick={unlockChapter}
                  >
                    {unlocking ? 'Unlocking…' : `Unlock for ${chapter.ink_cost} Ink`}
                  </button>
                  <a href="/reading-room/buy-ink" className="lock-btn-ghost">
                    Buy Ink
                  </a>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Bottom navigation */}
        <nav className={`reader-bottom${uiHidden ? ' hidden' : ''}`}>
          <button
            className="nav-btn"
            disabled={!prevChapter}
            onClick={() => {
              if (prevChapter) window.location.href = `/reading-room/stories/${storySlug}/chapters/${prevChapter.chapter_number}`;
            }}
          >
            ← Previous
          </button>

          <span className="chapter-position">
            {chapterNum} / {allChapters.length}
          </span>

          <button
            className="nav-btn"
            disabled={!nextChapter}
            onClick={() => {
              if (nextChapter) window.location.href = `/reading-room/stories/${storySlug}/chapters/${nextChapter.chapter_number}`;
            }}
          >
            Next →
          </button>
        </nav>

        {/* Chapter list drawer */}
        <div
          className={`drawer-overlay${drawerOpen ? ' open' : ''}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div className={`chapters-drawer${drawerOpen ? ' open' : ''}`}>
          <div className="drawer-header">
            <span className="drawer-title">Chapters</span>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>
          <div className="chapter-list">
            {allChapters.map(ch => (
              <button
                key={ch.id}
                className={`chapter-list-item${ch.chapter_number === chapterNum ? ' active' : ''}`}
                onClick={() => {
                  setDrawerOpen(false);
                  window.location.href = `/reading-room/stories/${storySlug}/chapters/${ch.chapter_number}`;
                }}
              >
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
export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  return (
    <ChapterReaderContent
      storySlug={slug}
      chapterNum={parseInt(chapter, 10)}
    />
  );
}
