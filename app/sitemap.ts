import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // rebuild hourly so new stories appear

export default async function sitemap() {
  const base = 'https://read.the-tiniest-library.com';

  const staticPages = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${base}/reading-room`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${base}/reading-room/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${base}/members`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: stories } = await supabase
      .from('stories')
      .select('slug, created_at')
      .eq('is_published', true);

    const storyPages = (stories ?? []).map((s: any) => ({
      url: `${base}/reading-room/stories/${s.slug}/chapters/1`,
      lastModified: s.created_at ? new Date(s.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...storyPages];
  } catch {
    return staticPages; // if the query fails, still serve static pages
  }
}