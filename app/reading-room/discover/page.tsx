"use client";
import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";
import DiscoverPanel from "@/app/components/DiscoverPanel";

export default function DiscoverPage() {
  return (
    <>
      <TTLNav />
      <div style={{ height: 74 }} />
      <DiscoverPanel />
      <TTLFooter />
    </>
  );
}