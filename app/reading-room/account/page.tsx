'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [inkBalance, setInkBalance] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/reading-room/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('ink_balance')
        .eq('id', user.id)
        .single()
      if (profile) setInkBalance(profile.ink_balance)
    }
    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/reading-room')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#f0ece2',
      fontFamily: 'Cormorant Garamond, serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#111',
        border: '1px solid #C9A84C',
        borderRadius: '16px',
        padding: '48px 40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '48px', height: '48px',
            backgroundColor: '#C9A84C',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: '700', color: '#000', fontSize: '14px',
          }}>TTL</div>
          <h1 style={{ fontSize: '1.8rem', color: '#C9A84C', fontFamily: 'Syne, sans-serif', marginBottom: '6px' }}>
            My Account
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#f0ece2', opacity: 0.5 }}>
            {user?.email}
          </p>
        </div>

        <div style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #C9A84C',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f0ece2', opacity: 0.5, marginBottom: '8px' }}>
            Ink Balance
          </div>
          <div style={{ fontSize: '3rem', color: '#C9A84C', fontWeight: 'bold' }}>
            {inkBalance}
          </div>
          <a href="/reading-room/buy-ink" style={{
            display: 'inline-block', marginTop: '12px',
            backgroundColor: '#C9A84C', color: '#000',
            borderRadius: '8px', padding: '8px 20px',
            fontFamily: 'Syne, sans-serif', fontSize: '0.85rem',
            fontWeight: 'bold', textDecoration: 'none',
          }}>
            Buy More Ink
          </a>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#f0ece2',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '0.95rem',
            fontFamily: 'Syne, sans-serif',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/reading-room" style={{ color: '#C9A84C', fontFamily: 'Syne, sans-serif', fontSize: '0.85rem' }}>
            ← Back to Reading Room
          </a>
        </div>
      </div>
    </div>
  )
}