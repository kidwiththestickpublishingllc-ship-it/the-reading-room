'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const INK_PACKS = [
  {
    priceId: 'price_1SnqHNDSUBBonGGSVgeIwLjY',
    ink: 100,
    price: '$1',
    label: 'Starter',
    description: 'Try it out',
  },
  {
    priceId: 'price_1SnqK5DSUBBonGGSPSVyadse',
    ink: 750,
    price: '$5',
    label: 'Standard',
    description: 'Most popular',
  },
  {
    priceId: 'price_1SnqLZDSUBBonGGSQrJIozSO',
    ink: 1500,
    price: '$10',
    label: 'Pro',
    description: 'Best value',
  },
  {
    priceId: 'price_1SnqOpDSUBBonGGSHAzZjAia',
    ink: 3000,
    price: '$20',
    label: 'XL',
    description: 'Power reader',
  },
]

export default function BuyInkPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [inkBalance, setInkBalance] = useState<number>(0)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/reading-room/login')
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('ink_balance')
        .eq('id', user.id)
        .single()

      if (profile) setInkBalance(profile.ink_balance)
    }
    getUser()
  }, [router])

  const handleBuy = async (priceId: string) => {
  if (!userId) {
    alert('Not logged in — userId is null')
    return
  }
  setLoading(priceId)

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId }),
    })

    const data = await res.json()
    console.log('Checkout response:', data)

    if (data.url) {
      window.location.href = data.url
    } else {
      alert(`Error: ${JSON.stringify(data)}`)
      setLoading(null)
    }
  } catch (err) {
    console.error('Checkout error:', err)
    alert(`Caught error: ${err}`)
    setLoading(null)
  }
}

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#f0ece2',
      fontFamily: 'Cormorant Garamond, serif',
      padding: '60px 20px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '3rem',
            color: '#C9A84C',
            fontFamily: 'Syne, sans-serif',
            marginBottom: '8px',
          }}>
            Buy Ink
          </h1>
          <p style={{ color: '#f0ece2', opacity: 0.7, fontSize: '1.1rem' }}>
            Use Ink to unlock chapters and support writers directly
          </p>
          {inkBalance > 0 && (
            <div style={{
              marginTop: '16px',
              display: 'inline-block',
              backgroundColor: '#1a1a1a',
              border: '1px solid #C9A84C',
              borderRadius: '20px',
              padding: '8px 20px',
              color: '#C9A84C',
              fontSize: '1rem',
            }}>
              🖋 Current Balance: {inkBalance} Ink
            </div>
          )}
        </div>

        {/* Ink Packs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
        }}>
          {INK_PACKS.map((pack) => (
            <div key={pack.priceId} style={{
              backgroundColor: '#111',
              border: '1px solid #C9A84C',
              borderRadius: '12px',
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: '#C9A84C',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontFamily: 'Syne, sans-serif',
              }}>
                {pack.label}
              </div>

              <div style={{
                fontSize: '2.5rem',
                color: '#C9A84C',
                fontWeight: 'bold',
              }}>
                {pack.price}
              </div>

              <div style={{
                fontSize: '1.4rem',
                color: '#f0ece2',
              }}>
                {pack.ink.toLocaleString()} Ink
              </div>

              <div style={{
                fontSize: '0.85rem',
                color: '#f0ece2',
                opacity: 0.5,
              }}>
                {pack.description}
              </div>

              <div style={{
                fontSize: '0.8rem',
                color: '#f0ece2',
                opacity: 0.4,
              }}>
                unlocks ~{Math.floor(pack.ink / 50)} chapters
              </div>

              <button
                onClick={() => handleBuy(pack.priceId)}
                disabled={loading === pack.priceId}
                style={{
                  marginTop: '8px',
                  backgroundColor: loading === pack.priceId ? '#555' : '#C9A84C',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading === pack.priceId ? 'not-allowed' : 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading === pack.priceId ? 'Loading...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: 'center',
          marginTop: '40px',
          fontSize: '0.85rem',
          color: '#f0ece2',
          opacity: 0.4,
        }}>
          Ink is non-refundable. 70% of every unlock goes directly to the writer.
        </p>

      </div>
    </div>
  )
}