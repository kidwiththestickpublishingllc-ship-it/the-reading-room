import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, inkAmount } = session.metadata!

    if (!userId || !inkAmount) {
      return NextResponse.json(
        { error: 'Missing metadata' },
        { status: 400 }
      )
    }

    const ink = parseInt(inkAmount)

    // 1. Credit Ink to user balance
    const { error: balanceError } = await supabase.rpc('increment_ink', {
      user_id: userId,
      amount: ink,
    })

    if (balanceError) {
      console.error('Failed to credit Ink:', balanceError)
      return NextResponse.json(
        { error: 'Failed to credit Ink' },
        { status: 500 }
      )
    }

    // 2. Log the transaction
    const { error: logError } = await supabase
      .from('ink_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: ink,
        stripe_payment_id: session.payment_intent as string,
      })

    if (logError) {
      console.error('Failed to log transaction:', logError)
    }
  }

  return NextResponse.json({ received: true })
}