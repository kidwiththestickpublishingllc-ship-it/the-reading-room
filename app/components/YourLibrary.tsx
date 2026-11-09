"use client";

// app/components/YourLibrary.tsx
// The member floor. Renders nothing at all for a signed-out visitor, so the
// homepage stops showing empty streaks, empty shelves and an Ink wallet to
// people who have no account.
//
// Wrap the existing member components in it — they are not modified:
//
//   <YourLibrary user={user}>
//     <ContinueReadingStrip />
//     <ReadingStreak />
//     ...
//   </YourLibrary>
//
// Prefix: ylb-

import React from "react";
import Floor from "./Floor";
import Surface from "./Surface";

type Props = {
  user: unknown | null;        // whatever your auth state holds; only truthiness is used
  name?: string;
  number?: number | string;
  children: React.ReactNode;
};

const STYLES = `
  .ylb-stack { display: flex; flex-direction: column; gap: 26px; }
  .ylb-stack > * { min-width: 0; }
  .ylb-hand {
    font-family: 'Caveat', cursive;
    font-size: 22px;
    color: var(--gold, #8A6510);
    margin: 0 0 18px;
  }
  @media (max-width: 900px) {
    .ylb-stack { gap: 18px; }
  }
`;

export default function YourLibrary({
  user, name = "Your Library", number = 3, children,
}: Props) {
  if (!user) return null;

  return (
    <Floor name={name} number={number} slug="Members only">
      <style>{STYLES}</style>
      <Surface span={12}>
        <p className="ylb-hand">everything you&rsquo;ve started, saved and unlocked</p>
        <div className="ylb-stack">{children}</div>
      </Surface>
    </Floor>
  );
}
