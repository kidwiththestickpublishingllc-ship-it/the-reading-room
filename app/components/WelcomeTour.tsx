"use client";

import { useEffect, useState, useCallback } from "react";

// =============================================================
// TTL WELCOME TOUR
// A two-phase onboarding experience:
//   Phase 1 — Welcome modal (5 slides introducing TTL)
//   Phase 2 — Spotlight tour (highlights real page elements)
//
// HOW TO INSTALL:
//   1. Save as: app/components/WelcomeTour.tsx
//   2. In app/layout.tsx, add:
//      import WelcomeTour from "./components/WelcomeTour";
//      Then place <WelcomeTour /> just before </body>
//
// HOW TO ADD THE REPLAY BUTTON anywhere on the page:
//   import { startTour } from "./components/WelcomeTour";
//   <button onClick={startTour}>Take the Tour</button>
//
// CUSTOMIZATION:
//   - Edit MODAL_SLIDES to change the intro content
//   - Edit SPOTLIGHT_STEPS to change what gets highlighted
//   - Add data-tour="step-id" to any element to spotlight it
// =============================================================

const TOUR_KEY = "ttl_tour_completed";

// =============================================================
// Modal slides — the welcome intro
// =============================================================
const MODAL_SLIDES = [
  {
    emoji: "📚",
    title: "Welcome to\nThe Reading Room",
    subtitle: "The Tiniest Library",
    body: "A home for long stories, serialized chapters, and exclusive releases from independent authors. Every click can uncover your next favorite story.",
    cta: "Let's get started →",
  },
  {
    emoji: "🪶",
    title: "Meet Ink",
    subtitle: "Your Reader Currency",
    body: "Ink is how you support authors and unlock exclusive content. You start with 250 Ink free. Use it to read early-access chapters, exclusives, and members-only releases.",
    highlight: "Buy more Ink starting at just $1 — packs go up to 2,500 Ink.",
    cta: "Got it →",
  },
  {
    emoji: "🔓",
    title: "Unlock Stories",
    subtitle: "Read What's Next",
    body: "Each story unlock costs 25 Ink. Once unlocked, it's saved in your browser — your reading persists across every visit. No account required.",
    highlight: "Look for the Unlock button on any story card.",
    cta: "Nice →",
  },
  {
    emoji: "✍️",
    title: "Support Authors",
    subtitle: "Tip the Writers You Love",
    body: "Every author on TTL is independent. You can tip them directly with Ink right from their profile card — no middleman, no algorithm deciding who gets seen.",
    highlight: "Find authors in the Author Directory and leave them a tip.",
    cta: "Love it →",
  },
  {
    emoji: "🗂️",
    title: "Find Your Genre",
    subtitle: "24 Genres to Explore",
    body: "From Fantasy and Sci-Fi to Dark Academia, Cozy, LGBTQ+ Fiction, Black Stories, Latin Voices, and more. Use the genre panels on Browse Stories to filter exactly what you love.",
    highlight: "Ready for a quick tour of the Reading Room?",
    cta: "Show me around →",
    isFinal: true,
  },
];

// =============================================================
// Spotlight steps — highlights real page elements
// Add data-tour="step-id" to elements in your pages
// =============================================================
const SPOTLIGHT_STEPS = [
  {
    id: "nav-ink",
    target: "[data-tour='nav-ink']",
    title: "Your Ink Balance",
    body: "This is your Ink balance — always visible in the top nav. It updates instantly when you buy or spend Ink.",
    position: "bottom" as const,
  },
  {
    id: "nav-stories",
    target: "[data-tour='nav-stories']",
    title: "Browse All Stories",
    body: "Jump to the full story library here. Filter by genre, sort by newest, or search by title, author, or badge.",
    position: "bottom" as const,
  },
  {
    id: "nav-authors",
    target: "[data-tour='nav-authors']",
    title: "Author Directory",
    body: "Discover the writers behind the stories. Read their bios, explore their work, and tip them directly with Ink.",
    position: "bottom" as const,
  },
  {
    id: "ink-wallet",
    target: "[data-tour='ink-wallet']",
    title: "Reader Ink Wallet",
    body: "Buy Ink packs here using Stripe — secure and instant. Packs start at $1. Your Ink is credited automatically after purchase.",
    position: "top" as const,
  },
  {
    id: "featured-stories",
    target: "[data-tour='featured-stories']",
    title: "Featured Stories",
    body: "These are hand-picked stories from TTL authors. Click any card to open the reader — use Ink to unlock the full chapter.",
    position: "top" as const,
  },
  {
    id: "page-chat",
    target: "[data-tour='page-chat']",
    title: "Meet Page 📖",
    body: "Page is your AI Reading Guide. Ask anything — how Ink works, story recommendations, genre help, or how to support authors.",
    position: "top" as const,
    isFinal: true,
  },
];

// =============================================================
// Global trigger — call this from anywhere to start the tour
// =============================================================
export function startTour() {
  window.dispatchEvent(new CustomEvent("ttl-start-tour"));
}

// =============================================================
// Spotlight helpers
// =============================================================
type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getRect(selector: string): SpotlightRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function TooltipBox({
  step,
  rect,
  current,
  total,
  onNext,
  onSkip,
}: {
  step: (typeof SPOTLIGHT_STEPS)[0];
  rect: SpotlightRect;
  current: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const PAD = 16;
  const TIP_W = 300;
  const TIP_H = 160;

  let top = 0;
  let left = rect.left + rect.width / 2 - TIP_W / 2;

  if (step.position === "bottom") {
    top = rect.top + rect.height + PAD;
  } else {
    top = rect.top - TIP_H - PAD;
  }

  // clamp to viewport
  left = Math.max(12, Math.min(left, window.innerWidth - TIP_W - 12));
  top = Math.max(12, top);

  return (
    <div
      style={{
        position: "fixed",
        top,
        left,
        width: TIP_W,
        zIndex: 10002,
        background: "#111",
        border: "1px solid rgba(201,168,76,0.45)",
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.8), 0 0 24px rgba(201,168,76,0.15)",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* gold top line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "14px 14px 0 0", background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />

      <div style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(201,168,76,0.6)", marginBottom: 6 }}>
        Step {current} of {total}
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#E2C97E", marginBottom: 6, lineHeight: 1.3 }}>{step.title}</p>
      <p style={{ fontSize: 12, color: "rgba(232,228,218,0.7)", lineHeight: 1.65, marginBottom: 14 }}>{step.body}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          onClick={onSkip}
          style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Skip tour
        </button>
        <button
          type="button"
          onClick={onNext}
          style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
            background: "linear-gradient(135deg, #C9A84C, #8a6510)", color: "#000",
            border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer",
          }}
        >
          {step.isFinal ? "Done! 🎉" : "Next →"}
        </button>
      </div>
    </div>
  );
}

// =============================================================
// Main component
// =============================================================
export default function WelcomeTour() {
  const [phase, setPhase] = useState<"idle" | "modal" | "spotlight">("idle");
  const [modalSlide, setModalSlide] = useState(0);
  const [spotStep, setSpotStep] = useState(0);
  const [spotRect, setSpotRect] = useState<SpotlightRect | null>(null);

  // Auto-start on first visit
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      setTimeout(() => setPhase("modal"), 1200);
    }
  }, []);

  // Listen for manual trigger
  useEffect(() => {
    const handler = () => {
      setModalSlide(0);
      setSpotStep(0);
      setPhase("modal");
    };
    window.addEventListener("ttl-start-tour", handler);
    return () => window.removeEventListener("ttl-start-tour", handler);
  }, []);

  // Update spotlight rect when step changes
  useEffect(() => {
    if (phase !== "spotlight") return;
    const step = SPOTLIGHT_STEPS[spotStep];
    if (!step) return;

    const update = () => {
      const rect = getRect(step.target);
      if (rect) {
        setSpotRect(rect);
        // scroll element into view
        const el = document.querySelector(step.target);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // element not found — skip to next
        handleSpotNext();
      }
    };

    const timer = setTimeout(update, 350);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [phase, spotStep]);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setPhase("idle");
    setSpotRect(null);
  }, []);

  const handleModalNext = () => {
    if (modalSlide < MODAL_SLIDES.length - 1) {
      setModalSlide((s) => s + 1);
    } else {
      // transition to spotlight
      setPhase("spotlight");
      setSpotStep(0);
    }
  };

  const handleSpotNext = () => {
    if (spotStep < SPOTLIGHT_STEPS.length - 1) {
      setSpotStep((s) => s + 1);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => completeTour();

  if (phase === "idle") return null;

  return (
    <>
      <style>{TOUR_STYLES}</style>

      {/* ── MODAL PHASE ── */}
      {phase === "modal" && (
        <div className="ttl-tour-overlay">
          <div className="ttl-tour-modal">
            <div className="ttl-tour-modal-top-line" />

            {/* Progress dots */}
            <div className="ttl-tour-dots">
              {MODAL_SLIDES.map((_, i) => (
                <div key={i} className={`ttl-tour-dot ${i === modalSlide ? "ttl-tour-dot-active" : ""}`} />
              ))}
            </div>

            {/* Slide content */}
            <div className="ttl-tour-slide">
              <div className="ttl-tour-emoji">{MODAL_SLIDES[modalSlide].emoji}</div>
              <p className="ttl-tour-eyebrow">{MODAL_SLIDES[modalSlide].subtitle}</p>
              <h2 className="ttl-tour-title">{MODAL_SLIDES[modalSlide].title}</h2>
              <p className="ttl-tour-body">{MODAL_SLIDES[modalSlide].body}</p>
              {MODAL_SLIDES[modalSlide].highlight && (
                <div className="ttl-tour-highlight">
                  <span>💡</span>
                  <span>{MODAL_SLIDES[modalSlide].highlight}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="ttl-tour-modal-footer">
              <button type="button" onClick={handleSkip} className="ttl-tour-skip">
                Skip tour
              </button>
              <button type="button" onClick={handleModalNext} className="ttl-tour-cta">
                {MODAL_SLIDES[modalSlide].cta}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SPOTLIGHT PHASE ── */}
      {phase === "spotlight" && spotRect && (
        <>
          {/* Dark overlay with cutout */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              pointerEvents: "none",
            }}
          >
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={spotRect.left - 8}
                    y={spotRect.top - 8}
                    width={spotRect.width + 16}
                    height={spotRect.height + 16}
                    rx={12}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.78)"
                mask="url(#spotlight-mask)"
              />
              {/* Gold border around spotlight */}
              <rect
                x={spotRect.left - 8}
                y={spotRect.top - 8}
                width={spotRect.width + 16}
                height={spotRect.height + 16}
                rx={12}
                fill="none"
                stroke="#C9A84C"
                strokeWidth={2}
                opacity={0.8}
              />
            </svg>
          </div>

          {/* Tooltip */}
          <TooltipBox
            step={SPOTLIGHT_STEPS[spotStep]}
            rect={spotRect}
            current={spotStep + 1}
            total={SPOTLIGHT_STEPS.length}
            onNext={handleSpotNext}
            onSkip={handleSkip}
          />
        </>
      )}

      {/* Spotlight — waiting for element */}
      {phase === "spotlight" && !spotRect && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.1em" }}>
            Loading tour…
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================
// Styles
// =============================================================
const TOUR_STYLES = `
  .ttl-tour-overlay {
    position: fixed;
    inset: 0;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(10px);
    animation: ttl-tour-fadein 0.35s ease;
  }

  @keyframes ttl-tour-fadein {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .ttl-tour-modal {
    position: relative;
    width: 100%;
    max-width: 480px;
    background: #111;
    border: 1px solid rgba(201,168,76,0.35);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.9), 0 0 60px rgba(201,168,76,0.1);
    animation: ttl-tour-slidein 0.35s cubic-bezier(0.34,1.56,0.64,1);
    font-family: 'Syne', sans-serif;
  }

  @keyframes ttl-tour-slidein {
    from { transform: translateY(24px) scale(0.96); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  .ttl-tour-modal-top-line {
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }

  .ttl-tour-dots {
    display: flex;
    gap: 6px;
    justify-content: center;
    padding: 20px 24px 0;
  }

  .ttl-tour-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.15);
    transition: all 0.25s;
  }

  .ttl-tour-dot-active {
    width: 24px;
    background: #C9A84C;
  }

  .ttl-tour-slide {
    padding: 28px 32px 8px;
    text-align: center;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .ttl-tour-emoji {
    font-size: 52px;
    margin-bottom: 16px;
    animation: ttl-tour-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1);
  }

  @keyframes ttl-tour-bounce {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .ttl-tour-eyebrow {
    font-size: 9px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(201,168,76,0.6);
    margin-bottom: 10px;
  }

  .ttl-tour-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 34px;
    font-weight: 300;
    color: #f0ece2;
    line-height: 1.1;
    margin-bottom: 14px;
    white-space: pre-line;
  }

  .ttl-tour-body {
    font-size: 13px;
    color: rgba(232,228,218,0.65);
    line-height: 1.75;
    max-width: 360px;
    margin-bottom: 16px;
  }

  .ttl-tour-highlight {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 12px;
    color: rgba(232,228,218,0.7);
    line-height: 1.6;
    text-align: left;
    max-width: 360px;
  }

  .ttl-tour-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px 28px;
    border-top: 1px solid rgba(255,255,255,0.06);
    margin-top: 8px;
  }

  .ttl-tour-skip {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.28);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }

  .ttl-tour-skip:hover { color: rgba(255,255,255,0.55); }

  .ttl-tour-cta {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    letter-spacing: 0.14em;
    font-weight: 700;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    color: #000;
    border: none;
    border-radius: 10px;
    padding: 12px 28px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
  }

  .ttl-tour-cta:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    .ttl-tour-modal { border-radius: 16px; }
    .ttl-tour-slide { padding: 20px 24px 8px; min-height: 240px; }
    .ttl-tour-title { font-size: 28px; }
    .ttl-tour-modal-footer { padding: 16px 24px 24px; }
  }
`;

// =============================================================
// HOW TO ADD THE TOUR TRIGGER BUTTON
// =============================================================
// In any page or component, add this to replay the tour:
//
//   import { startTour } from "@/app/components/WelcomeTour";
//
//   <button onClick={startTour}>Take the Tour</button>
//
// =============================================================
// HOW TO ADD DATA-TOUR ATTRIBUTES TO YOUR PAGES
// =============================================================
// The spotlight tour looks for elements with data-tour attributes.
// Add these to the matching elements in your pages:
//
// In your navbar (ReadingRoomPage.tsx or layout):
//   Ink balance div   → add data-tour="nav-ink"
//   All Stories link  → add data-tour="nav-stories"
//   Authors link      → add data-tour="nav-authors"
//
// In ReadingRoomPage.tsx:
//   Ink wallet section → add data-tour="ink-wallet"
//   Featured Stories   → add data-tour="featured-stories"
//
// In PageChatWidget.tsx:
//   The FAB button     → add data-tour="page-chat"
//
// =============================================================
