/* retheme.js — map hardcoded dark-design colours onto theme tokens.
 *
 *   node retheme.js            → dry run, tier 1, prints what would change
 *   node retheme.js --apply    → writes tier 1
 *   node retheme.js 2          → dry run, tier 2
 *   node retheme.js 2 --apply  → writes tier 2
 *   node retheme.js all --apply
 *
 * Run from the repo root (~/the-reading-room).
 * Preserves CRLF — it only replaces inside lines, never touches line endings.
 */

const fs = require('fs');
const path = require('path');

// ── files, by priority ──────────────────────────────────────────────
// Deliberately excluded, they are meant to be dark:
//   components/TTLNav.tsx, stories/[slug]/chapters/**, AdQueue, AdWindow
const TIERS = {
  1: [ // on the homepage, visible right now
    'app/reading-room/components/FeaturedAuthors.tsx',
    'app/reading-room/components/HowItWorks.tsx',
    'app/reading-room/components/MoodSelector.tsx',
    'app/reading-room/components/LiveActivityFeed.tsx',
    'app/reading-room/components/ContinueReadingStrip.tsx',
    'app/reading-room/components/NewChapterAlerts.tsx',
    'app/reading-room/components/CountdownDrops.tsx',
    'app/reading-room/components/ChapterUnlocks.tsx',
    'app/components/TTLStoryCard.tsx',
    'app/components/TTLAuthorCard.tsx',
  ],
  2: [ // other public pages a stranger can reach
    'app/reading-room/stories/page.tsx',
    'app/reading-room/authors/page.tsx',
    'app/reading-room/authors/[slug]/page.tsx',
    'app/reading-room/authors/[slug]/AuthorProfileClient.tsx',
    'app/reading-room/genres/[genre]/page.tsx',
    'app/reading-room/how-it-works/page.tsx',
    'app/reading-room/buy-ink/page.tsx',
    'app/reading-room/login/page.tsx',
    'app/components/GenreLandingPage.tsx',
    'app/components/GenreScrollNav.tsx',
    'app/components/TTLSearchOverlay.tsx',
    'app/components/TTLFollowButton.tsx',
    'app/components/TTLReadingProgress.tsx',
    'app/components/TTLNotificationBell.tsx',
    'app/components/PageChatWidget.tsx',
    'app/components/WelcomeTour.tsx',
  ],
  3: [ // behind sign-in
    'app/members/page.tsx',
    'app/reading-room/account/page.tsx',
    'app/components/MemberProfileRoom.tsx',
    'app/components/MembersRoomFeed.tsx',
    'app/components/MembersRoomShelf.tsx',
    'app/components/InkwellPanel.tsx',
    'app/components/DiscoverPanel.tsx',
    'app/components/ChapterDropCalendar.tsx',
    'app/components/ReadersLetter.tsx',
    'app/components/WritersCorner.tsx',
    'app/components/AskTheWriter.tsx',
    'app/components/TTLGenreLounge.tsx',
  ],
};

// ── mapping ─────────────────────────────────────────────────────────
// Light-on-dark text → theme ink, graded by the alpha it was using.
function inkFor(alpha) {
  const a = parseFloat(alpha);
  if (isNaN(a) || a >= 0.8) return 'var(--text-main)';
  if (a >= 0.5) return 'var(--text-dim)';
  return 'var(--text-faint)';
}

const RULES = [
  // graded text colours
  { re: /rgba\(232,\s*228,\s*218,\s*([\d.]+)\)/g, to: (_, a) => inkFor(a) },
  { re: /rgba\(240,\s*236,\s*226,\s*([\d.]+)\)/g, to: (_, a) => inkFor(a) },
  { re: /#f0ece2\b/gi, to: () => 'var(--text-main)' },
  { re: /#e8e4da\b/gi, to: () => 'var(--text-main)' },

  // solid dark panels → paper
  { re: /#0a0a0a\b/gi, to: () => 'var(--plate)' },
  { re: /#111111\b/gi, to: () => 'var(--plate)' },
  { re: /#1a1a2e\b/gi, to: () => 'var(--plate)' },
  { re: /#16213e\b/gi, to: () => 'var(--plate)' },
  { re: /#1a1a1a\b/gi, to: () => 'var(--plate)' },

  // hairlines that assumed a dark ground
  { re: /rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/g, to: () => 'var(--edge)' },
];

// Flagged, never auto-changed — gradients need a human eye.
const FLAG = /linear-gradient\([^)]*#(0a0a0a|111|1a1a2e|16213e|1e1e26|2a2a38)/gi;

// ── run ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const tierArg = args.find(a => a !== '--apply') || '1';
const files = tierArg === 'all'
  ? [...TIERS[1], ...TIERS[2], ...TIERS[3]]
  : (TIERS[tierArg] || []);

if (!files.length) {
  console.error(`No files for tier "${tierArg}". Use 1, 2, 3 or all.`);
  process.exit(1);
}

let totalChanges = 0;
let totalFlags = 0;

for (const rel of files) {
  const full = path.join(process.cwd(), rel);
  if (!fs.existsSync(full)) {
    console.log(`  skip (missing)  ${rel}`);
    continue;
  }

  const before = fs.readFileSync(full, 'utf8');
  let after = before;
  let count = 0;

  for (const rule of RULES) {
    after = after.replace(rule.re, (...m) => { count++; return rule.to(...m); });
  }

  const flags = (before.match(FLAG) || []).length;
  totalFlags += flags;

  if (count === 0 && flags === 0) {
    console.log(`  clean           ${rel}`);
    continue;
  }

  totalChanges += count;
  const note = flags ? `  ⚑ ${flags} gradient${flags > 1 ? 's' : ''} to check by hand` : '';
  console.log(`  ${String(count).padStart(3)} change${count === 1 ? ' ' : 's'}     ${rel}${note}`);

  if (apply && count > 0) fs.writeFileSync(full, after, 'utf8');
}

console.log('');
console.log(`Tier ${tierArg}: ${totalChanges} replacements across ${files.length} files.`);
if (totalFlags) console.log(`${totalFlags} gradients flagged — those stay as they are, review them yourself.`);
console.log(apply ? 'Written. Check Problems, then look at the site.' : 'Dry run. Add --apply to write.');
