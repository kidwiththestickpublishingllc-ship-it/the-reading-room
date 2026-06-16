import type { Metadata } from "next";
import ChapterReaderClient from "./ChapterReaderClient";

type Params = Promise<{ slug: string; chapter: string }>;

const SITE = "https://read.the-tiniest-library.com";
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchStory(slug: string) {
  try {
    const res = await fetch(
      `${SUPA}/rest/v1/stories?slug=eq.${encodeURIComponent(slug)}&select=title,author_name,description,cover_url&limit=1`,
      {
        headers: { apikey: ANON!, Authorization: `Bearer ${ANON}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, chapter } = await params;
  const story = await fetchStory(slug);

  if (!story) {
    return {
      title: "The Tiniest Library",
      description: "Read serialized fiction on The Tiniest Library.",
    };
  }

  const title = story.title;
  const description =
    story.description ??
    `Read "${story.title}" by ${story.author_name} on The Tiniest Library.`;
  const image = story.cover_url || `${SITE}/images/ttl-og-default.jpg`;
  const url = `${SITE}/reading-room/stories/${slug}/chapters/${chapter}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "The Tiniest Library",
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: story.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ChapterPage({ params }: { params: Params }) {
  const { slug, chapter } = await params;
  const story = await fetchStory(slug);
  const url = `${SITE}/reading-room/stories/${slug}/chapters/${chapter}`;

  const jsonLd = story
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        name: story.title,
        author: { "@type": "Person", name: story.author_name },
        url,
        ...(story.cover_url ? { image: story.cover_url } : {}),
        ...(story.description ? { description: story.description } : {}),
        publisher: {
          "@type": "Organization",
          name: "The Tiniest Library",
          url: SITE,
        },
        workExample: {
          "@type": "CreativeWork",
          name: `Chapter ${chapter}`,
          url,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ChapterReaderClient storySlug={slug} chapterNum={parseInt(chapter, 10)} />
    </>
  );
}
