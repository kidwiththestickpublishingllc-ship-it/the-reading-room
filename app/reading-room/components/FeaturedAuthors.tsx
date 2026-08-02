"use client";
import React, { useEffect, useState } from "react";

function CarouselControls() {
  const [index, setIndex] = useState(0);
  const total = 10;
  const visible = 4;
  const max = total - visible;

  useEffect(() => {
    const track = document.getElementById("ttl-carousel-track");
    if (!track) return;
    const cardWidth = track.children[0]
      ? (track.children[0] as HTMLElement).offsetWidth + 16
      : 0;
    track.style.transform = `translateX(-${index * cardWidth}px)`;
  }, [index]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i >= max ? 0 : i + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [max]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: max + 1 }).map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} style={{ width: index === i ? 20 : 6, height: 6, borderRadius: 3, background: index === i ? "#C9A84C" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setIndex(i => Math.max(i - 1, 0))} disabled={index === 0} style={{ width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(201,168,76,0.26)", background: "rgba(201,168,76,0.13)", color: "#E2C97E", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: index === 0 ? 0.25 : 1 }}>←</button>
        <button onClick={() => setIndex(i => Math.min(i + 1, max))} disabled={index >= max} style={{ width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(201,168,76,0.26)", background: "rgba(201,168,76,0.13)", color: "#E2C97E", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: index >= max ? 0.25 : 1 }}>→</button>
      </div>
    </div>
  );
}

const AUTHORS = [
  { slug: "chris-knopf", name: "Chris Knopf", role: "Founding Author · Published", tagline: "Where the dead aren't quite done.", quote: "A ghost grows attached to someone who reminds him of himself.", genres: ["Horror Mystery", "Thriller"], accent: "#9B2335" },
  { slug: "d-cedeno", name: "Daniel Cedeno", role: "Founding Author · Creator", tagline: "Worlds that refuse to stay quiet.", quote: "The sky above Hartford wasn't supposed to flicker like a broken screen… but tonight it did.", genres: ["Sci-Fi", "Young Adult"], accent: "#C9A84C" },
  { slug: "sergio-lastre", name: "Sergio Lastre", role: "Founding Author", tagline: "Stories that live in the marrow.", quote: "Some doors don't open. They remember.", genres: ["Latin Stories", "Contemporary Fiction"], accent: "#6495ED" },
];

export default function FeaturedAuthors() {
  return (
    <div className="ttl-section">
      <div className="ttl-section-header">
        <div>
          <div className="ttl-section-accent">
            <div className="ttl-section-bar" />
            <div>
              <span className="ttl-section-eyebrow">Discover</span>
              <h2 className="ttl-section-title">Featured Authors</h2>
            </div>
          </div>
        </div>
        <a href="/reading-room/authors" className="ttl-section-link">Full Directory →</a>
      </div>
      <div className="ttl-divider" />
      <div style={{ position: "relative" }}>
        <div style={{ overflow: "hidden", borderRadius: 16 }}>
          <div id="ttl-carousel-track" style={{ display: "flex", gap: 16, transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
            {AUTHORS.map((author) => {
              const initial = author.name.split(" ").pop()?.[0] ?? author.name[0];
              return (
                <a key={author.slug} href={`/reading-room/authors/${author.slug}`} style={{ flexShrink: 0, width: "calc(25% - 12px)", minHeight: 420, borderRadius: 16, background: "#111", border: `1px solid ${author.accent}22`, textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.3s" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-6px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${author.accent}, transparent)` }} />
                  <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: author.accent, opacity: 0.1, filter: "blur(40px)", pointerEvents: "none" }} />
                  <div style={{ padding: "28px 24px 24px", display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 1 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: "linear-gradient(135deg, #1a1a24, #252535)", border: `1px solid ${author.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: author.accent, marginBottom: 20 }}>{initial}</div>
                    <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: author.accent, opacity: 0.7, marginBottom: 8 }}>{author.role}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#f0ece2", marginBottom: 6, lineHeight: 1.1 }}>{author.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(240,236,226,0.92)", marginBottom: 16, lineHeight: 1.55 }}>{author.tagline}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: "italic", color: "rgba(240,236,226,0.92)", lineHeight: 1.7, borderLeft: `2px solid ${author.accent}30`, paddingLeft: 14, marginBottom: 20, flex: 1 }}>"{author.quote}"</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 20 }}>
                      {author.genres.map(g => (
                        <span key={g} style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 999, border: "1px solid rgba(100,149,237,0.22)", color: "#84b0f5", background: "rgba(100,149,237,0.22)" }}>{g}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(232,228,218,0.25)" }}>🪶 View profile</span>
                      <span style={{ fontSize: 16, color: author.accent }}>↗</span>
                    </div>
                  </div>
                </a>
              );
            })}
            <div style={{ flexShrink: 0, width: "calc(25% - 12px)", minHeight: 420, borderRadius: 16, background: "linear-gradient(135deg, #0f0f18, #151520)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" as const, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
              <div style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(201,168,76,0.4)", marginBottom: 20 }}>Featured Placement</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "#f0ece2", lineHeight: 1.3, marginBottom: 12 }}>Your Story<br />Could Live Here</div>
              <div style={{ fontSize: 11, color: "rgba(232,228,218,0.25)", lineHeight: 1.65, marginBottom: 24 }}>Reach thousands of readers. Feature your work in the Reading Room carousel.</div>
              <a href="/reading-room/authors" style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#E2C97E", border: "1px solid rgba(201,168,76,0.38)", background: "rgba(201,168,76,0.13)", padding: "8px 20px", borderRadius: 999, textDecoration: "none" }}>Learn More →</a>
            </div>
          </div>
        </div>
        <CarouselControls />
      </div>
    </div>
  );
}