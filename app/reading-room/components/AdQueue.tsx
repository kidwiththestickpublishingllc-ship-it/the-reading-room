"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// TTL Ad Queue Component
// Drop in: app/reading-room/components/AdQueue.tsx
// Usage: <AdQueue />
// Shows a "Support TTL" button that opens a daily ad queue
// Readers earn Ink for each ad viewed
// Max 10 ads per reader per day
// =========================

const MAX_ADS_PER_DAY = 10;
const AD_VIEW_SECONDS = 5;

type Ad = {
  id: string;
  headline: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  cta_text: string;
  advertiser_name: string;
  advertiser_logo_url: string | null;
  ink_reward: number;
};

function getReaderId(): string {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem("ttl_reader_id");
  if (!id) {
    id = `reader_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem("ttl_reader_id", id);
  }
  return id;
}

function getTodayViewed(): string[] {
  if (typeof window === "undefined") return [];
  const key = `ttl_ads_viewed_${new Date().toDateString()}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function markViewed(adId: string) {
  if (typeof window === "undefined") return;
  const key = `ttl_ads_viewed_${new Date().toDateString()}`;
  const current = getTodayViewed();
  if (!current.includes(adId)) {
    localStorage.setItem(key, JSON.stringify([...current, adId]));
  }
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');

  .aq-trigger {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(232,228,218,0.55);
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; padding: 6px 16px; border-radius: 999px;
    cursor: pointer; transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .aq-trigger:hover {
    color: #E2C97E; border-color: rgba(201,168,76,0.4);
    background: rgba(201,168,76,0.08);
  }
  .aq-trigger-ink {
    font-size: 10px; font-weight: 700; color: #C9A84C;
    background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3);
    padding: 2px 8px; border-radius: 999px;
  }

  /* OVERLAY */
  .aq-overlay {
    position: fixed; inset: 0; z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .aq-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.88); backdrop-filter: blur(12px);
    cursor: pointer; border: none; width: 100%; height: 100%;
  }

  /* MODAL */
  .aq-modal {
    position: relative; z-index: 10;
    width: 100%; max-width: 520px;
    background: #0f0f0f;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.8);
  }
  .aq-modal-top {
    height: 3px;
    background: linear-gradient(90deg, transparent, #C9A84C, #E2C97E, #C9A84C, transparent);
  }

  /* HEADER */
  .aq-header {
    padding: 24px 28px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  }
  .aq-header-eyebrow {
    font-family: 'Syne', sans-serif; font-size: 8px; letter-spacing: 0.28em;
    text-transform: uppercase; color: rgba(201,168,76,0.65);
    display: block; margin-bottom: 6px;
  }
  .aq-header-title {
    font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300;
    color: #f0ece2; margin-bottom: 4px;
  }
  .aq-header-sub {
    font-size: 11px; color: rgba(232,228,218,0.4); line-height: 1.6;
  }
  .aq-close {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(232,228,218,0.35); background: transparent;
    border: 1px solid rgba(255,255,255,0.08); padding: 7px 14px;
    border-radius: 6px; cursor: pointer; flex-shrink: 0; transition: all 0.2s;
  }
  .aq-close:hover { color: rgba(232,228,218,0.7); border-color: rgba(255,255,255,0.15); }

  /* PROGRESS BAR */
  .aq-progress-wrap { padding: 16px 28px 0; }
  .aq-progress-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
  }
  .aq-progress-label { font-size: 10px; color: rgba(232,228,218,0.3); letter-spacing: 0.08em; }
  .aq-progress-ink {
    font-size: 11px; font-weight: 700; color: #C9A84C;
    display: flex; align-items: center; gap: 5px;
  }
  .aq-progress-bar-wrap {
    height: 4px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;
  }
  .aq-progress-bar {
    height: 100%; background: linear-gradient(90deg, #C9A84C, #E2C97E);
    border-radius: 999px; transition: width 0.4s ease;
  }

  /* AD DOTS */
  .aq-dots {
    display: flex; gap: 6px; padding: 14px 28px 0; flex-wrap: wrap;
  }
  .aq-dot {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: rgba(232,228,218,0.3);
    transition: all 0.2s; cursor: default;
  }
  .aq-dot.viewed { background: rgba(74,222,128,0.15); border-color: rgba(74,222,128,0.4); color: rgba(74,222,128,0.8); }
  .aq-dot.current { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.5); color: #C9A84C; }

  /* AD CARD */
  .aq-ad-wrap { padding: 20px 28px 24px; }
  .aq-ad-card {
    background: #161616; border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; overflow: hidden;
    transition: border-color 0.3s;
  }
  .aq-ad-card:hover { border-color: rgba(201,168,76,0.2); }

  .aq-ad-image {
    width: 100%; height: 180px; object-fit: cover;
    display: block; background: #1a1a1a;
  }
  .aq-ad-image-placeholder {
    width: 100%; height: 180px;
    background: linear-gradient(135deg, #1a1a24, #252535);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 32px; color: rgba(201,168,76,0.2);
  }

  .aq-ad-body { padding: 18px 20px; }
  .aq-ad-advertiser {
    display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  .aq-ad-logo {
    width: 24px; height: 24px; border-radius: 4px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: rgba(232,228,218,0.4); overflow: hidden; flex-shrink: 0;
  }
  .aq-ad-logo img { width: 100%; height: 100%; object-fit: cover; }
  .aq-ad-sponsor {
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(232,228,218,0.28);
  }
  .aq-ad-headline {
    font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400;
    color: #f0ece2; line-height: 1.25; margin-bottom: 8px;
  }
  .aq-ad-desc {
    font-size: 12px; color: rgba(232,228,218,0.45); line-height: 1.65; margin-bottom: 16px;
  }
  .aq-ad-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .aq-ad-cta {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; color: #000; font-weight: 700;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none; padding: 10px 20px; border-radius: 6px;
    cursor: pointer; text-decoration: none; transition: opacity 0.2s;
    display: inline-block;
  }
  .aq-ad-cta:hover { opacity: 0.88; }
  .aq-ad-reward {
    font-size: 11px; color: rgba(201,168,76,0.8);
    display: flex; align-items: center; gap: 5px;
  }

  /* TIMER BAR */
  .aq-timer-wrap { padding: 0 28px 6px; }
  .aq-timer-bar-bg {
    height: 3px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden;
  }
  .aq-timer-bar {
    height: 100%; background: rgba(201,168,76,0.5); border-radius: 999px;
    transition: width 1s linear;
  }
  .aq-timer-label {
    font-size: 9px; color: rgba(232,228,218,0.25); letter-spacing: 0.1em;
    margin-top: 4px; text-align: right;
  }

  /* ACTIONS */
  .aq-actions {
    padding: 0 28px 24px; display: flex; gap: 10px;
  }
  .aq-btn-next {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; font-weight: 700; color: #000;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none; padding: 12px 24px; border-radius: 6px;
    cursor: pointer; transition: opacity 0.2s; flex: 1;
  }
  .aq-btn-next:hover:not(:disabled) { opacity: 0.88; }
  .aq-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
  .aq-btn-skip {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(232,228,218,0.35);
    background: transparent; border: 1px solid rgba(255,255,255,0.08);
    padding: 12px 20px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
  }
  .aq-btn-skip:hover { color: rgba(232,228,218,0.6); border-color: rgba(255,255,255,0.15); }

  /* DONE SCREEN */
  .aq-done {
    padding: 48px 28px; text-align: center;
  }
  .aq-done-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 20px;
  }
  .aq-done-title {
    font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 300;
    color: #f0ece2; margin-bottom: 10px;
  }
  .aq-done-sub {
    font-size: 12px; color: rgba(232,228,218,0.4); line-height: 1.7; margin-bottom: 24px;
  }
  .aq-done-ink {
    font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300;
    color: #C9A84C; line-height: 1; margin-bottom: 6px;
  }
  .aq-done-ink-label {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(201,168,76,0.5); margin-bottom: 28px;
  }
  .aq-done-btn {
    font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; font-weight: 700; color: #000;
    background: linear-gradient(135deg, #C9A84C, #8a6510);
    border: none; padding: 13px 32px; border-radius: 6px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .aq-done-btn:hover { opacity: 0.88; }

  /* EMPTY */
  .aq-empty { padding: 48px 28px; text-align: center; }
  .aq-empty-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; color: rgba(232,228,218,0.5); margin-bottom: 10px; }
  .aq-empty-sub { font-size: 12px; color: rgba(232,228,218,0.3); line-height: 1.7; }

  /* ALREADY DONE TODAY */
  .aq-today-done { padding: 40px 28px; text-align: center; }
  .aq-today-done-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; color: #f0ece2; margin-bottom: 10px; }
  .aq-today-done-sub { font-size: 12px; color: rgba(232,228,218,0.4); line-height: 1.7; margin-bottom: 20px; }
  .aq-today-ink { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; color: #C9A84C; }
  .aq-today-ink-label { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(201,168,76,0.5); margin-bottom: 20px; }
`;

export default function AdQueue() {
  const [open, setOpen] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedToday, setViewedToday] = useState<string[]>([]);
  const [inkEarned, setInkEarned] = useState(0);
  const [timer, setTimer] = useState(AD_VIEW_SECONDS);
  const [canNext, setCanNext] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readerId = typeof window !== "undefined" ? getReaderId() : "anon";

  const todayInk = parseInt(typeof window !== "undefined" ? (localStorage.getItem(`ttl_ads_ink_${new Date().toDateString()}`) ?? "0") : "0");

  useEffect(() => {
    if (!open) return;
    loadAds();
  }, [open]);

  useEffect(() => {
    if (!open || done || ads.length === 0) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, open, ads]);

  async function loadAds() {
    setLoading(true);
    const viewed = getTodayViewed();
    setViewedToday(viewed);
    const { data } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const available = (data ?? []).filter((a: Ad) => !viewed.includes(a.id)).slice(0, MAX_ADS_PER_DAY - viewed.length);
    setAds(available);
    setCurrentIndex(0);
    setInkEarned(0);
    setDone(false);
    setLoading(false);
  }

  function startTimer() {
    setTimer(AD_VIEW_SECONDS);
    setCanNext(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setCanNext(true);
          recordView();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function recordView() {
    const ad = ads[currentIndex];
    if (!ad) return;
    markViewed(ad.id);
    setViewedToday(v => [...v, ad.id]);
    const earned = ad.ink_reward ?? 5;
    setInkEarned(i => i + earned);

    // Credit ink to localStorage
    const newInk = (parseInt(localStorage.getItem("ttl_ink") ?? "0")) + earned;
    localStorage.setItem("ttl_ink", String(newInk));

    // Track today's ink from ads
    const todayKey = `ttl_ads_ink_${new Date().toDateString()}`;
    const prev = parseInt(localStorage.getItem(todayKey) ?? "0");
    localStorage.setItem(todayKey, String(prev + earned));

    // Save to Supabase
    await supabase.from("ad_views").insert({
      ad_id: ad.id,
      reader_id: readerId,
      ink_earned: earned,
      clicked: false,
    });

    // Increment view count
    await supabase.from("ads").update({ view_count: (ad as any).view_count + 1 }).eq("id", ad.id);
  }

  async function handleClick(ad: Ad) {
    await supabase.from("ad_views").update({ clicked: true })
      .eq("ad_id", ad.id).eq("reader_id", readerId);
    await supabase.from("ads").update({ click_count: (ad as any).click_count + 1 }).eq("id", ad.id);
    window.open(ad.link_url, "_blank", "noopener,noreferrer");
  }

  function handleNext() {
    if (currentIndex >= ads.length - 1) {
      setDone(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }

  function handleSkip() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex >= ads.length - 1) {
      setDone(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }

  const allViewedToday = viewedToday.length >= MAX_ADS_PER_DAY;
  const currentAd = ads[currentIndex];
  const totalAdsToday = viewedToday.length + ads.length;

  return (
    <>
      <style>{STYLES}</style>

      {/* Trigger button */}
      <button className="aq-trigger" onClick={() => setOpen(true)}>
        <span>✦</span>
        Support TTL
        <span className="aq-trigger-ink">+Ink</span>
      </button>

      {open && (
        <div className="aq-overlay">
          <button className="aq-backdrop" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="aq-modal">
            <div className="aq-modal-top" />

            {/* Header */}
            <div className="aq-header">
              <div>
                <span className="aq-header-eyebrow">The Tiniest Library — Community Support</span>
                <div className="aq-header-title">Today's Ad Queue</div>
                <p className="aq-header-sub">
                  View ads to earn Ink and keep TTL running for the writers you love.
                </p>
              </div>
              <button className="aq-close" onClick={() => setOpen(false)}>Close ✕</button>
            </div>

            {loading ? (
              <div className="aq-empty">
                <div className="aq-empty-title">Loading…</div>
              </div>
            ) : allViewedToday ? (
              /* Already done today */
              <div className="aq-today-done">
                <div className="aq-today-done-title">You're all caught up for today.</div>
                <p className="aq-today-done-sub">You've viewed all your ads for today. Come back tomorrow for a fresh queue and more Ink.</p>
                <div className="aq-today-ink">{todayInk}</div>
                <div className="aq-today-ink-label">Ink earned today from ads</div>
                <button className="aq-done-btn" onClick={() => setOpen(false)}>Keep Reading →</button>
              </div>
            ) : ads.length === 0 ? (
              /* No ads available */
              <div className="aq-empty">
                <div className="aq-empty-title">No ads right now.</div>
                <p className="aq-empty-sub">Check back soon — new advertisers are joining TTL. Your support means everything.</p>
              </div>
            ) : done ? (
              /* Done screen */
              <div className="aq-done">
                <div className="aq-done-icon">✦</div>
                <div className="aq-done-title">Thank you for supporting TTL.</div>
                <p className="aq-done-sub">Every ad you view helps keep this platform free for writers and readers. The Ink you earned has been added to your wallet.</p>
                <div className="aq-done-ink">+{inkEarned}</div>
                <div className="aq-done-ink-label">Ink added to your wallet</div>
                <button className="aq-done-btn" onClick={() => setOpen(false)}>Keep Reading →</button>
              </div>
            ) : currentAd ? (
              <>
                {/* Progress */}
                <div className="aq-progress-wrap">
                  <div className="aq-progress-row">
                    <span className="aq-progress-label">
                      Ad {currentIndex + 1} of {ads.length} · {MAX_ADS_PER_DAY - viewedToday.length - currentIndex - 1} remaining today
                    </span>
                    <span className="aq-progress-ink">✒️ +{inkEarned} Ink earned</span>
                  </div>
                  <div className="aq-progress-bar-wrap">
                    <div className="aq-progress-bar" style={{ width: `${((currentIndex) / ads.length) * 100}%` }} />
                  </div>
                </div>

                {/* Ad dots */}
                <div className="aq-dots">
                  {ads.map((a, i) => (
                    <div key={a.id} className={`aq-dot${i < currentIndex ? " viewed" : i === currentIndex ? " current" : ""}`}>
                      {i < currentIndex ? "✓" : i + 1}
                    </div>
                  ))}
                </div>

                {/* Ad card */}
                <div className="aq-ad-wrap">
                  <div className="aq-ad-card">
                    {currentAd.image_url
                      ? <img src={currentAd.image_url} alt={currentAd.headline} className="aq-ad-image" />
                      : <div className="aq-ad-image-placeholder">✦</div>
                    }
                    <div className="aq-ad-body">
                      <div className="aq-ad-advertiser">
                        <div className="aq-ad-logo">
                          {currentAd.advertiser_logo_url
                            ? <img src={currentAd.advertiser_logo_url} alt={currentAd.advertiser_name} />
                            : currentAd.advertiser_name[0]
                          }
                        </div>
                        <span className="aq-ad-sponsor">Sponsored · {currentAd.advertiser_name}</span>
                      </div>
                      <div className="aq-ad-headline">{currentAd.headline}</div>
                      {currentAd.description && <p className="aq-ad-desc">{currentAd.description}</p>}
                      <div className="aq-ad-footer">
                        <button className="aq-ad-cta" onClick={() => handleClick(currentAd)}>
                          {currentAd.cta_text} →
                        </button>
                        <span className="aq-ad-reward">
                          ✒️ +{currentAd.ink_reward} Ink for viewing
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer */}
                <div className="aq-timer-wrap">
                  <div className="aq-timer-bar-bg">
                    <div className="aq-timer-bar" style={{ width: `${((AD_VIEW_SECONDS - timer) / AD_VIEW_SECONDS) * 100}%` }} />
                  </div>
                  <div className="aq-timer-label">
                    {canNext ? "Ready to continue" : `Earning Ink in ${timer}s…`}
                  </div>
                </div>

                {/* Actions */}
                <div className="aq-actions">
                  <button className="aq-btn-skip" onClick={handleSkip}>Skip</button>
                  <button className="aq-btn-next" disabled={!canNext} onClick={handleNext}>
                    {canNext
                      ? currentIndex >= ads.length - 1 ? "Finish & Collect Ink →" : "Next Ad →"
                      : `Earning Ink… (${timer}s)`
                    }
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
