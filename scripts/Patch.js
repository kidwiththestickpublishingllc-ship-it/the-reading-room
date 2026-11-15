/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 * regex — PATTERN must match exactly once; GONE is text that proves the edit
 *         is still needed. If anything is missing or ambiguous, NOTHING is
 *         written. CRLF safe.
 *
 * Batch: Reading Room — remove the Adult 18+ door from the Stories page.
 */

const fs = require('fs');
const path = require('path');

const EDITS = [
  {
    file: 'app/reading-room/stories/page.tsx', kind: 'regex',
    label: 'stories: skip the Adult 18+ panel',
    pattern: /if \(panel\.genre === "Adult 18\+"\) \{[\s\S]*?\n\}\n(?=[ \t]*return \()/,
    replace: () => 'if (panel.genre === "Adult 18+") return null;\n',
    gone: 'genres/adult-18"; }}',
  },
];

// ── engine ───────────────────────────────────────────────────────────
const apply = process.argv.includes('--apply');
const cache = new Map();

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
const report = (sym, msg, e) => console.log(`  ${sym} ${msg.padEnd(15)} ${e.label}`);

for (const e of EDITS) {
  const f = load(e.file);
  if (!f) { console.log(`  ✗ MISSING FILE   ${e.file}`); missing++; continue; }
  const all = new RegExp(e.pattern.source, e.pattern.flags.replace('g', '') + 'g');
  const n = (f.text.match(all) || []).length;
  if (n === 0) {
    if (f.text.includes(e.gone)) { missing++; report('✗', 'NOT FOUND', e); }
    else { already++; report('·', 'already done', e); }
    continue;
  }
  if (n > 1) { ambiguous++; report('✗', `AMBIGUOUS ${n}×`, e); continue; }
  f.text = f.text.replace(e.pattern, e.replace);
  f.dirty = true; ok++; report('✓', 'will change', e);
}

console.log('');
console.log(`${ok} to change · ${already} already applied · ${missing} not found · ${ambiguous} ambiguous`);
if (missing || ambiguous) { console.log('\nNothing written. Send me the output.'); process.exit(1); }
if (!apply) { console.log('Dry run. Add --apply to write.'); process.exit(0); }

for (const [rel, f] of cache) {
  if (!f.dirty) continue;
  fs.writeFileSync(f.full, f.crlf ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
  console.log(`  wrote  ${rel}`);
}
console.log('\nWritten. Check Problems, then push.');