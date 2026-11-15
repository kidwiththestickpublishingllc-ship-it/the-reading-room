/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 *   exact — FROM must appear exactly once, replaced with TO
 *   regex — PATTERN must match exactly once; GONE is text that proves the
 *           edit is still needed
 * If anything is missing or ambiguous, NOTHING is written. CRLF safe.
 *
 * Batch: Reading Room — Adult 18+ door off the Stories page, the adult-18
 * genre address returns "not found", Romance SEO line made all-ages.
 */

const fs = require('fs');
const path = require('path');

const L = 'app/reading-room/genres/[genre]/layout.tsx';

const EDITS = [
  {
    file: 'app/reading-room/stories/page.tsx', kind: 'regex',
    label: 'stories: skip the Adult 18+ panel',
    pattern: /if \(panel\.genre === "Adult 18\+"\) \{[\s\S]*?\n\}\n(?=[ \t]*return \()/,
    replace: () => 'if (panel.genre === "Adult 18+") return null;\n',
    gone: 'genres/adult-18"; }}',
  },
  {
    file: L, kind: 'exact',
    label: 'genre layout: import notFound',
    from: `import type { Metadata } from "next";`,
    to: `import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Adult genres live on TTL After Dark, never on this site.
// Any /reading-room/genres/adult… address returns "not found".
const isAdultSlug = (slug: string) => /^adult(-|$)/.test(decodeURIComponent(slug).toLowerCase());`,
  },
  {
    file: L, kind: 'exact',
    label: 'genre layout: block the adult-18 address',
    from: `export default function GenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}`,
    to: `export default async function GenreLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ genre: string }> }
) {
  const { genre } = await params;
  if (isAdultSlug(genre)) notFound();
  return <>{children}</>;
}`,
  },
  {
    file: L, kind: 'exact',
    label: 'Romance SEO: all-ages wording',
    from: `slow burns, age-gap, and love stories that don't flinch,`,
    to: `slow burns, second chances, and love stories with heart,`,
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

  if (e.kind === 'regex') {
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
    continue;
  }

  const hits = count(f.text, e.from);
  const toHoldsFrom = e.to.includes(e.from);
  if (hits === 0) {
    if (f.text.includes(e.to)) { already++; report('·', 'already done', e); }
    else { missing++; report('✗', 'NOT FOUND', e); }
  } else if (hits === 1) {
    if (toHoldsFrom && f.text.includes(e.to)) { already++; report('·', 'already done', e); continue; }
    f.text = f.text.replace(e.from, () => e.to);
    f.dirty = true; ok++; report('✓', 'will change', e);
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