"use client";
import MemberProfileRoom from "@/app/components/MemberProfileRoom";

export default function MemberRoomPage() {
  const username = typeof window !== "undefined"
    ? window.location.pathname.split("/").pop() ?? ""
    : "";
  return <MemberProfileRoom username={username} />;
}