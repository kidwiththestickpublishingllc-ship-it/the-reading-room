'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/reading-room/buy-ink')
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setError('Check your email to confirm your account, then log in.')
    setLoading(false)
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
        maxWidth: '420px',
        backgroundColor: '#111',
        border: '1px solid #C9A84C',
        borderRadius: '16px',
        padding: '48px 40px',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#C9A84C',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: '700',
            color: '#000',
            fontSize: '14px',
          }}>TTL</div>
          <h1 style={{
            fontSize: '1.8rem',
            color: '#C9A84C',
            fontFamily: 'Syne, sans-serif',
            marginBottom: '6px',
          }}>
            The Tiniest Library
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#f0ece2', opacity: 0.5 }}>
            Sign in to your reader account
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#f0ece2',
            opacity: 0.6,
            marginBottom: '8px',
          }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#f0ece2',
              fontFamily: 'Syne, sans-serif',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#f0ece2',
            opacity: 0.6,
            marginBottom: '8px',
          }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#f0ece2',
              fontFamily: 'Syne, sans-serif',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(201,168,76,0.1)',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.85rem',
            color: '#C9A84C',
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#C9A84C',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            fontFamily: 'Syne, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '12px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#f0ece2',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '0.95rem',
            fontFamily: 'Syne, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Create Account
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '0.8rem',
          color: '#f0ece2',
          opacity: 0.3,
          fontFamily: 'Syne, sans-serif',
        }}>
          Your account works across all TTL platforms
        </p>

      </div>
    </div>
  )
}