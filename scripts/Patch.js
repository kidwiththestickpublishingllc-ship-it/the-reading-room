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

  // ── 1. The sign moves above the hero ────────────────────────────────
  {
    file: 'app/reading-room/page.tsx',
    label: 'remove WelcomeBoard from inside ttl-wrap',
    from: `
          <WelcomeBoard />
`,
    to: `
`,
  },
  {
    file: 'app/reading-room/page.tsx',
    label: 'place WelcomeBoard above GroundFloor, in its own wrap',
    from: `        {/* ── HERO ── */}
        <GroundFloor />`,
    to: `        {/* ── THE SIGN ── */}
        <div className="ttl-wrap">
          <WelcomeBoard />
        </div>

        {/* ── HERO ── */}
        <GroundFloor />`,
  },

  // ── 2. Genre bar becomes a whiteboard ───────────────────────────────
  {
    file: 'app/reading-room/page.tsx',
    label: '.ttl-filter-bar → whiteboard panel (chalkboard in dark)',
    from: `  .ttl-filter-bar {
    background: var(--ink-surface);
    border: 1px solid var(--ink-border);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }`,
    to: `  .ttl-filter-bar {
    position: relative;
    background: #F7F7F4;
    background-image: linear-gradient(177deg, rgba(255,255,255,0.92), rgba(226,229,227,0.5));
    border: 12px solid #2A2A28;
    border-radius: 14px;
    padding: 24px 26px 26px;
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px 20px;
    box-shadow:
      0 16px 34px var(--surface-shadow),
      inset 0 1px 0 rgba(255,255,255,0.95),
      inset 0 -20px 34px rgba(0,0,0,0.05);
  }
  :root[data-theme="dark"] .ttl-filter-bar {
    background: #22312B;
    background-image: none;
    border-color: #4A3A28;
    box-shadow: 0 16px 34px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3);
  }`,
  },
  {
    file: 'app/reading-room/page.tsx',
    label: '.ttl-filter-btn → dry-erase marker in four colours',
    from: `  .ttl-filter-btn {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid rgba(232,228,218,0.2);
    background: rgba(232,228,218,0.06);
    color: rgba(232,228,218,0.7);
    cursor: pointer;
    transition: all 0.18s;
  }`,
    to: `  .ttl-filter-btn {
    position: relative;
    font-family: 'Caveat', cursive;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    line-height: 1.05;
    padding: 2px 6px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #2F4F8F;
    cursor: pointer;
    transition: transform 0.15s, opacity 0.15s;
  }
  .ttl-filter-btn:nth-child(4n+2) { color: #26262B; }
  .ttl-filter-btn:nth-child(4n+3) { color: #2E6B45; }
  .ttl-filter-btn:nth-child(4n+4) { color: #9E3030; }
  :root[data-theme="dark"] .ttl-filter-btn { color: #EDEAE2; }
  :root[data-theme="dark"] .ttl-filter-btn:nth-child(4n+2) { color: #C7DCCB; }
  :root[data-theme="dark"] .ttl-filter-btn:nth-child(4n+3) { color: #E4D9B6; }
  :root[data-theme="dark"] .ttl-filter-btn:nth-child(4n+4) { color: #E8C2C2; }`,
  },
  {
    file: 'app/reading-room/page.tsx',
    label: '.ttl-filter-btn hover → lift, not fill',
    from: `  .ttl-filter-btn:hover { border-color: var(--blue-dim); color: var(--blue-bright); background: var(--blue-dim); }`,
    to: `  .ttl-filter-btn:hover { transform: translateY(-1px) rotate(-0.6deg); opacity: 0.68; background: transparent; }`,
  },
  {
    file: 'app/reading-room/page.tsx',
    label: '.ttl-filter-btn.active → circled by hand',
    from: `  .ttl-filter-btn.active {
    background: var(--gold-glow) !important;
    border-color: var(--gold-dim) !important;
    color: var(--gold-light) !important;
  }`,
    to: `  .ttl-filter-btn.active {
    background: transparent !important;
    border-color: transparent !important;
    color: #9E3030 !important;
  }
  .ttl-filter-btn.active::after {
    content: "";
    position: absolute;
    inset: -6px -12px;
    border: 2px solid currentColor;
    border-radius: 52% 48% 47% 53% / 59% 41% 57% 43%;
    transform: rotate(-1.6deg);
    opacity: 0.8;
    pointer-events: none;
  }
  :root[data-theme="dark"] .ttl-filter-btn.active { color: #F0C9C9 !important; }`,
  },

  // ── 3. The LitRPG neon glow has no business on a whiteboard ─────────
  {
    file: 'app/reading-room/components/FeaturedStories.tsx',
    label: 'LitRPG chip → pink marker instead of neon',
    from: `            style={g === "LitRPG" ? { color: "#FF69B4", borderColor: "#FF1493", boxShadow: "0 0 10px rgba(255,20,147,0.6), inset 0 0 6px rgba(255,20,147,0.15)", textShadow: "0 0 6px rgba(255,20,147,0.5)", animation: "litrpgBtnGlow 2.5s ease-in-out infinite" } : undefined}`,
    to: `            style={g === "LitRPG" ? { color: "#C2187F" } : undefined}`,
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