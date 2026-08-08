"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import React from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";


// =========================
// TTLNav + TTLFooter
// Shared navigation components for all Reading Room pages.
// Drop into any page — ink balance and auth state are self-contained.
// Usage:
//   import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";
//   <TTLNav />
//   <div style={{ height: 74 }} /> {/* spacer */}
//   ... page content ...
//   <TTLFooter />
// =========================

const NAV_STYLES = `
  .ttl-shared-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 40;
    background: rgba(8,8,8,0.96);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.25);
    box-shadow: 0 2px 40px rgba(0,0,0,0.7);
  }

  .ttl-shared-nav-gold-line {
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }

  .ttl-shared-nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .ttl-shared-nav-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  .ttl-shared-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .ttl-shared-logo {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    font-family: 'Times New Roman', Times, serif;
    font-size: 11px; font-weight: 700; color: #000;
    flex-shrink: 0;
  }

  .ttl-shared-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .ttl-shared-brand-main {
    font-family: 'Times New Roman', Times, serif;
    font-size: 14px;
    font-weight: 400;
    color: #E2C97E;
    letter-spacing: 0.02em;
  }

  .ttl-shared-brand-sub {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10px;
    color: rgba(255,255,255,0.32);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ttl-shared-links {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-wrap: nowrap;
  }

  .ttl-shared-link {
    font-family: 'Times New Roman', Times, serif;
    font-size: 9px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(240,236,226,0.85);
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }

  /* ── Dropdown menus ── */
  .ttl-nav-dropdown { position: relative; }
  .ttl-nav-dropdown-btn {
    font-family: 'Syne', sans-serif;
    font-size: 11px; letter-spacing: 0.06em;
    color: rgba(232,228,218,0.6);
    background: transparent; border: none;
    padding: 4px 8px; border-radius: 6px;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 5px;
  }
  .ttl-nav-dropdown-btn:hover { color: #C9A84C; background: rgba(201,168,76,0.08); }
  .ttl-nav-dropdown-menu {
    position: absolute; top: calc(100% + 10px); left: 0;
    min-width: 200px; z-index: 200;
    background: #1a1410;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    display: none;
  }
  .ttl-nav-dropdown:hover .ttl-nav-dropdown-menu { display: block; }
  .ttl-nav-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; text-decoration: none;
    font-family: 'Syne', sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.6);
    transition: all 0.15s; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .ttl-nav-dropdown-item:last-child { border-bottom: none; }
  .ttl-nav-dropdown-item:hover {
    background: rgba(201,168,76,0.08); color: #C9A84C;
  }
  .ttl-nav-dropdown-divider {
    height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0;
  }

  .ttl-shared-link:hover {
    color: #E2C97E;
    border-color: rgba(201,168,76,0.38);
    background: rgba(201,168,76,0.1);
  }

  .ttl-shared-link-members {
    color: #C9A84C;
    border: 1px solid rgba(201,168,76,0.38);
    border-radius: 6px;
    padding: 4px 12px;
  }

  .ttl-shared-link-members:hover {
    background: rgba(201,168,76,0.15);
    color: #E2C97E;
  }

  .ttl-shared-nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .ttl-shared-ink {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 80px;
    justify-content: center;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #E2C97E;
    border: 1px solid rgba(201,168,76,0.38);
    background: rgba(201,168,76,0.1);
    padding: 6px 14px;
    border-radius: 999px;
    white-space: nowrap;
    text-decoration: none;
    transition: all 0.2s;
  }

  .ttl-shared-ink:hover {
    background: rgba(201,168,76,0.18);
  }

  .ttl-shared-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.1);
  }

  .ttl-shared-auth-btn {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    background: #6495ED;
    border: none;
    padding: 6px 18px;
    border-radius: 999px;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.2s;
    cursor: pointer;
  }

  .ttl-shared-auth-btn:hover { opacity: 0.88; }

  /* Mobile bottom nav */
  .ttl-shared-bottom-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(6,6,10,0.97);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(201,168,76,0.2);
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
    height: calc(60px + env(safe-area-inset-bottom));
  }

  .ttl-shared-bottom-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-around;
    max-width: 500px;
    margin: 0 auto;
    padding: 0 8px;
  }

  .ttl-shared-bottom-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 4px 12px;
    border-radius: 8px;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
  }

  .ttl-shared-bottom-item:hover { background: rgba(201,168,76,0.08); }

  .ttl-shared-bottom-icon { font-size: 20px; line-height: 1; }

  .ttl-shared-bottom-label {
    font-family: 'Times New Roman', Times, serif;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(240,236,226,0.5);
    transition: color 0.2s;
  }

  .ttl-shared-bottom-item:hover .ttl-shared-bottom-label { color: #C9A84C; }

  .ttl-shared-bottom-spacer {
    display: none;
    height: calc(60px + env(safe-area-inset-bottom));
  }

  /* Footer */
  .ttl-shared-footer {
    margin-top: 72px;
    padding: 40px 40px 24px;
    border-top: 1px solid rgba(201,168,76,0.35);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    background: rgba(15,8,5,0.6);
  }

  .ttl-shared-footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ttl-shared-footer-logo {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    font-family: 'Times New Roman', Times, serif;
    font-size: 11px; font-weight: 700; color: #000;
    flex-shrink: 0;
    text-decoration: none;
  }

  .ttl-shared-footer-name {
    font-family: 'Times New Roman', Times, serif;
    font-size: 18px;
    font-weight: 400;
    color: #E2C97E;
  }

  .ttl-shared-footer-sub {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ttl-shared-footer-copy {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    text-align: center;
  }

  .ttl-shared-footer-credit {
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #C9A84C;
    text-decoration: none;
    font-family: 'Times New Roman', Times, serif;
    display: block;
    text-align: center;
    margin-top: 4px;
  }

  .ttl-shared-footer-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .ttl-shared-footer-btn {
    font-family: 'Times New Roman', Times, serif;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.25);
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .ttl-shared-footer-btn:hover {
    color: #E2C97E;
    border-color: rgba(201,168,76,0.5);
    background: rgba(201,168,76,0.15);
  }

  .ttl-shared-footer-btn-primary {
    font-family: 'Times New Roman', Times, serif;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #000;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    transition: opacity 0.2s;
    white-space: nowrap;
    font-weight: 700;
  }

  .ttl-shared-footer-btn-primary:hover { opacity: 0.88; }

  @media (max-width: 768px) {
    .ttl-shared-links { display: none; }
    .ttl-get-ink-fab { display: flex; }
    .ttl-shared-nav-inner { padding: 0 20px; }
    .ttl-shared-divider { display: none; }
    .ttl-shared-brand-sub { display: none; }
    .ttl-shared-bottom-nav { display: block; }
    .ttl-shared-bottom-spacer { display: block; }
    .ttl-shared-footer { padding: 32px 24px 24px; flex-direction: column; align-items: flex-start; }
    .ttl-shared-footer-actions { justify-content: flex-start; }
    .ttl-shared-footer { display: none; }
  }

  @media (max-width: 480px) {
    .ttl-shared-brand-main { font-size: 14px; }
    .ttl-shared-ink { padding: 5px 10px; font-size: 10px; }
    .ttl-shared-auth-btn { padding: 5px 12px; font-size: 10px; }
  }
`;

export function TTLNav({ extras }: { extras?: ReactNode }) {
  const [ink, setInk] = useState(0);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const [navHidden, setNavHidden] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastY = React.useRef(0);

  // Read ink from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("ttl_ink");
    setInk(raw ? Number(raw) : 0);

    // Listen for ink changes across tabs/pages
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ttl_ink") setInk(e.newValue ? Number(e.newValue) : 0);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavHidden(y > 80 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{NAV_STYLES}</style>
      <nav className="ttl-shared-nav" style={{ transform: navHidden ? 'translateY(-100%)' : 'translateY(0)', transition: 'transform 0.3s ease' }}>
        <div className="ttl-shared-nav-gold-line" />
        <div className="ttl-shared-nav-inner">
          <div className="ttl-shared-nav-left">
            {/* Logo → main TTL site */}
            <div className="ttl-shared-brand">
              <a href="https://www.the-tiniest-library.com" className="ttl-shared-logo">TTL</a>
              <div className="ttl-shared-brand-text">
                <a href="https://www.the-tiniest-library.com" className="ttl-shared-brand-main" style={{ textDecoration: 'none' }}>The Tiniest Library</a>
                <a href="https://read.the-tiniest-library.com/reading-room" className="ttl-shared-brand-sub" style={{ textDecoration: 'none' }}>The Reading Room</a>
              </div>
            </div>

            {/* Nav links */}
            <div className="ttl-shared-links">
              {/* Explore dropdown */}
              <div className="ttl-nav-dropdown">
                <button type="button" className="ttl-nav-dropdown-btn">
                  Explore ▾
                </button>
                <div className="ttl-nav-dropdown-menu">
                  <a href="/reading-room/stories" className="ttl-nav-dropdown-item">📖 Browse Stories</a>
                  <a href="/reading-room/discover" className="ttl-nav-dropdown-item">✨ Discover</a>
                  <a href="/reading-room/drops" className="ttl-nav-dropdown-item">📅 Chapter Drops</a>
                  <a href="/reading-room/authors" className="ttl-nav-dropdown-item">🪶 Authors</a>
                  <a href="/reading-room/comics" className="ttl-nav-dropdown-item">🎨 Comics & Manga</a>
                  <a href="/reading-room/how-it-works" className="ttl-nav-dropdown-item">💡 How It Works</a>
                </div>
              </div>

              {/* My TTL dropdown */}
              <div className="ttl-nav-dropdown">
                <button type="button" className="ttl-nav-dropdown-btn">
                  My TTL ▾
                </button>
                <div className="ttl-nav-dropdown-menu">
                  <a href="/members" className="ttl-nav-dropdown-item">🏠 Members Room</a>
                  <a href="/reading-room/inkwell" className="ttl-nav-dropdown-item">🪶 Inkwell</a>
                  <a href="/reading-room/buy-ink" className="ttl-nav-dropdown-item">✒️ Buy Ink</a>
                  <div className="ttl-nav-dropdown-divider" />
                  <a href="/reading-room/account" className="ttl-nav-dropdown-item">⚙️ My Account</a>
                </div>
              </div>

              <a href="https://write.the-tiniest-library.com" className="ttl-shared-link">Writer's Room</a>
            </div>
          </div>

          <div className="ttl-shared-nav-right">
            <div className="ttl-shared-divider" />
            {extras}
            {user ? (
              <a href="/reading-room/account" className="ttl-shared-auth-btn">My Account →</a>
            ) : (
              <a href="/reading-room/login" className="ttl-shared-auth-btn">Sign In →</a>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="ttl-shared-bottom-nav">
        <div className="ttl-shared-bottom-nav-inner">
          <a href="/reading-room" className="ttl-shared-bottom-item" style={pathname === '/reading-room' ? { color: '#C9A84C' } : {}}>
            <span className="ttl-shared-bottom-icon">🏠</span>
            <span className="ttl-shared-bottom-label">Home</span>
          </a>
          <a href="/reading-room/stories" className="ttl-shared-bottom-item">
            <span className="ttl-shared-bottom-icon">📖</span>
            <span className="ttl-shared-bottom-label">Stories</span>
          </a>
          <a href="/reading-room/comics" className="ttl-shared-bottom-item">
            <span className="ttl-shared-bottom-icon">🎨</span>
            <span className="ttl-shared-bottom-label">Comics</span>
          </a>
          <a href="/reading-room/authors" className="ttl-shared-bottom-item">
            <span className="ttl-shared-bottom-icon">🪶</span>
            <span className="ttl-shared-bottom-label">Authors</span>
          </a>
          <a href="/reading-room/buy-ink" className="ttl-shared-bottom-item">
            <span className="ttl-shared-bottom-icon">✒️</span>
            <span className="ttl-shared-bottom-label">Ink</span>
          </a>
        </div>
      </nav>
      <div className="ttl-shared-bottom-spacer" />
      {ink === 0 && !dismissed && (
        <div style={{
          position: 'fixed', bottom: 80, left: 20, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <a href="/reading-room/buy-ink" style={{
            background: 'linear-gradient(135deg, #C9A84C, #8a6510)',
            color: '#000', fontFamily: 'Times New Roman, serif',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            padding: '10px 18px', borderRadius: 999,
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
          }}>✒️ {ink} Ink — Get More</a>
          <button onClick={() => setDismissed(true)} style={{
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', borderRadius: '50%', width: 22, height: 22,
            fontSize: 11, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 0
          }}>✕</button>
        </div>
      )}
    </>
  );
}

export function TTLFooter() {
  return (
    <footer className="ttl-shared-footer">
      <div className="ttl-shared-footer-brand">
        <a href="https://www.the-tiniest-library.com" className="ttl-shared-footer-logo">TTL</a>
        <div>
          <div className="ttl-shared-footer-name">The Tiniest Library</div>
          <div className="ttl-shared-footer-sub">The Reading Room</div>
        </div>
      </div>

      <div>
        <div className="ttl-shared-footer-copy">
          © {new Date().getFullYear()} The Tiniest Library. All rights reserved.
        </div>
        <a
          href="https://www.kidwiththestick.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ttl-shared-footer-credit"
        >
          A company of Kid With The Stick Publishing
        </a>
      </div>

      <div className="ttl-shared-footer-actions">
        <a href="/reading-room/stories" className="ttl-shared-footer-btn">Browse Stories</a>
        <a href="/reading-room/authors" className="ttl-shared-footer-btn">Authors</a>
        <a href="https://write.the-tiniest-library.com" className="ttl-shared-footer-btn">Writer's Room</a>
        <a href="https://redroom.the-tiniest-library.com" className="ttl-shared-footer-btn">Red Room</a>
        <a href="/members" className="ttl-shared-footer-btn-primary">Members Room →</a>
      </div>
    </footer>
  );
}
