"use client";

/**
 * AskTheWriter.tsx
 * ─────────────────────────────────────────────────────────────────
 * Per-story Q&A thread. Lives on the chapter reader page.
 * Readers ask questions about a specific story. The writer answers
 * when ready — async, no pressure.
 *
 * EARNED ACCESS GATE:
 * Reader must have unlocked at least 1 chapter of this story to ask.
 * This keeps the conversation genuine — no drive-by questions.
 *
 * Place at: app/components/AskTheWriter.tsx
 *
 * HOW TO USE in ChapterReaderClient.tsx:
 * Import and add below the chapter content:
 *   <AskTheWriter
 *     storyId={story.id}
 *     storySlug={story.slug}
 *     storyTitle={story.title}
 *     writerId={story.author_id}
 *     writerName={story.author_name}
 *     writerAvatar={story.cover_url}
 *     genreAccent="#C9A84C"
 *     genreAccentDim="rgba(201,168,76,0.2)"
 *   />
 *
 * TABLES NEEDED (Supabase):
 * ─────────────────────────────────────────────────────────────────
 * create table story_questions (
 *   id uuid primary key default gen_random_uuid(),
 *   story_id uuid references stories not null,
 *   asker_id uuid references auth.users not null,
 *   asker_name text not null,
 *   body text not null check (char_length(body) between 10 and 500),
 *   is_answered boolean default false,
 *   writer_answer text,
 *   answered_at timestamptz,
 *   upvotes int default 0,
 *   created_at timestamptz default now()
 * );
 * alter table story_questions enable row level security;
 * create policy "anyone can read questions"
 *   on story_questions for select using (true);
 * create policy "authed users can ask"
 *   on story_questions for insert
 *   with check (auth.uid() = asker_id);
 * create policy "writer can answer"
 *   on story_questions for update
 *   using (
 *     exists (
 *       select 1 from stories s
 *       where s.id = story_id
 *         and s.author_id = auth.uid()
 *     )
 *   );
 *
 * create table story_question_upvotes (
 *   question_id uuid references story_questions not null,
 *   user_id uuid references auth.users not null,
 *   primary key (question_id, user_id)
 * );
 * alter table story_question_upvotes enable row level security;
 * create policy "anyone can read upvotes"
 *   on story_question_upvotes for select using (true);
 * create policy "authed users can upvote"
 *   on story_question_upvotes for insert
 *   with check (auth.uid() = user_id);
 * create policy "users can remove their upvote"
 *   on story_question_upvotes for delete
 *   using (auth.uid() = user_id);
 *
 * -- RPC: check if reader has unlocked at least 1 chapter of a story
 * create or replace function has_story_access(
 *   p_user_id uuid,
 *   p_story_id uuid
 * ) returns boolean language plpgsql security definer as $$
 * begin
 *   return exists (
 *     select 1 from chapter_unlocks cu
 *     join chapters c on c.id = cu.chapter_id
 *     where cu.user_id = p_user_id
 *       and c.story_id = p_story_id
 *   );
 * end;
 * $$;
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────
interface Question {
  id: string;
  story_id: string;
  asker_id: string;
  asker_name: string;
  body: string;
  is_answered: boolean;
  writer_answer: string | null;
  answered_at: string | null;
  upvotes: number;
  created_at: string;
}

interface AskTheWriterProps {
  storyId: string;
  storySlug: string;
  storyTitle: string;
  writerId: string;
  writerName: string;
  writerAvatar?: string | null;
  genreAccent: string;
  genreAccentDim: string;
}

const MAX_Q = 500;
const MAX_A = 800;

const ATW_STYLES = `
  .atw-root {
    margin-top: 56px;
    padding-top: 40px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }

  /* Header */
  .atw-header { margin-bottom: 24px; }
  .atw-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--atw-accent); opacity: 0.75; margin-bottom: 6px; display: block;
  }
  .atw-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300;
    color: rgba(232,228,218,0.95); margin-bottom: 6px;
  }
  .atw-subtitle {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.35); line-height: 1.65;
  }

  /* Compose */
  .atw-compose {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; overflow: hidden;
    background: rgba(255,255,255,0.02);
    margin-bottom: 28px; transition: border-color 0.2s;
  }
  .atw-compose:focus-within { border-color: var(--atw-accent-dim); }
  .atw-compose-inner { padding: 14px 18px; }
  .atw-compose-textarea {
    width: 100%; background: transparent;
    border: none; outline: none; resize: none;
    font-family: 'Syne', sans-serif; font-size: 13px;
    color: rgba(232,228,218,0.8); line-height: 1.65;
    min-height: 80px; box-sizing: border-box;
  }
  .atw-compose-textarea::placeholder { color: rgba(232,228,218,0.2); }
  .atw-compose-footer {
    padding: 10px 18px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px;
  }
  .atw-compose-meta {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.25);
  }
  .atw-ask-btn {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #000; font-weight: 700;
    background: linear-gradient(135deg, var(--atw-accent), #8a6510);
    border: none; padding: 8px 20px; border-radius: 8px;
    cursor: pointer; transition: opacity 0.2s;
  }
  .atw-ask-btn:hover { opacity: 0.85; }
  .atw-ask-btn:disabled { opacity: 0.3; cursor: default; }

  /* Gate */
  .atw-gate {
    padding: 20px 24px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; margin-bottom: 28px;
    font-family: 'Syne', sans-serif; font-size: 12px;
    color: rgba(232,228,218,0.35); line-height: 1.7;
  }
  .atw-gate a { color: var(--atw-accent); text-decoration: none; }

  /* Question cards */
  .atw-questions { display: flex; flex-direction: column; gap: 14px; }

  .atw-question {
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; overflow: hidden;
    background: rgba(255,255,255,0.015);
  }
  .atw-question.answered {
    border-color: var(--atw-accent-dim);
  }

  .atw-q-body { padding: 16px 20px; }
  .atw-q-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px;
  }
  .atw-q-asker {
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 500;
    color: rgba(232,228,218,0.6);
  }
  .atw-q-time {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.2);
    margin-left: auto;
  }
  .atw-q-text {
    font-family: 'Syne', sans-serif;
    font-size: 13px; color: rgba(232,228,218,0.7);
    line-height: 1.65;
  }
  .atw-q-actions {
    display: flex; align-items: center; gap: 12px; margin-top: 12px;
  }
  .atw-upvote-btn {
    font-family: 'Syne', sans-serif;
    font-size: 10px; letter-spacing: 0.1em;
    color: rgba(232,228,218,0.3);
    background: transparent; border: 1px solid rgba(255,255,255,0.08);
    padding: 4px 12px; border-radius: 999px;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 5px;
  }
  .atw-upvote-btn:hover, .atw-upvote-btn.voted {
    color: var(--atw-accent);
    border-color: var(--atw-accent-dim);
    background: var(--atw-accent-dim);
  }
  .atw-answered-badge {
    font-family: 'Syne', sans-serif;
    font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--atw-accent);
    border: 1px solid var(--atw-accent-dim);
    background: var(--atw-accent-dim);
    padding: 2px 8px; border-radius: 999px;
  }

  /* Writer answer */
  .atw-answer {
    padding: 16px 20px;
    border-top: 1px solid var(--atw-accent-dim);
    background: rgba(201,168,76,0.03);
  }
  .atw-answer-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .atw-answer-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--atw-accent); opacity: 0.8;
  }
  .atw-answer-writer {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.5);
  }
  .atw-answer-time {
    font-family: 'Syne', sans-serif;
    font-size: 10px; color: rgba(232,228,218,0.2);
    margin-left: auto;
  }
  .atw-answer-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.75); line-height: 1.75;
  }

  /* Writer answer compose */
  .atw-writer-answer-compose {
    padding: 14px 20px;
    border-top: 1px dashed rgba(201,168,76,0.2);
    background: rgba(201,168,76,0.02);
  }
  .atw-writer-answer-label {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--atw-accent); opacity: 0.6; margin-bottom: 8px;
  }
  .atw-writer-answer-textarea {
    width: 100%; background: transparent;
    border: none; outline: none; resize: none;
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 300; font-style: italic;
    color: rgba(232,228,218,0.6); line-height: 1.7;
    box-sizing: border-box;
  }
  .atw-writer-answer-textarea::placeholder {
    color: rgba(232,228,218,0.2); font-style: italic;
  }
  .atw-writer-answer-footer {
    display: flex; justify-content: flex-end; margin-top: 8px;
  }

  /* Empty */
  .atw-empty {
    padding: 32px 24px; text-align: center;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; background: rgba(255,255,255,0.01);
  }
  .atw-empty-icon { font-size: 28px; display: block; margin-bottom: 10px; }
  .atw-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300;
    color: rgba(232,228,218,0.6); margin-bottom: 6px;
  }
  .atw-empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 11px; color: rgba(232,228,218,0.3); line-height: 1.65;
  }

  /* Tabs */
  .atw-tabs {
    display: flex; gap: 6px; margin-bottom: 20px;
  }
  .atw-tab {
    font-family: 'Syne', sans-serif;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 6px 14px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: rgba(232,228,218,0.4);
    cursor: pointer; transition: all 0.2s;
  }
  .atw-tab.active {
    color: var(--atw-accent);
    border-color: var(--atw-accent-dim);
    background: var(--atw-accent-dim);
  }

  /* Loading */
  .atw-loading {
    font-family: 'Syne', sans-serif; font-size: 11px;
    color: rgba(232,228,218,0.25); padding: 24px 0;
    text-align: center; letter-spacing: 0.1em;
  }
`;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Question Card ─────────────────────────────────────────────────
function QuestionCard({
  question, userId, writerId, writerName, onAnswered, genreAccent, genreAccentDim,
}: {
  question: Question;
  userId: string | null;
  writerId: string;
  writerName: string;
  onAnswered: (id: string, answer: string) => void;
  genreAccent: string;
  genreAccentDim: string;
}) {
  const [answerDraft, setAnswerDraft] = useState("");
  const [answering, setAnswering] = useState(false);
  const [showAnswerBox, setShowAnswerBox] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(question.upvotes);
  const isWriter = userId === writerId;

  // Check if user already upvoted
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("story_question_upvotes")
      .select("user_id")
      .eq("question_id", question.id)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => { if (data) setVoted(true); });
  }, [question.id, userId]);

  const handleUpvote = async () => {
    if (!userId || voted) return;
    setVoted(true);
    setVoteCount(v => v + 1);
    await supabase.from("story_question_upvotes").insert({
      question_id: question.id,
      user_id: userId,
    });
    await supabase
      .from("story_questions")
      .update({ upvotes: voteCount + 1 })
      .eq("id", question.id);
  };

  const handleAnswer = async () => {
    if (!answerDraft.trim() || answering) return;
    setAnswering(true);
    try {
      await supabase
        .from("story_questions")
        .update({
          writer_answer: answerDraft.trim(),
          is_answered: true,
          answered_at: new Date().toISOString(),
        })
        .eq("id", question.id);
      onAnswered(question.id, answerDraft.trim());
      setAnswerDraft("");
      setShowAnswerBox(false);
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div className={`atw-question${question.is_answered ? " answered" : ""}`}>
      <div className="atw-q-body">
        <div className="atw-q-header">
          <span className="atw-q-asker">{question.asker_name}</span>
          {question.is_answered && (
            <span className="atw-answered-badge">Answered</span>
          )}
          <span className="atw-q-time">{timeAgo(question.created_at)}</span>
        </div>
        <div className="atw-q-text">{question.body}</div>
        <div className="atw-q-actions">
          <button
            type="button"
            className={`atw-upvote-btn${voted ? " voted" : ""}`}
            onClick={handleUpvote}
            disabled={!userId || voted}
            title={voted ? "Upvoted" : "Upvote this question"}
          >
            ▲ {voteCount}
          </button>
          {isWriter && !question.is_answered && (
            <button
              type="button"
              className="atw-upvote-btn"
              onClick={() => setShowAnswerBox(v => !v)}
            >
              {showAnswerBox ? "Cancel" : "Answer"}
            </button>
          )}
        </div>
      </div>

      {/* Writer's answer compose box */}
      {isWriter && showAnswerBox && !question.is_answered && (
        <div className="atw-writer-answer-compose">
          <div className="atw-writer-answer-label">Your Answer</div>
          <textarea
            className="atw-writer-answer-textarea"
            placeholder="Write your answer here… be as detailed or brief as you like."
            value={answerDraft}
            onChange={e => setAnswerDraft(e.target.value.slice(0, MAX_A))}
            rows={4}
          />
          <div className="atw-writer-answer-footer">
            <button
              type="button"
              className="atw-ask-btn"
              disabled={!answerDraft.trim() || answering}
              onClick={handleAnswer}
            >
              {answering ? "Posting…" : "Post Answer"}
            </button>
          </div>
        </div>
      )}

      {/* Writer's answer */}
      {question.is_answered && question.writer_answer && (
        <div className="atw-answer">
          <div className="atw-answer-header">
            <span className="atw-answer-label">Writer's Answer</span>
            <span className="atw-answer-writer">{writerName}</span>
            {question.answered_at && (
              <span className="atw-answer-time">{timeAgo(question.answered_at)}</span>
            )}
          </div>
          <div className="atw-answer-text">{question.writer_answer}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function AskTheWriter({
  storyId, storyTitle, writerId, writerName, writerAvatar,
  genreAccent, genreAccentDim,
}: AskTheWriterProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [tab, setTab] = useState<"all" | "answered" | "unanswered">("all");

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: writer } = await supabase
        .from("writers")
        .select("name")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setUserName(writer?.name ?? data.user.email?.split("@")[0] ?? "Reader");

      // Check access
      const { data: access } = await supabase.rpc("has_story_access", {
        p_user_id: data.user.id,
        p_story_id: storyId,
      });
      setHasAccess(Boolean(access) || data.user.id === writerId);
    });
  }, [storyId, writerId]);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("story_questions")
      .select("*")
      .eq("story_id", storyId)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setQuestions(data as Question[]);
    setLoading(false);
  }, [storyId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleAsk = async () => {
    if (!userId || !draft.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await supabase
        .from("story_questions")
        .insert({
          story_id: storyId,
          asker_id: userId,
          asker_name: userName,
          body: draft.trim(),
        })
        .select()
        .single();
      if (data) {
        setQuestions(prev => [data as Question, ...prev]);
        setDraft("");
      }
    } finally {
      setPosting(false);
    }
  };

  const handleAnswered = (id: string, answer: string) => {
    setQuestions(prev => prev.map(q =>
      q.id === id
        ? { ...q, is_answered: true, writer_answer: answer, answered_at: new Date().toISOString() }
        : q
    ));
  };

  const filtered = questions.filter(q => {
    if (tab === "answered") return q.is_answered;
    if (tab === "unanswered") return !q.is_answered;
    return true;
  });

  const answeredCount = questions.filter(q => q.is_answered).length;

  return (
    <>
      <style>{ATW_STYLES}</style>
      <div
        className="atw-root"
        style={{
          "--atw-accent": genreAccent,
          "--atw-accent-dim": genreAccentDim,
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="atw-header">
          <span className="atw-eyebrow">Story Discussion</span>
          <div className="atw-title">Ask the Writer</div>
          <div className="atw-subtitle">
            Questions about <em>{storyTitle}</em> — answered by {writerName} when ready.
            Unlock a chapter to join the conversation.
          </div>
        </div>

        {/* Compose or gate */}
        {!userId ? (
          <div className="atw-gate">
            <a href="/reading-room/login">Sign in</a> and unlock a chapter to ask {writerName} a question.
          </div>
        ) : !hasAccess ? (
          <div className="atw-gate">
            Unlock at least one chapter of <em>{storyTitle}</em> to ask a question.
            Your question deserves to come from someone who's read the work.
          </div>
        ) : userId !== writerId ? (
          <div className="atw-compose">
            <div className="atw-compose-inner">
              <textarea
                className="atw-compose-textarea"
                placeholder={`Ask ${writerName} anything about ${storyTitle}… character choices, world-building, what comes next…`}
                value={draft}
                onChange={e => setDraft(e.target.value.slice(0, MAX_Q))}
                rows={3}
              />
            </div>
            <div className="atw-compose-footer">
              <span className="atw-compose-meta">{draft.length}/{MAX_Q}</span>
              <button
                type="button"
                className="atw-ask-btn"
                disabled={draft.trim().length < 10 || posting}
                onClick={handleAsk}
              >
                {posting ? "Posting…" : "Ask"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        {questions.length > 0 && (
          <div className="atw-tabs">
            <button
              type="button"
              className={`atw-tab${tab === "all" ? " active" : ""}`}
              onClick={() => setTab("all")}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              className={`atw-tab${tab === "answered" ? " active" : ""}`}
              onClick={() => setTab("answered")}
            >
              Answered ({answeredCount})
            </button>
            <button
              type="button"
              className={`atw-tab${tab === "unanswered" ? " active" : ""}`}
              onClick={() => setTab("unanswered")}
            >
              Waiting ({questions.length - answeredCount})
            </button>
          </div>
        )}

        {/* Questions */}
        {loading ? (
          <div className="atw-loading">Loading questions…</div>
        ) : filtered.length === 0 ? (
          <div className="atw-empty">
            <span className="atw-empty-icon">🪶</span>
            <div className="atw-empty-title">
              {tab === "answered"
                ? "No answered questions yet."
                : tab === "unanswered"
                ? "All questions answered!"
                : "No questions yet."
              }
            </div>
            <p className="atw-empty-text">
              {tab === "all" && hasAccess
                ? `Be the first to ask ${writerName} something about ${storyTitle}.`
                : tab === "all"
                ? `Unlock a chapter to start the conversation with ${writerName}.`
                : ""
              }
            </p>
          </div>
        ) : (
          <div className="atw-questions">
            {filtered.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                userId={userId}
                writerId={writerId}
                writerName={writerName}
                onAnswered={handleAnswered}
                genreAccent={genreAccent}
                genreAccentDim={genreAccentDim}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
