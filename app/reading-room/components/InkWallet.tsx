"use client";

// app/reading-room/components/InkWallet.tsx
// The wallet as a ledger page: printed labels, handwritten figures,
// ruled lines, a price list with dotted leaders.
// Prefix: lg-

type InkPack = { id: string; label: string; ink: number; price: string };

interface InkWalletProps {
  ink: number;
  inkPacks: InkPack[];
  isOpeningCheckout: boolean;
  openingInk: number | null;
  onBuyInk: (amount: number) => void;
  unlockCost?: number;
}

const STYLES = `
  .lg-page {
    position: relative;
    background: var(--plate);
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 37px,
      var(--paper-rule, rgba(90,130,170,0.17)) 37px,
      var(--paper-rule, rgba(90,130,170,0.17)) 38px);
    border: 1px solid var(--edge);
    border-radius: 2px;
    padding: 40px 44px 44px 86px;
    box-shadow: 0 14px 34px var(--surface-shadow);
    margin-top: 40px;
  }
  .lg-margin {
    position: absolute; left: 66px; top: 0; bottom: 0; width: 2px;
    background: var(--margin-rule, rgba(190,60,60,0.42));
  }

  .lg-kicker {
    font: 700 10px 'Syne', sans-serif;
    letter-spacing: 0.26em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 6px;
  }
  .lg-h {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 38px; font-weight: 400; line-height: 1;
    color: var(--text-main); margin: 0 0 30px;
  }

  /* balance */
  .lg-bal { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
  .lg-num {
    font-family: 'Caveat', cursive; font-weight: 700;
    font-size: 76px; line-height: 0.9; color: var(--text-main);
  }
  .lg-unit {
    font-family: 'Caveat', cursive; font-size: 30px;
    color: var(--gold);
  }
  .lg-worth {
    font-size: 15px; line-height: 1.6; color: var(--text-dim);
    margin: 14px 0 34px; max-width: 46ch;
  }

  .lg-rule {
    border: none; border-top: 2px solid var(--edge);
    margin: 0 0 26px;
  }

  /* price list */
  .lg-list-k {
    font: 700 10px 'Syne', sans-serif;
    letter-spacing: 0.26em; text-transform: uppercase;
    color: var(--text-dim); margin-bottom: 14px;
  }
  .lg-row {
    display: flex; align-items: baseline; gap: 14px;
    padding: 15px 0;
    border-bottom: 1px solid var(--edge);
  }
  .lg-row-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 21px; color: var(--text-main); white-space: nowrap;
  }
  .lg-row-ink {
    font-family: 'Caveat', cursive; font-weight: 700;
    font-size: 26px; color: var(--gold); white-space: nowrap;
  }
  .lg-leader {
    flex: 1; min-width: 24px;
    border-bottom: 2px dotted var(--edge);
    transform: translateY(-5px);
  }
  .lg-row-price {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px; color: var(--text-main); white-space: nowrap;
  }
  .lg-buy {
    font: 700 11px 'Syne', sans-serif;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #FAF6EC; background: #2A2520;
    border: none; border-radius: 2px;
    padding: 11px 20px; cursor: pointer; white-space: nowrap;
    transition: background 0.18s;
  }
  .lg-buy:hover { background: #1B1714; }
  .lg-buy:disabled { opacity: 0.5; cursor: default; }

  .lg-foot {
    font-size: 13.5px; color: var(--text-dim);
    margin-top: 26px; line-height: 1.7;
  }

  @media (max-width: 760px) {
    .lg-page { padding: 26px 20px 30px 34px; }
    .lg-margin { left: 20px; }
    .lg-num { font-size: 58px; }
    .lg-row { flex-wrap: wrap; gap: 10px; }
    .lg-leader { display: none; }
  }
`;

export default function InkWallet({
  ink, inkPacks, isOpeningCheckout, openingInk, onBuyInk, unlockCost = 25,
}: InkWalletProps) {
  const unlocks = Math.floor(ink / unlockCost);

  return (
    <div className="lg-page">
      <style>{STYLES}</style>
      <span className="lg-margin" aria-hidden="true" />

      <div className="lg-kicker">Ledger</div>
      <h2 className="lg-h">Reader Ink</h2>

      <div className="lg-bal">
        <span className="lg-num">{ink.toLocaleString()}</span>
        <span className="lg-unit">ink</span>
      </div>
      <p className="lg-worth">
        {ink > 0
          ? <>Enough to unlock <strong>{unlocks.toLocaleString()}</strong> {unlocks === 1 ? "chapter" : "chapters"} at {unlockCost} Ink each. Every unlock pays the author directly.</>
          : <>You haven&rsquo;t any Ink yet. First chapters are always free — Ink unlocks what comes after, and goes to the author.</>}
      </p>

      <hr className="lg-rule" />

      <div className="lg-list-k">Buy Ink</div>
      {inkPacks.map(p => (
        <div className="lg-row" key={p.id}>
          <span className="lg-row-name">{p.label}</span>
          <span className="lg-row-ink">{p.ink.toLocaleString()}</span>
          <span className="lg-leader" aria-hidden="true" />
          <span className="lg-row-price">{p.price}</span>
          <button
            type="button"
            className="lg-buy"
            onClick={() => onBuyInk(p.ink)}
            disabled={isOpeningCheckout}
          >
            {isOpeningCheckout && openingInk === p.ink ? "Opening…" : "Buy"}
          </button>
        </div>
      ))}

      <p className="lg-foot">Payments handled by Stripe. Ink never expires.</p>
    </div>
  );
}