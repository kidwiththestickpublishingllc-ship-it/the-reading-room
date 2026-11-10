/* scripts/patch.js — exact, verified multi-line edits.
 *
 *   node scripts/patch.js           → dry run, reports what would change
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 *
 * Safety:
 *   - Matches against LF internally, writes back in the file's own line ending,
 *     so Windows CRLF files are handled without corruption.
 *   - If an edit's FROM text is missing, it checks whether the TO text is
 *     already there and says "already applied" instead of failing blind.
 *   - If anything is genuinely MISSING, NOTHING is written. All or nothing.
 *   - Refuses to run if a FROM string appears more than once in its file.
 *
 * Batch: Reading Room — sign to the top, genre bar to whiteboard.
 */

const fs = require('fs');
const path = require('path');

const EDITS = [

  {
    file: 'app/components/PageChatWidget.tsx',
    label: 'scope the chat widget palette to the widget',
    from: `  :root {
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
  }`,
    to: `  /* Scoped to the widget's own elements. These were declared on :root,
     which meant a chat widget mounted in layout.tsx redefined the whole
     site's palette on every page - and won ties, because its style tag is
     injected after the page's. */
  [class^="page-"], [class*=" page-"] {
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
  }`,
  },

  {
    file: 'app/reading-room/page.tsx',
    label: 'remove the stray !important ink-pack override',
    from: `.ttl-ink-pack {
  border: 1px solid rgba(0,0,0,0.1) !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
}`,
    to: `/* .ttl-ink-pack borders come from --ink-border in the main block */`,
  },

];

// ── engine ───────────────────────────────────────────────────────────
const apply = process.argv.includes('--apply');

const cache = new Map();   // file → { full, text, crlf, dirty }

function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const full = path.join(process.cwd(), rel);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, 'utf8');
  const crlf = raw.includes('\r\n');
  const entry = { full, text: crlf ? raw.replace(/\r\n/g, '\n') : raw, crlf, dirty: false };
  cache.set(rel, entry);
  return entry;
}

let ok = 0, already = 0, missing = 0, ambiguous = 0;

for (const e of EDITS) {
  const f = load(e.file);
  if (!f) {
    console.log(`  x MISSING FILE   ${e.file}`);
    missing++;
    continue;
  }

  const hits = f.text.split(e.from).length - 1;

  if (hits === 1) {
    f.text = f.text.replace(e.from, e.to);
    f.dirty = true;
    ok++;
    console.log(`  + will change    ${e.label}`);
  } else if (hits > 1) {
    ambiguous++;
    console.log(`  x AMBIGUOUS (${hits}x)  ${e.label}`);
    console.log(`      the FROM text appears ${hits} times in ${e.file} - needs more context`);
  } else if (f.text.includes(e.to)) {
    already++;
    console.log(`  . already done   ${e.label}`);
  } else {
    missing++;
    console.log(`  x NOT FOUND      ${e.label}`);
    console.log(`      in ${e.file} - the file has drifted from what this patch expects`);
  }
}

console.log('');
console.log(`${ok} to change | ${already} already applied | ${missing} not found | ${ambiguous} ambiguous`);

if (missing || ambiguous) {
  console.log('');
  console.log('Nothing written. Fix the mismatches above first - send me the failing');
  console.log('labels and I will re-cut those edits against the real text.');
  process.exit(1);
}

if (!apply) {
  console.log('Dry run. Add --apply to write.');
  process.exit(0);
}

let written = 0;
for (const [rel, f] of cache) {
  if (!f.dirty) continue;
  fs.writeFileSync(f.full, f.crlf ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
  written++;
  console.log(`  wrote  ${rel}`);
}

console.log('');
console.log(written ? 'Written. Check Problems, then push.' : 'Nothing to write.');