// app/contact/page.tsx
// Contact — The Tiniest Library (Reading Room)
// Server component. No "use client" — renders as real HTML for crawlers.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach The Tiniest Library — support, writer and artist enquiries, copyright, and press.",
  alternates: { canonical: "https://read.the-tiniest-library.com/contact" },
};

const EMAIL = "kidwiththestickpublishingllc@gmail.com";

const REASONS = [
  {
    label: "Reader support",
    body: "Trouble signing in, a missing unlock, an Ink balance that looks wrong, or anything that is simply not working. Include the email on your account and what you were doing when it broke.",
    subject: "Reader support",
  },
  {
    label: "Writers and artists",
    body: "Questions about publishing on TTL, earnings, payouts, or your creator dashboard. If you want to publish with us, the application form is the faster route.",
    subject: "Creator enquiry",
  },
  {
    label: "Copyright",
    body: "If something on TTL infringes your copyright, write with the subject line Copyright Complaint. The Terms page lists what to include so we can act on it straight away.",
    subject: "Copyright Complaint",
  },
  {
    label: "Press and partnerships",
    body: "Interviews, features, collaborations, or anything about the imprint itself.",
    subject: "Press enquiry",
  },
  {
    label: "Privacy",
    body: "Requests to access, correct, or delete your personal data. We respond within 30 days.",
    subject: "Privacy request",
  },
];

const STYLES = `
  .pol-wrap {
    max-width: 780px;
    margin: 0 auto;
    padding: 72px 24px 96px;
    color: #E8E4DA;
    font-family: 'Syne', system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.8;
  }
  .pol-eyebrow {
    font-size: 9px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #C9A84C;
    margin-bottom: 14px;
  }
  .pol-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 44px;
    font-weight: 300;
    line-height: 1.1;
    color: #F0ECE2;
    margin: 0 0 10px;
  }
  .pol-lede {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 19px;
    font-style: italic;
    color: rgba(232,228,218,0.6);
    margin-bottom: 44px;
    padding-bottom: 28px;
    border-bottom: 1px solid rgba(201,168,76,0.2);
    line-height: 1.6;
  }
  .pol-wrap h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 26px;
    font-weight: 400;
    color: #C9A84C;
    margin: 44px 0 14px;
    line-height: 1.2;
  }
  .pol-wrap p { margin: 0 0 16px; color: rgba(232,228,218,0.78); }
  .pol-wrap a { color: #C9A84C; text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.35); }
  .pol-wrap a:hover { border-bottom-color: #C9A84C; }
  .pol-wrap strong { color: #F0ECE2; font-weight: 600; }

  .pol-mail {
    display: block;
    background: rgba(201,168,76,0.05);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 12px;
    padding: 26px 28px;
    margin: 0 0 12px;
    text-decoration: none;
    border-bottom: 1px solid rgba(201,168,76,0.3);
  }
  .pol-mail:hover { background: rgba(201,168,76,0.09); border-color: rgba(201,168,76,0.55); }
  .pol-mail-label {
    font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
    color: rgba(201,168,76,0.75); margin-bottom: 8px;
  }
  .pol-mail-addr {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 24px; color: #F0ECE2; word-break: break-all; line-height: 1.3;
  }
  .pol-hint { font-size: 12px; color: rgba(232,228,218,0.45); margin-bottom: 40px; }

  .pol-reasons { display: flex; flex-direction: column; gap: 2px; margin: 0 0 20px; }
  .pol-reason {
    border-left: 2px solid rgba(201,168,76,0.3);
    padding: 16px 0 16px 20px;
  }
  .pol-reason-h {
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #C9A84C; margin-bottom: 6px;
  }
  .pol-reason-b { font-size: 14px; color: rgba(232,228,218,0.72); line-height: 1.7; }

  .pol-back {
    display: inline-block;
    margin-top: 56px;
    padding: 9px 20px;
    border: 1px solid rgba(201,168,76,0.5);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #C9A84C;
    text-decoration: none;
  }
  .pol-back:hover { background: rgba(201,168,76,0.08); }

  @media (max-width: 700px) {
    .pol-wrap { padding: 48px 20px 72px; font-size: 14px; }
    .pol-title { font-size: 32px; }
    .pol-lede { font-size: 17px; }
    .pol-mail-addr { font-size: 18px; }
    .pol-wrap h2 { font-size: 22px; }
  }
`;

export default function ContactPage() {
  return (
    <main className="pol-wrap">
      <style>{STYLES}</style>

      <div className="pol-eyebrow">The Tiniest Library</div>
      <h1 className="pol-title">Contact</h1>
      <p className="pol-lede">
        A small press reads its own mail. Write and a person answers.
      </p>

      <a className="pol-mail" href={`mailto:${EMAIL}`}>
        <div className="pol-mail-label">Email</div>
        <div className="pol-mail-addr">{EMAIL}</div>
      </a>
      <p className="pol-hint">
        We aim to reply within two business days. Copyright and privacy requests are handled on
        the timelines set out in the Terms and Privacy Policy.
      </p>

      <h2>What to write about</h2>
      <div className="pol-reasons">
        {REASONS.map((r) => (
          <div className="pol-reason" key={r.label}>
            <div className="pol-reason-h">{r.label}</div>
            <div className="pol-reason-b">{r.body}</div>
          </div>
        ))}
      </div>

      <h2>Want to publish with TTL?</h2>
      <p>
        Writers apply through the{" "}
        <a href="https://write.the-tiniest-library.com/apply">Writer&rsquo;s Room</a>. Artists and
        comics creators start at <a href="https://artists.the-tiniest-library.com">The Galleria</a>.
        You keep your copyright, you earn through the Ink economy, and you can unpublish at any
        time.
      </p>

      <h2>The imprint</h2>
      <p>
        The Tiniest Library is published by <strong>Kid With The Stick Publishing LLC</strong>, an
        independent press. See the <a href="/reading-room/how-it-works">How It Works</a> page for
        how the platform fits together, or read the{" "}
        <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>

      <a className="pol-back" href="/reading-room">&larr; Back to the Reading Room</a>
    </main>
  );
}
