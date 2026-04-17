"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  membership_tier: "free" | "gold" | "founding";
  ink_balance: number;
  avatar_url: string | null;
};

type AuthView = "dashboard" | "login" | "signup";

export default function MembersRoom() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      await loadProfile(session.user.id, session.user.email ?? "");
    } catch {
      setLoading(false);
    }
  }

  async function loadProfile(userId: string, userEmail: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        const newProfile: Profile = {
          id: userId,
          email: userEmail,
          full_name: null,
          membership_tier: "free",
          ink_balance: 250,
          avatar_url: null,
        };
        await supabase.from("profiles").insert([{
          id: userId,
          email: userEmail,
          membership_tier: "free",
          ink_balance: 250,
        }]);
        setProfile(newProfile);
      } else {
        setProfile({
          id: data.id,
          email: data.email ?? userEmail,
          full_name: data.full_name ?? null,
          membership_tier: data.membership_tier ?? "free",
          ink_balance: data.ink_balance ?? 250,
          avatar_url: data.avatar_url ?? null,
        });
      }
      setView("dashboard");
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(error.message); return; }
      if (data.session) {
        await loadProfile(data.session.user.id, data.session.user.email ?? "");
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) { setAuthError(error.message); return; }
      if (data.user) {
        await loadProfile(data.user.id, data.user.email ?? "");
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setView("login");
    setEmail("");
    setPassword("");
    setFullName("");
  }

  function getTierBadge(tier: string) {
    if (tier === "founding") return { label: "Founding Member", color: "#C9A84C", bg: "rgba(201,168,76,0.15)", border: "#C9A84C" };
    if (tier === "gold") return { label: "Gold Member", color: "#FFD700", bg: "rgba(255,215,0,0.1)", border: "#FFD700" };
    return { label: "Free Reader", color: "#6495ED", bg: "rgba(100,149,237,0.1)", border: "#6495ED" };
  }

  function getTierInk(tier: string) {
    if (tier === "founding") return "Unlimited Ink access + bonus monthly top-up";
    if (tier === "gold") return "600 Ink bonus on signup + monthly top-up";
    return "250 Ink to start — purchase more anytime";
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a14" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🕯️</div>
          <p style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", animation: "pulse 2s infinite" }}>
            Entering the Members Room...
          </p>
        </div>
      </div>
    );
  }

  if (view === "login" || view === "signup") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🕯️</div>
            <h1 style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: "600", margin: "0 0 8px" }}>
              The Members Room
            </h1>
            <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>
              The Tiniest Library — Members Only
            </p>
          </div>

          <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ display: "flex", marginBottom: "28px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "4px" }}>
              <button
                onClick={() => { setView("login"); setAuthError(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", background: view === "login" ? "rgba(201,168,76,0.2)" : "transparent", color: view === "login" ? "#C9A84C" : "#666", transition: "all 0.2s" }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setView("signup"); setAuthError(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", background: view === "signup" ? "rgba(201,168,76,0.2)" : "transparent", color: view === "signup" ? "#C9A84C" : "#666", transition: "all 0.2s" }}
              >
                Join Free
              </button>
            </div>

            <form onSubmit={view === "login" ? handleLogin : handleSignUp}>
              {view === "signup" && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name"
                    style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {authError && (
                <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
                  <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{ width: "100%", padding: "14px", background: authLoading ? "rgba(201,168,76,0.4)" : "#C9A84C", color: "#1a1a2e", borderRadius: "8px", border: "none", fontSize: "15px", fontWeight: "700", cursor: authLoading ? "not-allowed" : "pointer", transition: "all 0.2s", letterSpacing: "0.5px" }}
              >
                {authLoading ? "Please wait..." : view === "login" ? "Enter the Room" : "Join The Library"}
              </button>
            </form>

            {view === "signup" && (
              <div style={{ marginTop: "24px", padding: "16px", background: "rgba(201,168,76,0.05)", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.1)" }}>
                <p style={{ color: "#C9A84C", fontSize: "12px", fontWeight: "600", margin: "0 0 8px" }}>FREE MEMBERSHIP INCLUDES</p>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>🪙 250 Ink to start reading</p>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 4px" }}>📚 Access to The Reading Room</p>
                <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>🪶 Support writers you love</p>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <a href="/" style={{ color: "#555", fontSize: "13px", textDecoration: "none" }}>← Back to The Tiniest Library</a>
          </div>
        </div>
      </div>
    );
  }

  if (view === "dashboard" && profile) {
    const badge = getTierBadge(profile.membership_tier);
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", color: "#fff", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <p style={{ color: "#666", fontSize: "13px", margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Welcome back</p>
              <h1 style={{ color: "#f0ece2", fontFamily: "'Cormorant Garamond', serif", fontSize: "36px", fontWeight: "600", margin: "0 0 12px" }}>
                {profile.full_name ?? profile.email.split("@")[0]} 🕯️
              </h1>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "99px", background: badge.bg, border: `1px solid ${badge.border}` }}>
                <span style={{ color: badge.color, fontSize: "13px", fontWeight: "600" }}>{badge.label}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div style={{ padding: "12px 20px", background: "rgba(201,168,76,0.1)", borderRadius: "12px", border: "1px solid rgba(201,168,76,0.2)", textAlign: "right" }}>
                <p style={{ color: "#C9A84C", fontSize: "11px", fontWeight: "600", margin: "0 0 2px", letterSpacing: "0.08em" }}>INK BALANCE</p>
                <p style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: 0 }}>🪙 {profile.ink_balance}</p>
              </div>
              <button onClick={handleLogout} style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#666", fontSize: "12px", cursor: "pointer" }}>
                Sign Out
              </button>
            </div>
          </div>

          <div style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "12px", padding: "16px 20px", marginBottom: "32px" }}>
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>🪙 {getTierInk(profile.membership_tier)}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>

            <a href="/reading-room" style={{ textDecoration: "none" }}>
              <div style={{ background: "#111122", border: "1px solid rgba(100,149,237,0.2)", borderRadius: "16px", padding: "28px", cursor: "pointer", transition: "all 0.2s", height: "100%" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>📚</div>
                <h2 style={{ color: "#6495ED", fontSize: "18px", fontWeight: "600", margin: "0 0 8px" }}>The Reading Room</h2>
                <p style={{ color: "#666", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.6" }}>Browse all genres. Unlock stories. Discover your next favorite writer.</p>
                <span style={{ color: "#6495ED", fontSize: "13px", fontWeight: "500" }}>Browse stories →</span>
              </div>
            </a>

            <a href={profile.membership_tier === "free" ? "#upgrade" : "https://redroom.the-tiniest-library.com"} style={{ textDecoration: "none" }}>
              <div style={{ background: "#111122", border: `1px solid ${profile.membership_tier === "free" ? "rgba(255,255,255,0.05)" : "rgba(139,0,0,0.3)"}`, borderRadius: "16px", padding: "28px", cursor: "pointer", transition: "all 0.2s", opacity: profile.membership_tier === "free" ? 0.6 : 1, height: "100%" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>🖤</div>
                <h2 style={{ color: "#8b0000", fontSize: "18px", fontWeight: "600", margin: "0 0 8px" }}>The Red Room</h2>
                <p style={{ color: "#666", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.6" }}>18+ adult fiction. Dark romance, erotica, and more. Gold and Founding members only.</p>
                {profile.membership_tier === "free"
                  ? <span style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "500" }}>Upgrade to unlock →</span>
                  : <span style={{ color: "#8b0000", fontSize: "13px", fontWeight: "500" }}>Enter The Red Room →</span>
                }
              </div>
            </a>

            <a href="https://the-writer-s-room.vercel.app" style={{ textDecoration: "none" }}>
              <div style={{ background: "#111122", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "16px", padding: "28px", cursor: "pointer", transition: "all 0.2s", height: "100%" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>🪶</div>
                <h2 style={{ color: "#C9A84C", fontSize: "18px", fontWeight: "600", margin: "0 0 8px" }}>The Writer's Room</h2>
                <p style={{ color: "#666", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.6" }}>Are you a writer? Apply to publish your stories and build your audience on TTL.</p>
                <span style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "500" }}>Apply to write →</span>
              </div>
            </a>

          </div>

          {profile.membership_tier === "free" && (
            <div id="upgrade" style={{ background: "linear-gradient(135deg, #111122, #1a1a2e)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>👑</div>
              <h2 style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: "600", margin: "0 0 12px" }}>Upgrade Your Membership</h2>
              <p style={{ color: "#888", fontSize: "15px", margin: "0 0 32px", lineHeight: "1.7", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                Unlock The Red Room, earn bonus Ink, and get exclusive access to TTL founding content.
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "12px", padding: "24px 32px", minWidth: "200px" }}>
                  <p style={{ color: "#FFD700", fontSize: "13px", fontWeight: "600", margin: "0 0 8px", letterSpacing: "0.08em" }}>GOLD MEMBER</p>
                  <p style={{ color: "#fff", fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>$5<span style={{ fontSize: "14px", color: "#888" }}>/mo</span></p>
                  <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px" }}>600 Ink + Red Room access</p>
                  <button style={{ width: "100%", padding: "10px", background: "#FFD700", color: "#1a1a2e", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                    Upgrade to Gold
                  </button>
                </div>
                <div style={{ background: "rgba(201,168,76,0.08)", border: "2px solid rgba(201,168,76,0.5)", borderRadius: "12px", padding: "24px 32px", minWidth: "200px", position: "relative" }}>
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#C9A84C", color: "#1a1a2e", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "99px", whiteSpace: "nowrap" }}>FOUNDING MEMBER</div>
                  <p style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "600", margin: "0 0 8px", letterSpacing: "0.08em" }}>LIMITED SPOTS</p>
                  <p style={{ color: "#fff", fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>$10<span style={{ fontSize: "14px", color: "#888" }}>/mo</span></p>
                  <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px" }}>1500 Ink + All access + Badge</p>
                  <button style={{ width: "100%", padding: "10px", background: "#C9A84C", color: "#1a1a2e", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                    Become a Founder
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}
