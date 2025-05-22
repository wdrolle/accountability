import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { payment_provider_enum, payment_status_enum } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Helper function to map Stripe status to our enum
function mapStripeStatus(status: string): string {
  if (!status) return 'failed';

  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'succeeded':
      return 'succeeded';
    case 'canceled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
    case 'processing':
      return 'pending';
    default:
      return 'failed';
  }
}

// Helper function to format card details as a plain object
function formatCardDetails(paymentMethod: Stripe.PaymentMethod | string | null) {
  if (typeof paymentMethod === 'string' || !paymentMethod?.card) {
    return null;
  }

  const { brand, last4, exp_month, exp_year, funding } = paymentMethod.card;
  return {
    brand,
    last4,
    exp_month,
    exp_year,
    funding
  };
}

// Helper function to safely get customer details
function getCustomerDetails(customer: Stripe.Customer | Stripe.DeletedCustomer | string | null) {
  if (!customer) return null;
  if (typeof customer === 'string') return { id: customer };
  if ('deleted' in customer && customer.deleted) return { id: customer.id, deleted: true };
  
  const stripeCustomer = customer as Stripe.Customer;
  return {
    id: stripeCustomer.id,
    email: stripeCustomer.email,
    name: stripeCustomer.name,
    metadata: stripeCustomer.metadata
  };
}

// Add this interface before the POST function
interface SyncRequestBody {
  last_sync_time?: string;
  sync_type?: 'incremental' | 'full';
}

// Helper function to determine payment provider
function getPaymentProvider(paymentType: string): string {
  switch (paymentType.toLowerCase()) {
    case 'stripe':
      return 'stripe';
    case 'paypal':
      return 'paypal';
    default:
      return 'stripe';
  }
}

export async function POST(request: Request) {
  try {
    // console.log('[DEBUG] Starting payment sync process');
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      // console.log('[DEBUG] No session found', { session });
      return new NextResponse('Unauthorized - No session', { status: 401 });
    }
    // console.log('[DEBUG] Session found', { userId: session.user.id });

    // Get the user's role from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    // console.log('[DEBUG] User lookup result', { user });

    if (!user) {
      // console.log('[DEBUG] No user found for ID', { userId: session.user.id });
      return new NextResponse('Unauthorized - User not found', { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      // console.log('[DEBUG] User not authorized', { role: user.role });
      return new NextResponse('Unauthorized - Insufficient permissions', { status: 401 });
    }
    // console.log('[DEBUG] Authorization successful');

    // Set default sync parameters
    const defaultBody: SyncRequestBody = {
      last_sync_time: '2024-01-01T00:00:00.000Z',
      sync_type: 'full'
    };

    // Parse request body and merge with defaults
    let body = defaultBody;
    try {
      const text = await request.text();
      if (text) {
        const parsedBody = JSON.parse(text) as Partial<SyncRequestBody>;
        body = { ...defaultBody, ...parsedBody };
      }
    } catch (e) {
      // console.log('[DEBUG] Error parsing request body, using defaults', e);
    }
    
    // console.log('[DEBUG] Request body (with defaults)', { body });
    
    // Default to syncing from January 1st, 2024 if no specific time provided
    const defaultStartDate = new Date('2024-01-01');
    
    const lastSyncTime = body.last_sync_time ? new Date(body.last_sync_time) : defaultStartDate;
    const isIncremental = body.sync_type === 'incremental';
    // console.log('[DEBUG] Sync parameters', { lastSyncTime, isIncremental });

    // Convert to Unix timestamp for Stripe API
    const created = { gt: Math.floor(lastSyncTime.getTime() / 1000) };
    // console.log('[DEBUG] Stripe created parameter', { created });

    // Fetch payment intents from Stripe
    // console.log('[DEBUG] Fetching payment intents from Stripe');
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      created,
      expand: ['data.customer', 'data.payment_method']
    });
    // console.log('[DEBUG] Raw Stripe payment intent:', JSON.stringify(paymentIntents.data[0], null, 2));
    // console.log('[DEBUG] Fetched payment intents', { 
    //   count: paymentIntents.data.length,
    //   firstPaymentId: paymentIntents.data[0]?.id
    // });

    if (paymentIntents.data.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No new payments to sync',
        count: 0,
        results: 0
      });
    }

    // Ensure default subscription plan exists
    // console.log('[DEBUG] Looking up or creating subscription plan');
    let subscriptionPlan = await prisma.subscription_plans.findFirst({
      where: { 
        OR: [
          { name: 'TRIAL' },
          { name: 'STARTER' },
          { name: 'PREMIUM' },
          { name: 'FAMILY' }
        ]
      }
    });

    if (!subscriptionPlan) {
      // console.log('[DEBUG] Creating default subscription plan');
      const planName = 'STARTER';
      const planConfig = {
        FREE: { sms_per_day: 0, ai_chats_month: 10, max_family_members: 0 },
        TRIAL: { sms_per_day: 1, ai_chats_month: 10, max_family_members: 0 },
        STARTER: { sms_per_day: 1, ai_chats_month: 20, max_family_members: 0 },
        PREMIUM: { sms_per_day: 2, ai_chats_month: 50, max_family_members: 0 },
        FAMILY: { sms_per_day: 2, ai_chats_month: 50, max_family_members: 5 }
      };

      subscriptionPlan = await prisma.subscription_plans.create({
        data: {
          id: crypto.randomUUID(),
          name: planName,
          description: `${planName} subscription plan`,
          sms_per_day: planConfig[planName].sms_per_day,
          ai_chats_month: planConfig[planName].ai_chats_month,
          max_family_members: planConfig[planName].max_family_members,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    // console.log('[DEBUG] Using subscription plan', { 
    //   planId: subscriptionPlan.id,
    //   planName: subscriptionPlan.name 
    // });

    // Fetch existing payment IDs first
    const existingPaymentIds = await prisma.payments_received.findMany({
      select: {
        provider_payment_id: true
      }
    });
    
    const existingIds = new Set(existingPaymentIds.map(p => p.provider_payment_id));
    // console.log('[DEBUG] Found existing payment IDs:', { count: existingIds.size });

    // Process each payment intent
    // console.log('[DEBUG] Starting to process payment intents');
    const upsertPromises = paymentIntents.data.map(async (payment) => {
      try {
        // Skip if payment is already synced
        if (existingIds.has(payment.id)) {
          // console.log('[DEBUG] Skipping already synced payment', { paymentId: payment.id });
          return null;
        }

        // console.log('[DEBUG] Processing new payment', { paymentId: payment.id });
        
        const customer = typeof payment.customer === 'string' 
          ? await stripe.customers.retrieve(payment.customer) 
          : payment.customer;

        // console.log('[DEBUG] Customer details', { 
        //   customerId: customer?.id,
        //   isString: typeof payment.customer === 'string'
        // });

        const customerDetails = getCustomerDetails(customer);
        // console.log('[DEBUG] Formatted customer details', { 
        //   customerId: customerDetails?.id,
        //   customerEmail: customerDetails?.email 
        // });
        
        const paymentDetails = {
          card: formatCardDetails(payment.payment_method),
          metadata: payment.metadata || {},
          customer: customerDetails
        };

        // console.log('[DEBUG] Payment details formatted', { 
        //   hasCard: !!paymentDetails.card,
        //   paymentId: payment.id 
        // });

        // Find or create user based on customer email
        let userId = session.user.id;
        if (customerDetails?.email) {
          // console.log('[DEBUG] Looking up user by email', { 
          //   email: customerDetails.email 
          // });
          const user = await prisma.user.findUnique({
            where: { email: customerDetails.email }
          });
          if (user) {
            userId = user.id;
            // console.log('[DEBUG] Found user for payment', { userId });
          }
        }

        // Special handling for whitney@iolence.com - bypass date check
        const isWhitneyEmail = customerDetails?.email === 'whitney@iolence.com';
        const paymentDate = new Date(payment.created * 1000);
        
        if (!isWhitneyEmail && paymentDate < lastSyncTime && isIncremental) {
          // console.log('[DEBUG] Skipping old payment', { 
          //   paymentDate, 
          //   lastSyncTime,
          //   isIncremental 
          // });
          return null;
        }

        const createData = {
          id: uuidv4(),
          user_id: userId,
          subscription_plan_id: subscriptionPlan.id,
          amount: (payment.amount / 100).toFixed(2),
          currency: typeof payment.currency === 'number' ? payment.currency : payment.currency,
          payment_provider: 'stripe',
          payment_status: mapStripeStatus(payment.status),
          provider_payment_id: payment.id,
          provider_customer_id: customerDetails?.id || null,
          payment_method: typeof payment.payment_method === 'string' ? payment.payment_method : payment.payment_method?.type || null,
          payment_details: paymentDetails,
          billing_period_start: new Date(payment.created * 1000),
          billing_period_end: new Date(payment.created * 1000 + (31 * 24 * 60 * 60 * 1000)), // 31 days from payment creation
          created_at: new Date(payment.created * 1000),
          updated_at: new Date()
        };

        // console.log('[DEBUG] Column types and values:', {
        //   id: { type: 'UUID', value: createData.id },
        //   amount: { type: 'DECIMAL(10,2)', value: createData.amount },
        //   currency: { type: 'VARCHAR(3)', value: createData.currency },
        //   payment_provider: { type: 'payment_provider_enum', value: createData.payment_provider, rawValue: createData.payment_provider.toLowerCase() },
        //   payment_status: { type: 'payment_status_enum', value: createData.payment_status, rawValue: createData.payment_status.toLowerCase() },
        //   provider_payment_id: { type: 'VARCHAR(100)', value: createData.provider_payment_id },
        //   provider_customer_id: { type: 'VARCHAR(100)', value: createData.provider_customer_id },
        //   payment_method: { type: 'VARCHAR(50)', value: createData.payment_method },
        //   payment_details: { type: 'JSONB', value: createData.payment_details },
        //   billing_period_start: { type: 'TIMESTAMPTZ', value: createData.billing_period_start },
        //   billing_period_end: { type: 'TIMESTAMPTZ', value: createData.billing_period_end },
        //   created_at: { type: 'TIMESTAMPTZ', value: createData.created_at },
        //   updated_at: { type: 'TIMESTAMPTZ', value: createData.updated_at },
        //   subscription_plan_id: { type: 'UUID', value: createData.subscription_plan_id },
        //   user_id: { type: 'UUID', value: createData.user_id }
        // });

        // Check if payment exists using Prisma's findFirst
        const existingPayment = await prisma.payments_received.findFirst({
          where: {
            provider_payment_id: createData.provider_payment_id
          }
        });

        let result;
        if (existingPayment) {
          // Update existing payment using raw SQL to ensure proper enum casting
          result = await prisma.$queryRaw`
            UPDATE agents.payments_received 
            SET 
              payment_status = ${createData.payment_status.toLowerCase()}::payment_status_enum,
              payment_details = ${createData.payment_details || {}},
              updated_at = ${createData.updated_at}
            WHERE id = ${existingPayment.id}::uuid
            RETURNING *;
          `;
          const typedResult = result as { id: string }[];
          // console.log('[DEBUG] Updated existing payment', { id: typedResult[0].id });
        } else {
          // Create new payment using raw SQL to ensure proper enum casting
          result = await prisma.$queryRaw`
            WITH new_payment AS (
              INSERT INTO agents.payments_received (
                id, amount, currency, payment_provider, payment_status,
                provider_payment_id, provider_customer_id, payment_method,
                payment_details, billing_period_start, billing_period_end,
                created_at, updated_at,
                subscription_plan_id, user_id
              ) VALUES (
                ${createData.id}::uuid, ${createData.amount}::numeric, ${createData.currency},
                ${createData.payment_provider}::payment_provider_enum,
                ${createData.payment_status}::payment_status_enum,
                ${createData.provider_payment_id}, ${createData.provider_customer_id},
                ${createData.payment_method}, ${createData.payment_details}::jsonb,
                ${createData.billing_period_start}, ${createData.billing_period_end},
                ${createData.created_at}, ${createData.updated_at},
                ${createData.subscription_plan_id}::uuid, ${createData.user_id}::uuid
              )
              ON CONFLICT ON CONSTRAINT payments_received_provider_payment_id_key
              DO UPDATE SET
                payment_status = EXCLUDED.payment_status,
                payment_details = EXCLUDED.payment_details,
                billing_period_start = EXCLUDED.billing_period_start,
                billing_period_end = EXCLUDED.billing_period_end,
                updated_at = EXCLUDED.updated_at
              RETURNING *
            )
            SELECT * FROM new_payment;
          `;
          const typedResult = result as { id: string }[];
          // console.log('[DEBUG] Created new payment', { id: typedResult[0].id });
        }

        const typedResult = result as { id: string }[];
        return typedResult[0];
      } catch (error) {
        console.error('[DEBUG] Error processing payment', { 
          paymentId: payment.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        return null;
      }
    });

    // console.log('[DEBUG] Executing upsert operations');
    const results = await Promise.all(upsertPromises);
    const successfulResults = results.filter(Boolean);
    // console.log('[DEBUG] Sync completed successfully', { 
    //   processedCount: results.length,
    //   successCount: successfulResults.length
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Payments synced successfully',
      count: paymentIntents.data.length,
      successfulSyncs: successfulResults.length,
      failedSyncs: results.length - successfulResults.length
    });

  } catch (error) {
    console.error('[DEBUG] Error in sync process:', error);
    console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to sync payments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 