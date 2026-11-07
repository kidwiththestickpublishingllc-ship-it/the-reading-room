// app/privacy/page.tsx
// Privacy Policy — The Tiniest Library (Reading Room)
// Server component. No "use client" — renders as real HTML for crawlers.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Tiniest Library collects, uses, and protects your information.",
  alternates: { canonical: "https://read.the-tiniest-library.com/privacy" },
};

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
  .pol-updated {
    font-size: 12px;
    color: rgba(232,228,218,0.45);
    margin-bottom: 48px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(201,168,76,0.2);
  }
  .pol-wrap h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 26px;
    font-weight: 400;
    color: #C9A84C;
    margin: 44px 0 14px;
    line-height: 1.2;
  }
  .pol-wrap h3 {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #F0ECE2;
    margin: 26px 0 8px;
  }
  .pol-wrap p { margin: 0 0 16px; color: rgba(232,228,218,0.78); }
  .pol-wrap ul { margin: 0 0 18px; padding-left: 22px; }
  .pol-wrap li { margin-bottom: 9px; color: rgba(232,228,218,0.78); }
  .pol-wrap a { color: #C9A84C; text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.35); }
  .pol-wrap a:hover { border-bottom-color: #C9A84C; }
  .pol-wrap strong { color: #F0ECE2; font-weight: 600; }
  .pol-note {
    background: rgba(201,168,76,0.04);
    border: 1px solid rgba(201,168,76,0.2);
    border-left: 3px solid #C9A84C;
    border-radius: 8px;
    padding: 18px 22px;
    margin: 28px 0;
    font-size: 14px;
  }
  .pol-note p:last-child { margin-bottom: 0; }
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
    .pol-wrap h2 { font-size: 22px; }
  }
`;

export default function PrivacyPolicyPage() {
  return (
    <main className="pol-wrap">
      <style>{STYLES}</style>

      <div className="pol-eyebrow">The Tiniest Library</div>
      <h1 className="pol-title">Privacy Policy</h1>
      <div className="pol-updated">Last updated: November 7, 2026</div>

      <p>
        The Tiniest Library is operated by <strong>Kid With The Stick Publishing LLC</strong>
        {" "}(&ldquo;TTL,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). This policy explains what
        information we collect when you use our sites, why we collect it, and what control you
        have over it.
      </p>
      <p>
        It applies to The Reading Room, The Galleria, The Writer&rsquo;s Room, and the main TTL
        site &mdash; everything at <strong>the-tiniest-library.com</strong> and its subdomains.
      </p>

      <h2>Information we collect</h2>

      <h3>Information you give us</h3>
      <ul>
        <li><strong>Account details</strong> &mdash; your email address, display name, and password. Passwords are hashed; we never see or store them in readable form.</li>
        <li><strong>Profile information</strong> &mdash; anything you choose to add, such as a bio, avatar, or author page details.</li>
        <li><strong>Content you create</strong> &mdash; stories, chapters, comics, artwork, comments, and forum posts you publish or save.</li>
        <li><strong>Messages</strong> &mdash; anything you send us by email or through support channels.</li>
        <li><strong>Payout details</strong> &mdash; if you are a writer or artist receiving earnings, the payout method and account identifiers you provide so we can pay you.</li>
      </ul>

      <h3>Information created as you use the site</h3>
      <ul>
        <li><strong>Ink activity</strong> &mdash; your Ink balance, purchases, unlocks, and tips.</li>
        <li><strong>Reading activity</strong> &mdash; which works you have unlocked, your reading progress, saved items, and streaks.</li>
        <li><strong>Technical data</strong> &mdash; IP address, browser and device type, pages requested, and timestamps, recorded in standard server logs by our hosting provider.</li>
        <li><strong>Age range</strong> &mdash; whether you are over or under 18, so we can apply the right protections to your account. We do not collect identity documents.</li>
      </ul>

      <h3>Information we do not collect</h3>
      <p>
        We never receive or store your full payment card number, CVC, or bank credentials. Card
        payments are handled entirely by Stripe. We receive only a confirmation that a payment
        succeeded, the amount, and a token that lets us match it to your account.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To create and secure your account and keep you signed in across TTL sites.</li>
        <li>To deliver what you have unlocked or purchased, and to maintain your Ink balance.</li>
        <li>To pay writers and artists what they have earned.</li>
        <li>To respond to your questions and provide support.</li>
        <li>To detect fraud, abuse, and violations of our Terms.</li>
        <li>To understand which parts of the site are used, so we can improve them.</li>
        <li>To meet legal, tax, and accounting obligations.</li>
      </ul>
      <p>
        We do not sell your personal information, and we do not share it with third parties for
        their own marketing.
      </p>

      <h2>Cookies and similar technologies</h2>
      <p>
        We set an authentication cookie, <strong>ttl-auth-token</strong>, scoped to
        {" "}<strong>.the-tiniest-library.com</strong>. This is what keeps you signed in as you
        move between the Reading Room, the Galleria, and the Writer&rsquo;s Room. It is essential
        to the service; if you block it, you cannot stay signed in.
      </p>
      <p>
        We also use local browser storage for conveniences such as your theme choice and reading
        position. That data stays in your browser.
      </p>
      <p>
        Advertising partners whose ads appear on our pages may set their own cookies and use them
        to show ads based on your prior visits to this and other sites. That activity is governed
        by those partners&rsquo; own privacy policies, not ours. Most browsers let you block or
        delete third-party cookies in their settings.
      </p>

      <h2>Services we rely on</h2>
      <p>These providers process data on our behalf in order to run the service:</p>
      <ul>
        <li><strong>Supabase</strong> &mdash; database, authentication, and file storage.</li>
        <li><strong>Vercel</strong> &mdash; website hosting and content delivery.</li>
        <li><strong>Stripe</strong> &mdash; payment processing and creator payouts.</li>
        <li><strong>Advertising networks</strong> &mdash; serving ads on pages where they appear.</li>
        <li><strong>AI assistant providers</strong> &mdash; where an on-site assistant is offered, the messages you type into it are sent to a third-party model provider to generate a reply. Do not share sensitive personal information with it.</li>
      </ul>
      <p>
        We may also disclose information where we are legally required to, or where it is
        necessary to protect our rights, our users, or the public.
      </p>

      <h2>Your choices and rights</h2>
      <p>You can, at any time:</p>
      <ul>
        <li>View and edit your profile from your account settings.</li>
        <li>Ask us for a copy of the personal data we hold about you.</li>
        <li>Ask us to correct anything inaccurate.</li>
        <li>Ask us to delete your account and associated personal data.</li>
      </ul>
      <p>
        Email <a href="mailto:kidwiththestickpublishingllc@gmail.com">kidwiththestickpublishingllc@gmail.com</a>
        {" "}and we will respond within 30 days. Depending on where you live, you may have
        additional rights under laws such as the GDPR or the CCPA; we honour those requests
        regardless of location.
      </p>
      <div className="pol-note">
        <p>
          <strong>One limit on deletion:</strong> if you have published work or received payouts,
          we must keep certain transaction and tax records even after your account is closed.
          Published work is removed from public view; the financial record of what was paid is
          retained for as long as the law requires.
        </p>
      </div>

      <h2>How long we keep things</h2>
      <p>
        Account and content data is kept while your account is active. Once you delete your
        account, we remove personal data within 90 days except where we are required to retain
        it. Server logs are kept for a short period for security and diagnostics. Financial
        records are kept for the period required by tax law.
      </p>

      <h2>Security</h2>
      <p>
        Data is transmitted over HTTPS and stored with access controls at the database level.
        Payment credentials never touch our servers. No system is perfectly secure, but we take
        reasonable measures appropriate to the sensitivity of what we hold, and we will notify
        affected users if a breach puts their personal data at risk.
      </p>

      <h2>Young writers and readers</h2>
      <p>
        TTL is built for writers of all ages, and we expect teenagers among them. Accounts are
        available from age 13. We do not knowingly collect personal information from anyone
        under 13; if you believe a child under 13 has created an account, contact us and we will
        remove it and delete the data.
      </p>
      <p>
        For members under 18 we apply additional protections: we do not use their information
        for personalised advertising, and any arrangement involving earnings requires a parent
        or guardian. If you are a parent or guardian and want to review, correct, or delete your
        child&rsquo;s information, email us and we will help.
      </p>

      <h2>International users</h2>
      <p>
        We operate in the United States, and your information is processed there. If you use TTL
        from outside the US, you are transferring your information to the US, where data
        protection law may differ from your own.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the service changes. The date at the top always reflects the
        current version. If a change materially affects your rights, we will say so on the site
        rather than quietly revise the page.
      </p>

      <h2>Contact</h2>
      <p>
        Kid With The Stick Publishing LLC<br />
        <a href="mailto:kidwiththestickpublishingllc@gmail.com">kidwiththestickpublishingllc@gmail.com</a>
      </p>

      <a className="pol-back" href="/reading-room">&larr; Back to the Reading Room</a>
    </main>
  );
}
