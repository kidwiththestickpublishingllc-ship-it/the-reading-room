/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 * If anything is missing or ambiguous, NOTHING is written. CRLF safe.
 *
 * Batch: stage 2b — the last two Reading Room places that read chapter text
 * directly now ask get_chapter_body instead (free chapters for everyone,
 * paid ones only once unlocked).
 *   • GroundFloor: the first-chapter preview
 *   • reading-room/page.tsx: the quick-read story modal
 */

const fs = require('fs');
const path = require('path');

const GF = 'app/components/GroundFloor.tsx';
const RP = 'app/reading-room/page.tsx';

const EDITS = [
  {
    file: GF, label: 'Ground Floor preview: text via get_chapter_body',
    from: `            .select("chapter_number, title, content, is_free")
            .eq("story_id", storyRow.id)
            .order("chapter_number")
            .limit(1)
            .maybeSingle();
          if (!cancelled && c) setChapter(c as Chapter);`,
    to: `            .select("id, chapter_number, title, is_free")
            .eq("story_id", storyRow.id)
            .order("chapter_number")
            .limit(1)
            .maybeSingle();
          if (!cancelled && c) {
            // Text only comes through get_chapter_body (free chapters for everyone).
            const { data: body } = await supabase.rpc("get_chapter_body", { p_chapter_id: c.id });
            if (!cancelled) setChapter({ ...c, content: body?.content ?? null } as Chapter);
          }`,
  },
  {
    file: RP, label: 'quick-read modal: text via get_chapter_body',
    from: `      .select("id, chapter_number, title, content, is_free, ink_cost")
      .eq("story_id", story.id)
      .order("chapter_number", { ascending: true })
      .then(({ data }) => {
        const chs = (data ?? []) as Chapter[];`,
    to: `      .select("id, chapter_number, title, is_free, ink_cost")
      .eq("story_id", story.id)
      .order("chapter_number", { ascending: true })
      .then(async ({ data }) => {
        // Text only for chapters get_chapter_body allows (free, unlocked, own, admin).
        const chs = await Promise.all(((data ?? []) as Chapter[]).map(async (ch) => {
          const { data: body } = await supabase.rpc("get_chapter_body", { p_chapter_id: ch.id });
          return { ...ch, content: body?.content ?? "" } as Chapter;
        }));`,
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