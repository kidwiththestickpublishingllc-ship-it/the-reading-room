import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const INK_PACKS: Record<string, number> = {
  'price_1SnqHNDSUBBonGGSVgeIwLjY': 100,
  'price_1SnqK5DSUBBonGGSPSVyadse': 750,
  'price_1SnqLZDSUBBonGGSQrJIozSO': 1500,
  'price_1SnqOpDSUBBonGGSHAzZjAia': 3000,
}

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json()

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing priceId or userId' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reading-room?ink=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reading-room/buy-ink`,
      metadata: {
        userId,
        priceId,
        inkAmount: String(INK_PACKS[priceId] ?? 0),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}