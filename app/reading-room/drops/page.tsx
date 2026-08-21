"use client";
import { TTLNav, TTLFooter } from "@/app/reading-room/components/TTLNav";
import ChapterDropCalendar from "@/app/components/ChapterDropCalendar";

export default function DropsPage() {
  return (
    <>
      <TTLNav />
      <div style={{ height: 74 }} />
      <ChapterDropCalendar />
      <TTLFooter />
    </>
  );
}