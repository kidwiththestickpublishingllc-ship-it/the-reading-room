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

  // ── helper: the story's theme colour, as a translucent ink ──────────
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'add hexToRgba helper',
    from: `const DEFAULT_THEME: StageTheme = { bgFrom: "#16263f", bgTo: "#0f1c30", mode: "dark" };`,
    to: `const DEFAULT_THEME: StageTheme = { bgFrom: "#16263f", bgTo: "#0f1c30", mode: "dark" };

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map(function (c) { return c + c; }).join("") : h;
  const num = parseInt(n, 16);
  return "rgba(" + ((num >> 16) & 255) + ", " + ((num >> 8) & 255) + ", " + (num & 255) + ", " + a + ")";
}`,
  },

  // ── the stage sits on paper, the colour becomes a marker ────────────
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'force the light palette, build the highlighter gradient',
    from: `  const isLight = theme.mode === "light";`,
    to: `  // The stage sits on paper now, so the light palette always applies.
  const isLight = true;

  // The story's colour survives as a highlighter swipe over the description.
  const hlMark = hexToRgba(theme.bgFrom, 0.32);
  const hlGradient =
    "linear-gradient(104deg, rgba(0,0,0,0) 0.3%, " + hlMark +
    " 1.8%, " + hlMark + " 97%, rgba(0,0,0,0) 99%)";`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'stage background → paper',
    from: '        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,',
    to: '        background: "var(--plate)",',
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'description gets the highlighter',
    from: `        <div className="ss-desc" style={{ color: txtDim }}>{story.description}</div>`,
    to: `        <div className="ss-desc" style={{ color: txtMain }}>
          <span className="ss-desc-mark" style={{ backgroundImage: hlGradient }}>{story.description}</span>
        </div>`,
  },

  // ── the marker rule + the three remaining dark fills ────────────────
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'add .ss-desc-mark',
    from: `        .ss-desc { font-family: 'Lora', serif; font-size: 13px; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }`,
    to: `        .ss-desc { font-family: 'Lora', serif; font-size: 13px; line-height: 1.85; flex: 1; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .ss-desc-mark { display: inline; -webkit-box-decoration-break: clone; box-decoration-break: clone; padding: 2px 4px; margin: 0 -3px; background-repeat: no-repeat; border-radius: 1px; }`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'stage shadow → paper shadow',
    from: `        .ss-stage { position: relative; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.4); display: grid; grid-template-columns: 240px 1.1fr 1fr 0.9fr; min-height: 360px; margin-bottom: 16px; }`,
    to: `        .ss-stage { position: relative; border-radius: 4px; overflow: hidden; box-shadow: 0 14px 34px var(--surface-shadow); display: grid; grid-template-columns: 240px 1.1fr 1fr 0.9fr; min-height: 360px; margin-bottom: 16px; }`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'author photo frame → paper',
    from: `        .ss-author-photo { width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(135deg, #1e2e48, #2a3f60); border: 1px solid; display: flex; align-items: center; justify-content: center; font-family: 'Cinzel', serif; font-size: 22px; overflow: hidden; }`,
    to: `        .ss-author-photo { width: 56px; height: 56px; border-radius: 2px; flex-shrink: 0; background: var(--plate); border: 1px solid; display: flex; align-items: center; justify-content: center; font-family: 'Cinzel', serif; font-size: 22px; overflow: hidden; }`,
  },
  {
    file: 'app/reading-room/components/StoryStage.tsx',
    label: 'media placeholder → empty slot on paper',
    from: `        .ss-media-box { width: 100%; flex: 1; min-height: 200px; border-radius: 10px; overflow: hidden; border: 1px solid; background: #0d1726; }`,
    to: `        .ss-media-box { width: 100%; flex: 1; min-height: 200px; border-radius: 2px; overflow: hidden; border: 1px dashed var(--edge); background: var(--plate); }`,
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