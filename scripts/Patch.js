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

  // ── stage text follows the theme, not a hardcoded palette ───────────
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'main text → token',
    from: `  const txtMain = isLight ? "#1a1208" : "#ffffff";`,
    to: `  const txtMain = "var(--text-main)";`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'dim text → token',
    from: `  const txtDim = isLight ? "rgba(26,18,8,0.85)" : "#ffffff";`,
    to: `  const txtDim = "var(--text-dim)";`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'faint text → token',
    from: `  const txtFaint = isLight ? "rgba(26,18,8,0.62)" : "rgba(255,255,255,0.72)";`,
    to: `  const txtFaint = "var(--text-faint)";`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'zone surface → wash token',
    from: `  const surface = isLight ? "rgba(122,96,40,0.07)" : "rgba(255,255,255,0.06)";`,
    to: `  const surface = "var(--wash)";`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'zone border → edge token',
    from: `  const surfaceBorder = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)";`,
    to: `  const surfaceBorder = "var(--edge)";`,
  },

  // ── signal colours become token pairs ───────────────────────────────
  {
    file: 'app/globals.css',
    label: 'signal tokens, light',
    from: `  --text-faint: rgba(26,16,8,0.45);`,
    to: `  --text-faint: rgba(26,16,8,0.45);
  --signal-alert: #C0392B;
  --signal-ok: #2E6B45;`,
  },
  {
    file: 'app/globals.css',
    label: 'signal tokens, dark',
    from: `  --text-faint: rgba(240,236,226,0.45);`,
    to: `  --text-faint: rgba(240,236,226,0.45);
  --signal-alert: #F08A82;
  --signal-ok: #7FD6A0;`,
  },
  {
    file: 'app/reading-room/components/StorySocial.tsx',
    label: 'liked heart → signal token',
    from: `    color: #C0392B;`,
    to: `    color: var(--signal-alert);`,
  },
  {
    file: 'app/reading-room/components/StorySocial.tsx',
    label: 'copied state → signal token',
    from: `    color: #2E6B45;`,
    to: `    color: var(--signal-ok);`,
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