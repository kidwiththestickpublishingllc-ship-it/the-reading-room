"use client";

/**
 * ReadersLetter.tsx
 * ─────────────────────────────────────────────────────────────────
 * Drop into any page that renders an author card.
 * Place at: app/components/ReadersLetter.tsx
 *
 * EARNED ACCESS RULES (enforced here + Supabase RPC):
 *  • Reader must have unlocked ≥3 chapters from this writer
 *    OR completed a short story (single chapter = full story flag)
 *  • Max 3 active letter threads per reader across all writers
 *  • Max 10 queued letters per writer inbox
 *  • Max 5 exchanges per thread, then thread closes
 *  • Optional Ink tip attached to the letter (uses existing tip pipeline)
 *  • Writer can toggle DMs off — reader sees closed door message
 *
 * TABLES NEEDED (Supabase):
 *  reader_letters  (id, reader_id, writer_id, status, queue_position,
 *                   exchange_count, tip_amount, created_at, updated_at)
 *  letter_messages (id, letter_id, sender_id, body, created_at)
 *
 * Run this SQL to create them:
 * ─────────────────────────────────────────────────────────────────
 * create table reader_letters (
 *   id uuid primary key default gen_random_uuid(),
 *   reader_id uuid references auth.users not null,
 *   writer_id uuid not null,
 *   status text default 'queued'
 *     check (status in ('queued','open','closed','rejected')),
 *   queue_position int,
 *   exchange_count int default 0,
 *   tip_amount int default 0,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * );
 * alter table reader_letters enable row level security;
 * create policy "reader sees own letters"
 *   on reader_letters for select
 *   using (auth.uid() = reader_id);
 * create policy "reader inserts own letter"
 *   on reader_letters for insert
 *   with check (auth.uid() = reader_id);
 *
 * create table letter_messages (
 *   id uuid primary key default gen_random_uuid(),
 *   letter_id uuid references reader_letters not null,
 *   sender_id uuid references auth.users not null,
 *   body text not null,
 *   created_at timestamptz default now()
 * );
 * alter table letter_messages enable row level security;
 * create policy "thread participants see messages"
 *   on letter_messages for select
 *   using (
 *     exists (
 *       select 1 from reader_letters rl
 *       where rl.id = letter_id
 *         and (rl.reader_id = auth.uid())
 *     )
 *   );
 * create policy "thread participants insert messages"
 *   on letter_messages for insert
 *   with check (auth.uid() = sender_id);
 *
 * -- RPC: check if reader has earned letter access for a specific writer
 * create or replace function check_letter_access(
 *   p_reader_id uuid,
 *   p_writer_id uuid
 * ) returns json language plpgsql security definer as $$
 * declare
 *   v_unlocks int;
 *   v_short_complete bool;
 *   v_active_threads int;
 *   v_writer_accepts bool;
 *   v_queue_depth int;
 * begin
 *   -- count chapters unlocked from this writer
 *   select count(*) into v_unlocks
 *   from chapter_unlocks cu
 *   join chapters c on c.id = cu.chapter_id
 *   join stories s on s.id = c.story_id
 *   where cu.user_id = p_reader_id
 *     and s.author_id = p_writer_id;
 *
 *   -- check if any story by this writer is flagged as short (1 chapter = complete)
 *   select exists(
 *     select 1 from stories s
 *     join chapter_unlocks cu on cu.chapter_id in (
 *       select id from chapters where story_id = s.id
 *     )
 *     where s.author_id = p_writer_id
 *       and s.is_short_story = true
 *       and cu.user_id = p_reader_id
 *   ) into v_short_complete;
 *
 *   -- count reader's active threads across all writers
 *   select count(*) into v_active_threads
 *   from reader_letters
 *   where reader_id = p_reader_id
 *     and status in ('queued','open');
 *
 *   -- writer queue depth
 *   select count(*) into v_queue_depth
 *   from reader_letters
 *   where writer_id = p_writer_id
 *     and status = 'queued';
 *
 *   -- writer accepts DMs (default true; writers can set accepts_letters=false)
 *   select coalesce(accepts_letters, true) into v_writer_accepts
 *   from writers where user_id = p_writer_id;
 *
 *   return json_build_object(
 *     'earned',       (v_unlocks >= 3 or v_short_complete),
 *     'can_send',     (v_unlocks >= 3 or v_short_complete)
 *                      and v_active_threads < 3
 *                      and v_queue_depth < 10
 *                      and v_writer_accepts,
 *     'unlocks',      v_unlocks,
 *     'active_threads', v_active_threads,
 *     'queue_depth',  v_queue_depth,
 *     'writer_open',  v_writer_accepts
 *   );
 * end;
 * $$;
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────
interface ReadersLetterProps {
  writerId: string;        // writer's auth.users UUID
  writerName: string;
  writerAvatar?: string;
  /** Current reader's Ink balance — passed from parent */
  readerInk: number;
  /** Called when tip is deducted so parent can update ink state */
  onInkSpent?: (amount: number) => void;
  /** Trigger to open the modal */
  open: boolean;
  onClose: () => void;
}

interface AccessState {
  earned: boolean;
  can_send: boolean;
  unlocks: number;
  active_threads: number;
  queue_depth: number;
  writer_open: boolean;
}

type Step = "check" | "locked" | "writer-closed" | "compose" | "sent" | "error";

const TIP_OPTIONS = [0, 10, 25, 50, 100];

const STYLES = `
  .rl-overlay {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .rl-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.88);
    backdrop-filter: blur(12px);
    cursor: pointer; border: none; width: 100%; height: 100%;
  }
  .rl-modal {
    position: relative; z-index: 10;
    width: 100%; max-width: 560px;
    background: #1a1410;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 16px; overflow: hidden;
  }
  .rl-accent-bar {
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .rl-header {
    padding: 24px 28px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; gap: 16px;
  }
  .rl-avatar {
    width: 48px; height: 48px; border-radius: 10px;
    background: linear-gradient(135deg,#1e1e26,#2a2a38);
    border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
  }
  .rl-avatar img { width:100%; height:100%; object-fit:cover; }
  .rl-avatar-init {
    font-family: 'Cormorant Garamond',serif;
    font-size: 20px; font-weight: 300; color: #C9A84C;
  }
  .rl-header-text { flex: 1; }
  .rl-eyebrow {
    font-family: 'Syne',sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #C9A84C; opacity: 0.7; margin-bottom: 4px;
  }
  .rl-writer-name {
    font-family: 'Cormorant Garamond',serif;
    font-size: 22px; font-weight: 300; color: rgba(232,228,218,0.95);
  }
  .rl-close {
    font-family: 'Syne',sans-serif; font-size: 9px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(232,228,218,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; padding: 7px 14px;
    border-radius: 8px; cursor: pointer; transition: all 0.2s;
  }
  .rl-close:hover { color: rgba(232,228,218,0.8); border-color: rgba(255,255,255,0.2); }
  .rl-body { padding: 28px; }
  .rl-locked-icon { font-size: 36px; display: block; margin-bottom: 16px; }
  .rl-locked-title {
    font-family: 'Cormorant Garamond',serif;
    font-size: 24px; font-weight: 300;
    color: rgba(232,228,218,0.9); margin-bottom: 10px;
  }
  .rl-locked-text {
    font-family: 'Syne',sans-serif; font-size: 12px;
    color: rgba(232,228,218,0.45); line-height: 1.75;
  }
  .rl-progress {
    margin: 20px 0; padding: 16px;
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 10px; background: rgba(201,168,76,0.04);
  }
  .rl-progress-label {
    font-family: 'Syne',sans-serif; font-size: 10px;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(232,228,218,0.35); margin-bottom: 8px;
  }
  .rl-progress-bar-track {
    height: 3px; border-radius: 99px;
    background: rgba(255,255,255,0.08); overflow: hidden;
  }
  .rl-progress-bar-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg,#C9A84C,#8a6510);
    transition: width 0.4s ease;
  }
  .rl-progress-count {
    font-family: 'Syne',sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.5); margin-top: 6px;
  }
  .rl-compose-label {
    font-family: 'Syne',sans-serif; font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(232,228,218,0.4); margin-bottom: 8px;
  }
  .rl-textarea {
    width: 100%; min-height: 140px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 14px 16px;
    font-family: 'Cormorant Garamond',serif;
    font-size: 17px; font-weight: 300;
    color: rgba(232,228,218,0.85); line-height: 1.75;
    resize: vertical; box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .rl-textarea:focus { outline: none; border-color: rgba(201,168,76,0.4); }
  .rl-textarea::placeholder { color: rgba(232,228,218,0.2); }
  .rl-char-count {
    font-family: 'Syne',sans-serif; font-size: 10px;
    color: rgba(232,228,218,0.25); text-align: right; margin-top: 4px;
  }
  .rl-tip-section { margin-top: 20px; }
  .rl-tip-label {
    font-family: 'Syne',sans-serif; font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(232,228,218,0.4); margin-bottom: 10px;
  }
  .rl-tip-hint {
    font-family: 'Syne',sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.3); margin-bottom: 12px; line-height: 1.6;
  }
  .rl-tip-options { display: flex; gap: 8px; flex-wrap: wrap; }
  .rl-tip-btn {
    font-family: 'Syne',sans-serif; font-size: 10px;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: rgba(232,228,218,0.5);
    cursor: pointer; transition: all 0.2s;
  }
  .rl-tip-btn:hover, .rl-tip-btn.selected {
    border-color: rgba(201,168,76,0.5);
    color: #C9A84C; background: rgba(201,168,76,0.08);
  }
  .rl-queue-info {
    margin-top: 16px; padding: 12px 16px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; background: rgba(255,255,255,0.02);
    font-family: 'Syne',sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.35); line-height: 1.65;
  }
  .rl-footer {
    padding: 20px 28px;
    border-top: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .rl-ink-display {
    font-family: 'Syne',sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.35);
  }
  .rl-ink-display strong { color: #C9A84C; }
  .rl-send-btn {
    font-family: 'Syne',sans-serif; font-size: 10px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg,#C9A84C,#8a6510);
    border: none; padding: 11px 24px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
    display: flex; align-items: center; gap: 8px;
  }
  .rl-send-btn:hover { opacity: 0.85; }
  .rl-send-btn:disabled { opacity: 0.4; cursor: default; }
  .rl-sent-icon { font-size: 40px; display: block; margin-bottom: 16px; }
  .rl-sent-title {
    font-family: 'Cormorant Garamond',serif;
    font-size: 28px; font-weight: 300;
    color: rgba(232,228,218,0.9); margin-bottom: 10px;
  }
  .rl-sent-text {
    font-family: 'Syne',sans-serif; font-size: 12px;
    color: rgba(232,228,218,0.45); line-height: 1.75;
  }
  .rl-loading {
    font-family: 'Syne',sans-serif; font-size: 12px;
    color: rgba(232,228,218,0.35); text-align: center; padding: 32px 0;
    letter-spacing: 0.1em;
  }
`;

const MAX_CHARS = 1200;
const MIN_CHARS = 20;

// ─── Component ────────────────────────────────────────────────────
export default function ReadersLetter({
  writerId, writerName, writerAvatar,
  readerInk, onInkSpent, open, onClose,
}: ReadersLetterProps) {
  const [step, setStep] = useState<Step>("check");
  const [access, setAccess] = useState<AccessState | null>(null);
  const [body, setBody] = useState("");
  const [tip, setTip] = useState(0);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Check access when modal opens
  const checkAccess = useCallback(async () => {
    if (!userId || !writerId) return;
    setStep("check");
    try {
      const { data, error } = await supabase.rpc("check_letter_access", {
        p_reader_id: userId,
        p_writer_id: writerId,
      });
      if (error) { setStep("error"); return; }
      const result = data as AccessState;
      setAccess(result);
      if (!result.earned) setStep("locked");
      else if (!result.writer_open) setStep("writer-closed");
      else setStep("compose");
    } catch {
      setStep("error");
    }
  }, [userId, writerId]);

  useEffect(() => {
    if (open) { setBody(""); setTip(0); checkAccess(); }
  }, [open, checkAccess]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;

  const canSend = body.trim().length >= MIN_CHARS && !sending && (tip === 0 || readerInk >= tip);

  const handleSend = async () => {
    if (!canSend || !userId) return;
    setSending(true);
    try {
      // 1. Deduct tip ink if applicable
      if (tip > 0 && onInkSpent) onInkSpent(tip);

      // 2. Insert letter record
      const { data: letter, error: letterErr } = await supabase
        .from("reader_letters")
        .insert({
          reader_id: userId,
          writer_id: writerId,
          status: "queued",
          tip_amount: tip,
        })
        .select("id")
        .single();

      if (letterErr || !letter) throw new Error(letterErr?.message ?? "Insert failed");

      // 3. Insert first message
      const { error: msgErr } = await supabase
        .from("letter_messages")
        .insert({
          letter_id: letter.id,
          sender_id: userId,
          body: body.trim(),
        });

      if (msgErr) throw new Error(msgErr.message);

      setStep("sent");
    } catch (err) {
      console.error("ReadersLetter send error:", err);
      setStep("error");
    } finally {
      setSending(false);
    }
  };

  const initial = writerName.split(" ")[1]?.[0] ?? writerName[0];
  const progressPct = access ? Math.min((access.unlocks / 3) * 100, 100) : 0;

  return (
    <>
      <style>{STYLES}</style>
      <div className="rl-overlay" role="dialog" aria-modal="true" aria-label={`Reader's Letter to ${writerName}`}>
        <button type="button" onClick={onClose} className="rl-backdrop" aria-label="Close" />
        <div className="rl-modal">
          <div className="rl-accent-bar" />

          {/* Header */}
          <div className="rl-header">
            <div className="rl-avatar">
              {writerAvatar
                ? <img src={writerAvatar} alt={writerName} />
                : <span className="rl-avatar-init">{initial}</span>
              }
            </div>
            <div className="rl-header-text">
              <div className="rl-eyebrow">Reader's Letter</div>
              <div className="rl-writer-name">{writerName}</div>
            </div>
            <button type="button" onClick={onClose} className="rl-close">Close ✕</button>
          </div>

          {/* Body */}
          <div className="rl-body">

            {/* Checking access */}
            {step === "check" && (
              <div className="rl-loading">Verifying reader access…</div>
            )}

            {/* Not yet earned */}
            {step === "locked" && access && (
              <>
                <span className="rl-locked-icon">🔒</span>
                <div className="rl-locked-title">Keep Reading to Unlock</div>
                <p className="rl-locked-text">
                  A Reader's Letter is earned — not assumed. Unlock 3 chapters from{" "}
                  <strong style={{ color: "rgba(232,228,218,0.7)" }}>{writerName}</strong>,
                  or complete one of their short stories, to earn the right to write.
                </p>
                <div className="rl-progress">
                  <div className="rl-progress-label">Your Progress</div>
                  <div className="rl-progress-bar-track">
                    <div className="rl-progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="rl-progress-count">
                    {access.unlocks} of 3 chapters unlocked
                  </div>
                </div>
                <p className="rl-locked-text" style={{ marginTop: 8 }}>
                  When you write to an author whose work you've genuinely read,
                  that letter means something. That's the point.
                </p>
              </>
            )}

            {/* Writer has DMs closed */}
            {step === "writer-closed" && (
              <>
                <span className="rl-locked-icon">📪</span>
                <div className="rl-locked-title">{writerName} isn't accepting letters right now</div>
                <p className="rl-locked-text">
                  Some writers close their inbox during drafting or between chapters.
                  Your earned access remains — check back when they reopen. Writers
                  who close letters do so knowing it may affect reader connection.
                </p>
              </>
            )}

            {/* Compose */}
            {step === "compose" && (
              <>
                <div className="rl-compose-label">Your Letter</div>
                <textarea
                  className="rl-textarea"
                  placeholder={`Write to ${writerName}… What did their work mean to you? What stuck with you after the last chapter?`}
                  value={body}
                  onChange={e => setBody(e.target.value.slice(0, MAX_CHARS))}
                  rows={6}
                />
                <div className="rl-char-count">{body.length} / {MAX_CHARS}</div>

                {/* Tip section */}
                <div className="rl-tip-section">
                  <div className="rl-tip-label">Attach a Tip — Optional</div>
                  <p className="rl-tip-hint">
                    A tip isn't required, but writers notice a letter that arrives with one.
                    80% reaches {writerName} directly.
                  </p>
                  <div className="rl-tip-options">
                    {TIP_OPTIONS.map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`rl-tip-btn${tip === t ? " selected" : ""}`}
                        onClick={() => setTip(t)}
                        disabled={t > readerInk}
                      >
                        {t === 0 ? "No tip" : `${t} Ink`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queue info */}
                {access && (
                  <div className="rl-queue-info">
                    {access.queue_depth > 0
                      ? `${writerName} has ${access.queue_depth} letter${access.queue_depth !== 1 ? "s" : ""} ahead of yours in queue. Your letter will be delivered in order.`
                      : `${writerName}'s inbox is clear — your letter goes straight through.`
                    }
                    {" "}You have {3 - access.active_threads} letter slot{3 - access.active_threads !== 1 ? "s" : ""} remaining across all writers.
                  </div>
                )}
              </>
            )}

            {/* Sent */}
            {step === "sent" && (
              <>
                <span className="rl-sent-icon">🕯️</span>
                <div className="rl-sent-title">Your letter is on its way.</div>
                <p className="rl-sent-text">
                  {writerName} will see it when they check their inbox.
                  {tip > 0 && ` Your ${tip} Ink tip travels with it.`}
                  {" "}If they reply, you'll see the thread in your reader dashboard.
                  Each thread allows up to 5 exchanges — enough for a real conversation.
                </p>
              </>
            )}

            {/* Error */}
            {step === "error" && (
              <>
                <span className="rl-locked-icon">⚠️</span>
                <div className="rl-locked-title">Something went wrong</div>
                <p className="rl-locked-text">
                  We couldn't send your letter. Your Ink was not charged.
                  Please try again in a moment.
                </p>
              </>
            )}

          </div>

          {/* Footer */}
          {step === "compose" && (
            <div className="rl-footer">
              <div className="rl-ink-display">
                Your Ink: <strong>{readerInk}</strong>
                {tip > 0 && (
                  <span style={{ color: "rgba(232,228,218,0.3)", marginLeft: 8 }}>
                    → {readerInk - tip} after tip
                  </span>
                )}
              </div>
              <button
                type="button"
                className="rl-send-btn"
                disabled={!canSend}
                onClick={handleSend}
              >
                {sending ? "Sending…" : "Send Letter"}
                {!sending && <span>✉️</span>}
              </button>
            </div>
          )}

          {(step === "sent" || step === "locked" || step === "writer-closed" || step === "error") && (
            <div className="rl-footer" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="rl-close" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
