"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// Adult18Gate Component
// Drop in: app/reading-room/components/Adult18Gate.tsx
// Usage: Wrap the Adult 18+ genre page content with this component
// Also works as a standalone gate on the genre page
// =========================

type GateState = "checking" | "open" | "needs-login" | "needs-verify";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --gold: #C9A84C; --gold-light: #E2C97E; --gold-dim: rgba(201,168,76,0.35);
    --gold-glow: rgba(201,168,76,0.10); --blue: #6495ED;
    --red: #f87171; --red-dim: rgba(248,113,113,0.12);
    --ink-bg: #080808; --ink-surface: #0f0f0f; --ink-surface2: #161616;
    --ink-border: rgba(255,255,255,0.07); --ink-border-gold: rgba(201,168,76,0.22);
    --text-main: #f0ece2; --text-dim: rgba(232,228,218,0.5);
    --text-faint: rgba(232,228,218,0.25);
  }

  .ag-wrap {
    min-height: 60vh; display: flex; align-items: center;
    justify-content: center; padding: 40px 24px;
  }

  .ag-card {
    width: 100%; max-width: 520px;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border-gold);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 40px 80px rgba(0,0,0,0.6);
  }

  .ag-top {
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--red), #ff4444, var(--red), transparent);
  }

  .ag-body { padding: 40px; }

  .ag-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--red-dim); border: 1px solid rgba(248,113,113,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 24px;
  }

  .ag-eyebrow {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.28em;
    text-transform: uppercase; color: rgba(248,113,113,0.7);
    display: block; text-align: center; margin-bottom: 10px;
  }

  .ag-title {
    font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300;
    color: var(--text-main); text-align: center; margin-bottom: 14px; line-height: 1.1;
  }

  .ag-sub {
    font-family: 'Syne', sans-serif; font-size: 12px; color: var(--text-dim);
    text-align: center; line-height: 1.75; margin-bottom: 28px;
  }

  .ag-rules {
    background: var(--ink-surface2); border: 1px solid var(--ink-border);
    border-radius: 8px; padding: 20px; margin-bottom: 24px;
  }

  .ag-rules-title {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.22em;
    text-transform: uppercase; color: rgba(248,113,113,0.65);
    margin-bottom: 12px; display: block;
  }

  .ag-rule {
    display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;
  }
  .ag-rule:last-child { margin-bottom: 0; }

  .ag-rule-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(248,113,113,0.5); flex-shrink: 0; margin-top: 6px;
  }

  .ag-rule-text {
    font-family: 'Syne', sans-serif; font-size: 11px; color: var(--text-dim);
    line-height: 1.6;
  }

  .ag-rule-text strong { color: var(--text-main); font-weight: 500; }

  .ag-hard-line {
    background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
    border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;
  }

  .ag-hard-line-text {
    font-family: 'Syne', sans-serif; font-size: 11px; color: rgba(248,113,113,0.9);
    line-height: 1.65; text-align: center;
  }

  /* FORM */
  .ag-field { margin-bottom: 16px; }
  .ag-label {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--text-faint); display: block; margin-bottom: 7px;
  }
  .ag-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid var(--ink-border); border-radius: 6px;
    padding: 11px 14px; font-family: 'Syne', sans-serif;
    font-size: 13px; color: var(--text-main); outline: none;
    transition: border-color 0.2s;
  }
  .ag-input:focus { border-color: var(--gold-dim); }
  .ag-input::placeholder { color: var(--text-faint); }

  .ag-checkbox-row {
    display: flex; gap: 10px; align-items: flex-start;
    margin-bottom: 20px; cursor: pointer;
  }
  .ag-checkbox {
    width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0;
    border: 1px solid var(--ink-border); background: transparent;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--gold); margin-top: 1px;
    transition: all 0.2s; cursor: pointer;
  }
  .ag-checkbox.checked { border-color: var(--gold-dim); background: var(--gold-glow); }
  .ag-checkbox-label {
    font-family: 'Syne', sans-serif; font-size: 11px; color: var(--text-dim);
    line-height: 1.65;
  }
  .ag-checkbox-label strong { color: var(--text-main); }

  /* BUTTONS */
  .ag-btn-primary {
    width: 100%; font-family: 'Syne', sans-serif; font-size: 10px;
    letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700;
    color: #000; background: linear-gradient(135deg, var(--gold), #8a6510);
    border: none; padding: 14px; border-radius: 6px;
    cursor: pointer; transition: opacity 0.2s; margin-bottom: 10px;
  }
  .ag-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .ag-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .ag-btn-ghost {
    width: 100%; font-family: 'Syne', sans-serif; font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-faint); background: transparent;
    border: 1px solid var(--ink-border); padding: 12px; border-radius: 6px;
    cursor: pointer; transition: all 0.2s;
  }
  .ag-btn-ghost:hover { color: var(--text-dim); border-color: rgba(255,255,255,0.15); }

  .ag-divider {
    height: 1px; background: var(--ink-border); margin: 20px 0;
    display: flex; align-items: center; justify-content: center;
  }
  .ag-divider-text {
    font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.14em;
    color: var(--text-faint); background: var(--ink-surface); padding: 0 12px;
  }

  .ag-error {
    font-family: 'Syne', sans-serif; font-size: 11px; color: var(--red);
    padding: 9px 12px; background: var(--red-dim);
    border: 1px solid rgba(248,113,113,0.25); border-radius: 5px; margin-top: 10px;
  }

  .ag-success {
    text-align: center; padding: 8px 0;
  }
  .ag-success-icon {
    font-size: 40px; display: block; margin-bottom: 16px;
  }
  .ag-success-title {
    font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300;
    color: var(--text-main); margin-bottom: 8px;
  }
  .ag-success-sub {
    font-family: 'Syne', sans-serif; font-size: 12px; color: var(--text-dim);
    line-height: 1.7; margin-bottom: 24px;
  }

  .ag-back-link {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--text-faint); text-decoration: none;
    display: block; text-align: center; margin-top: 16px; transition: color 0.2s;
  }
  .ag-back-link:hover { color: var(--text-dim); }
`;

const CONTENT_RULES = [
  { text: <><strong>Adults only.</strong> All characters in sexual or romantic situations must be explicitly 18 or older. No ambiguous ages — when in doubt, write them older.</> },
  { text: <><strong>No minors.</strong> Absolutely zero depictions of minors in sexual, romantic, or suggestive contexts. This is a hard line with zero tolerance.</> },
  { text: <><strong>Consensual framing.</strong> Non-consensual scenarios must be clearly framed as wrong within the narrative. Glorification of sexual violence is not permitted.</> },
  { text: <><strong>Explicit content between adults</strong> — sexual, violent, and dark themes are permitted and welcome in this section.</> },
  { text: <><strong>Strong language, graphic violence, and dark themes</strong> including abuse, trauma, and addiction are all permitted in Adult 18+.</> },
];

export default function Adult18Gate({ children }: { children: React.ReactNode }) {
  const [gateState, setGateState] = useState<GateState>("checking");
  const [mode, setMode] = useState<"gate" | "login" | "register" | "verify" | "success">("gate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed18, setConfirmed18] = useState(false);
  const [confirmedRules, setConfirmedRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setGateState("needs-login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_age_verified")
      .eq("id", session.user.id)
      .single();

    if (profile?.is_age_verified) {
      setGateState("open");
    } else {
      setGateState("needs-verify");
      setMode("verify");
    }
  }

  async function handleLogin() {
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    await checkAccess();
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    // Create profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").upsert({
        id: session.user.id,
        email: session.user.email,
        is_age_verified: false,
      });
    }
    setMode("verify");
    setLoading(false);
  }

  async function handleVerify() {
    setLoading(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Session expired. Please log in again."); setLoading(false); return; }

    const { error: err } = await supabase.from("profiles").upsert({
      id: session.user.id,
      email: session.user.email,
      is_age_verified: true,
      age_verified_at: new Date().toISOString(),
    });

    if (err) { setError(err.message); setLoading(false); return; }
    setMode("success");
    setLoading(false);
    setTimeout(() => setGateState("open"), 2000);
  }

  // Access granted — render children
  if (gateState === "open") return <>{children}</>;

  // Checking
  if (gateState === "checking") return (
    <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{STYLES}</style>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ag-wrap">
        <div className="ag-card">
          <div className="ag-top" />
          <div className="ag-body">

            {/* ── GATE SCREEN ── */}
            {mode === "gate" && (
              <>
                <div className="ag-icon">🔞</div>
                <span className="ag-eyebrow">The Tiniest Library — Adult Content</span>
                <div className="ag-title">Adult 18+ Section</div>
                <p className="ag-sub">
                  This section contains explicit content intended for adults only. You must be 18 or older to access this genre. A free TTL account with age verification is required.
                </p>
                <div className="ag-rules">
                  <span className="ag-rules-title">Content in this section may include</span>
                  {CONTENT_RULES.map((r, i) => (
                    <div key={i} className="ag-rule">
                      <div className="ag-rule-dot" />
                      <span className="ag-rule-text">{r.text}</span>
                    </div>
                  ))}
                </div>
                <div className="ag-hard-line">
                  <p className="ag-hard-line-text">
                    <strong style={{ color: "#f87171" }}>Absolute hard line:</strong> Any content depicting minors in sexual, romantic, or suggestive contexts results in immediate permanent removal and account termination.
                  </p>
                </div>
                <button className="ag-btn-primary" onClick={() => setMode("login")}>
                  I Am 18+ — Sign In to Continue →
                </button>
                <button className="ag-btn-ghost" onClick={() => setMode("register")}>
                  Create a Free Account
                </button>
                <a href="/reading-room" className="ag-back-link">← Back to Reading Room</a>
              </>
            )}

            {/* ── LOGIN ── */}
            {mode === "login" && (
              <>
                <span className="ag-eyebrow">Age Verification — Sign In</span>
                <div className="ag-title">Welcome Back</div>
                <p className="ag-sub">Sign in to your TTL account to access the Adult 18+ section.</p>
                <div className="ag-field">
                  <label className="ag-label">Email</label>
                  <input className="ag-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="your@email.com" />
                </div>
                <div className="ag-field">
                  <label className="ag-label">Password</label>
                  <input className="ag-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Your password" />
                </div>
                {error && <div className="ag-error">{error}</div>}
                <button className="ag-btn-primary" style={{ marginTop: 16 }} disabled={loading || !email || !password} onClick={handleLogin}>
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
                <div style={{ height: 1, background: "var(--ink-border)", margin: "16px 0", position: "relative" }}>
                  <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--ink-surface)", padding: "0 12px", fontSize: 9, letterSpacing: "0.14em", color: "var(--text-faint)" }}>OR</span>
                </div>
                <button className="ag-btn-ghost" onClick={() => setMode("register")}>Create a Free Account</button>
                <button className="ag-btn-ghost" style={{ marginTop: 8 }} onClick={() => setMode("gate")}>← Back</button>
              </>
            )}

            {/* ── REGISTER ── */}
            {mode === "register" && (
              <>
                <span className="ag-eyebrow">Age Verification — Create Account</span>
                <div className="ag-title">Create Your TTL Account</div>
                <p className="ag-sub">Free to join. Your account lets you unlock stories, tip authors, and access age-restricted content.</p>
                <div className="ag-field">
                  <label className="ag-label">Email</label>
                  <input className="ag-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>
                <div className="ag-field">
                  <label className="ag-label">Password</label>
                  <input className="ag-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
                {error && <div className="ag-error">{error}</div>}
                <button className="ag-btn-primary" style={{ marginTop: 16 }} disabled={loading || !email || password.length < 6} onClick={handleRegister}>
                  {loading ? "Creating account…" : "Create Account →"}
                </button>
                <button className="ag-btn-ghost" style={{ marginTop: 8 }} onClick={() => setMode("login")}>Already have an account? Sign in</button>
                <button className="ag-btn-ghost" style={{ marginTop: 8 }} onClick={() => setMode("gate")}>← Back</button>
              </>
            )}

            {/* ── AGE VERIFY ── */}
            {mode === "verify" && (
              <>
                <div className="ag-icon">🔞</div>
                <span className="ag-eyebrow">One More Step</span>
                <div className="ag-title">Age Verification</div>
                <p className="ag-sub">
                  Before accessing the Adult 18+ section, you must confirm your age and agree to the content guidelines. This is saved to your account — you won't need to do this again.
                </p>

                <div className="ag-rules" style={{ marginBottom: 16 }}>
                  <span className="ag-rules-title">By accessing this section you confirm</span>
                  {CONTENT_RULES.map((r, i) => (
                    <div key={i} className="ag-rule">
                      <div className="ag-rule-dot" />
                      <span className="ag-rule-text">{r.text}</span>
                    </div>
                  ))}
                </div>

                <div className="ag-hard-line" style={{ marginBottom: 20 }}>
                  <p className="ag-hard-line-text">
                    <strong style={{ color: "#f87171" }}>Zero tolerance:</strong> Content depicting minors in sexual, romantic, or suggestive contexts is strictly prohibited and will result in immediate account termination and reporting.
                  </p>
                </div>

                <div className="ag-checkbox-row" onClick={() => setConfirmed18(!confirmed18)}>
                  <div className={`ag-checkbox${confirmed18 ? " checked" : ""}`}>{confirmed18 ? "✓" : ""}</div>
                  <span className="ag-checkbox-label">
                    <strong>I confirm that I am 18 years of age or older.</strong> I understand that providing false information to access age-restricted content may violate applicable laws.
                  </span>
                </div>

                <div className="ag-checkbox-row" onClick={() => setConfirmedRules(!confirmedRules)}>
                  <div className={`ag-checkbox${confirmedRules ? " checked" : ""}`}>{confirmedRules ? "✓" : ""}</div>
                  <span className="ag-checkbox-label">
                    <strong>I have read and agree to the Adult 18+ content guidelines.</strong> I understand the absolute prohibition on content involving minors and accept TTL's right to remove content and terminate accounts for violations.
                  </span>
                </div>

                {error && <div className="ag-error">{error}</div>}

                <button
                  className="ag-btn-primary"
                  disabled={!confirmed18 || !confirmedRules || loading}
                  onClick={handleVerify}
                >
                  {loading ? "Verifying…" : "Confirm & Access Adult 18+ →"}
                </button>

                <a href="/reading-room" className="ag-back-link">← Back to Reading Room</a>
              </>
            )}

            {/* ── SUCCESS ── */}
            {mode === "success" && (
              <div className="ag-success">
                <span className="ag-success-icon">✓</span>
                <div className="ag-success-title">Age Verified</div>
                <p className="ag-success-sub">
                  Your account has been verified. You now have access to the Adult 18+ section. This won't be asked again.
                </p>
                <p style={{ fontSize: 11, color: "var(--text-faint)" }}>Loading content…</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
