"use client";

/**
 * InkwellPage.tsx
 * ─────────────────────────────────────────────────────────────────
 * The Inkwell — dedicated Ink wallet page.
 * Shows: current balance, purchase history, how Ink was spent,
 * tips given to authors, Reader's Letters sent, and buy more Ink.
 *
 * Place at: app/reading-room/inkwell/page.tsx
 *
 * Also add a link to the nav: /reading-room/inkwell
 *
 * TABLES USED (existing + new):
 *  - ink_purchases  (existing)
 *  - chapter_unlocks (existing)
 *  - reader_letters (new — from ReadersLetter.tsx)
 *
 * NEW TABLE NEEDED:
 * create table if not exists ink_tips (
 *   id uuid primary key default gen_random_uuid(),
 *   tipper_id uuid references auth.users not null,
 *   writer_id uuid not null,
 *   writer_name text not null,
 *   amount int not null,
 *   story_slug text,
 *   created_at timestamptz default now()
 * );
 * alter table ink_tips enable row level security;
 * create policy "users see own tips"
 *   on ink_tips for select using (auth.uid() = tipper_id);
 * create policy "users can tip"
 *   on ink_tips for insert with check (auth.uid() = tipper_id);
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";

// ─── Stripe Ink purchase links (match existing) ───────────────────
const INK_PACKS = [
  { ink: 100,  price: "$1",   label: "Spark",    desc: "Unlock a story or two",        stripe: "https://buy.stripe.com/100ink" },
  { ink: 300,  price: "$3",   label: "Flame",    desc: "A few chapters and tips",       stripe: "https://buy.stripe.com/300ink" },
  { ink: 600,  price: "$5",   label: "Torch",    desc: "A solid reading session",       stripe: "https://buy.stripe.com/600ink" },
  { ink: 1500, price: "$10",  label: "Blaze",    desc: "Deep into a serial",            stripe: "https://buy.stripe.com/1500ink" },
  { ink: 3500, price: "$20",  label: "Inferno",  desc: "All-in on a story world",       stripe: "https://buy.stripe.com/3500ink" },
];

interface Purchase {
  id: string;
  amount: number;
  ink_amount: number;
  created_at: string;
}

interface Unlock {
  id: string;
  chapter_id: string;
  created_at: string;
  chapters: { title: string; chapter_number: number; stories: { title: string; slug: string } };
}

interface Tip {
  id: string;
  writer_name: string;
  amount: number;
  created_at: string;
}

interface Letter {
  id: string;
  writer_id: string;
  tip_amount: number;
  status: string;
  created_at: string;
}

type Tab = "overview" | "history" | "spent" | "buy";

const IW_STYLES = `
  .iw-root {
    min-height: 100vh;
    background: #0a0807;
  }
  .iw-wrap {
    max-width: 860px; margin: 0 auto;
    padding: 48px 32px 96px;
  }

  /* Header */
  .iw-header { margin-bottom: 40px; }
  .iw-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(201,168,76,0.6); margin-bottom: 10px; display: block;
  }
  .iw-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 300;
    color: rgba(232,228,218,0.95); line-height: 1.1;
    margin-bottom: 6px;
  }
  .iw-subtitle {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: rgba(232,228,218,0.35); line-height: 1.65;
  }

  /* Balance card */
  .iw-balance-card {
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 18px; overflow: hidden;
    margin-bottom: 32px;
    background: linear-gradient(135deg, #1a1510, #110e09);
  }
  .iw-balance-top {
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .iw-balance-inner {
    padding: 32px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 24px; flex-wrap: wrap;
  }
  .iw-balance-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
    color: rgba(201,168,76,0.6); margin-bottom: 8px;
  }
  .iw-balance-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 64px; font-weight: 300; line-height: 1;
    color: #C9A84C;
  }
  .iw-balance-unit {
    font-family: 'Syne', sans-serif;
    font-size: 14px; color: rgba(201,168,76,0.5);
    margin-left: 8px; letter-spacing: 0.1em;
  }
  .iw-balance-stats {
    display: flex; gap: 24px; flex-wrap: wrap;
  }
  .iw-stat {
    text-align: center;
    padding: 14px 20px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    background: rgba(255,255,255,0.02);
    min-width: 90px;
  }
  .iw-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300; color: rgba(232,228,218,0.9);
    display: block; margin-bottom: 3px;
  }
  .iw-stat-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(232,228,218,0.3);
  }

  /* Tabs */
  .iw-tabs {
    display: flex; gap: 4px; margin-bottom: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding-bottom: 0;
  }
  .iw-tab {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 10px 18px; border-radius: 8px 8px 0 0;
    border: none; background: transparent;
    color: rgba(232,228,218,0.35); cursor: pointer;
    transition: all 0.2s; position: relative;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .iw-tab:hover { color: rgba(232,228,218,0.7); }
  .iw-tab.active {
    color: #C9A84C;
    border-bottom-color: #C9A84C;
  }

  /* List items */
  .iw-list { display: flex; flex-direction: column; gap: 8px; }
  .iw-list-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    background: rgba(255,255,255,0.02);
  }
  .iw-list-icon { font-size: 20px; flex-shrink: 0; }
  .iw-list-body { flex: 1; min-width: 0; }
  .iw-list-title {
    font-family: 'Syne', sans-serif;
    font-size: 12px; color: rgba(232,228,218,0.8); margin-bottom: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .iw-list-sub {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.3);
  }
  .iw-list-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300; flex-shrink: 0;
  }
  .iw-list-amount-pos { color: #C9A84C; }
  .iw-list-amount-neg { color: rgba(232,228,218,0.4); }

  /* Buy packs */
  .iw-packs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 520px) { .iw-packs { grid-template-columns: 1fr; } }
  .iw-pack {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 20px;
    background: rgba(255,255,255,0.02);
    cursor: pointer; transition: all 0.2s; text-align: left;
  }
  .iw-pack:hover {
    border-color: rgba(201,168,76,0.35);
    background: rgba(201,168,76,0.05);
    transform: translateY(-2px);
  }
  .iw-pack-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300; color: rgba(232,228,218,0.9);
    margin-bottom: 4px;
  }
  .iw-pack-ink {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #C9A84C; margin-bottom: 8px;
  }
  .iw-pack-desc {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.35);
    line-height: 1.5; margin-bottom: 14px;
  }
  .iw-pack-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300; color: rgba(232,228,218,0.9);
  }
  .iw-pack-cta {
    display: block; margin-top: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none; padding: 9px 0; border-radius: 8px;
    cursor: pointer; width: 100%; text-align: center;
    transition: opacity 0.2s;
  }
  .iw-pack-cta:hover { opacity: 0.88; }

  /* Empty state */
  .iw-empty {
    padding: 40px 24px; text-align: center;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; background: rgba(255,255,255,0.01);
  }
  .iw-empty-icon { font-size: 28px; display: block; margin-bottom: 12px; }
  .iw-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300; color: rgba(232,228,218,0.6);
    margin-bottom: 6px;
  }
  .iw-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.3); line-height: 1.65;
  }

  /* Loading */
  .iw-loading {
    font-family: 'Syne', sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.25); text-align: center;
    padding: 32px 0; letter-spacing: 0.1em;
  }

  /* Section label */
  .iw-section-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(232,228,218,0.25); margin-bottom: 12px; margin-top: 24px;
  }
`;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InkwellPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [ink, setInk] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [unlocks, setUnlocks] = useState<Unlock[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get ink from localStorage (existing pattern)
    const raw = window.localStorage.getItem("ttl_ink");
    setInk(raw ? Number(raw) : 0);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      supabase.from("ink_purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("chapter_unlocks").select("*, chapters(title, chapter_number, stories(title, slug))").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("ink_tips").select("*").eq("tipper_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("reader_letters").select("*").eq("reader_id", userId).order("created_at", { ascending: false }).limit(10),
    ]).then(([p, u, t, l]) => {
      setPurchases((p.data ?? []) as Purchase[]);
      setUnlocks((u.data ?? []) as Unlock[]);
      setTips((t.data ?? []) as Tip[]);
      setLetters((l.data ?? []) as Letter[]);
      setLoading(false);
    });
  }, [userId]);

  const totalSpent = unlocks.length * 10 + tips.reduce((a, t) => a + t.amount, 0) + letters.reduce((a, l) => a + (l.tip_amount ?? 0), 0);
  const totalPurchased = purchases.reduce((a, p) => a + (p.ink_amount ?? 0), 0);

  return (
    <>
      <style>{IW_STYLES}</style>
      <TTLNav />
      <div style={{ height: 74 }} />
      <div className="iw-root">
        <div className="iw-wrap">

          {/* Header */}
          <div className="iw-header">
            <span className="iw-eyebrow">The Tiniest Library</span>
            <div className="iw-title">The Inkwell 🪶</div>
            <div className="iw-subtitle">
              Your Ink balance, spending history, and everything you've supported.
            </div>
          </div>

          {/* Balance card */}
          <div className="iw-balance-card">
            <div className="iw-balance-top" />
            <div className="iw-balance-inner">
              <div>
                <div className="iw-balance-label">Current Balance</div>
                <div>
                  <span className="iw-balance-amount">{ink.toLocaleString()}</span>
                  <span className="iw-balance-unit">Ink</span>
                </div>
              </div>
              <div className="iw-balance-stats">
                <div className="iw-stat">
                  <span className="iw-stat-num">{unlocks.length}</span>
                  <span className="iw-stat-label">Unlocked</span>
                </div>
                <div className="iw-stat">
                  <span className="iw-stat-num">{tips.length}</span>
                  <span className="iw-stat-label">Tips Given</span>
                </div>
                <div className="iw-stat">
                  <span className="iw-stat-num">{letters.length}</span>
                  <span className="iw-stat-label">Letters Sent</span>
                </div>
                <div className="iw-stat">
                  <span className="iw-stat-num">{totalPurchased.toLocaleString()}</span>
                  <span className="iw-stat-label">Total Purchased</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="iw-tabs">
            {(["overview","history","spent","buy"] as Tab[]).map(t => (
              <button
                key={t}
                type="button"
                className={`iw-tab${tab === t ? " active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "overview" ? "Overview"
                  : t === "history" ? "Purchases"
                  : t === "spent" ? "Spent"
                  : "Buy Ink"
                }
              </button>
            ))}
          </div>

          {loading ? (
            <div className="iw-loading">Loading your Inkwell…</div>
          ) : (
            <>
              {/* Overview tab */}
              {tab === "overview" && (
                <div>
                  {unlocks.length > 0 && (
                    <>
                      <div className="iw-section-label">Recently Unlocked</div>
                      <div className="iw-list">
                        {unlocks.slice(0, 5).map(u => (
                          <a
                            key={u.id}
                            href={`/reading-room/stories/${(u.chapters as any)?.stories?.slug}/chapters/${(u.chapters as any)?.chapter_number}`}
                            className="iw-list-item"
                            style={{ textDecoration: "none" }}
                          >
                            <span className="iw-list-icon">📖</span>
                            <div className="iw-list-body">
                              <div className="iw-list-title">{(u.chapters as any)?.stories?.title ?? "Story"}</div>
                              <div className="iw-list-sub">Chapter {(u.chapters as any)?.chapter_number} · {timeAgo(u.created_at)}</div>
                            </div>
                            <span className="iw-list-amount iw-list-amount-neg">−10</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}

                  {tips.length > 0 && (
                    <>
                      <div className="iw-section-label">Recent Tips</div>
                      <div className="iw-list">
                        {tips.slice(0, 5).map(t => (
                          <div key={t.id} className="iw-list-item">
                            <span className="iw-list-icon">🍯</span>
                            <div className="iw-list-body">
                              <div className="iw-list-title">Tip to {t.writer_name}</div>
                              <div className="iw-list-sub">{timeAgo(t.created_at)}</div>
                            </div>
                            <span className="iw-list-amount iw-list-amount-neg">−{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {unlocks.length === 0 && tips.length === 0 && (
                    <div className="iw-empty">
                      <span className="iw-empty-icon">🪶</span>
                      <div className="iw-empty-title">Your Inkwell is fresh.</div>
                      <p className="iw-empty-text">Unlock stories and tip writers to see your activity here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Purchases tab */}
              {tab === "history" && (
                <div>
                  {purchases.length === 0 ? (
                    <div className="iw-empty">
                      <span className="iw-empty-icon">💰</span>
                      <div className="iw-empty-title">No purchases yet.</div>
                      <p className="iw-empty-text">Buy Ink to unlock stories and support writers.</p>
                    </div>
                  ) : (
                    <div className="iw-list">
                      {purchases.map(p => (
                        <div key={p.id} className="iw-list-item">
                          <span className="iw-list-icon">✨</span>
                          <div className="iw-list-body">
                            <div className="iw-list-title">Ink Purchase</div>
                            <div className="iw-list-sub">{timeAgo(p.created_at)}</div>
                          </div>
                          <span className="iw-list-amount iw-list-amount-pos">+{p.ink_amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spent tab */}
              {tab === "spent" && (
                <div>
                  <div className="iw-section-label">Chapter Unlocks</div>
                  {unlocks.length === 0 ? (
                    <div className="iw-empty">
                      <span className="iw-empty-icon">📖</span>
                      <div className="iw-empty-title">No unlocks yet.</div>
                      <p className="iw-empty-text">Use Ink to unlock chapters and read stories.</p>
                    </div>
                  ) : (
                    <div className="iw-list">
                      {unlocks.map(u => (
                        <div key={u.id} className="iw-list-item">
                          <span className="iw-list-icon">🔓</span>
                          <div className="iw-list-body">
                            <div className="iw-list-title">{(u.chapters as any)?.stories?.title ?? "Story"} — Ch. {(u.chapters as any)?.chapter_number}</div>
                            <div className="iw-list-sub">{timeAgo(u.created_at)}</div>
                          </div>
                          <span className="iw-list-amount iw-list-amount-neg">−10</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="iw-section-label">Tips to Writers</div>
                  {tips.length === 0 ? (
                    <div className="iw-empty">
                      <span className="iw-empty-icon">🍯</span>
                      <div className="iw-empty-title">No tips yet.</div>
                      <p className="iw-empty-text">Tip writers you love — 80% goes directly to them.</p>
                    </div>
                  ) : (
                    <div className="iw-list">
                      {tips.map(t => (
                        <div key={t.id} className="iw-list-item">
                          <span className="iw-list-icon">🍯</span>
                          <div className="iw-list-body">
                            <div className="iw-list-title">Tip to {t.writer_name}</div>
                            <div className="iw-list-sub">{timeAgo(t.created_at)}</div>
                          </div>
                          <span className="iw-list-amount iw-list-amount-neg">−{t.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Buy tab */}
              {tab === "buy" && (
                <div>
                  <div style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 12,
                    color: "rgba(232,228,218,0.35)", lineHeight: 1.7,
                    marginBottom: 24,
                  }}>
                    Every Ink purchase directly supports independent writers.
                    80% of what you spend on unlocks and tips goes to the author.
                  </div>
                  <div className="iw-packs">
                    {INK_PACKS.map(pack => (
                      <div key={pack.ink} className="iw-pack">
                        <div className="iw-pack-name">{pack.label}</div>
                        <div className="iw-pack-ink">{pack.ink.toLocaleString()} Ink</div>
                        <div className="iw-pack-desc">{pack.desc}</div>
                        <div className="iw-pack-price">{pack.price}</div>
                        <button
                          type="button"
                          className="iw-pack-cta"
                          onClick={() => window.open(pack.stripe, "_blank", "noopener,noreferrer")}
                        >
                          Buy {pack.label} Pack →
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 24,
                    fontFamily: "'Syne',sans-serif", fontSize: 10,
                    color: "rgba(232,228,218,0.2)", textAlign: "center",
                    letterSpacing: "0.08em", lineHeight: 1.7,
                  }}>
                    Payments secured by Stripe. Ink is added to your balance instantly after purchase.
                    Ink has no cash value and is non-refundable.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <TTLFooter />
      </div>
    </>
  );
}
