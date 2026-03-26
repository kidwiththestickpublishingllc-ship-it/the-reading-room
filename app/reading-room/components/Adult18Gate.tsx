"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// Adult18Gate — Fixed
// app/reading-room/components/Adult18Gate.tsx
// =========================

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
  .ag-wrap { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; background: #080305; }
  .ag-card { width: 100%; max-width: 520px; background: #0f0608; border: 1px solid rgba(201,68,68,0.3); border-radius: 12px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(180,30,30,0.1); }
  .ag-top { height: 3px; background: linear-gradient(90deg, transparent, #c84444, #ff6666, #c84444, transparent); }
  .ag-body { padding: 40px; }
  .ag-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 24px; }
  .ag-eyebrow { font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(248,113,113,0.7); display: block; text-align: center; margin-bottom: 10px; }
  .ag-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: #f0ece2; text-align: center; margin-bottom: 14px; line-height: 1.1; }
  .ag-sub { font-family: 'Syne', sans-serif; font-size: 12px; color: rgba(232,228,218,0.5); text-align: center; line-height: 1.75; margin-bottom: 28px; }
  .ag-rules { background: #161616; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .ag-rules-title { font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(248,113,113,0.65); margin-bottom: 12px; display: block; }
  .ag-rule { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }
  .ag-rule:last-child { margin-bottom: 0; }
  .ag-rule-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(248,113,113,0.5); flex-shrink: 0; margin-top: 6px; }
  .ag-rule-text { font-family: 'Syne', sans-serif; font-size: 11px; color: rgba(232,228,218,0.5); line-height: 1.6; }
  .ag-rule-text strong { color: #f0ece2; font-weight: 500; }
  .ag-hard-line { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; }
  .ag-hard-line-text { font-family: 'Syne', sans-serif; font-size: 11px; color: rgba(248,113,113,0.9); line-height: 1.65; text-align: center; }
  .ag-field { margin-bottom: 16px; }
  .ag-label { font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(232,228,218,0.25); display: block; margin-bottom: 7px; }
  .ag-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 11px 14px; font-family: 'Syne', sans-serif; font-size: 13px; color: #f0ece2; outline: none; transition: border-color 0.2s; }
  .ag-input:focus { border-color: rgba(201,168,76,0.4); }
  .ag-input::placeholder { color: rgba(232,228,218,0.2); }
  .ag-checkbox-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 16px; cursor: pointer; }
  .ag-checkbox { width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.12); background: transparent; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #C9A84C; margin-top: 1px; transition: all 0.2s; }
  .ag-checkbox.checked { border-color: rgba(201,168,76,0.5); background: rgba(201,168,76,0.1); }
  .ag-checkbox-label { font-family: 'Syne', sans-serif; font-size: 11px; color: rgba(232,228,218,0.5); line-height: 1.65; }
  .ag-checkbox-label strong { color: #f0ece2; }
  .ag-btn-primary { width: 100%; font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; color: #000; background: linear-gradient(135deg, #C9A84C, #8a6510); border: none; padding: 14px; border-radius: 6px; cursor: pointer; transition: opacity 0.2s; margin-bottom: 10px; }
  .ag-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .ag-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
  .ag-btn-ghost { width: 100%; font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(232,228,218,0.35); background: transparent; border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; }
  .ag-btn-ghost:hover { color: rgba(232,228,218,0.6); border-color: rgba(255,255,255,0.15); }
  .ag-error { font-family: 'Syne', sans-serif; font-size: 11px; color: #f87171; padding: 9px 12px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: 5px; margin-top: 12px; margin-bottom: 8px; }
  .ag-success { text-align: center; padding: 8px 0; }
  .ag-success-icon { font-size: 40px; display: block; margin-bottom: 16px; }
  .ag-success-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: #f0ece2; margin-bottom: 8px; }
  .ag-success-sub { font-family: 'Syne', sans-serif; font-size: 12px; color: rgba(232,228,218,0.4); line-height: 1.7; margin-bottom: 24px; }
  .ag-back-link { font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(232,228,218,0.25); text-decoration: none; display: block; text-align: center; margin-top: 16px; transition: color 0.2s; }
  .ag-back-link:hover { color: rgba(232,228,218,0.5); }
  .ag-or { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
  .ag-or-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
  .ag-or-text { font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.14em; color: rgba(232,228,218,0.25); }
`;

const RULES = [
  { text: <><strong>Adults only.</strong> All characters in sexual or romantic situations must be explicitly 18+. No ambiguous ages.</> },
  { text: <><strong>No minors.</strong> Zero depictions of minors in sexual, romantic, or suggestive contexts. Absolute hard line.</> },
  { text: <><strong>Explicit content between adults</strong> — sexual, violent, and dark themes are permitted.</> },
  { text: <><strong>Strong language, graphic violence, dark themes</strong> including trauma and addiction are all permitted.</> },
];

export default function Adult18Gate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "open" | "gate" | "login" | "register" | "verify" | "success">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed18, setConfirmed18] = useState(false);
  const [confirmedRules, setConfirmedRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { checkAccess(); }, []);

  async function checkAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("gate"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_age_verified")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.is_age_verified) {
        setStatus("open");
      } else {
        setStatus("verify");
      }
    } catch {
      setStatus("gate");
    }
  }

  async function handleLogin() {
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      await checkAccess();
    } catch (err: any) {
      setError(err.message ?? "Login failed. Check your email and password.");
    }
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;
      if (data.user) {
        // Try to create profile — don't fail if it already exists
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          is_age_verified: false,
          role: "reader",
          ink_balance: 250,
        }, { onConflict: "id" });
      }
      setStatus("verify");
    } catch (err: any) {
      setError(err.message ?? "Registration failed. Try again.");
    }
    setLoading(false);
  }

  async function handleVerify() {
    setLoading(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const { error: err } = await supabase.from("profiles").upsert({
        id: session.user.id,
        email: session.user.email,
        is_age_verified: true,
        age_verified_at: new Date().toISOString(),
        role: "reader",
        ink_balance: 250,
      }, { onConflict: "id" });

      if (err) throw err;
      setStatus("success");
      setTimeout(() => setStatus("open"), 2000);
    } catch (err: any) {
      setError(err.message ?? "Verification failed. Please try again.");
    }
    setLoading(false);
  }

  // ── ACCESS GRANTED ──
  if (status === "open") return <>{children}</>;

  // ── CHECKING ──
  if (status === "checking") return (
    <><style>{STYLES}</style>
    <div className="ag-wrap" style={{ minHeight: "40vh" }} /></>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ag-wrap">
        <div className="ag-card">
          <div className="ag-top" />
          <div className="ag-body">

            {/* GATE */}
            {status === "gate" && (
              <>
                <div className="ag-icon">🔞</div>
                <span className="ag-eyebrow">The Tiniest Library — Adult Content</span>
                <div className="ag-title">Adult 18+ Section</div>
                <p className="ag-sub">This section contains explicit content for verified adults only. A free TTL account with age confirmation is required to access this genre.</p>
                <div className="ag-rules">
                  <span className="ag-rules-title">This section may contain</span>
                  {RULES.map((r, i) => (
                    <div key={i} className="ag-rule">
                      <div className="ag-rule-dot" />
                      <span className="ag-rule-text">{r.text}</span>
                    </div>
                  ))}
                </div>
                <div className="ag-hard-line">
                  <p className="ag-hard-line-text"><strong style={{ color: "#f87171" }}>Zero tolerance:</strong> Content depicting minors in any sexual or romantic context results in immediate permanent account termination.</p>
                </div>
                <button className="ag-btn-primary" onClick={() => setStatus("login")}>I Am 18+ — Sign In →</button>
                <button className="ag-btn-ghost" onClick={() => setStatus("register")}>Create a Free TTL Account</button>
                <a href="/reading-room" className="ag-back-link">← Back to Reading Room</a>
              </>
            )}

            {/* LOGIN */}
            {status === "login" && (
              <>
                <span className="ag-eyebrow">Age Verification — Sign In</span>
                <div className="ag-title">Sign In to Continue</div>
                <p className="ag-sub">Use your TTL account to access the Adult 18+ section.</p>
                <div className="ag-field">
                  <label className="ag-label">Email</label>
                  <input className="ag-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="your@email.com" autoComplete="email" />
                </div>
                <div className="ag-field">
                  <label className="ag-label">Password</label>
                  <input className="ag-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Your password" autoComplete="current-password" />
                </div>
                {error && <div className="ag-error">{error}</div>}
                <button className="ag-btn-primary" style={{ marginTop: 16 }} disabled={loading || !email || !password} onClick={handleLogin}>
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
                <div className="ag-or"><div className="ag-or-line" /><span className="ag-or-text">or</span><div className="ag-or-line" /></div>
                <button className="ag-btn-ghost" onClick={() => { setStatus("register"); setError(""); }}>Create a Free Account</button>
                <button className="ag-btn-ghost" onClick={() => { setStatus("gate"); setError(""); }}>← Back</button>
              </>
            )}

            {/* REGISTER */}
            {status === "register" && (
              <>
                <span className="ag-eyebrow">Age Verification — New Account</span>
                <div className="ag-title">Create Your TTL Account</div>
                <p className="ag-sub">Free to join. Unlock stories, tip authors, and access age-verified content.</p>
                <div className="ag-field">
                  <label className="ag-label">Email</label>
                  <input className="ag-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
                </div>
                <div className="ag-field">
                  <label className="ag-label">Password (min 6 characters)</label>
                  <input className="ag-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" autoComplete="new-password" />
                </div>
                {error && <div className="ag-error">{error}</div>}
                <button className="ag-btn-primary" style={{ marginTop: 16 }} disabled={loading || !email || password.length < 6} onClick={handleRegister}>
                  {loading ? "Creating account…" : "Create Account →"}
                </button>
                <div className="ag-or"><div className="ag-or-line" /><span className="ag-or-text">or</span><div className="ag-or-line" /></div>
                <button className="ag-btn-ghost" onClick={() => { setStatus("login"); setError(""); }}>Already have an account? Sign in</button>
                <button className="ag-btn-ghost" onClick={() => { setStatus("gate"); setError(""); }}>← Back</button>
              </>
            )}

            {/* VERIFY */}
            {status === "verify" && (
              <>
                <div className="ag-icon">🔞</div>
                <span className="ag-eyebrow">One Last Step</span>
                <div className="ag-title">Confirm Your Age</div>
                <p className="ag-sub">Before accessing Adult 18+ content, confirm your age and agree to the content guidelines. This is saved to your account permanently.</p>
                <div className="ag-rules" style={{ marginBottom: 16 }}>
                  <span className="ag-rules-title">This section may contain</span>
                  {RULES.map((r, i) => (
                    <div key={i} className="ag-rule">
                      <div className="ag-rule-dot" />
                      <span className="ag-rule-text">{r.text}</span>
                    </div>
                  ))}
                </div>
                <div className="ag-hard-line" style={{ marginBottom: 20 }}>
                  <p className="ag-hard-line-text"><strong style={{ color: "#f87171" }}>Zero tolerance:</strong> Any content depicting minors in sexual or romantic contexts = immediate permanent ban and reporting.</p>
                </div>
                <div className="ag-checkbox-row" onClick={() => setConfirmed18(v => !v)}>
                  <div className={`ag-checkbox${confirmed18 ? " checked" : ""}`}>{confirmed18 ? "✓" : ""}</div>
                  <span className="ag-checkbox-label"><strong>I confirm I am 18 years of age or older.</strong> I understand that providing false information may violate applicable laws.</span>
                </div>
                <div className="ag-checkbox-row" onClick={() => setConfirmedRules(v => !v)}>
                  <div className={`ag-checkbox${confirmedRules ? " checked" : ""}`}>{confirmedRules ? "✓" : ""}</div>
                  <span className="ag-checkbox-label"><strong>I have read and agree to the Adult 18+ content guidelines</strong> including the absolute prohibition on content involving minors.</span>
                </div>
                {error && <div className="ag-error">{error}</div>}
                <button className="ag-btn-primary" disabled={!confirmed18 || !confirmedRules || loading} onClick={handleVerify}>
                  {loading ? "Verifying…" : "Confirm & Enter Adult 18+ →"}
                </button>
                <a href="/reading-room" className="ag-back-link">← Back to Reading Room</a>
              </>
            )}

            {/* SUCCESS */}
            {status === "success" && (
              <div className="ag-success">
                <span className="ag-success-icon">✓</span>
                <div className="ag-success-title">Age Verified</div>
                <p className="ag-success-sub">Your account is verified. You now have permanent access to the Adult 18+ section.</p>
                <p style={{ fontSize: 11, color: "rgba(232,228,218,0.25)" }}>Loading content…</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
