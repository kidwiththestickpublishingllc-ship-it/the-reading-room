'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/members')
  }

  const handleSignUp = async () => {
    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    if (!email) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        membership_tier: 'free',
        ink_balance: 50,
      })
      router.push('/members')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333',
    borderRadius: '8px', padding: '12px 16px', color: '#f0ece2',
    fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontFamily: 'Syne, sans-serif', fontSize: '0.75rem',
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: '#f0ece2', opacity: 0.6, marginBottom: '8px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f0ece2', fontFamily: 'Cormorant Garamond, serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#111', border: '1px solid #C9A84C', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Gold top bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />

        <div style={{ padding: '48px 40px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#C9A84C', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: '#000', fontSize: '14px' }}>TTL</div>
            <h1 style={{ fontSize: '1.8rem', color: '#C9A84C', fontFamily: 'Syne, sans-serif', marginBottom: '6px' }}>The Tiniest Library</h1>
            <p style={{ fontSize: '0.9rem', color: '#f0ece2', opacity: 0.5 }}>{mode === 'login' ? 'Sign in to your reader account' : 'Create your free reader account'}</p>
          </div>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', marginBottom: '28px' }}>
            <button onClick={() => { setMode('login'); setError(null); }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'Syne, sans-serif', background: mode === 'login' ? 'rgba(201,168,76,0.2)' : 'transparent', color: mode === 'login' ? '#C9A84C' : '#666', transition: 'all 0.2s' }}>
              Sign In
            </button>
            <button onClick={() => { setMode('signup'); setError(null); }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'Syne, sans-serif', background: mode === 'signup' ? 'rgba(201,168,76,0.2)' : 'transparent', color: mode === 'signup' ? '#C9A84C' : '#666', transition: 'all 0.2s' }}>
              Join Free
            </button>
          </div>

          {/* Sign up extras */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignUp())} style={inputStyle} />
          </div>

          {/* Free membership perks — signup only */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(201,168,76,0.05)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.15)' }}>
              <p style={{ color: '#C9A84C', fontSize: '11px', fontWeight: '600', fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Free Membership Includes</p>
              <p style={{ color: '#888', fontSize: '12px', fontFamily: 'Syne, sans-serif', margin: '0 0 4px' }}>🪙 50 Ink to start reading</p>
              <p style={{ color: '#888', fontSize: '12px', fontFamily: 'Syne, sans-serif', margin: '0 0 4px' }}>📚 Access to The Reading Room</p>
              <p style={{ color: '#888', fontSize: '12px', fontFamily: 'Syne, sans-serif', margin: 0 }}>🪶 Support writers you love</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid #C9A84C', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontFamily: 'Syne, sans-serif', fontSize: '0.85rem', color: '#C9A84C' }}>
              {error}
            </div>
          )}

          {/* Primary button */}
          <button onClick={mode === 'login' ? handleLogin : handleSignUp} disabled={loading} style={{ width: '100%', backgroundColor: '#C9A84C', color: '#000', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '0.95rem', fontWeight: 'bold', fontFamily: 'Syne, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#f0ece2', opacity: 0.3, fontFamily: 'Syne, sans-serif' }}>
            Your account works across all TTL platforms
          </p>
        </div>
      </div>
    </div>
  )
}