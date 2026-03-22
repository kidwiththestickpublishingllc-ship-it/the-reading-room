// reading-room/app/authors/[id]/page.jsx
// Fetches a writer's profile from Supabase and renders it.
// Works as a Next.js App Router page (server component).

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import AuthorProfileCard from '@/app/components/AuthorProfileCard'

export async function generateMetadata({ params }) {
  const { data } = await supabase
    .from('writers')
    .select('name, bio')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Author not found' }

  return {
    title: `${data.name} — The Reading Room`,
    description: data.bio?.slice(0, 160) || '',
  }
}

export default async function AuthorPage({ params }) {
  const { data: writer, error } = await supabase
    .from('writers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!writer || error) notFound()

  return (
    <main className="author-page">
      <AuthorProfileCard writer={writer} />
    </main>
  )
}
