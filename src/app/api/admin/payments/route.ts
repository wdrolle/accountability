import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function GET() {
  try {
    // console.log('[DEBUG] Starting GET /api/admin/payments');
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (!session.user.is_super_admin && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch payments from Stripe
    // console.log('[DEBUG] Fetching Stripe payments');
    const stripePayments = await stripe.paymentIntents.list({
      limit: 100,
      expand: ['data.customer', 'data.payment_method']
    });
    // console.log('[DEBUG] Stripe payments fetched:', { count: stripePayments.data.length });

    // Get list of provider_payment_ids from local database
    // console.log('[DEBUG] Fetching local payment IDs');
    const localPaymentIds = await prisma.$queryRaw<{ provider_payment_id: string }[]>`
      SELECT provider_payment_id
      FROM agents.payments_received
      WHERE provider_payment_id = ANY(${stripePayments.data.map(p => p.id)})
    `;

    const localPaymentIdSet = new Set(localPaymentIds.map(p => p.provider_payment_id));
    
    // console.log('[DEBUG] Local payment IDs fetched:', {
    //   count: localPaymentIds.length,
    //   sample: localPaymentIds[0]?.provider_payment_id
    // });

    // Enhance Stripe payments with local database status
    const enhancedPayments = stripePayments.data.map(payment => ({
      ...payment,
      exists_in_db: localPaymentIdSet.has(payment.id)
    }));

    return NextResponse.json({
      payments: enhancedPayments
    });
  } catch (error) {
    console.error('[DEBUG] Error fetching payments:', error);
    console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to fetch payments',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Add webhook handler
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    await prisma.$queryRaw`SELECT agents.handle_stripe_webhook_event(${JSON.stringify(event)}::jsonb)`;

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
} 