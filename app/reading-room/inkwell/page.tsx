"use client";
import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";
import InkwellPanel from "@/app/components/InkwellPanel";

export default function InkwellPage() {
  return (
    <>
      <TTLNav />
      <div style={{ height: 74 }} />
      <InkwellPanel />
      <TTLFooter />
    </>
  );
}