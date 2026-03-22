// reading-room/app/authors/page.jsx
// Lists all writer profiles — the author directory.

import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 60 // Re-fetch every 60 seconds (ISR)

export default async function AuthorsPage() {
  const { data: writers, error } = await supabase
    .from('writers')
    .select('id, name, bio, photo_url, greeting')
    .order('created_at', { ascending: false })

  if (error) {
    return <p>Could not load authors. Please try again later.</p>
  }

  return (
    <main className="authors-directory">
      <h1>Our Authors</h1>
      <p className="directory-subtitle">
        Meet the writers behind The Reading Room.
      </p>

      <div className="authors-grid">
        {writers?.map(writer => (
          <Link
            key={writer.id}
            href={`/authors/${writer.id}`}
            className="author-card-link"
          >
            <div className="author-card-thumb">
              {writer.photo_url ? (
                <Image
                  src={writer.photo_url}
                  alt={writer.name}
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <div className="author-initials">
                  {writer.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="author-thumb-name">{writer.name}</h2>
                {writer.bio && (
                  <p className="author-thumb-bio">
                    {writer.bio.slice(0, 100)}
                    {writer.bio.length > 100 ? '…' : ''}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
