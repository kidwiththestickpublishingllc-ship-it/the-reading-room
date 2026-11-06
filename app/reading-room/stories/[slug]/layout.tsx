import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://read.the-tiniest-library.com";

async function getStory(slug: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data } = await supabase
      .from("stories")
      .select("slug, title, author_name, description, cover_url, badge, genre, is_published, created_at")
      .eq("slug", slug)
      .maybeSingle();
    return data as any;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStory(slug);
  if (!s) return { title: "Story" };

  const by = s.author_name ? ` by ${s.author_name}` : "";
  const desc = (s.description ||
    `Read ${s.title}${by} on The Tiniest Library — original serial fiction where writers keep their copyright and earn from every unlock.`
  ).slice(0, 300);

  return {
    title: `${s.title}${by}`,
    description: desc,
    alternates: { canonical: `/reading-room/stories/${s.slug}` },
    robots: s.is_published ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "article",
      url: `${BASE}/reading-room/stories/${s.slug}`,
      title: `${s.title}${by}`,
      description: desc,
      siteName: "The Tiniest Library",
      images: s.cover_url ? [{ url: s.cover_url, alt: s.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${s.title}${by}`,
      description: desc,
      images: s.cover_url ? [s.cover_url] : undefined,
    },
  };
}

export default async function StoryLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getStory(slug);

  const jsonLd = s && s.is_published ? {
    "@context": "https://schema.org",
    "@type": "Book",
    name: s.title,
    url: `${BASE}/reading-room/stories/${s.slug}`,
    description: s.description ?? undefined,
    image: s.cover_url ?? undefined,
    genre: s.genre ?? undefined,
    inLanguage: "en",
    datePublished: s.created_at ?? undefined,
    bookFormat: "https://schema.org/EBook",
    author: s.author_name ? { "@type": "Person", name: s.author_name } : undefined,
    publisher: { "@type": "Organization", name: "Kid With The Stick Publishing LLC", url: BASE },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}