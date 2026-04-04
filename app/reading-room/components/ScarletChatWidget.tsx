"use client";

import { useState, useEffect, useRef } from "react";

// =========================
// ScarletChatWidget
// Drop in: app/reading-room/components/ScarletChatWidget.tsx
// Adult 18+ section AI guide — pixel candle FAB
// =========================

const SCARLET_SYSTEM_PROMPT = `You are Scarlet, the AI guide for the Adult 18+ section of The Tiniest Library (TTL). You appear as a glowing candle in the corner of the screen.

You are sophisticated, direct, and unapologetically adult. You speak like a knowledgeable literary companion who respects mature readers and treats them as the adults they are. You are never crude or gratuitous — you are literary and precise about adult content.

ABOUT THE ADULT 18+ SECTION:
- This section contains explicit content for verified adult readers only
- All content features characters who are explicitly 18 or older
- Genres include: explicit romance, dark fiction, graphic horror, literary erotica, adult thrillers, and more
- Writers must sign a special Adult Content Agreement to publish here
- Content is age-gated — readers must verify their age via a TTL account

WHAT YOU HELP WITH:
- Finding adult fiction by theme, trope, or genre
- Explaining the content guidelines for this section
- Helping readers understand what types of content are available
- Directing writers to apply at the-writer-s-room.read.the-tiniest-library.com/apply
- Explaining the Ink economy and how to unlock stories

ABSOLUTE RULES YOU ENFORCE:
- All characters in sexual situations are adults (18+) — no exceptions
- You will not recommend, discuss, or engage with any content involving minors in sexual contexts
- If asked about such content, you firmly decline and explain the zero-tolerance policy

TONE:
- Sophisticated and literary, never crude
- Direct and confident — adult readers don't need hedging
- Warm but not playful — this section has a different energy than the main Reading Room
- Brief responses — 2-4 sentences usually

QUICK REFERENCE:
- Reading Room: /reading-room
- Adult 18+ genre: /reading-room/genres/adult-18
- Apply to write: the-writer-s-room.read.the-tiniest-library.com/apply
- Ink packs: available on the Reading Room home page
- Age verification: required via free TTL account`;

type Message = { role: "user" | "assistant"; content: string };

const GREETINGS_NEW = [
  "Welcome to the Adult 18+ section. I'm Scarlet — your guide to mature fiction on TTL. What are you looking for tonight?",
  "You've found the candlelit corner of TTL. I'm Scarlet. Ask me anything about our adult fiction collection.",
  "The Adult 18+ section is all yours. I'm Scarlet — tell me what kind of story you're in the mood for.",
];

const GREETINGS_RETURNING = [
  "Welcome back. The candle's still burning. What can I find for you?",
  "Good to see you again. Looking for something specific, or shall I make a suggestion?",
  "Back again — I like that. What are we reading tonight?",
];

const QUICK_REPLIES = [
  "What's available?",
  "Content rules?",
  "How do I unlock?",
  "Write for TTL",
];

export default function ScarletChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [flame, setFlame] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReturning = localStorage.getItem("ttl_scarlet_visited");
    const pool = isReturning ? GREETINGS_RETURNING : GREETINGS_NEW;
    setGreeting(pool[Math.floor(Math.random() * pool.length)]);
    if (!isReturning) localStorage.setItem("ttl_scarlet_visited", "true");
  }, []);

  useEffect(() => {
    if (open && messages.length === 0 && greeting) {
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open, greeting]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Candle flicker animation
  useEffect(() => {
    const interval = setInterval(() => setFlame(f => !f), 800 + Math.random() * 400);
    return () => clearInterval(interval);
  }, []);

  const send = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/page-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: SCARLET_SYSTEM_PROMPT,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "I'm having trouble connecting. Try again in a moment.";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700&display=swap');

        .sc-fab-wrap {
          position: fixed; bottom: 28px; right: 28px; z-index: 200;
          display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
        }

        /* Pixel candle FAB */
        .sc-fab {
          width: 64px; height: 64px; cursor: pointer;
          position: relative; background: none; border: none; padding: 0;
          filter: drop-shadow(0 0 12px rgba(201,68,68,0.6));
          transition: filter 0.3s;
        }
        .sc-fab:hover { filter: drop-shadow(0 0 20px rgba(201,68,68,0.9)); }

        .sc-fab-label {
          font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(201,68,68,0.8);
          text-align: center;
        }

        /* Chat panel */
        .sc-panel {
          position: fixed; bottom: 110px; right: 28px; z-index: 200;
          width: 360px; max-height: 520px;
          background: #0a0505;
          border: 1px solid rgba(201,68,68,0.35);
          border-radius: 12px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(180,30,30,0.15);
        }

        .sc-panel-top {
          height: 2px;
          background: linear-gradient(90deg, transparent, #c84444, #ff6666, #c84444, transparent);
        }

        .sc-panel-header {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(201,68,68,0.15);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(180,30,30,0.08);
        }

        .sc-header-left { display: flex; align-items: center; gap: 10px; }

        .sc-header-candle {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .sc-header-name {
          font-family: 'Cormorant Garamond', serif; font-size: 16px;
          font-weight: 400; color: #f0ece2;
        }

        .sc-header-status {
          font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(201,68,68,0.7);
          display: flex; align-items: center; gap: 5px;
        }

        .sc-status-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #c84444; animation: sc-pulse 2s ease-in-out infinite;
        }

        @keyframes sc-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .sc-close {
          font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(240,236,226,0.3);
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
        }
        .sc-close:hover { color: rgba(240,236,226,0.6); }

        .sc-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .sc-messages::-webkit-scrollbar { width: 3px; }
        .sc-messages::-webkit-scrollbar-track { background: transparent; }
        .sc-messages::-webkit-scrollbar-thumb { background: rgba(201,68,68,0.3); border-radius: 2px; }

        .sc-msg {
          max-width: 88%; padding: 10px 14px; border-radius: 8px;
          font-family: 'Syne', sans-serif; font-size: 12px; line-height: 1.65;
        }

        .sc-msg-assistant {
          background: rgba(180,30,30,0.12); border: 1px solid rgba(201,68,68,0.2);
          color: rgba(240,236,226,0.85); align-self: flex-start;
          border-radius: 2px 8px 8px 8px;
        }

        .sc-msg-user {
          background: rgba(100,149,237,0.12); border: 1px solid rgba(100,149,237,0.2);
          color: rgba(240,236,226,0.75); align-self: flex-end;
          border-radius: 8px 2px 8px 8px;
        }

        .sc-typing {
          display: flex; gap: 4px; align-items: center; padding: 4px 0;
        }
        .sc-typing span {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(201,68,68,0.6);
          animation: sc-bounce 1.2s ease-in-out infinite;
        }
        .sc-typing span:nth-child(2) { animation-delay: 0.2s; }
        .sc-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes sc-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

        .sc-quick-replies {
          padding: 8px 16px 12px; display: flex; flex-wrap: wrap; gap: 6px;
        }

        .sc-quick-btn {
          font-family: 'Syne', sans-serif; font-size: 9px; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(201,68,68,0.75);
          border: 1px solid rgba(201,68,68,0.25); background: rgba(180,30,30,0.08);
          padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
        }
        .sc-quick-btn:hover { background: rgba(180,30,30,0.18); color: rgba(201,68,68,1); }

        .sc-input-row {
          padding: 12px 16px;
          border-top: 1px solid rgba(201,68,68,0.12);
          display: flex; gap: 8px; align-items: center;
          background: rgba(0,0,0,0.3);
        }

        .sc-input {
          flex: 1; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,68,68,0.2); border-radius: 6px;
          padding: 9px 12px; font-family: 'Syne', sans-serif;
          font-size: 12px; color: rgba(240,236,226,0.85); outline: none;
          transition: border-color 0.2s;
        }
        .sc-input::placeholder { color: rgba(240,236,226,0.2); }
        .sc-input:focus { border-color: rgba(201,68,68,0.5); }

        .sc-send {
          width: 34px; height: 34px; border-radius: 6px; flex-shrink: 0;
          background: linear-gradient(135deg, #c84444, #8a1515);
          border: none; cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 14px; transition: opacity 0.2s;
        }
        .sc-send:hover:not(:disabled) { opacity: 0.85; }
        .sc-send:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <div className="sc-fab-wrap">
        {open && (
          <div className="sc-panel">
            <div className="sc-panel-top" />
            <div className="sc-panel-header">
              <div className="sc-header-left">
                <div className="sc-header-candle">🕯️</div>
                <div>
                  <div className="sc-header-name">Scarlet</div>
                  <div className="sc-header-status">
                    <div className="sc-status-dot" />
                    Adult 18+ Guide
                  </div>
                </div>
              </div>
              <button className="sc-close" onClick={() => setOpen(false)}>Close ✕</button>
            </div>

            <div className="sc-messages">
              {messages.map((m, i) => (
                <div key={i} className={`sc-msg sc-msg-${m.role}`}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="sc-msg sc-msg-assistant">
                  <div className="sc-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="sc-quick-replies">
                {QUICK_REPLIES.map(q => (
                  <button key={q} className="sc-quick-btn" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}

            <div className="sc-input-row">
              <input
                className="sc-input"
                placeholder="Ask Scarlet anything…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
              />
              <button className="sc-send" disabled={!input.trim() || loading} onClick={() => send()}>
                →
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {/* Pixel candle SVG */}
          <button className="sc-fab" onClick={() => setOpen(o => !o)} aria-label="Open Scarlet">
            <svg width="64" height="64" viewBox="0 0 16 16" style={{ imageRendering: "pixelated", width: 64, height: 64 }}>
              {/* Flame */}
              <rect x="7" y="1" width="2" height="1" fill={flame ? "#ffdd44" : "#ffaa22"} />
              <rect x="6" y="2" width="4" height="1" fill={flame ? "#ffcc33" : "#ff9922"} />
              <rect x="6" y="3" width="4" height="1" fill={flame ? "#ff8833" : "#cc5511"} />
              <rect x="7" y="4" width="2" height="1" fill={flame ? "#ff6622" : "#aa3311"} />
              {/* Wax drip glow */}
              <rect x="6" y="5" width="4" height="1" fill="rgba(201,68,68,0.4)" />
              {/* Candle body */}
              <rect x="5" y="6" width="6" height="7" fill="#c84444" />
              {/* Candle highlight */}
              <rect x="6" y="6" width="1" height="7" fill="#d85555" />
              {/* Candle base */}
              <rect x="4" y="13" width="8" height="2" fill="#a03333" />
              <rect x="3" y="14" width="10" height="1" fill="#8a2222" />
              {/* Wax drip */}
              <rect x="5" y="8" width="1" height="3" fill="#d85555" />
              <rect x="10" y="7" width="1" height="2" fill="#d85555" />
              {/* Flame glow overlay */}
              <rect x="5" y="1" width="6" height="5" fill="rgba(255,180,0,0.08)" />
            </svg>
          </button>
          <span className="sc-fab-label">Scarlet</span>
        </div>
      </div>
    </>
  );
}
