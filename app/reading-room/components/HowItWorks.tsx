"use client";

type Story = {
  slug: string;
  title: string;
  author: string;
};

interface HowItWorksProps {
  stories: Story[];
}

export default function HowItWorks({ stories }: HowItWorksProps) {
  return (
    <div className="ttl-section" id="how-it-works">
      <div className="ttl-section-header">
        <div>
          <div className="ttl-section-accent">
            <div className="ttl-section-bar" />
            <div>
              <span className="ttl-section-eyebrow">Simple</span>
              <h2 className="ttl-section-title">How it works</h2>
            </div>
          </div>
        </div>
      </div>
      <div className="ttl-divider" />
      <div className="ttl-how-grid">

        {/* Panel 1 — New This Week */}
        <div className="ttl-how-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>New This Week</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#f0ece2" }}>Fresh Stories</div>
          </div>
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {stories.slice(0, 3).map(s => (
              <div key={s.slug} onClick={() => window.location.href = `/reading-room/stories/${s.slug}/chapters/1`} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 36, height: 50, borderRadius: 4, background: "linear-gradient(135deg,#1e1e26,#2a2a38)", border: "1px solid rgba(201,168,76,0.2)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f0ece2", lineHeight: 1.3, marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(232,228,218,0.4)" }}>by {s.author}</div>
                </div>
              </div>
            ))}
            <a href="/reading-room/stories" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C9A84C", textDecoration: "none", marginTop: 4 }}>Browse all →</a>
          </div>
        </div>

        {/* Panel 2 — Readers Are Saying */}
        <div className="ttl-how-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>Community</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#f0ece2" }}>Readers Are Saying</div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { quote: "Fox Vs. The World had me hooked from the first paragraph. Daniel's world-building is something else.", reader: "A. Chen" },
              { quote: "The Body Knows, Breathing Calms is the most honest piece of writing I've read this year.", reader: "M. Torres" },
              { quote: "TTL is what reading online should feel like. Clean, beautiful, and full of real voices.", reader: "R. Osei" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: "italic", color: "rgba(240,236,226,0.75)", lineHeight: 1.6, marginBottom: 6 }}>"{r.quote}"</div>
                <div style={{ fontSize: 10, color: "rgba(232,228,218,0.35)", letterSpacing: "0.1em" }}>— {r.reader}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3 — Now Reading ticker */}
        <div className="ttl-how-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>Live</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#f0ece2" }}>Now Reading</div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ overflow: "hidden", position: "relative", height: 200 }}>
              <style>{`
                @keyframes scrollUp {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(-50%); }
                }
                .now-reading-scroll { animation: scrollUp 12s linear infinite; }
                .now-reading-scroll:hover { animation-play-state: paused; }
              `}</style>
              <div className="now-reading-scroll">
                {[...stories, ...stories].map((s, i) => (
                  <div key={i} onClick={() => window.location.href = `/reading-room/stories/${s.slug}/chapters/1`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0, boxShadow: "0 0 6px #4ade80" }} />
                    <div style={{ fontSize: 12, color: "rgba(240,236,226,0.7)", lineHeight: 1.3 }}>
                      <span style={{ color: "#f0ece2", fontWeight: 600 }}>{s.title}</span>
                      <span style={{ color: "rgba(232,228,218,0.35)", fontSize: 10 }}> · {s.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 10, color: "rgba(232,228,218,0.3)", letterSpacing: "0.08em" }}>
              🟢 Readers active now
            </div>
          </div>
        </div>

      </div>
      <div className="ttl-hero-actions">
        <a href="/members" className="ttl-btn-primary">Go to Members Room →</a>
        <span className="ttl-btn-ghost" style={{ cursor: 'default' }}>Payments by Stripe</span>
      </div>
    </div>
  );
}