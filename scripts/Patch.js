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
    file: 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx',
    label: 'wrapper accepts the server data',
    from: `export default function ChapterReaderClient({ storySlug, chapterNum }: { storySlug: string; chapterNum: number }) {
  return <ChapterReaderContent storySlug={storySlug} chapterNum={chapterNum} />;
}`,
    to: `export default function ChapterReaderClient({
  storySlug, chapterNum, initialStory = null, initialChapter = null, initialChapters = [],
}: {
  storySlug: string; chapterNum: number;
  initialStory?: any; initialChapter?: any; initialChapters?: any[];
}) {
  return (
    <ChapterReaderContent
      storySlug={storySlug}
      chapterNum={chapterNum}
      initialStory={initialStory}
      initialChapter={initialChapter}
      initialChapters={initialChapters}
    />
  );
}`,
  },
  {
    file: 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx',
    label: 'content component accepts the server data',
    from: `function ChapterReaderContent({ storySlug, chapterNum }: { storySlug: string; chapterNum: number }) {`,
    to: `function ChapterReaderContent({
  storySlug, chapterNum, initialStory = null, initialChapter = null, initialChapters = [],
}: {
  storySlug: string; chapterNum: number;
  initialStory?: any; initialChapter?: any; initialChapters?: any[];
}) {`,
  },
  {
    file: 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx',
    label: 'seed state from the server render',
    from: `  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);`,
    to: `  const [story, setStory] = useState<Story | null>(initialStory);
  const [chapter, setChapter] = useState<Chapter | null>(initialChapter);
  const [allChapters, setAllChapters] = useState<Chapter[]>(initialChapters);`,
  },
  {
    file: 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx',
    label: 'no skeleton when the server already rendered',
    from: `  const [loading, setLoading] = useState(true);`,
    to: `  const [loading, setLoading] = useState(!initialChapter);`,
  },
  {
    file: 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx',
    label: 'and no flash back to it when the effect runs',
    from: `        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();`,
    to: `        setLoading(!initialChapter);
        const { data: { session } } = await supabase.auth.getSession();`,
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