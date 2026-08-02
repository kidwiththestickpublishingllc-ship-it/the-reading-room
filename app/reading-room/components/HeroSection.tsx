"use client";
import { useEffect, useState } from "react";
import AdWindow from "./AdWindow";
import { RightAdPanel } from "./HeroPanels";

export default function HeroSection() {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const full = "The Tiniest Library";
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (i <= full.length) {
        setTypedText(full.slice(0, i));
        i++;
        timeout = setTimeout(tick, 110);
      } else {
        timeout = setTimeout(() => { i = 0; tick(); }, 2200);
      }
    };
    tick();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="ttl-hero-section">
      <div className="ttl-hero-three-col">
        <AdWindow />
        <div className="ttl-hero-inner">
          <span className="ttl-hero-eyebrow">{typedText}<span className="ttl-eyebrow-cursor">&nbsp;</span></span>
          <h1 className="ttl-hero-title">
            <span style={{ fontSize: "0.55em", color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>The</span><br />
            <span style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #FFE066 40%, #E2C97E 60%, #C9A84C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontStyle: "italic",
              filter: "drop-shadow(0 2px 8px rgba(139,100,20,0.6)) drop-shadow(0 0 30px rgba(201,168,76,0.7))",
            }}>Reading</span><br />
            <span style={{ color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)" }}>Room</span>
          </h1>
          <p className="ttl-hero-sub">
            A space for long stories, serialized chapters, and exclusive releases.
            Support creators with Ink and unlock what's next.
          </p>
          <div className="ttl-hero-actions">
            <a href="/reading-room/login" className="ttl-btn-join">✦ Join Now — Free ✦</a>
            <a href="/members" className="ttl-btn-primary">Enter Members Room →</a>
            <a href="/reading-room/authors" className="ttl-btn-gold">Author Directory</a>
            <a href="#how-it-works" className="ttl-btn-gold">How it works</a>
          </div>
        </div>
        <RightAdPanel />
      </div>
    </div>
  );
}