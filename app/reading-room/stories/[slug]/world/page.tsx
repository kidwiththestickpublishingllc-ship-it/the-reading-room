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
    --gold: #C9A84C; --gold-light: #8a6510; --gold-dim: rgba(201,168,76,0.5);
    --gold-glow: rgba(201,168,76,0.12); --blue: #6495ED; --blue-dim: rgba(100,149,237,0.15);
    --blue-bright: #4a7fd4; --ink-surface: #ffffff; --ink-surface2: #f5f8ff;
    --ink-border: rgba(100,149,237,0.12); --ink-border-gold: rgba(201,168,76,0.35);
    --text-main: #1a1a2e; --text-dim: rgba(26,26,46,0.65); --text-faint: rgba(26,26,46,0.38);
  }
  .wm-root { min-height: 100vh; background: #f5f8ff; font-family: 'Syne', sans-serif; color: var(--text-main); }

  /* NAV */
  .wm-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 40;
    background: rgba(255,255,255,0.97); backdrop-filter: blur(20px);
    border-bottom: 2px solid var(--ink-border-gold);
    height: 64px; display: flex; align-items: center;
    padding: 0 32px; justify-content: space-between;
    box-shadow: 0 2px 20px rgba(100,149,237,0.08);
  }
  .wm-nav-left { display: flex; align-items: center; gap: 16px; }
  .wm-back {
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--blue-bright); text-decoration: none;
    border: 1px solid var(--blue-dim); background: var(--blue-dim);
    padding: 6px 14px; border-radius: 6px; transition: all 0.2s;
  }
  .wm-back:hover { background: rgba(100,149,237,0.25); }
  .wm-nav-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: var(--gold-light); }
  .wm-nav-sub { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-faint); }
  .wm-nav-badge {
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--gold-light); border: 1px solid var(--gold-dim);
    background: var(--gold-glow); padding: 4px 12px; border-radius: 999px;
  }

  /* BODY LAYOUT */
  .wm-body { padding-top: 64px; display: grid; grid-template-columns: 1fr 360px; min-height: 100vh; }

  /* MAP AREA */
  .wm-map-area {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, #e8eeff 0%, #f0f4ff 40%, #e8f0ff 100%);
    border-right: 1px solid var(--ink-border);
  }
  .wm-map-canvas { width: 100%; height: 100%; position: relative; min-height: calc(100vh - 64px); }

  /* MAP BACKGROUND — illustrated feel */
  .wm-map-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.8) 0%, transparent 60%),
      radial-gradient(ellipse at 35% 38%, rgba(201,168,76,0.08) 0%, transparent 30%),
      radial-gradient(ellipse at 65% 60%, rgba(100,149,237,0.08) 0%, transparent 30%),
      radial-gradient(ellipse at 42% 62%, rgba(100,149,237,0.05) 0%, transparent 20%);
  }

  /* MAP GRID — subtle cartographic feel */
  .wm-map-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(100,149,237,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(100,149,237,0.08) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* TERRITORY ZONES — visual regions on the map */
  .wm-zone {
    position: absolute; border-radius: 50%;
    pointer-events: none; transform: translate(-50%, -50%);
  }

  /* ROUTE */
  .wm-route-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

  /* LOCATION PINS */
  .wm-location {
    position: absolute; transform: translate(-50%, -50%);
    cursor: pointer; z-index: 10;
  }
  .wm-location-pin-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .wm-location-pin {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid; transition: all 0.3s;
    position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .wm-location-pin::after {
    content: ''; position: absolute; inset: -5px; border-radius: 50%;
    background: currentColor; opacity: 0; transition: opacity 0.3s;
  }
  .wm-location:hover .wm-location-pin { transform: scale(1.3); }
  .wm-location:hover .wm-location-pin::after { opacity: 0.12; }
  .wm-location-name {
    font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-main); white-space: nowrap; font-weight: 600;
    background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 3px;
    border: 1px solid rgba(100,149,237,0.15);
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    opacity: 0; transition: opacity 0.2s;
    pointer-events: none;
  }
  .wm-location:hover .wm-location-name { opacity: 1; }
  .wm-location.locked .wm-location-pin { opacity: 0.3; filter: grayscale(1); box-shadow: none; }
  .wm-location.locked { cursor: default; }
  .wm-location.active .wm-location-pin { transform: scale(1.5); box-shadow: 0 0 0 4px rgba(201,168,76,0.25); }

  /* MOVING ARROW */
  .wm-arrow {
    position: absolute; width: 14px; height: 14px;
    background: var(--gold); border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(201,168,76,0.3), 0 0 16px rgba(201,168,76,0.6);
    transform: translate(-50%, -50%);
    transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none; z-index: 20;
  }

  /* LEGEND */
  .wm-legend {
    position: absolute; top: 20px; left: 20px;
    background: rgba(255,255,255,0.95); border: 1px solid var(--ink-border-gold);
    border-radius: 12px; padding: 16px 20px; z-index: 30;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .wm-legend-title {
    font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold-light); margin-bottom: 12px; font-weight: 700;
    border-bottom: 1px solid var(--ink-border-gold); padding-bottom: 8px;
  }
  .wm-legend-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 11px; color: var(--text-dim); }
  .wm-legend-item:last-child { margin-bottom: 0; }
  .wm-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 1.5px solid rgba(0,0,0,0.1); }

  /* CONTROLS */
  .wm-controls {
    position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 10px; z-index: 30;
  }
  .wm-ctrl-btn {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700;
    padding: 10px 20px; border-radius: 8px;
    border: 1px solid var(--gold-dim); background: white;
    color: var(--gold-light); cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(201,168,76,0.15);
  }
  .wm-ctrl-btn:hover { background: var(--gold-glow); box-shadow: 0 4px 20px rgba(201,168,76,0.25); }
  .wm-ctrl-btn.playing { background: var(--gold-glow); border-color: var(--gold); }
  .wm-ctrl-btn.secondary {
    border-color: var(--blue-dim); color: var(--blue-bright); background: white;
    box-shadow: 0 2px 12px rgba(100,149,237,0.1);
  }
  .wm-ctrl-btn.secondary:hover { background: var(--blue-dim); }

  /* COMPASS */
  .wm-compass {
    position: absolute; top: 20px; right: 20px; z-index: 30;
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(255,255,255,0.95); border: 1px solid var(--ink-border-gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  /* SIDEBAR */
  .wm-sidebar {
    background: white; border-left: 1px solid var(--ink-border-gold);
    display: flex; flex-direction: column; overflow-y: auto;
    position: sticky; top: 64px; height: calc(100vh - 64px);
    box-shadow: -4px 0 20px rgba(100,149,237,0.06);
  }
  .wm-sidebar-header {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--ink-border);
    background: linear-gradient(180deg, rgba(201,168,76,0.04) 0%, transparent 100%);
    position: relative;
  }
  .wm-sidebar-header::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--gold), rgba(201,168,76,0.3), transparent);
  }
  .wm-sidebar-eyebrow {
    font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold-light); margin-bottom: 10px; font-weight: 700;
  }
  .wm-sidebar-title {
    font-family: 'Cormorant Garamond', serif; font-size: 30px;
    font-weight: 300; color: var(--text-main); line-height: 1.1; margin-bottom: 8px;
  }
  .wm-sidebar-type {
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: white; background: var(--blue-bright);
    padding: 3px 10px; border-radius: 999px; display: inline-block;
  }
  .wm-sidebar-desc {
    padding: 24px; font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 300; line-height: 1.85;
    color: var(--text-dim); flex: 1;
    border-bottom: 1px solid var(--ink-border);
  }
  .wm-sidebar-locked {
    margin: 20px 24px; padding: 16px 18px; border-radius: 10px;
    background: rgba(100,149,237,0.05); border: 1px solid var(--blue-dim);
    font-size: 12px; color: var(--blue-bright); line-height: 1.65;
    display: flex; align-items: center; gap: 10px;
  }
  .wm-sidebar-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 48px 32px; text-align: center; gap: 16px;
  }
  .wm-sidebar-empty-icon { font-size: 48px; }
  .wm-sidebar-empty-title {
    font-family: 'Cormorant Garamond', serif; font-size: 22px;
    font-weight: 300; color: var(--text-main);
  }
  .wm-sidebar-empty-text {
    font-size: 13px; color: var(--text-faint); line-height: 1.7; max-width: 240px;
  }

  /* LOCATION LIST */
  .wm-location-list { padding: 20px 24px; }
  .wm-location-list-title {
    font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold-light); margin-bottom: 14px; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
  }
  .wm-location-list-title::after {
    content: ''; flex: 1; height: 1px; background: var(--ink-border-gold);
  }
  .wm-location-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px;
    border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px;
  }
  .wm-location-item:hover { background: var(--blue-dim); }
  .wm-location-item.locked { opacity: 0.4; cursor: default; }
  .wm-location-item.locked:hover { background: transparent; }
  .wm-location-item-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .wm-location-item-name { font-size: 12px; color: var(--text-main); flex: 1; font-weight: 500; }
  .wm-location-item-type { font-size: 9px; color: var(--text-faint); letter-spacing: 0.1em; text-transform: uppercase; }
  .wm-location-item-lock { font-size: 11px; color: var(--text-faint); }

  /* STATS BAR */
  .wm-stats {
    padding: 16px 24px; background: var(--ink-surface2);
    border-top: 1px solid var(--ink-border);
    display: flex; gap: 20px;
  }
  .wm-stat { display: flex; flex-direction: column; gap: 2px; }
  .wm-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; color: var(--gold-light); }
  .wm-stat-label { font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-faint); }

  @media (max-width: 768px) {
    .wm-body { grid-template-columns: 1fr; }
    .wm-sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; height: 45vh; border-left: none; border-top: 2px solid var(--ink-border-gold); z-index: 30; }
    .wm-map-canvas { min-height: 55vh; }
    .wm-controls { bottom: 48vh; }
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
                  <div className="wm-location-pin-wrap">
                    <div className="wm-location-pin" style={{ backgroundColor: loc.unlocked ? loc.accent : "#ccc", borderColor: loc.unlocked ? loc.accent : "#bbb", color: loc.accent }} />
                    <div className="wm-location-name">{loc.name}</div>
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
              {/* Compass */}
              <div className="wm-compass">🧭</div>
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
                <div className="wm-sidebar-empty-icon">🗺️</div>
                <div className="wm-sidebar-empty-title">Explore the World</div>
                <div className="wm-sidebar-empty-text">Tap a location on the map to discover its story and lore.</div>
              </div>
            )}
            {/* Stats */}
            <div className="wm-stats">
              <div className="wm-stat">
                <div className="wm-stat-num">{LOCATIONS.filter(l => l.unlocked).length}</div>
                <div className="wm-stat-label">Discovered</div>
              </div>
              <div className="wm-stat">
                <div className="wm-stat-num">{LOCATIONS.filter(l => !l.unlocked).length}</div>
                <div className="wm-stat-label">Locked</div>
              </div>
              <div className="wm-stat">
                <div className="wm-stat-num">{LOCATIONS.length}</div>
                <div className="wm-stat-label">Total</div>
              </div>
            </div>
            {/* Location List */}
            <div className="wm-location-list">
              <div className="wm-location-list-title">All Locations</div>
              {LOCATIONS.map(loc => (
                <div key={loc.id} className={`wm-location-item${!loc.unlocked ? " locked" : ""}`} onClick={() => loc.unlocked && setSelected(loc)}>
                  <div className="wm-location-item-dot" style={{ background: loc.unlocked ? loc.accent : "#ccc" }} />
                  <span className="wm-location-item-name">{loc.name}</span>
                  <span className="wm-location-item-type">{loc.type}</span>
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