/* scripts/patch.js — exact, verified edits.
 *
 *   node scripts/patch.js           → dry run
 *   node scripts/patch.js --apply   → writes
 *
 * Run from the repo root (~/the-reading-room).
 *   exact  — FROM must appear exactly once, replaced with TO
 *   block  — everything from START up to (not including) END is replaced
 *   import — LINE is added above the file's first import (once)
 * If anything is missing or ambiguous, NOTHING is written. CRLF safe.
 * At the end it checks no ExoClick code is left in the edited files.
 *
 * Batch: Reading Room — ExoClick out. Every ad space shows TTL's own
 * rotating house ads (TTLHouseAd) until AdSense goes in.
 */

const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(process.cwd(), 'app/reading-room/components/TTLHouseAd.tsx'))) {
  console.log('  ✗ app/reading-room/components/TTLHouseAd.tsx is missing — create it first, then run this again.');
  process.exit(1);
}

const CM = 'app/reading-room/comics/page.tsx';
const GP = 'app/reading-room/genres/[genre]/page.tsx';
const SP = 'app/reading-room/stories/page.tsx';
const AW = 'app/reading-room/components/AdWindow.tsx';
const CR = 'app/reading-room/stories/[slug]/chapters/[chapter]/ChapterReaderClient.tsx';

const LABEL_FROM = `>SPONSORED</span>\n`;
const LABEL_TO = `>FROM THE LIBRARY</span>\n`;
const SKY = `              <TTLHouseAd width={160} height={600} />`;

const EDITS = [

  // ═══ COMICS PAGE ══════════════════════════════════════════════════════
  { file: CM, kind: 'import', label: 'import TTLHouseAd', line: `import TTLHouseAd from "../components/TTLHouseAd";` },
  {
    file: CM, kind: 'exact', label: 'skyscraper: ExoClick → house ad',
    from: `${LABEL_FROM}              <iframe src="//a.magsrv.com/iframe.php?idzone=5907426&size=160x600" width="160" height="600" scrolling="no" frameBorder={0} style={{ border: 'none', display: 'block', margin: '0 auto' }} />`,
    to: `${LABEL_TO}${SKY}`,
  },

  // ═══ GENRE PAGES ══════════════════════════════════════════════════════
  { file: GP, kind: 'import', label: 'import TTLHouseAd', line: `import TTLHouseAd from "../../components/TTLHouseAd";` },
  {
    file: GP, kind: 'exact', label: 'skyscraper: ExoClick → house ad',
    from: `${LABEL_FROM}              <iframe src={\`//a.magsrv.com/iframe.php?idzone=\${GENRE_AD_ZONES[genreSlug] ?? FALLBACK_AD_ZONE}&size=160x600\`} width="160" height="600" scrolling="no" frameBorder={0} style={{ border: 'none', display: 'block', margin: '0 auto' }} />`,
    to: `${LABEL_TO}${SKY}`,
  },

  // ═══ STORIES PAGE ═════════════════════════════════════════════════════
  { file: SP, kind: 'import', label: 'import TTLHouseAd', line: `import TTLHouseAd from "../components/TTLHouseAd";` },
  {
    file: SP, kind: 'exact', label: 'skyscraper: ExoClick → house ad',
    from: `${LABEL_FROM}              <iframe src="//a.magsrv.com/iframe.php?idzone=5944436&size=160x600" width="160" height="600" scrolling="no" frameBorder={0} style={{ border: 'none', display: 'block', margin: '0 auto' }} />`,
    to: `${LABEL_TO}${SKY}`,
  },

  // ═══ HERO AD WINDOW ═══════════════════════════════════════════════════
  {
    file: AW, kind: 'exact', label: 'ad window: import TTLHouseAd',
    from: `import { useEffect, useRef, useState } from "react";`,
    to: `import { useEffect, useRef, useState } from "react";
import TTLHouseAd from "./TTLHouseAd";`,
  },
  {
    file: AW, kind: 'exact', label: 'ad window: drop the ExoClick type',
    from: `declare global {
  interface Window {
    AdProvider?: any[];
  }
}

`,
    to: ``, done: `import TTLHouseAd from "./TTLHouseAd";`,
  },
  {
    file: AW, kind: 'exact', label: 'ad window: header comment',
    from: `// TTL Ad Window — ExoClick zone 5938670 (300x500)`,
    to: `// TTL Ad Window — 300x500, shows TTL house ads (AdSense later)`,
  },
  {
    file: AW, kind: 'exact', label: 'ad window: stop loading ExoClick',
    from: `
    // 1. Load the ExoClick ad-provider script once.
    if (!document.querySelector('script[src="https://a.magsrv.com/ad-provider.js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.type = "application/javascript";
      script.src = "https://a.magsrv.com/ad-provider.js";
      document.body.appendChild(script);
    }

    // 2. Tell ExoClick to serve the zone.
    window.AdProvider = window.AdProvider || [];
    window.AdProvider.push({ serve: {} });
`,
    to: ``, done: `<TTLHouseAd width={width} height={height} />`,
  },
  {
    file: AW, kind: 'exact', label: 'ad window: ExoClick slot → house ad',
    from: `            <ins
              className="eas6a97888e2"
              data-zoneid={zoneId}
              style={{ display: "block", width, height }}
            />`,
    to: `            <TTLHouseAd width={width} height={height} />`,
  },

  // ═══ CHAPTER GATE ═════════════════════════════════════════════════════
  { file: CR, kind: 'import', label: 'import TTLHouseAd', line: `import TTLHouseAd from "../../../../components/TTLHouseAd";` },
  {
    file: CR, kind: 'exact', label: 'chapter gate: stop loading ExoClick',
    from: `    // inject magsrv provider + serve the zone
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://a.magsrv.com/ad-provider.js';
    document.body.appendChild(s);
    s.onload = () => {
      try { ((window as any).AdProvider = (window as any).AdProvider || []).push({ serve: {} }); } catch {}
    };
`,
    to: ``, done: `<TTLHouseAd width={300} height={250} />`,
  },
  {
    file: CR, kind: 'exact', label: 'chapter gate: ExoClick slot → house ad',
    from: `<ins className="eas6a97888e2" data-zoneid="5949872"></ins>`,
    to: `<TTLHouseAd width={300} height={250} />`,
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
const report = (sym, msg, e) => console.log(`  ${sym} ${msg.padEnd(15)} ${e.file.split('/').slice(-2).join('/').padEnd(34)} ${e.label}`);

for (const e of EDITS) {
  const f = load(e.file);
  if (!f) { console.log(`  ✗ MISSING FILE   ${e.file}`); missing++; continue; }

  if (e.kind === 'import') {
    if (f.text.includes(e.line)) { already++; report('·', 'already done', e); continue; }
    const m = f.text.match(/^import\s/m);
    if (!m) { missing++; report('✗', 'NO IMPORTS', e); continue; }
    f.text = f.text.slice(0, m.index) + e.line + '\n' + f.text.slice(m.index);
    f.dirty = true; ok++; report('✓', 'will add', e);
    continue;
  }

  if (e.kind === 'block') {
    if (e.done && !f.text.includes(e.start) && f.text.includes(e.done)) { already++; report('·', 'already done', e); continue; }
    const s = count(f.text, e.start), n = count(f.text, e.end);
    if (s !== 1 || n !== 1) {
      if (s > 1 || n > 1) { ambiguous++; report('✗', 'AMBIGUOUS', e); }
      else { missing++; report('✗', 'NOT FOUND', e); }
      continue;
    }
    const a = f.text.indexOf(e.start), b = f.text.indexOf(e.end);
    if (b < a) { missing++; report('✗', 'OUT OF ORDER', e); continue; }
    f.text = f.text.slice(0, a) + e.to + f.text.slice(b);
    f.dirty = true; ok++; report('✓', 'will replace', e);
    continue;
  }

  // exact
  const hits = count(f.text, e.from);
  if (hits === 1) {
    if (e.to.includes(e.from) && f.text.includes(e.to)) { already++; report('·', 'already done', e); continue; }
    f.text = f.text.replace(e.from, () => e.to);
    f.dirty = true; ok++; report('✓', 'will change', e);
  } else if (hits === 0) {
    if (e.done ? f.text.includes(e.done) : (e.to && f.text.includes(e.to))) { already++; report('·', 'already done', e); }
    else { missing++; report('✗', 'NOT FOUND', e); }
  } else {
    ambiguous++; report('✗', `AMBIGUOUS ${hits}×`, e);
  }
}

// After every edit, no ExoClick may be left in the edited files.
for (const [rel, f] of cache) {
  if (/magsrv|AdProvider|eas6a97888e|exoclick/i.test(f.text)) {
    console.log(`  ! ExoClick still referenced in ${rel} — send me: grep -niE "magsrv|AdProvider|eas6a97888e|exoclick" ${rel}`);
    if (!missing && !ambiguous) missing++;
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