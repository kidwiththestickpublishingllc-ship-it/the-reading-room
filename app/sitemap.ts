import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // rebuild hourly so new stories appear

const base = 'https://read.the-tiniest-library.com';

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    { url: base, lastModified: now, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${base}/reading-room`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${base}/reading-room/stories`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${base}/reading-room/authors`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${base}/reading-room/discover`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${base}/reading-room/how-it-works`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );

    const [{ data: stories }, { data: writers }] = await Promise.all([
      supabase.from('stories').select('slug, genre, created_at').eq('is_published', true),
      supabase.from('writers').select('slug, updated_at').eq('is_approved', true),
    ]);

    const storyPages = (stories ?? []).map((s: any) => ({
      url: `${base}/reading-room/stories/${s.slug}`,
      lastModified: s.created_at ? new Date(s.created_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const genreSlugs = Array.from(
      new Set((stories ?? []).map((s: any) => s.genre).filter(Boolean).map((g: string) => slugify(g))),
    ).filter((g) => g !== 'adult-18');

    const genrePages = genreSlugs.map((g) => ({
      url: `${base}/reading-room/genres/${g}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

    const publishedAuthors = new Set(
      (stories ?? []).map((s: any) => (s.author_name ?? '').trim().toLowerCase()).filter(Boolean),
    );

    const authorPages = (writers ?? [])
      .filter((w: any) => w.slug && publishedAuthors.has((w.name ?? '').trim().toLowerCase()))
      .map((w: any) => ({
      url: `${base}/reading-room/authors/${w.slug}`,
      lastModified: w.updated_at ? new Date(w.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...storyPages, ...genrePages, ...authorPages];
  } catch {
    return staticPages;
  }
}