"use client";

import { useEffect, useRef, useState } from "react";

// =============================================================
// TTL Ad Window — sharp-edged, animated gradient glow border
// Drop in: app/reading-room/components/AdWindow.tsx
//
// Loads an Adsterra banner via real same-origin script injection
// (the reliable method — avoids the blank-iframe srcDoc problem).
//
// Usage in page.tsx hero left slot:
//   import AdWindow from "./components/AdWindow";
//   <AdWindow adKey="YOUR_300x250_KEY" width={300} height={250} />
// =============================================================

function AdsterraSlot({ adKey, width, height }: { adKey: string; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!ref.current || ref.current.querySelector("script")) return;

    // atOptions must be set on window BEFORE invoke.js runs
    (window as any).atOptions = {
      key: adKey,
      format: "iframe",
      height,
      width,
      params: {},
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    script.async = true;
    ref.current.appendChild(script);
  }, [adKey, width, height]);

  if (!mounted) return <div style={{ width, height }} />;
  return <div ref={ref} style={{ width, height, overflow: "hidden", display: "block" }} />;
}

export default function AdWindow({
  adKey = "7bda6115e949728e7480cea4662de9ce",
  width = 300,
  height = 250,
}: {
  adKey?: string;
  width?: number;
  height?: number;
}) {
  return (
    <>
      <style>{`
        @keyframes adwin-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(201,168,76,0.5),
              0 0 18px rgba(201,168,76,0.35),
              0 0 40px rgba(100,149,237,0.18);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(100,149,237,0.6),
              0 0 28px rgba(201,168,76,0.55),
              0 0 70px rgba(100,149,237,0.32);
          }
        }
        @keyframes adwin-border-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .adwin-frame {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2px;                 /* gradient border thickness */
          border-radius: 0;             /* sharp edges */
          background: linear-gradient(120deg, #C9A84C, #6495ED, #E2C97E, #6495ED, #C9A84C);
          background-size: 300% 300%;
          animation: adwin-border-shift 6s ease infinite, adwin-pulse 2.8s ease-in-out infinite;
        }
        .adwin-inner {
          background: #0f0805;
          border-radius: 0;
          padding: 14px 14px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .adwin-label {
          font-family: 'Times New Roman', Times, serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #6495ED;
          border: 1px solid rgba(100,149,237,0.4);
          padding: 3px 12px;
          border-radius: 0;
        }
        .adwin-slot {
          background: #0a0503;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="adwin-frame">
        <div className="adwin-inner">
          <span className="adwin-label">Sponsored</span>
          <div className="adwin-slot" style={{ width, height }}>
            <AdsterraSlot adKey={adKey} width={width} height={height} />
          </div>
        </div>
      </div>
    </>
  );
}
