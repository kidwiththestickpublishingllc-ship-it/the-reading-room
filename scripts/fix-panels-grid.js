const fs = require('fs');
const file = 'app/galleria/comics/genres/[type]/[genre]/page.tsx';
let c = fs.readFileSync(file, 'utf8');

// Update GenreMeta type to support 4 panels
c = c.replace(
  '  panel1?: string;\n  panel2?: string;\n  panel3?: string;',
  '  panel1?: string;\n  panel2?: string;\n  panel3?: string;\n  panel4?: string;'
);

// Find and replace panels CSS
const oldCSS = c.substring(
  c.indexOf('  /* ── COMIC PANELS HERO ── */'),
  c.indexOf('  ::-webkit-scrollbar { width: 6px; }')
);

const newCSS = `  /* ── COMIC PANELS HERO ── */
  .gp-panels-hero {
    position: relative;
    background: #111;
    border-left: 6px solid #111;
    border-right: 6px solid #111;
  }
  .gp-panels-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 6px;
    height: 480px;
    padding: 6px;
    background: #111;
  }
  .gp-panel {
    position: relative;
    overflow: hidden;
    background: #f0fffe;
  }
  .gp-panel img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform 0.4s ease;
  }
  .gp-panel:hover img { transform: scale(1.03); }
  .gp-panel-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bangers', cursive; font-size: 80px;
    color: rgba(20,241,217,0.2);
    background: linear-gradient(135deg, #f8fffe, #e8fff8);
  }
  .gp-panel-1 { grid-column: 1; grid-row: 1; }
  .gp-panel-2 { grid-column: 2; grid-row: 1; border-left: none; }
  .gp-panel-3 { grid-column: 1; grid-row: 2; }
  .gp-panel-4 { grid-column: 2; grid-row: 2; }
  .gp-panel-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 60%);
    z-index: 2;
  }
  .gp-panels-hero-text {
    padding: 20px 32px;
    background: #fff;
    border-top: 6px solid #111;
  }
  @media (max-width: 768px) {
    .gp-panels-row { height: 320px; gap: 4px; padding: 4px; }
    .gp-panels-hero-text { padding: 14px 18px; }
  }
  @media (max-width: 480px) {
    .gp-panels-row { height: 240px; }
  }
`;

c = c.replace(oldCSS, newCSS);
console.log('CSS replaced');

// Now fix the JSX — replace 3 panels with 4 panels in gp-panels-row
const oldJSX = `        {/* ── COMIC PANELS HERO ── */}
        <div className="gp-panels-hero"><div className="gp-panels-row">
          {/* Panel 1 */}
          <div className="gp-panel gp-panel-1">
            {meta.panel1
              ? <img src={meta.panel1} alt={meta.label + " panel 1"} />
              : <div className="gp-panel-placeholder">{meta.emoji}</div>
            }
            <div className="gp-panel-overlay" />
          </div>
          {/* Panel 2 — center, largest */}
          <div className="gp-panel gp-panel-2">
            {meta.panel2 ?? meta.cover
              ? <img src={meta.panel2 ?? meta.cover} alt={meta.label + " panel 2"} />
              : <div className="gp-panel-placeholder">{meta.emoji}</div>
            }
            <div className="gp-panel-overlay" />
          </div>
          {/* Panel 3 */}
          <div className="gp-panel gp-panel-3">
            {meta.panel3
              ? <img src={meta.panel3} alt={meta.label + " panel 3"} />
              : <div className="gp-panel-placeholder">{meta.emoji}</div>
            }
            <div className="gp-panel-overlay" />
          </div>
          </div>
          {/* Text — below panels */}`;

const newJSX = `        {/* ── COMIC PANELS HERO ── */}
        <div className="gp-panels-hero">
          <div className="gp-panels-row">
            {/* Panel 1 — top left */}
            <div className="gp-panel gp-panel-1">
              {meta.panel1
                ? <img src={meta.panel1} alt={meta.label + " panel 1"} />
                : <div className="gp-panel-placeholder">{meta.emoji}</div>
              }
              <div className="gp-panel-overlay" />
            </div>
            {/* Panel 2 — top right */}
            <div className="gp-panel gp-panel-2">
              {meta.panel2 ?? meta.cover
                ? <img src={meta.panel2 ?? meta.cover} alt={meta.label + " panel 2"} />
                : <div className="gp-panel-placeholder">{meta.emoji}</div>
              }
              <div className="gp-panel-overlay" />
            </div>
            {/* Panel 3 — bottom left */}
            <div className="gp-panel gp-panel-3">
              {meta.panel3
                ? <img src={meta.panel3} alt={meta.label + " panel 3"} />
                : <div className="gp-panel-placeholder">{meta.emoji}</div>
              }
              <div className="gp-panel-overlay" />
            </div>
            {/* Panel 4 — bottom right */}
            <div className="gp-panel gp-panel-4">
              {meta.panel4
                ? <img src={meta.panel4} alt={meta.label + " panel 4"} />
                : <div className="gp-panel-placeholder">{meta.emoji}</div>
              }
              <div className="gp-panel-overlay" />
            </div>
          </div>
          {/* Text — below panels */}`;

if (c.includes(oldJSX)) {
  c = c.replace(oldJSX, newJSX);
  console.log('JSX replaced');
} else {
  console.log('JSX NOT FOUND');
}

fs.writeFileSync(file, c, 'utf8');
console.log('Done.');
