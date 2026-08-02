"use client";

type InkPack = {
  id: string;
  label: string;
  ink: number;
  price: string;
};

interface InkWalletProps {
  ink: number;
  inkPacks: InkPack[];
  isOpeningCheckout: boolean;
  openingInk: number | null;
  onBuyInk: (amount: number) => void;
}

export default function InkWallet({ ink, inkPacks, isOpeningCheckout, openingInk, onBuyInk }: InkWalletProps) {
  return (
    <div className="ttl-section">
      <div className="ttl-section-header">
        <div>
          <div className="ttl-section-accent">
            <div className="ttl-section-bar" />
            <div>
              <span className="ttl-section-eyebrow">Wallet</span>
              <h2 className="ttl-section-title">Reader Ink</h2>
            </div>
          </div>
        </div>
      </div>
      <div className="ttl-divider" />
      <div className="ttl-wallet-grid">
        <div className="ttl-panel">
          <div className="ttl-panel-label">Your Balance</div>
          <div className="ttl-ink-num">{ink}</div>
          <p className="ttl-ink-sub">Ink is stored in your browser. It updates automatically after purchase.</p>
        </div>
        <div className="ttl-panel">
          <div className="ttl-panel-label">Buy Ink</div>
          <div className="ttl-ink-packs">
            {inkPacks.map(p => (
              <button key={p.id} type="button" onClick={() => onBuyInk(p.ink)} className="ttl-ink-pack">
                <div className="ttl-pack-label">{p.label}</div>
                <div className="ttl-pack-amount">{p.ink}</div>
                <div className="ttl-pack-price">{p.price}</div>
                <div className="ttl-pack-cta">
                  {isOpeningCheckout && openingInk === p.ink ? "Opening…" : "Stripe →"}
                </div>
              </button>
            ))}
          </div>
          <p className="ttl-ink-sub" style={{ marginTop: 14 }}>
            Set each Stripe success URL to <strong style={{ color: 'var(--text-main)' }}>/reading-room?ink=XXX</strong> for auto-credit.
          </p>
        </div>
      </div>
    </div>
  );
}