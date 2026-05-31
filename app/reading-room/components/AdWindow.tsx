"use client";

import { useEffect, useRef, useState } from "react";

// =============================================================
// TTL Ad Window — exactly 300x250
// Drop in: app/reading-room/components/AdWindow.tsx
//
// Loads an Adsterra banner via real same-origin script injection
// (the reliable method — avoids the blank-iframe srcDoc problem).
//
// Outer window size == ad size (300x250). No padding, no label.
// Animated gradient glow is deferred for now.
// =============================================================

function AdsterraSlot({ adKey, width, height }: { adKey: string; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!ref.current || ref.current.querySelector("script")) return;

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
    <div
      style={{
        width,
        height,
        margin: "auto",
        background: "#0a0503",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AdsterraSlot adKey={adKey} width={width} height={height} />
    </div>
  );
}
