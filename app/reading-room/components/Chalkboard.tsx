"use client";

// app/components/Chalkboard.tsx
// The surface the page lies on. Fixed, so it stays put while content
// scrolls over it. Dropped on narrow screens where there are no gutters.
// Prefix: cb-

const STYLES = `
  .cb-board {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-color: #2E3A35;
    background-image: url('/images/chalkboard.jpg');
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
  }
  :root[data-theme="dark"] .cb-board {
    background-color: #151A18;
    filter: brightness(0.72);
  }
  @media (max-width: 1240px) {
    .cb-board { background-image: none; }
  }
`;

export default function Chalkboard() {
  return (
    <div className="cb-board" aria-hidden="true">
      <style>{STYLES}</style>
    </div>
  );
}