"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    AdProvider?: any[];
  }
}

// =============================================================
// TTL Ad Window — ExoClick zone 5938670 (300x500)
// Drop in: app/reading-room/components/AdWindow.tsx
//
// Ad slot stays EXACTLY 300x500. The animated gold gradient border
// + pulsing glow sit OUTSIDE the slot (2px padding + box-shadow),
// so they decorate the window without changing the ad size.
// =============================================================

const EXO_ZONE_ID = "5938670";

export default function AdWindow({
  width = 300,
  height = 500,
  zoneId = EXO_ZONE_ID,
}: {
  width?: number;
  height?: number;
  zoneId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const initialized = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || initialized.current) return;
    initialized.current = true;

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
  }, [mounted]);

  return (
    <>
      <style>{`
        @keyframes adwin-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(201,168,76,0.55),
              0 0 18px rgba(201,168,76,0.40),
              0 0 42px rgba(201,168,76,0.20);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(226,201,126,0.75),
              0 0 30px rgba(201,168,76,0.65),
              0 0 72px rgba(201,168,76,0.35);
          }
        }
        @keyframes adwin-border-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .adwin-frame {
          position: relative;
          width: max-content;
          margin: auto;
          padding: 2px;
          border-radius: 0;
          background: linear-gradient(120deg, #8a6510, #C9A84C, #FFE066, #E2C97E, #C9A84C, #8a6510);
          background-size: 300% 300%;
          animation: adwin-border-shift 6s ease infinite, adwin-pulse 2.8s ease-in-out infinite;
        }
        .adwin-slot {
          background: #0a0503;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
      `}</style>

      <div className="adwin-frame">
        <div className="adwin-slot" style={{ width, height }}>
          {mounted ? (
            <ins
              className="eas6a97888e2"
              data-zoneid={zoneId}
              style={{ display: "block", width, height }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
