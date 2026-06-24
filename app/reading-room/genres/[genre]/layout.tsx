import type { Metadata } from "next";

/* ============================================================
   Server layout for /reading-room/genres/[genre]
   The page itself is a client component (can't export metadata),
   so this layout supplies per-genre SEO title + description.
   LitRPG is tailored to its niche keyword; all others get a
   clean default built from the genre name.
============================================================ */

// Slug -> display name (mirrors slugToGenre in page.tsx)
function slugToGenre(slug: string): string {
  return decodeURIComponent(slug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace("Sci Fi", "Sci-Fi")
    .replace("Litrpg", "LitRPG")
    .replace("Lgbtq ", "LGBTQ+ ")
    .replace("Aapi", "AAPI")
    .replace("18 ", "18+")
    .replace("&Amp;", "&");
}

// Tailored SEO descriptions for genres worth targeting.
// Falls back to a clean default for any genre not listed.
const GENRE_SEO: Record<string, { title: string; description: string }> = {
  LitRPG: {
    title: "LitRPG & Progression Fantasy Fiction",
    description:
      "Read LitRPG and progression fantasy on The Tiniest Library — stories where narrative meets the game: stats, levels, skills, and systems the characters can see. Serialized fiction that levels up with you.",
  },
  Fantasy: {
    title: "Fantasy Fiction",
    description:
      "Read original fantasy serials on The Tiniest Library — epic quests, village folklore, magic, and monsters from independent authors who keep their copyright.",
  },
  "Sci-Fi": {
    title: "Science Fiction",
    description:
      "Read original science fiction on The Tiniest Library — hard sci-fi, soft futures, and far-flung dispatches from independent authors who earn from every chapter.",
  },
  Romance: {
    title: "Romance Fiction",
    description:
      "Read original romance serials on The Tiniest Library — slow burns, age-gap, and love stories that don't flinch, from independent authors who keep their rights.",
  },
};

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string }> }
): Promise<Metadata> {
  const { genre } = await params;
  const name = slugToGenre(genre);
  const seo = GENRE_SEO[name];

  const title = seo?.title ?? `${name} Fiction`;
  const description =
    seo?.description ??
    `Read original ${name} serial fiction on The Tiniest Library — a home for independent authors who keep their copyright and earn from every chapter readers unlock.`;

  const url = `https://read.the-tiniest-library.com/reading-room/genres/${genre}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — The Tiniest Library`,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — The Tiniest Library`,
      description,
    },
  };
}

export default function GenreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
