"use client";

/**
 * DiscoverPage.tsx
 * ─────────────────────────────────────────────────────────────────
 * Mood-based story discovery. Reader answers 3 questions:
 *  1. How much time do you have?
 *  2. How do you want to feel?
 *  3. What were you last obsessed with?
 * TTL surfaces 5 stories tailored to that moment.
 * No genre labels. No filters. Pure human curation via AI.
 *
 * Place at: app/reading-room/discover/page.tsx
 *
 * Also create: app/reading-room/discover/layout.tsx
 * with just: export { default } from "@/app/reading-room/layout";
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────
interface DiscoverResult {
  slug: string;
  title: string;
  author: string;
  description: string;
  cover: string | null;
  genre: string;
  badge: string | null;
  reason: string; // Why Page recommended this
}

type Step = "time" | "feel" | "obsession" | "loading" | "results" | "error";

const TIME_OPTIONS = [
  { value: "quick",  label: "15 minutes",    icon: "⚡", desc: "A short story or single chapter" },
  { value: "hour",   label: "An hour",        icon: "🕯️", desc: "A few chapters, something to sink into" },
  { value: "session",label: "All afternoon",  icon: "📚", desc: "A full story or deep serial" },
  { value: "binge",  label: "All weekend",    icon: "🌙", desc: "A long serial, multiple stories" },
];

const FEEL_OPTIONS = [
  { value: "thrilled",   label: "Thrilled",    icon: "⚡", color: "#EF4444" },
  { value: "moved",      label: "Moved",       icon: "🌊", color: "#6495ED" },
  { value: "delighted",  label: "Delighted",   icon: "✨", color: "#F59E0B" },
  { value: "unsettled",  label: "Unsettled",   icon: "🌑", color: "#8B5CF6" },
  { value: "inspired",   label: "Inspired",    icon: "🔥", color: "#C9A84C" },
  { value: "comforted",  label: "Comforted",   icon: "🍂", color: "#10B981" },
];

const OBSESSION_OPTIONS = [
  { value: "magic systems",     label: "Magic systems",      icon: "✦" },
  { value: "found family",      label: "Found family",       icon: "🤝" },
  { value: "enemies to lovers", label: "Enemies to lovers",  icon: "⚔️" },
  { value: "dark secrets",      label: "Dark secrets",       icon: "🔒" },
  { value: "redemption arcs",   label: "Redemption arcs",    icon: "🌅" },
  { value: "unreliable narrator",label: "Unreliable narrators",icon: "🪞" },
  { value: "slow burn",         label: "Slow burn",          icon: "🕯️" },
  { value: "plot twists",       label: "Plot twists",        icon: "🌀" },
  { value: "morally grey",      label: "Morally grey leads", icon: "🩶" },
  { value: "world building",    label: "Deep world-building",icon: "🗺️" },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Syne:wght@400;500;700&display=swap');

  .disc-root {
    min-height: 100vh;
    background: #0a0807;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px 24px;
  }

  /* Progress dots */
  .disc-dots {
    display: flex; gap: 8px; margin-bottom: 48px;
  }
  .disc-dot {
    width: 6px; height: 6px; border-radius: 50%;
    transition: all 0.3s;
  }
  .disc-dot-active { background: #C9A84C; }
  .disc-dot-done { background: rgba(201,168,76,0.4); }
  .disc-dot-idle { background: rgba(255,255,255,0.12); }

  /* Question block */
  .disc-question {
    max-width: 600px; width: 100%;
    text-align: center; margin-bottom: 40px;
  }
  .disc-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(201,168,76,0.6); margin-bottom: 14px; display: block;
  }
  .disc-q-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.95); line-height: 1.25;
  }
  .disc-q-sub {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: rgba(232,228,218,0.35);
    margin-top: 8px; line-height: 1.6;
  }

  /* Option grids */
  .disc-grid-2 {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; max-width: 520px; width: 100%;
  }
  .disc-grid-3 {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 8px; max-width: 560px; width: 100%;
  }
  .disc-grid-5 {
    display: flex; flex-wrap: wrap;
    gap: 8px; max-width: 580px; width: 100%;
    justify-content: center;
  }

  /* Option button */
  .disc-opt {
    display: flex; flex-direction: column; align-items: center;
    gap: 8px; padding: 18px 14px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.02);
    cursor: pointer; transition: all 0.2s; text-align: center;
  }
  .disc-opt:hover {
    border-color: rgba(201,168,76,0.35);
    background: rgba(201,168,76,0.05);
    transform: translateY(-2px);
  }
  .disc-opt.selected {
    border-color: rgba(201,168,76,0.5);
    background: rgba(201,168,76,0.1);
  }
  .disc-opt-icon { font-size: 24px; line-height: 1; }
  .disc-opt-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 400;
    color: rgba(232,228,218,0.85); line-height: 1.2;
  }
  .disc-opt-desc {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.3);
    line-height: 1.4;
  }

  /* Feel option — smaller, color-tinted */
  .disc-feel-opt {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.02);
    cursor: pointer; transition: all 0.2s;
  }
  .disc-feel-opt:hover { transform: translateY(-1px); }
  .disc-feel-opt.selected { }
  .disc-feel-label {
    font-family: 'Syne', sans-serif;
    font-size: 12px; letter-spacing: 0.08em;
    color: rgba(232,228,218,0.8);
  }

  /* Obsession pill */
  .disc-obs-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.02);
    cursor: pointer; transition: all 0.2s;
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.6);
    letter-spacing: 0.04em;
  }
  .disc-obs-pill:hover {
    border-color: rgba(201,168,76,0.3);
    color: rgba(232,228,218,0.9);
  }
  .disc-obs-pill.selected {
    border-color: rgba(201,168,76,0.5);
    background: rgba(201,168,76,0.1);
    color: #C9A84C;
  }

  /* CTA button */
  .disc-cta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none; padding: 14px 36px; border-radius: 10px;
    cursor: pointer; transition: opacity 0.2s; margin-top: 32px;
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 11px;
  }
  .disc-cta:hover { opacity: 0.88; }
  .disc-cta:disabled { opacity: 0.3; cursor: default; }

  /* Loading */
  .disc-loading {
    text-align: center; max-width: 400px;
  }
  .disc-loading-icon {
    font-size: 40px; display: block; margin-bottom: 20px;
    animation: disc-float 2s ease-in-out infinite;
  }
  @keyframes disc-float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .disc-loading-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.8); margin-bottom: 8px;
  }
  .disc-loading-sub {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.3);
    line-height: 1.65;
  }
  .disc-loading-bar {
    margin: 24px auto 0; width: 200px; height: 2px;
    background: rgba(255,255,255,0.08); border-radius: 99px;
    overflow: hidden;
  }
  .disc-loading-fill {
    height: 100%; background: linear-gradient(90deg, #C9A84C, #8a6510);
    border-radius: 99px;
    animation: disc-load 2s ease-in-out infinite;
  }
  @keyframes disc-load {
    0% { width: 0%; } 70% { width: 90%; } 100% { width: 100%; }
  }

  /* Results */
  .disc-results { max-width: 640px; width: 100%; }
  .disc-results-header { text-align: center; margin-bottom: 32px; }
  .disc-results-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.95); margin-bottom: 8px;
  }
  .disc-results-sub {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.35); line-height: 1.65;
  }
  .disc-result-card {
    display: flex; gap: 16px; padding: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; margin-bottom: 10px;
    background: rgba(255,255,255,0.02);
    text-decoration: none;
    transition: all 0.2s;
  }
  .disc-result-card:hover {
    border-color: rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.04);
    transform: translateX(4px);
  }
  .disc-result-thumb {
    width: 56px; height: 72px; border-radius: 8px;
    flex-shrink: 0; overflow: hidden;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .disc-result-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .disc-result-body { flex: 1; min-width: 0; }
  .disc-result-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 400;
    color: rgba(232,228,218,0.95); margin-bottom: 3px; line-height: 1.2;
  }
  .disc-result-author {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.4);
    margin-bottom: 8px; letter-spacing: 0.04em;
  }
  .disc-result-reason {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.55);
    line-height: 1.6; font-style: italic;
  }
  .disc-result-arrow {
    font-size: 18px; color: rgba(201,168,76,0.4);
    align-self: center; flex-shrink: 0;
    transition: all 0.2s;
  }
  .disc-result-card:hover .disc-result-arrow {
    color: #C9A84C; transform: translateX(3px);
  }
  .disc-restart {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(232,228,218,0.3); background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 10px 24px; border-radius: 8px;
    cursor: pointer; margin-top: 24px; transition: all 0.2s;
    display: block; margin-left: auto; margin-right: auto;
  }
  .disc-restart:hover { color: #C9A84C; border-color: rgba(201,168,76,0.3); }

  @media (max-width: 560px) {
    .disc-grid-2 { grid-template-columns: 1fr; }
    .disc-grid-3 { grid-template-columns: 1fr 1fr; }
    .disc-q-text { font-size: 28px; }
  }
`;

// ─── Component ────────────────────────────────────────────────────
export default function DiscoverPage() {
  const [step, setStep] = useState<Step>("time");
  const [time, setTime] = useState("");
  const [feel, setFeel] = useState("");
  const [obsession, setObsession] = useState("");
  const [results, setResults] = useState<DiscoverResult[]>([]);

  const steps = ["time", "feel", "obsession"];
  const currentStepIdx = steps.indexOf(step);

  const discover = useCallback(async () => {
    setStep("loading");
    try {
      const prompt = `You are Page, the reading guide for The Tiniest Library (TTL).
A reader has told you:
- Time available: ${time}
- How they want to feel: ${feel}  
- What they've been obsessed with: ${obsession}

Based on these moods, recommend exactly 5 stories from TTL's Reading Room.
The stories available on TTL span these genres: Fantasy, Sci-Fi, Romance, Crime & Thrillers, 
Dark Academia, Young Adult, Horror Mystery, Cozy, Adventure, Historical Fiction, 
Contemporary Fiction, Fan Fiction, Serialized Fiction, Slice of Life, Multi-Cultural, 
Black Stories, Latin Stories, LGBTQ+ Fiction, New Adult, LitRPG.

For each recommendation, match the reading time to the story format:
- "quick" → short stories or first chapters
- "hour" → 3-5 chapter serials
- "session" → full novels or longer serials  
- "binge" → epic serials with many chapters

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "results": [
    {
      "slug": "kings-of-sorrow",
      "title": "Kings Of Sorrow",
      "author": "Daniel Cedeno",
      "description": "A world that refuses to stay quiet — YA sci-fi with sharp edges.",
      "cover": null,
      "genre": "Sci-Fi",
      "badge": "Early Access",
      "reason": "Your obsession with morally grey leads will find exactly that in Fox, the protagonist who blurs every line."
    }
  ]
}

Use real TTL stories when you know them. For genres without known TTL stories, 
create plausible story titles and authors that fit the genre and mood.
The reason field should be 1 sentence connecting this story to what the reader told you.
Make it feel like a personal recommendation from a librarian who knows them.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text ?? "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed.results ?? []);
      setStep("results");
    } catch (err) {
      console.error("Discover error:", err);
      setStep("error");
    }
  }, [time, feel, obsession]);

  const reset = () => {
    setStep("time"); setTime(""); setFeel(""); setObsession(""); setResults([]);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="disc-root">

        {/* Progress dots */}
        {["time","feel","obsession","loading","results"].includes(step) && step !== "error" && (
          <div className="disc-dots">
            {steps.map((s, i) => (
              <div key={s} className={`disc-dot ${
                i < currentStepIdx ? "disc-dot-done"
                : i === currentStepIdx ? "disc-dot-active"
                : "disc-dot-idle"
              }`} />
            ))}
          </div>
        )}

        {/* ── Step 1: Time ── */}
        {step === "time" && (
          <>
            <div className="disc-question">
              <span className="disc-eyebrow">The Tiniest Library · Discover</span>
              <div className="disc-q-text">How much time do you have?</div>
              <div className="disc-q-sub">We'll find something that fits your window perfectly.</div>
            </div>
            <div className="disc-grid-2">
              {TIME_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`disc-opt${time === o.value ? " selected" : ""}`}
                  onClick={() => { setTime(o.value); setStep("feel"); }}
                >
                  <span className="disc-opt-icon">{o.icon}</span>
                  <span className="disc-opt-label">{o.label}</span>
                  <span className="disc-opt-desc">{o.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Feel ── */}
        {step === "feel" && (
          <>
            <div className="disc-question">
              <span className="disc-eyebrow">Question 2 of 3</span>
              <div className="disc-q-text">How do you want to feel?</div>
              <div className="disc-q-sub">Pick the emotion you're reading toward right now.</div>
            </div>
            <div className="disc-grid-3">
              {FEEL_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`disc-feel-opt${feel === o.value ? " selected" : ""}`}
                  style={{
                    borderColor: feel === o.value ? `${o.color}66` : undefined,
                    background: feel === o.value ? `${o.color}14` : undefined,
                  }}
                  onClick={() => { setFeel(o.value); setStep("obsession"); }}
                  onMouseEnter={e => {
                    if (feel !== o.value) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${o.color}44`;
                      (e.currentTarget as HTMLButtonElement).style.background = `${o.color}0a`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (feel !== o.value) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "";
                      (e.currentTarget as HTMLButtonElement).style.background = "";
                    }
                  }}
                >
                  <span style={{ fontSize: 20 }}>{o.icon}</span>
                  <span className="disc-feel-label" style={{ color: feel === o.value ? o.color : undefined }}>
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 3: Obsession ── */}
        {step === "obsession" && (
          <>
            <div className="disc-question">
              <span className="disc-eyebrow">Question 3 of 3</span>
              <div className="disc-q-text">What have you been obsessed with?</div>
              <div className="disc-q-sub">Pick as many as feel true right now.</div>
            </div>
            <div className="disc-grid-5">
              {OBSESSION_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`disc-obs-pill${obsession === o.value ? " selected" : ""}`}
                  onClick={() => setObsession(o.value)}
                >
                  <span>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="disc-cta"
              disabled={!obsession}
              onClick={discover}
            >
              Find my stories
              <span>→</span>
            </button>
          </>
        )}

        {/* ── Loading ── */}
        {step === "loading" && (
          <div className="disc-loading">
            <span className="disc-loading-icon">📖</span>
            <div className="disc-loading-title">Page is finding your reads…</div>
            <div className="disc-loading-sub">
              Searching {feel} stories for someone with {time} who loves {obsession}.
            </div>
            <div className="disc-loading-bar">
              <div className="disc-loading-fill" />
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {step === "results" && (
          <div className="disc-results">
            <div className="disc-results-header">
              <div className="disc-results-title">Your reads for right now</div>
              <div className="disc-results-sub">
                Curated by Page for {feel} · {time} · {obsession}
              </div>
            </div>

            {results.map((r, i) => (
              <a
                key={i}
                href={`/reading-room/stories/${r.slug}/chapters/1`}
                className="disc-result-card"
              >
                <div className="disc-result-thumb">
                  {r.cover
                    ? <img src={r.cover} alt={r.title} />
                    : "📖"
                  }
                </div>
                <div className="disc-result-body">
                  <div className="disc-result-title">{r.title}</div>
                  <div className="disc-result-author">by {r.author}</div>
                  <div className="disc-result-reason">"{r.reason}"</div>
                </div>
                <span className="disc-result-arrow">→</span>
              </a>
            ))}

            <button type="button" className="disc-restart" onClick={reset}>
              Start over
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="disc-loading">
            <span className="disc-loading-icon">⚠️</span>
            <div className="disc-loading-title">Something went wrong</div>
            <div className="disc-loading-sub">Page couldn't find your stories just now. Try again.</div>
            <button type="button" className="disc-cta" onClick={reset} style={{ marginTop: 24 }}>
              Try again
            </button>
          </div>
        )}

      </div>
    </>
  );
}
