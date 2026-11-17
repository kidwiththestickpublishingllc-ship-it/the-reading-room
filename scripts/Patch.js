/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 * If anything is missing or ambiguous, NOTHING is written. CRLF safe.
 *
 * Batch: chapter reader — no more "Finding your page…" gate. "Resume my
 * Page-Bend" and "Start from here" now act straight away.
 */

const fs = require('fs');
const path = require('path');

const CR = 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx';

const EDITS = [
  {
    file: CR, label: 'run the reader\'s choice right away (no gate)',
    from: `const [adGate, setAdGate] = useState<null | (() => void)>(null);`,
    to: `const [adGate, setAdGate] = useState<null | (() => void)>(null);
  // No more ad gate: whatever the reader picked runs straight away.
  useEffect(() => { if (adGate) { const go = adGate; setAdGate(null); go(); } }, [adGate]);`,
  },
  {
    file: CR, label: 'stop showing the gate screen',
    from: `{adGate && <AdGate onDone={() => { const go = adGate; setAdGate(null); go(); }} />}`,
    to: `{/* chapter gate removed: readers go straight to the page */}`,
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
const count = (hay, needle) => hay.split(needle).length - 1;
let ok = 0, already = 0, missing = 0, ambiguous = 0;
const report = (sym, msg, e) => console.log(`  ${sym} ${msg.padEnd(15)} ${e.label}`);

for (const e of EDITS) {
  const f = load(e.file);
  if (!f) { console.log(`  ✗ MISSING FILE   ${e.file}`); missing++; continue; }
  const hits = count(f.text, e.from);
  if (hits === 1) {
    if (e.to.includes(e.from) && f.text.includes(e.to)) { already++; report('·', 'already done', e); continue; }
    f.text = f.text.replace(e.from, () => e.to);
    f.dirty = true; ok++; report('✓', 'will change', e);
  } else if (hits === 0) {
    if (f.text.includes(e.to)) { already++; report('·', 'already done', e); }
    else { missing++; report('✗', 'NOT FOUND', e); }
  } else {
    ambiguous++; report('✗', `AMBIGUOUS ${hits}×`, e);
  }
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