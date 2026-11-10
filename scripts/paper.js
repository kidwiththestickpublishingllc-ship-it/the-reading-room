/* scripts/paper.js — move a component from the dark design onto paper.
 *
 *   node scripts/paper.js <file> [<file> ...]            → dry run, shows every line it would change
 *   node scripts/paper.js --apply <file> [<file> ...]    → writes
 *
 * Run from the repo root. Preserves CRLF.
 * Line-based, so it can be context-aware: a dark fill inside a gradient
 * is left alone, a dark fill behind a panel is not.
 */

const fs = require('fs');
const path = require('path');

// Light-on-dark text → ink on paper, graded by the alpha it was using.
function inkFor(alpha) {
  const a = parseFloat(alpha);
  if (isNaN(a) || a >= 0.8) return 'var(--text-main)';
  if (a >= 0.5) return 'var(--text-dim)';
  return 'var(--text-faint)';
}

// Applied to every line.
const RULES = [
  { re: /rgba\(232,\s*228,\s*218,\s*([\d.]+)\)/g, to: (_, a) => inkFor(a) },
  { re: /rgba\(240,\s*236,\s*226,\s*([\d.]+)\)/g, to: (_, a) => inkFor(a) },
  { re: /#f0ece2\b/gi, to: () => 'var(--text-main)' },
  { re: /#e8e4da\b/gi, to: () => 'var(--text-main)' },

  // the glow gold becomes the paper gold, alpha intact
  { re: /rgba\(201,\s*168,\s*76,\s*([\d.]+)\)/g, to: (_, a) => `rgba(138, 101, 16, ${a})` },

  // white used as a FILL becomes a warm paper wash, not a border colour
  { fill: true, re: /(background(?:-color|Color)?:\s*"?)rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/g,
    to: (_, p) => p + 'var(--wash, rgba(122,96,40,0.06))' },
  { fill: true, re: /(style\.background\s*=\s*")rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/g,
    to: (_, p) => p + 'var(--wash, rgba(122,96,40,0.06))' },

  // whatever is left is a hairline that assumed a dark ground
  { re: /rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/g, to: () => 'var(--edge)' },

  // signal colours picked for contrast against black
  { re: /#f87171\b/gi, to: () => '#C0392B' },
  { re: /#4ade80\b/gi, to: () => '#2E6B45' },
];

// Applied only to lines that are NOT painting a gradient.
const SOLID_RULES = [
  { re: /#C9A84C\b/g, to: () => 'var(--gold)' },
  { re: /#111111\b|#0a0a0a\b|#1a1a1a\b|#1a1a2e\b|#16213e\b/gi, to: () => 'var(--plate)' },
  { re: /"#111"/g, to: () => '"var(--plate)"' },
];

// Applied only to shadow lines: heavy black shadows assumed a dark page.
const SHADOW_RULE = { re: /rgba\(0,\s*0,\s*0,\s*0\.[4-9]\d?\)/g, to: () => 'var(--surface-shadow)' };

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const files = args.filter(a => a !== '--apply');

if (!files.length) {
  console.error('Give me at least one file path.');
  process.exit(1);
}

function clip(s) { return s.length > 108 ? s.slice(0, 105) + '...' : s; }

let grand = 0;

for (const rel of files) {
  const full = path.join(process.cwd(), rel);
  if (!fs.existsSync(full)) {
    console.log(`skip (missing)  ${rel}`);
    continue;
  }

  const raw = fs.readFileSync(full, 'utf8');
  const crlf = raw.includes('\r\n');
  const lines = (crlf ? raw.replace(/\r\n/g, '\n') : raw).split('\n');

  let changed = 0;
  console.log('');
  console.log(rel);

  for (let i = 0; i < lines.length; i++) {
    const before = lines[i];
    let after = before;

    // a 1px element with a background is a divider, so it keeps the edge colour
    const isHairline = /height:\s*1\b/.test(after);
    for (const r of RULES) {
      if (isHairline && r.fill) continue;
      after = after.replace(r.re, r.to);
    }

    if (!/gradient/i.test(after)) {
      for (const r of SOLID_RULES) after = after.replace(r.re, r.to);
    }

    if (/box-shadow|boxShadow/i.test(after)) {
      after = after.replace(SHADOW_RULE.re, SHADOW_RULE.to);
    }

    if (after !== before) {
      changed++;
      console.log(`  ${String(i + 1).padStart(4)}  - ${clip(before.trim())}`);
      console.log(`        + ${clip(after.trim())}`);
      lines[i] = after;
    }
  }

  grand += changed;
  console.log(`  ${changed} line${changed === 1 ? '' : 's'}`);

  if (apply && changed) {
    const out = lines.join('\n');
    fs.writeFileSync(full, crlf ? out.replace(/\n/g, '\r\n') : out, 'utf8');
  }
}

console.log('');
console.log(`${grand} lines across ${files.length} file${files.length === 1 ? '' : 's'}.`);
console.log(apply ? 'Written. Check Problems, then push.' : 'Dry run. Add --apply to write.');