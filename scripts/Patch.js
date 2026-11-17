/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 * If anything is missing or ambiguous, NOTHING is written. CRLF safe.
 *
 * Batch: chapter reader — paid chapters stay paid.
 *   • The chapter list loads WITHOUT text or media.
 *   • Text + media come from get_chapter_body(), which only answers for
 *     free chapters, chapters this reader unlocked, the reader's own story,
 *     or an admin. Writers and admins read their own paid chapters free.
 *   • After unlocking, the text is fetched the same way.
 *   • "Insufficient Ink" from unlock_chapter now shows a message instead
 *     of pretending the chapter unlocked.
 *   • The server page asks for the free chapter's text the same way.
 */

const fs = require('fs');
const path = require('path');

const DIR = 'app/reading-room/stories/[slug]/chapters/[chapter]';
const CR = `${DIR}/ChapterReaderClient.tsx`;
const SP = `${DIR}/page.tsx`;

const META = 'id, story_id, chapter_number, title, is_free, ink_cost, created_at, media_type, publish_at, split_id';

const EDITS = [

  // ═══ READER (browser) ═════════════════════════════════════════════════
  {
    file: CR, label: 'chapter list loads without text or media',
    from: `await supabase.from('chapters').select('*').eq('story_id', storyData.id).order('chapter_number');`,
    to: `await supabase.from('chapters').select('${META}').eq('story_id', storyData.id).order('chapter_number');`,
  },
  {
    file: CR, label: 'text + media only through get_chapter_body',
    from: `        setChapter(thisChapter);
        if (thisChapter) {
          if (thisChapter.is_free) { setUnlocked(true); }
          else if (session) {
            const { data: unlockData } = await supabase.from('chapter_unlocks').select('id').eq('user_id', session.user.id).eq('chapter_id', thisChapter.id).maybeSingle();
            setUnlocked(!!unlockData);
          }
        }`,
    to: `        setChapter(thisChapter);
        if (thisChapter) {
          // Text and media only come from get_chapter_body, which answers for
          // free chapters, chapters this reader unlocked, their own story, or admins.
          const { data: body } = await supabase.rpc('get_chapter_body', { p_chapter_id: thisChapter.id });
          if (body) { setChapter({ ...thisChapter, ...body }); setUnlocked(true); }
          else { setUnlocked(false); }
        }`,
  },
  {
    file: CR, label: 'after unlocking: check the result, then load the text',
    from: `      if (rpcError) throw rpcError;
      setInk(v => v - chapter.ink_cost);
      setUnlocked(true);`,
    to: `      if (rpcError) throw rpcError;
      if (result && result.ok === false) { alert(result.error === 'Insufficient Ink' ? \`You need \${chapter.ink_cost} Ink.\` : (result.error ?? 'Could not unlock this chapter.')); return; }
      if (!result?.already) setInk(v => v - chapter.ink_cost);
      const { data: body } = await supabase.rpc('get_chapter_body', { p_chapter_id: chapter.id });
      if (body) setChapter(c => (c ? { ...c, ...body } : c));
      setUnlocked(true);`,
  },

  // ═══ SERVER PAGE ══════════════════════════════════════════════════════
  {
    file: SP, label: 'server: chapter list without text or media',
    from: `&select=*&order=chapter_number`,
    to: `&select=${META.replace(/ /g, '')}&order=chapter_number`,
  },
  {
    file: SP, label: 'server: helper that asks get_chapter_body',
    from: `// Prose only ships in the HTML for free chapters.`,
    to: `// Text and media for one chapter, only if get_chapter_body allows it
// (for a signed-out visitor: free chapters only).
async function fetchBody(chapterId: string) {
  try {
    const res = await fetch(\`\${SUPA}/rest/v1/rpc/get_chapter_body\`, {
      method: "POST",
      headers: { apikey: ANON!, Authorization: \`Bearer \${ANON}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_chapter_id: chapterId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Prose only ships in the HTML for free chapters.`,
  },
  {
    file: SP, label: 'server: free chapter text for the page',
    from: `  const thisChapter = chapters.find((c: any) => c.chapter_number === parseInt(chapter, 10)) ?? null;`,
    to: `  const thisChapter = chapters.find((c: any) => c.chapter_number === parseInt(chapter, 10)) ?? null;
  if (thisChapter?.is_free) Object.assign(thisChapter, (await fetchBody(thisChapter.id)) ?? {});`,
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