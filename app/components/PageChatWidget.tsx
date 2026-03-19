"use client";

import { useEffect, useRef, useState } from "react";

// =============================================================
// PAGE — The TTL AI Reading Guide
// Rule-based chat widget. To upgrade to Claude AI later:
//   1. Create /app/api/page-chat/route.ts (template at bottom)
//   2. Set USE_AI = true below
//   3. Add ANTHROPIC_API_KEY to your .env.local + Vercel env vars
// =============================================================

const USE_AI = true; // ← flip to true when ready for Claude AI

// =============================================================
// Knowledge base — edit these to customize Page's responses
// =============================================================
const TTL_KB = {
  greeting_new: [
    "Welcome to The Tiniest Library! 📚 I'm Page, your Reading Room guide. You've been given 250 Ink to get started — use it to unlock stories, tip authors, and explore what's here. What can I help you discover first?",
    "Hello and welcome! 🪶 I'm Page — I live here in the Reading Room and I know every story, author, and secret this place holds. You've got 250 Ink ready to spend. Want me to show you around?",
    "Welcome, new reader! 📖 The Tiniest Library is a space for long stories, serialized chapters, and writers worth knowing. I'm Page, your guide. Ask me anything — genres, Ink, authors, or where to start.",
  ],
  greeting_returning: [
    "Welcome back! 📚 Glad you're here again. You've got {ink} Ink in your balance — ready to unlock something new? I can recommend your next read if you tell me what you're in the mood for.",
    "Hey, good to see you again! 🪶 Your {ink} Ink is waiting. New stories have been added since your last visit — want me to point you to something worth reading?",
    "Welcome back to The Tiniest Library! 📖 You've got {ink} Ink and a whole Reading Room full of stories. Tell me what you're in the mood for and I'll find you something perfect.",
  ],
  fallback: [
    "Hmm, I'm not sure about that one yet — but I'm always learning! Try asking me about stories, authors, Ink, or how the Reading Room works.",
    "That's a great question! I don't have that answer just yet. Try asking about genres, Ink, or how to unlock stories.",
  ],
  topics: {
    ink: "Ink is The Tiniest Library's reader currency. 🪶 You start with 250 Ink free. Use it to unlock exclusive chapters and early access stories. You can buy more Ink anytime — packs start at just $1. Your Ink balance is always shown in the top navigation bar.",
    unlock: "To unlock a story, click the **Unlock** button on any story card. Each unlock costs 25 Ink. Once unlocked, the full chapter is yours to read anytime — it's saved right in your browser so it'll be there next time you visit!",
    buy: "You can buy Ink packs in the Reading Room wallet section! 💰 Packs start at $1 for 100 Ink, all the way up to $15 for 2,500 Ink. Payments are handled securely by Stripe. After purchase, your Ink is added automatically.",
    stories: "The Reading Room has serials, exclusives, and early access chapters from our featured authors. 📖 Head to **Browse All Stories** to filter by genre, sort by newest, or search by title or author.",
    authors: "TTL features a growing roster of independent authors across genres. 🪶 Visit the **Author Directory** to discover writers, read their bios, and even tip them directly with Ink!",
    genres: "We have 24 genres to explore — from Fantasy and Sci-Fi to Dark Academia, Cozy, Romance, LGBTQ+ Fiction, Black Stories, and more. Use the genre panels on the Browse page to filter stories by what you love.",
    serial: "Serial stories are published in ongoing chapters — new episodes drop regularly. Follow along and use Ink to unlock the latest chapters before anyone else!",
    exclusive: "Exclusive stories are only available here in The Reading Room. You won't find these chapters anywhere else — they're written just for TTL members.",
    early: "Early Access stories give you a first look before public release. Use your Ink to read chapters as they're written, straight from the author.",
    members: "The Members Site on Squarespace has additional content, community updates, and member-only resources. You can access it from the **Members Site** link in the navigation.",
    help: "I can help with: finding stories, understanding Ink, learning about authors, genre recommendations, or how unlocking works. What would you like to know?",
    hello: "Hey there! 👋 I'm Page, your TTL guide. Ask me anything about the Reading Room — stories, authors, Ink, genres — I'm here to help!",
    thanks: "You're so welcome! Happy reading! 📚 Let me know if you need anything else.",
    tip: "Tipping authors is a wonderful way to support independent writers! 🪶 On any author card in the Featured Authors section, you'll see tip buttons. A small tip goes a long way in keeping great stories coming.",
    recommend: "For great starting points: if you love mystery try **Lanterns Over Hartford**, for sci-fi check out **Fox Vs. The World** or **Stars Don't Apologize**, and for dark academia try **The Quiet Stairwell**. All available in Browse Stories!",
  },
};

type Message = {
  role: "user" | "page";
  text: string;
  time: string;
};

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isReturning(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("ttl_page_visited"));
}

function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem("ttl_visit_count") || "0");
}

function getInkBalance(): number {
  if (typeof window === "undefined") return 250;
  const raw = window.localStorage.getItem("ttl_ink");
  return raw ? Number(raw) : 250;
}

function hasVisited(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("ttl_page_visited"));
}

function markVisited() {
  if (typeof window === "undefined") return;
  const count = getVisitCount() + 1;
  window.localStorage.setItem("ttl_page_visited", "1");
  window.localStorage.setItem("ttl_visit_count", String(count));
  window.localStorage.setItem("ttl_last_visit", new Date().toISOString());
}

// Simple keyword matcher
function getRuleBasedResponse(input: string): string {
  const q = input.toLowerCase();

  if (/\b(hi|hello|hey|good morning|good evening|good afternoon|howdy)\b/.test(q))
    return TTL_KB.topics.hello;
  if (/\b(thank|thanks|thank you|ty|thx)\b/.test(q))
    return TTL_KB.topics.thanks;
  if (/\b(help|what can you|what do you|support)\b/.test(q))
    return TTL_KB.topics.help;
  if (/\b(ink|currency|credits|points|balance)\b/.test(q))
    return TTL_KB.topics.ink;
  if (/\b(buy|purchase|get more|top up|stripe|payment|price|cost|pack)\b/.test(q))
    return TTL_KB.topics.buy;
  if (/\b(unlock|access|read|open|chapter)\b/.test(q))
    return TTL_KB.topics.unlock;
  if (/\b(story|stories|browse|library|collection)\b/.test(q))
    return TTL_KB.topics.stories;
  if (/\b(author|writer|directory|profile)\b/.test(q))
    return TTL_KB.topics.authors;
  if (/\b(genre|fantasy|sci.fi|romance|mystery|cozy|horror|thriller|academic|lgbtq|black|latin|aapi|indigenous|adventure|fiction)\b/.test(q))
    return TTL_KB.topics.genres;
  if (/\b(serial|series|ongoing|episode|weekly)\b/.test(q))
    return TTL_KB.topics.serial;
  if (/\b(exclusive|only here|members only)\b/.test(q))
    return TTL_KB.topics.exclusive;
  if (/\b(early access|preview|first look|draft)\b/.test(q))
    return TTL_KB.topics.early;
  if (/\b(member|members site|squarespace|community)\b/.test(q))
    return TTL_KB.topics.members;
  if (/\b(tip|support author|donate|give ink)\b/.test(q))
    return TTL_KB.topics.tip;
  if (/\b(recommend|suggest|what should|where to start|best story|popular)\b/.test(q))
    return TTL_KB.topics.recommend;

  // Fallback
  return TTL_KB.fallback[Math.floor(Math.random() * TTL_KB.fallback.length)];
}

async function getAIResponse(messages: Message[]): Promise<string> {
  // This calls your API route when USE_AI = true
  const res = await fetch("/api/page-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role === "page" ? "assistant" : "user",
        content: m.text,
      })),
    }),
  });
  const data = await res.json();
  return data.message ?? "I'm having trouble thinking right now — try again in a moment!";
}

// =============================================================
// Quick reply chips
// =============================================================
const QUICK_REPLIES = [
  "How does Ink work?",
  "What stories are available?",
  "How do I unlock a chapter?",
  "Tell me about the authors",
  "Recommend a story",
];

// =============================================================
// Pixel Leather Book FAB — upgraded with golden glow ring + click toggle
// =============================================================
const PIXEL = 2;
const BOOK_COLORS = {
  leatherDark: '#3d2610', leather: '#5c3a1e', leatherLight: '#7a5230',
  leatherHighlight: '#8f6538', gold: '#daa520', goldLight: '#f0d060',
  goldDark: '#b8860b', pageCream: '#f5f0e1', pageEdge: '#e8dcc8',
  pageShadow: '#d4c8a8', spine: '#4a2e14', spineDark: '#2e1a0a', text: '#5c4a30',
};

function PixelBook() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isOpenRef = useRef(false);
  const animatingRef = useRef(false);
  const animProgressRef = useRef(0);
  const animDirectionRef = useRef(0);
  const rafRef = useRef<number>(0);

  function dp(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
  }
  function dr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x * PIXEL, y * PIXEL, w * PIXEL, h * PIXEL);
  }

  function drawClosed(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 160, 120);
    const bx = 18, by = 10, bw = 44, bh = 40;
    dr(ctx, bx+2, by+2, bw, bh, "rgba(0,0,0,0.35)");
    dr(ctx, bx, by, bw, bh, BOOK_COLORS.leather);
    for (let i = 0; i < 10; i++) {
      dp(ctx, bx+3+Math.floor((i*7+3)%(bw-6)), by+3+Math.floor((i*11+5)%(bh-6)), BOOK_COLORS.leatherDark);
    }
    for (let i = 0; i < 6; i++) {
      dp(ctx, bx+3+Math.floor((i*13+7)%(bw-6)), by+3+Math.floor((i*9+3)%(bh-6)), BOOK_COLORS.leatherHighlight);
    }
    for (let x = bx+2; x < bx+bw-2; x++) dp(ctx, x, by+2, BOOK_COLORS.gold);
    for (let x = bx+2; x < bx+bw-2; x++) dp(ctx, x, by+bh-3, BOOK_COLORS.gold);
    for (let y = by+2; y < by+bh-2; y++) dp(ctx, bx+2, y, BOOK_COLORS.gold);
    for (let y = by+2; y < by+bh-2; y++) dp(ctx, bx+bw-3, y, BOOK_COLORS.gold);
    [[bx+3,by+3],[bx+4,by+3],[bx+3,by+4],[bx+bw-4,by+3],[bx+bw-5,by+3],[bx+bw-4,by+4],
     [bx+3,by+bh-4],[bx+4,by+bh-4],[bx+3,by+bh-5],[bx+bw-4,by+bh-4],[bx+bw-5,by+bh-4],[bx+bw-4,by+bh-5]
    ].forEach(([x,y]) => dp(ctx, x, y, BOOK_COLORS.goldLight));
    const cx = bx + Math.floor(bw/2), cy = by + Math.floor(bh/2);
    [[cx,cy-3,BOOK_COLORS.gold],[cx-1,cy-2,BOOK_COLORS.gold],[cx,cy-2,BOOK_COLORS.goldLight],[cx+1,cy-2,BOOK_COLORS.gold],
     [cx-2,cy-1,BOOK_COLORS.gold],[cx-1,cy-1,BOOK_COLORS.goldLight],[cx,cy-1,BOOK_COLORS.goldLight],[cx+1,cy-1,BOOK_COLORS.goldLight],[cx+2,cy-1,BOOK_COLORS.gold],
     [cx-3,cy,BOOK_COLORS.goldDark],[cx-2,cy,BOOK_COLORS.gold],[cx-1,cy,BOOK_COLORS.goldLight],[cx,cy,"#fff8dc"],[cx+1,cy,BOOK_COLORS.goldLight],[cx+2,cy,BOOK_COLORS.gold],[cx+3,cy,BOOK_COLORS.goldDark],
     [cx-2,cy+1,BOOK_COLORS.gold],[cx-1,cy+1,BOOK_COLORS.goldLight],[cx,cy+1,BOOK_COLORS.goldLight],[cx+1,cy+1,BOOK_COLORS.goldLight],[cx+2,cy+1,BOOK_COLORS.gold],
     [cx-1,cy+2,BOOK_COLORS.gold],[cx,cy+2,BOOK_COLORS.goldLight],[cx+1,cy+2,BOOK_COLORS.gold],[cx,cy+3,BOOK_COLORS.goldDark]
    ].forEach(([x,y,c]) => dp(ctx, x as number, y as number, c as string));
    for (let y = by+1; y < by+bh-1; y++) { dp(ctx, bx+bw, y, BOOK_COLORS.pageEdge); dp(ctx, bx+bw+1, y, BOOK_COLORS.pageShadow); }
    dr(ctx, bx-2, by, 2, bh, BOOK_COLORS.spine);
    for (let y = by; y < by+bh; y+=3) dp(ctx, bx-2, y, BOOK_COLORS.spineDark);
    dr(ctx, bx-2, by+4, 2, 1, BOOK_COLORS.goldDark);
    dr(ctx, bx-2, by+bh-5, 2, 1, BOOK_COLORS.goldDark);
    for (let y = by; y < by+bh; y++) dp(ctx, bx+bw-1, y, BOOK_COLORS.leatherLight);
    for (let x = bx; x < bx+bw; x++) dp(ctx, x, by+bh-1, BOOK_COLORS.leatherDark);
    for (let x = bx; x < bx+bw; x++) dp(ctx, x, by, BOOK_COLORS.leatherHighlight);
  }

  function drawOpen(ctx: CanvasRenderingContext2D, progress: number) {
    ctx.clearRect(0, 0, 160, 120);
    const bx = 6, by = 10, bw = 34, bh = 40;
    dr(ctx, bx+1, by+2, bw*2+10, bh, "rgba(0,0,0,0.2)");
    dr(ctx, bx, by, bw, bh, BOOK_COLORS.leather);
    for (let x = bx+2; x < bx+bw-2; x++) dp(ctx, x, by+2, BOOK_COLORS.gold);
    for (let x = bx+2; x < bx+bw-2; x++) dp(ctx, x, by+bh-3, BOOK_COLORS.gold);
    for (let y = by+2; y < by+bh-2; y++) dp(ctx, bx+2, y, BOOK_COLORS.gold);
    for (let y = by+2; y < by+bh-2; y++) dp(ctx, bx+bw-3, y, BOOK_COLORS.gold);
    dr(ctx, bx+bw, by, 3, bh, BOOK_COLORS.spine);
    for (let y = by; y < by+bh; y+=3) dp(ctx, bx+bw+1, y, BOOK_COLORS.spineDark);
    dr(ctx, bx+bw, by+4, 3, 1, BOOK_COLORS.goldDark);
    dr(ctx, bx+bw, by+bh-5, 3, 1, BOOK_COLORS.goldDark);
    const px = bx+bw+3, pageW = Math.floor(bw * progress);
    if (pageW > 0) {
      dr(ctx, px, by+1, pageW, bh-2, BOOK_COLORS.pageCream);
      if (progress > 0.5) {
        for (let i = 0; i < 9; i++) {
          const lw = Math.min(pageW-4, 6+(i*5+3)%18);
          if (lw > 2) dr(ctx, px+2, by+4+i*3, lw, 1, BOOK_COLORS.text);
        }
        if (pageW > 10) { dp(ctx, px+pageW-2, by+bh-4, BOOK_COLORS.pageShadow); dp(ctx, px+pageW-3, by+bh-3, BOOK_COLORS.pageShadow); }
      }
      for (let y = by+1; y < by+bh-1; y++) dp(ctx, px, y, BOOK_COLORS.pageShadow);
    }
    const rcx = px+pageW+1;
    if (progress > 0.1) {
      dr(ctx, rcx, by, Math.floor(bw*progress), bh, BOOK_COLORS.leatherLight);
      if (progress > 0.6) {
        const visW = Math.floor(bw*progress);
        for (let x = rcx+1; x < rcx+visW-1; x++) { dp(ctx, x, by+2, BOOK_COLORS.goldDark); dp(ctx, x, by+bh-3, BOOK_COLORS.goldDark); }
      }
      for (let y = by; y < by+bh; y++) dp(ctx, rcx, y, BOOK_COLORS.leatherDark);
    }
    if (progress > 0.3) {
      dr(ctx, bx+1, by+1, bw-1, bh-2, BOOK_COLORS.pageCream);
      for (let i = 0; i < 7; i++) dr(ctx, bx+3, by+4+i*4, Math.min(6+i*3, bw-6), 1, "#d4c8a8");
      dr(ctx, bx, by, 1, bh, BOOK_COLORS.leather);
    }
  }

  function runAnim() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (animDirectionRef.current === 1) {
      animProgressRef.current += 0.07;
      if (animProgressRef.current >= 1) {
        animProgressRef.current = 1; animatingRef.current = false; isOpenRef.current = true;
        drawOpen(ctx, 1); return;
      }
    } else {
      animProgressRef.current -= 0.07;
      if (animProgressRef.current <= 0) {
        animProgressRef.current = 0; animatingRef.current = false; isOpenRef.current = false;
        drawClosed(ctx); return;
      }
    }
    drawOpen(ctx, animProgressRef.current);
    rafRef.current = requestAnimationFrame(runAnim);
  }

  function handleClick() {
    if (animatingRef.current) return;
    animatingRef.current = true;
    if (!isOpenRef.current) {
      animDirectionRef.current = 1; animProgressRef.current = 0;
    } else {
      animDirectionRef.current = -1; animProgressRef.current = 1;
    }
    rafRef.current = requestAnimationFrame(runAnim);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) drawClosed(ctx);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={120}
      onClick={handleClick}
      style={{ imageRendering: "pixelated", display: "block", cursor: "pointer" }}
    />
  );
}



// =============================================================
// Component
// =============================================================
export default function PageChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Greeting on first open
  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
      const returning = isReturning();
      const ink = getInkBalance();
      const visitCount = getVisitCount();
      markVisited();
      const pool = returning ? TTL_KB.greeting_returning : TTL_KB.greeting_new;
      const template = pool[Math.floor(Math.random() * pool.length)]
        .replace("{ink}", String(ink))
        .replace("{visits}", String(visitCount));

      setTimeout(() => {
        setMessages([{ role: "page", text: template, time: getTime() }]);
      }, 400);
    }
  }, [open, hasGreeted]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Unread badge when closed
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "page") setUnread((n) => n + 1);
    }
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim(), time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let response: string;
      if (USE_AI) {
        response = await getAIResponse([...messages, userMsg]);
      } else {
        // Simulate slight delay for realism
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        response = getRuleBasedResponse(text);
      }
      setMessages((prev) => [...prev, { role: "page", text: response, time: getTime() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "page", text: "Something went wrong — please try again!", time: getTime() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <style>{WIDGET_STYLES}</style>

      {/* Floating button — Pixel leather book (Canva) — data-tour="page-chat" enables WelcomeTour spotlight */}
      <button
        type="button"
        onClick={handleOpen}
        className={`page-fab page-fab-book ${open ? "page-fab-hidden" : ""}`}
        aria-label="Open Page chat"
        data-tour="page-chat"
        suppressHydrationWarning
      >
        <PixelBook />
        <span className="page-fab-book-label">PAGE</span>
        <span className="page-fab-book-hint">~ tap to open ~</span>
        {unread > 0 && <span className="page-fab-badge">{unread}</span>}
      </button>

      {/* Chat window */}
      <div className={`page-window ${open ? "page-window-open" : ""}`} role="dialog" aria-label="Page chat">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-avatar">
              <span>📖</span>
              <span className="page-online-dot" />
            </div>
            <div>
              <p className="page-name">Page</p>
              <p className="page-status">TTL Reading Guide</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="page-close" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="page-messages">
          {messages.length === 0 && (
            <div className="page-empty">
              <span style={{ fontSize: 32 }}>📚</span>
              <p>Page is ready to help you explore The Tiniest Library!</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`page-msg-row ${msg.role === "user" ? "page-msg-user" : "page-msg-page"}`}>
              {msg.role === "page" && (
                <div className="page-msg-avatar">📖</div>
              )}
              <div className="page-msg-bubble">
                <p className="page-msg-text">{msg.text}</p>
                <span className="page-msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="page-msg-row page-msg-page">
              <div className="page-msg-avatar">📖</div>
              <div className="page-msg-bubble page-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {messages.length <= 1 && !loading && (
          <div className="page-chips">
            {QUICK_REPLIES.map((q) => (
              <button key={q} type="button" className="page-chip" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="page-input-row">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Page anything…"
            className="page-input"
            disabled={loading}
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="page-send"
            aria-label="Send"
          >
            ↑
          </button>
        </form>

        <p className="page-footer-note">
          Powered by The Tiniest Library · <span style={{ color: "var(--gold)" }}>Page AI</span>
        </p>
      </div>
    </>
  );
}

// =============================================================
// Styles
// =============================================================
const WIDGET_STYLES = `
  :root {
    --gold: #C9A84C;
    --gold-light: #E2C97E;
    --gold-dim: rgba(201,168,76,0.35);
    --gold-glow: rgba(201,168,76,0.13);
    --blue: #6495ED;
    --blue-dim: rgba(100,149,237,0.22);
    --ink-bg: #0a0a0a;
    --ink-surface: #111111;
    --ink-surface2: #181818;
    --ink-border: rgba(255,255,255,0.08);
    --ink-border-gold: rgba(201,168,76,0.28);
  }

  /* ── FAB ── */
  .page-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px 12px 16px;
    border-radius: 999px;
    background: linear-gradient(135deg, #1a1400, #0a0a0a);
    border: 1px solid var(--gold-dim);
    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px var(--gold-glow);
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s;
    font-family: 'Syne', sans-serif;
  }

  /* Pixel book variant — golden glow ring + canvas */
  .page-fab-book {
    padding: 8px;
    border-radius: 18px;
    width: 180px;
    height: 156px;
    overflow: hidden;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #0a0a0a;
    border: none;
    box-shadow: none;
  }

  .page-fab-book::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 20px;
    background: conic-gradient(
      from 0deg,
      transparent 10%,
      rgba(201,168,76,0.0) 20%,
      rgba(201,168,76,0.6) 35%,
      rgba(240,208,96,0.9) 50%,
      rgba(201,168,76,0.6) 65%,
      rgba(201,168,76,0.0) 80%,
      transparent 90%
    );
    animation: pageGlowSpin 3s linear infinite;
    z-index: -1;
  }

  .page-fab-book::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 17px;
    background: #0a0a0a;
    z-index: -1;
  }

  @keyframes pageGlowSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .page-fab-book canvas {
    width: 160px !important;
    height: 120px !important;
    pointer-events: none;
    image-rendering: pixelated;
  }

  .page-fab-book-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: #C9A84C;
    letter-spacing: 0.1em;
    margin-top: 4px;
    text-shadow: 0 0 8px rgba(201,168,76,0.5);
  }

  .page-fab-book-hint {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: rgba(201,168,76,0.45);
    letter-spacing: 0.05em;
    margin-top: 2px;
    animation: pageFabPulse 2s ease-in-out infinite;
  }

  @keyframes pageFabPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  .page-fab:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 28px var(--gold-glow);
    border-color: var(--gold);
  }

  .page-fab-hidden {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.85);
  }

  .page-fab-icon { font-size: 18px; }

  .page-fab-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--gold-light);
    letter-spacing: 0.08em;
  }

  .page-fab-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--blue);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
  }

  /* ── WINDOW ── */
  .page-window {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 1000;
    width: 380px;
    max-height: 600px;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    background: var(--ink-surface);
    border: 1px solid var(--ink-border-gold);
    box-shadow: 0 24px 64px rgba(0,0,0,0.8), 0 0 40px var(--gold-glow);
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transform: translateY(16px) scale(0.96);
    transition: opacity 0.25s ease, transform 0.25s ease;
    font-family: 'Syne', sans-serif;
  }

  .page-window-open {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0) scale(1);
  }

  /* top gold accent */
  .page-window::before {
    content: '';
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    flex-shrink: 0;
  }

  /* ── HEADER ── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--ink-border);
    flex-shrink: 0;
  }

  .page-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .page-avatar {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1c1500, #2e2000);
    border: 1px solid var(--gold-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .page-online-dot {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #22c55e;
    border: 2px solid var(--ink-surface);
  }

  .page-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--gold-light);
    line-height: 1.2;
  }

  .page-status {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.06em;
  }

  .page-close {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid var(--ink-border);
    background: var(--ink-surface2);
    color: rgba(255,255,255,0.5);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .page-close:hover {
    border-color: var(--gold-dim);
    color: var(--gold-light);
  }

  /* ── MESSAGES ── */
  .page-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--gold-dim) transparent;
  }

  .page-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgba(255,255,255,0.3);
    font-size: 12px;
    text-align: center;
    padding: 24px;
  }

  .page-msg-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .page-msg-user { flex-direction: row-reverse; }

  .page-msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1c1500, #2e2000);
    border: 1px solid var(--gold-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .page-msg-bubble {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 1.6;
  }

  .page-msg-page .page-msg-bubble {
    background: var(--ink-surface2);
    border: 1px solid var(--ink-border);
    border-bottom-left-radius: 4px;
    color: rgba(255,255,255,0.85);
  }

  .page-msg-user .page-msg-bubble {
    background: linear-gradient(135deg, var(--gold), #8a6510);
    color: #000;
    border-bottom-right-radius: 4px;
    font-weight: 600;
  }

  .page-msg-text { margin: 0 0 4px; }

  .page-msg-time {
    font-size: 9px;
    letter-spacing: 0.06em;
    opacity: 0.45;
    display: block;
    text-align: right;
  }

  /* typing dots */
  .page-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 16px;
    min-width: 56px;
  }

  .page-typing span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--gold-dim);
    animation: page-bounce 1.2s ease-in-out infinite;
  }

  .page-typing span:nth-child(2) { animation-delay: 0.2s; }
  .page-typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes page-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  /* ── QUICK REPLIES ── */
  .page-chips {
    padding: 0 16px 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex-shrink: 0;
  }

  .page-chip {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    letter-spacing: 0.06em;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--ink-border-gold);
    background: var(--gold-glow);
    color: var(--gold-light);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .page-chip:hover {
    background: rgba(201,168,76,0.2);
    border-color: var(--gold);
  }

  /* ── INPUT ── */
  .page-input-row {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--ink-border);
    flex-shrink: 0;
  }

  .page-input {
    flex: 1;
    background: var(--ink-surface2);
    border: 1px solid var(--ink-border);
    border-radius: 10px;
    padding: 10px 14px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    color: #fff;
    outline: none;
    transition: border-color 0.15s;
  }

  .page-input::placeholder { color: rgba(255,255,255,0.25); }

  .page-input:focus { border-color: var(--gold-dim); }

  .page-send {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--gold), #8a6510);
    border: none;
    color: #000;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s, transform 0.15s;
    flex-shrink: 0;
  }

  .page-send:hover:not(:disabled) { opacity: 0.88; transform: scale(1.05); }
  .page-send:disabled { opacity: 0.35; cursor: default; }

  /* ── FOOTER NOTE ── */
  .page-footer-note {
    font-size: 9px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.18);
    text-align: center;
    padding: 0 16px 10px;
    flex-shrink: 0;
  }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .page-window {
      width: calc(100vw - 24px);
      right: 12px;
      bottom: 12px;
      max-height: 80vh;
    }
    .page-fab {
      right: 16px;
      bottom: 16px;
    }
  }
`;

// =============================================================
// HOW TO ADD THIS TO YOUR PROJECT
// =============================================================
// 1. Save this file as: app/components/PageChatWidget.tsx
// 2. Open: app/layout.tsx
// 3. Add the import at the top:
//    import PageChatWidget from "./components/PageChatWidget";
// 4. Add the component just before </body>:
//    <PageChatWidget />
//
// =============================================================
// TO UPGRADE TO CLAUDE AI LATER
// =============================================================
// Create this file: app/api/page-chat/route.ts
//
// import Anthropic from "@anthropic-ai/sdk";
// import { NextRequest, NextResponse } from "next/server";
//
// const client = new Anthropic();
//
// export async function POST(req: NextRequest) {
//   const { messages } = await req.json();
//   const response = await client.messages.create({
//     model: "claude-sonnet-4-20250514",
//     max_tokens: 300,
//     system: `You are Page, the friendly AI reading guide for The Tiniest Library.
//       You help readers find stories, understand Ink (the site's currency),
//       learn about authors, and navigate the Reading Room.
//       Keep responses warm, brief (2-3 sentences), and literary in tone.
//       The Reading Room has serials, exclusives, and early access chapters.
//       Ink costs: unlock = 25 Ink, packs from $1-$15.`,
//     messages,
//   });
//   const text = response.content.find(b => b.type === "text")?.text ?? "";
//   return NextResponse.json({ response: text });
// }
//
// Then set USE_AI = true at the top of this file.
// Add ANTHROPIC_API_KEY to .env.local and Vercel environment variables.
// =============================================================
