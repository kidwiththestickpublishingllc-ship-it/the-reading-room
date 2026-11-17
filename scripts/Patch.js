/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 * If anything is missing or ambiguous, NOTHING is written. CRLF safe.
 *
 * Batch: chapter reader paywall.
 *   • An ad space below the lock box (TTL house ads now, AdSense later),
 *     labeled and kept apart from the Unlock / Join buttons.
 *   • Locked chapters get their 600-character teaser back, from
 *     get_chapter_teaser — never the full text.
 *   • "Sergio is still writing…" now uses the story's real author.
 */

const fs = require('fs');
const path = require('path');

const CR = 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx';

const EDITS = [
  {
    file: CR, label: 'locked chapters: teaser only (600 characters)',
    from: `          else { setUnlocked(false); }`,
    to: `          else {
            // Locked: only a short teaser (the first 600 characters), never the chapter.
            const { data: teaser } = await supabase.rpc('get_chapter_teaser', { p_chapter_id: thisChapter.id });
            if (teaser) setChapter({ ...thisChapter, content: teaser });
            setUnlocked(false);
          }`,
  },
  {
    file: CR, label: '"still writing" uses the real author',
    from: `<p className="empty-content">Sergio is still writing this chapter — check back soon.</p>`,
    to: `<p className="empty-content">{story.author_name || 'The author'} is still writing this chapter — check back soon.</p>`,
  },
  {
    file: CR, label: 'ad space below the lock box',
    from: `                  </>
                )}
              </div>
            </>
          )}
        </main>`,
    to: `                  </>
                )}
              </div>
              {/* Ad space at the paywall: below the lock box, apart from its buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '40px auto 8px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Advertisement</span>
                <TTLHouseAd width={300} height={250} />
              </div>
            </>
          )}
        </main>`,
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