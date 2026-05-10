"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// =========================
// TTL World Map
// Route: /reading-room/stories/[slug]/world
// Interactive story map with clickable locations
// and animated character routes
// =========================

const LOCATIONS = [
  {
    id: "town-square",
    name: "Town Square",
    x: 50, y: 45,
    description: "The center of everything. Where the first glitch was seen.",
    type: "landmark",
    unlocked: true,
    accent: "#C9A84C",
  },
  {
    id: "the-cafe",
    name: "The Old Café",
    x: 35, y: 38,
    description: "A corner spot with fogged windows. The lantern appeared here first.",
    type: "building",
    unlocked: true,
    accent: "#C9A84C",
  },
  {
    id: "riverwalk",
    name: "The Riverwalk",
    x: 65, y: 60,
    description: "Where the water remembers names. Locked until Chapter 3.",
    type: "landmark",
    unlocked: false,
    accent: "#6495ED",
  },
  {
    id: "fox-apartment",
    name: "Fox's Block",
    x: 42, y: 62,
    description: "The starting point. Where the run began.",
    type: "residential",
    unlocked: true,
    accent: "#C9A84C",
  },
  {
    id: "the-bridge",
    name: "The Bridge",
    x: 72, y: 42,
    description: "Something happened here. Locked until Chapter 5.",
    type: "landmark",
    unlocked: false,
    accent: "#6495ED",
  },
  {
    id: "underground",
    name: "The Underground",
    x: 55, y: 72,
    description: "Not on any map. Locked until Chapter 8.",
    type: "secret",
    unlocked: false,
    accent: "#a78bfa",
  },
];

const ROUTE = [
  { x: 42, y: 62 },
  { x: 45, y: 55 },
  { x: 50, y: 45 },
  { x: 35, y: 38 },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --gold: #C9A84C; --gold-light: #E2C97E; --gold-dim: rgba(201,168,76,0.35);
    --gold-glow: rgba(201,168,76,0.12); --blue: #6495ED; --blue-dim: rgba(100,149,237,0.22);
    --ink-bg: #0a0a0a; --ink-surface: #111; --ink-surface2: #181818;
    --ink-border: rgba(255,255,255,0.07); --ink-border-gold: rgba(201,168,76,0.25);
    --text-main: #f0ece2; --text-dim: rgba(232,228,218,0.5); --text-faint: rgba(232,228,218,0.25);
  }
  .wm-root { min-height: 100vh; background: #0a0a0a; font-family: 'Syne', sans-serif; color: var(--text-main); }
  .wm-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 40;
    background: rgba(8,8,8,0.97); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--ink-border-gold);
    height: 64px; display: flex; align-items: center;
    padding: 0 32px; justify-content: space-between;
  }
  .wm-nav-left { display: flex; align-items: center; gap: 16px; }
  .wm-back {
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-dim); text-decoration: none; border: 1px solid var(--ink-border);
    padding: 6px 14px; border-radius: 6px; transition: all 0.2s;
  }
  .wm-back:hover { color: var(--gold-light); border-color: var(--gold-dim); }
  .wm-nav-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; color: var(--gold-light); }
  .wm-nav-sub { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-faint); }
  .wm-body { padding-top: 64px; display: grid; grid-template-columns: 1fr 340px; min-height: 100vh; }
  .wm-map-area { position: relative; background: #0d0d12; overflow: hidden; }
  .wm-map-canvas { width: 100%; height: 100%; position: relative; min-height: calc(100vh - 64px); }
  .wm-map-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 30% 40%, rgba(201,168,76,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 70%, rgba(100,149,237,0.04) 0%, transparent 50%),
      repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px),
      repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px);
  }
  .wm-route-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .wm-location {
    position: absolute; transform: translate(-50%, -50%);
    cursor: pointer; z-index: 10;
  }
  .wm-location-pin {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid; transition: all 0.3s;
    position: relative;
  }
  .wm-location-pin::after {
    content: ''; position: absolute; inset: -6px; border-radius: 50%;
    background: currentColor; opacity: 0; transition: opacity 0.3s;
  }
  .wm-location:hover .wm-location-pin::after { opacity: 0.15; }
  .wm-location-label {
    position: absolute; left: 50%; transform: translateX(-50%);
    bottom: calc(100% + 8px); white-space: nowrap;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    background: rgba(10,10,10,0.9); border: 1px solid;
    padding: 3px 8px; border-radius: 4px; pointer-events: none;
    opacity: 0; transition: opacity 0.2s;
  }
  .wm-location:hover .wm-location-label { opacity: 1; }
  .wm-location.locked .wm-location-pin { opacity: 0.35; filter: grayscale(1); }
  .wm-location.active .wm-location-pin { transform: scale(1.4); }
  .wm-arrow {
    position: absolute; width: 12px; height: 12px;
    background: var(--gold); border-radius: 50%;
    box-shadow: 0 0 12px rgba(201,168,76,0.8);
    transform: translate(-50%, -50%);
    transition: all 0.5s ease;
    pointer-events: none; z-index: 20;
  }
  .wm-controls {
    position: absolute; bottom: 24px; left: 24px; display: flex; gap: 8px; z-index: 30;
  }
  .wm-ctrl-btn {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 8px 16px; border-radius: 6px; border: 1px solid var(--gold-dim);
    background: var(--gold-glow); color: var(--gold-light); cursor: pointer;
    transition: all 0.2s;
  }
  .wm-ctrl-btn:hover { background: rgba(201,168,76,0.2); }
  .wm-ctrl-btn.playing { border-color: var(--gold); background: rgba(201,168,76,0.2); }
  .wm-legend {
    position: absolute; top: 24px; left: 24px;
    background: rgba(10,10,10,0.85); border: 1px solid var(--ink-border-gold);
    border-radius: 10px; padding: 14px 18px; z-index: 30;
  }
  .wm-legend-title { font-size: 8px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--gold-dim); margin-bottom: 10px; }
  .wm-legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 10px; color: var(--text-dim); }
  .wm-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .wm-sidebar {
    background: var(--ink-surface); border-left: 1px solid var(--ink-border-gold);
    display: flex; flex-direction: column; overflow-y: auto;
    position: sticky; top: 64px; height: calc(100vh - 64px);
  }
  .wm-sidebar-header {
    padding: 24px; border-bottom: 1px solid var(--ink-border);
    background: linear-gradient(180deg, rgba(201,168,76,0.05) 0%, transparent 100%);
  }
  .wm-sidebar-eyebrow { font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold-dim); margin-bottom: 8px; }
  .wm-sidebar-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: var(--text-main); line-height: 1.1; margin-bottom: 6px; }
  .wm-sidebar-type { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-faint); }
  .wm-sidebar-desc { padding: 20px 24px; font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 300; line-height: 1.8; color: var(--text-dim); flex: 1; }
  .wm-sidebar-locked {
    margin: 0 24px 24px; padding: 16px; border-radius: 8px;
    background: rgba(100,149,237,0.06); border: 1px solid rgba(100,149,237,0.2);
    font-size: 11px; color: var(--text-faint); text-align: center; line-height: 1.6;
  }
  .wm-sidebar-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 40px 24px; text-align: center; gap: 12px;
  }
  .wm-sidebar-empty-icon { font-size: 40px; opacity: 0.3; }
  .wm-sidebar-empty-text { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 300; color: var(--text-faint); line-height: 1.7; }
  .wm-location-list { padding: 20px 24px; border-top: 1px solid var(--ink-border); }
  .wm-location-list-title { font-size: 8px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--gold-dim); margin-bottom: 12px; }
  .wm-location-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 0;
    border-bottom: 1px solid var(--ink-border); cursor: pointer; transition: all 0.2s;
  }
  .wm-location-item:last-child { border-bottom: none; }
  .wm-location-item:hover { padding-left: 4px; }
  .wm-location-item.locked { opacity: 0.4; cursor: default; }
  .wm-location-item-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .wm-location-item-name { font-size: 11px; color: var(--text-dim); flex: 1; }
  .wm-location-item-lock { font-size: 10px; }
  @media (max-width: 768px) {
    .wm-body { grid-template-columns: 1fr; }
    .wm-sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: 50vh; border-left: none; border-top: 1px solid var(--ink-border-gold); z-index: 30; }
    .wm-map-canvas { min-height: 50vh; }
  }
`;

export default function WorldMapPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [selected, setSelected] = useState<typeof LOCATIONS[0] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [arrowPos, setArrowPos] = useState<{ x: number; y: number } | null>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  const playRoute = () => {
    if (playing) {
      setPlaying(false);
      setArrowPos(null);
      setRouteProgress(0);
      if (animRef.current) clearInterval(animRef.current);
      return;
    }
    setPlaying(true);
    setRouteProgress(0);
    let step = 0;
    setArrowPos(ROUTE[0]);
    animRef.current = setInterval(() => {
      step++;
      if (step >= ROUTE.length) {
        setPlaying(false);
        setArrowPos(null);
        setRouteProgress(0);
        if (animRef.current) clearInterval(animRef.current);
        return;
      }
      setArrowPos(ROUTE[step]);
      setRouteProgress(step);
    }, 800);
  };

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="wm-root">

        {/* NAV */}
        <nav className="wm-nav">
          <div className="wm-nav-left">
            <a href={`/reading-room/stories/${slug}`} className="wm-back">← Story</a>
            <div>
              <div className="wm-nav-title">World Map</div>
              <div className="wm-nav-sub">Interactive Story Atlas</div>
            </div>
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-faint)" }}>
            The Tiniest Library
          </div>
        </nav>

        <div className="wm-body">

          {/* MAP */}
          <div className="wm-map-area">
            <div className="wm-map-canvas" ref={mapRef}>
              <div className="wm-map-bg" />

              {/* Route SVG */}
              <svg className="wm-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="rgba(201,168,76,0.6)" />
                  </marker>
                </defs>
                {ROUTE.slice(0, routeProgress + 1).map((point, i) => {
                  if (i === 0) return null;
                  const prev = ROUTE[i - 1];
                  return (
                    <line key={i}
                      x1={`${prev.x}%`} y1={`${prev.y}%`}
                      x2={`${point.x}%`} y2={`${point.y}%`}
                      stroke="rgba(201,168,76,0.5)" strokeWidth="0.4"
                      strokeDasharray="2 2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </svg>

              {/* Locations */}
              {LOCATIONS.map(loc => (
                <div
                  key={loc.id}
                  className={`wm-location${!loc.unlocked ? " locked" : ""}${selected?.id === loc.id ? " active" : ""}`}
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                  onClick={() => loc.unlocked && setSelected(loc)}
                >
                  <div className="wm-location-pin" style={{ backgroundColor: loc.unlocked ? loc.accent : "#333", borderColor: loc.unlocked ? loc.accent : "#444", color: loc.accent }} />
                  <div className="wm-location-label" style={{ borderColor: loc.accent, color: loc.unlocked ? loc.accent : "var(--text-faint)" }}>
                    {loc.name}
                  </div>
                </div>
              ))}

              {/* Moving arrow */}
              {arrowPos && (
                <div className="wm-arrow" style={{ left: `${arrowPos.x}%`, top: `${arrowPos.y}%` }} />
              )}

              {/* Legend */}
              <div className="wm-legend">
                <div className="wm-legend-title">Legend</div>
                <div className="wm-legend-item"><div className="wm-legend-dot" style={{ background: "#C9A84C" }} />Unlocked location</div>
                <div className="wm-legend-item"><div className="wm-legend-dot" style={{ background: "#333" }} />Locked location</div>
                <div className="wm-legend-item"><div className="wm-legend-dot" style={{ background: "#C9A84C", boxShadow: "0 0 6px rgba(201,168,76,0.8)" }} />Character position</div>
              </div>

              {/* Controls */}
              <div className="wm-controls">
                <button className={`wm-ctrl-btn${playing ? " playing" : ""}`} onClick={playRoute}>
                  {playing ? "⏹ Stop Route" : "▶ Play Fox's Route"}
                </button>
                <button className="wm-ctrl-btn" onClick={() => { setSelected(null); setArrowPos(null); setPlaying(false); setRouteProgress(0); if (animRef.current) clearInterval(animRef.current); }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="wm-sidebar">
            {selected ? (
              <>
                <div className="wm-sidebar-header">
                  <div className="wm-sidebar-eyebrow">Location</div>
                  <div className="wm-sidebar-title">{selected.name}</div>
                  <div className="wm-sidebar-type">{selected.type}</div>
                </div>
                <div className="wm-sidebar-desc">{selected.description}</div>
                {!selected.unlocked && (
                  <div className="wm-sidebar-locked">🔒 This location unlocks as you read further in the story.</div>
                )}
              </>
            ) : (
              <div className="wm-sidebar-empty">
                <div className="wm-sidebar-empty-icon">🗺</div>
                <div className="wm-sidebar-empty-text">Tap a location on the map to learn more about it.</div>
              </div>
            )}

            {/* Location List */}
            <div className="wm-location-list">
              <div className="wm-location-list-title">All Locations</div>
              {LOCATIONS.map(loc => (
                <div key={loc.id} className={`wm-location-item${!loc.unlocked ? " locked" : ""}`} onClick={() => loc.unlocked && setSelected(loc)}>
                  <div className="wm-location-item-dot" style={{ background: loc.unlocked ? loc.accent : "#333" }} />
                  <span className="wm-location-item-name">{loc.name}</span>
                  {!loc.unlocked && <span className="wm-location-item-lock">🔒</span>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}