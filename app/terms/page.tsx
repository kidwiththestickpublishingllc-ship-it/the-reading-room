// app/terms/page.tsx
// Terms of Service — The Tiniest Library (Reading Room)
// Server component. No "use client" — renders as real HTML for crawlers.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of The Tiniest Library, including accounts, Ink, and creator rights.",
  alternates: { canonical: "https://read.the-tiniest-library.com/terms" },
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

export default function TermsPage() {
  return (
    <main className="pol-wrap">
      <style>{STYLES}</style>

      <div className="pol-eyebrow">The Tiniest Library</div>
      <h1 className="pol-title">Terms of Service</h1>
      <div className="pol-updated">Last updated: November 7, 2026</div>

      <p>
        These terms are an agreement between you and <strong>Kid With The Stick Publishing LLC</strong>,
        which operates The Tiniest Library (&ldquo;TTL&rdquo;). They cover the Reading Room, the
        Galleria, the Writer&rsquo;s Room, and the main TTL site. By creating an account or using
        the service, you accept them.
      </p>

      <h2>1. Who can use TTL</h2>
      <p>
        You must be at least 13 years old to create an account. Members under 18 have additional
        protections and restrictions, including a parent or guardian&rsquo;s involvement in any
        arrangement where the member earns money. If you are using TTL on behalf of a business,
        you confirm you have authority to bind it to these terms.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for what happens under your account and for keeping your password
        private. Tell us promptly if you believe someone else has access to it. One person, one
        account; do not share logins or sell account access.
      </p>
      <p>
        You may close your account at any time from your account settings or by emailing us.
      </p>

      <h2>3. Ink</h2>
      <p>
        Ink is the credit used on TTL to unlock chapters, issues, and other works, and to tip
        creators. Ink is a limited licence to access content on TTL. It is not money, not a
        stored-value or gift card, not transferable between accounts, and has no cash value.
      </p>
      <ul>
        <li>Ink you buy is added to your balance once payment clears.</li>
        <li>Spending Ink on an unlock is final &mdash; the unlock is delivered immediately, so purchases of content are not refundable once made.</li>
        <li>Unspent Ink can be refunded at our discretion within 14 days of purchase. Email us and we will look at it.</li>
        <li>Free or promotional Ink is never refundable and may expire.</li>
        <li>If your account is terminated for breaking these terms, remaining Ink is forfeited.</li>
      </ul>
      <p>
        Nothing here removes refund rights you have under the law where you live.
      </p>

      <h2>4. Your content and your copyright</h2>
      <div className="pol-note">
        <p>
          <strong>You keep your copyright.</strong> TTL does not take ownership of anything you
          write, draw, or upload. This has always been the point of the platform and it is not
          going to change.
        </p>
      </div>
      <p>
        So that we can actually run the service, you grant us a non-exclusive, worldwide,
        royalty-free licence to host, store, reproduce, display, and distribute your work on TTL
        and to promote it on TTL and our own social channels. The licence lasts while your work
        is published with us, and ends when you remove it &mdash; except for copies in backups,
        which age out on their own, and material already distributed to readers who unlocked it.
      </p>
      <p>By publishing, you confirm that:</p>
      <ul>
        <li>the work is yours, or you have the rights to publish it;</li>
        <li>it does not infringe anyone&rsquo;s copyright, trademark, or other rights;</li>
        <li>it does not break the rules in section 6.</li>
      </ul>
      <p>
        You can unpublish your work at any time. Readers who have already unlocked a chapter keep
        access to what they paid for.
      </p>

      <h2>5. Earnings and payouts</h2>
      <p>
        Writers and artists earn a share of the Ink spent unlocking their work, plus any tips
        readers send. Current rates are shown in your creator dashboard and in the How It Works
        page. We may change rates going forward, but never retroactively on earnings already
        recorded.
      </p>
      <ul>
        <li>Earnings accrue to your balance as readers unlock and tip.</li>
        <li>Payouts are made through the method you set up and may be subject to a minimum threshold.</li>
        <li>You are responsible for your own taxes. We may require tax information before paying you, and may be required to report payments.</li>
        <li>We may withhold a payout while investigating suspected fraud, self-dealing, or artificially inflated unlocks.</li>
      </ul>

      <h2>6. Rules for content and conduct</h2>
      <p>
        TTL exists for difficult, honest fiction, and we are not in the business of sanding edges
        off. These limits are the ones we do not move on.
      </p>
      <p><strong>Absolutely prohibited, without exception:</strong></p>
      <ul>
        <li>Any sexual content involving minors, real or fictional, in any form, including text and artwork.</li>
        <li>Content that sexualises real children or presents a real minor in a sexual way.</li>
        <li>Material that promotes or facilitates the abuse of children.</li>
      </ul>
      <p><strong>Also prohibited:</strong></p>
      <ul>
        <li>Work you did not write or create, published as your own.</li>
        <li>Content that incites violence against real people or groups, or that constitutes harassment, doxxing, or targeted abuse.</li>
        <li>Non-consensual intimate imagery of real people, including synthetic or altered images.</li>
        <li>Content unlawful where you or your readers are, or that infringes third-party rights.</li>
        <li>Deceptive use of the platform: fake accounts, manipulating unlock counts or earnings, scraping, or interfering with the service.</li>
        <li>Placing explicit material outside the sections designated for it, or mislabelling adult work as all-ages.</li>
      </ul>
      <p>
        We may remove content, restrict a feature, or close an account that breaks these rules.
        For clear violations of the first list, we act immediately and permanently.
      </p>

      <h2>7. Copyright complaints</h2>
      <p>
        If you believe something on TTL infringes your copyright, email
        {" "}<a href="mailto:kidwiththestickpublishingllc@gmail.com">kidwiththestickpublishingllc@gmail.com</a>
        {" "}with the subject line <strong>Copyright Complaint</strong> and include: what work is
        infringed, where on TTL it appears, your contact details, a statement that you believe in
        good faith the use is unauthorised, and a statement that the information is accurate and
        that you are the owner or authorised to act for them.
      </p>
      <p>
        We remove infringing material when a valid complaint is made, notify the person who
        posted it, and give them a chance to respond. Accounts that repeatedly infringe are
        closed.
      </p>

      <h2>8. Advertising</h2>
      <p>
        Some pages carry third-party advertising. We do not control what those networks show and
        we are not responsible for the products or sites they lead to. Interactions with an
        advertiser are between you and them.
      </p>

      <h2>9. Availability</h2>
      <p>
        We work to keep TTL running, but we do not promise uninterrupted service. Features may
        change, and sections may be added or retired. If we discontinue something you paid for,
        we will do what is reasonable to make it right.
      </p>

      <h2>10. Ending the agreement</h2>
      <p>
        You can stop using TTL and close your account whenever you like. We may suspend or close
        an account that breaks these terms, or where we are required to by law. If we close your
        account without cause, we will refund unspent Ink and pay out earnings you have already
        accrued.
      </p>

      <h2>11. Disclaimers and liability</h2>
      <p>
        TTL is provided &ldquo;as is.&rdquo; We do not warrant that it will be error-free or that
        content on it is accurate. Views expressed in published work belong to the writers and
        artists, not to TTL.
      </p>
      <p>
        To the extent the law allows, Kid With The Stick Publishing LLC is not liable for
        indirect, incidental, or consequential damages, and our total liability to you for any
        claim is limited to the greater of the amount you paid us in the 12 months before the
        claim, or 100 US dollars. Some jurisdictions do not allow these limits, in which case
        they apply to you only as far as the law permits.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of <strong>Connecticut</strong>, United
        States, without regard to conflict-of-law rules. Disputes will be brought in the state or
        federal courts located there, and we each consent to that jurisdiction.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        We may revise these terms. The date at the top shows the current version. For material
        changes we will give notice on the site before they take effect. Continuing to use TTL
        after that means you accept the revised terms; if you do not, close your account.
      </p>

      <h2>14. Contact</h2>
      <p>
        Kid With The Stick Publishing LLC<br />
        <a href="mailto:kidwiththestickpublishingllc@gmail.com">kidwiththestickpublishingllc@gmail.com</a>
      </p>

      <a className="pol-back" href="/reading-room">&larr; Back to the Reading Room</a>
    </main>
  );
}
