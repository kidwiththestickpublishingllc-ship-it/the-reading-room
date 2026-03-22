// reading-room/app/admin/writers/page.jsx
// Private admin page to approve/reject writer applications
// Protect this route with Supabase auth or a secret env-based password

import { supabase } from '@/lib/supabase'
import AdminWritersClient from './AdminWritersClient'

export const revalidate = 0 // Always fetch fresh

export default async function AdminWritersPage() {
  const { data: writers, error } = await supabase
    .from('writers')
    .select('id, name, bio, photo_url, is_approved, is_founding_author, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return <p>Could not load writers.</p>
  }

  return <AdminWritersClient writers={writers} />
}
