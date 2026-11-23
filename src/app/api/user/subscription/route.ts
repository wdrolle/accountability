import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const PLAN_LIMITS: Record<string, { messages: number; chats: number }> = {
  STARTER: { messages: 30, chats: 20 },
  PREMIUM: { messages: 200, chats: 100 },
};

function planLimits(plan?: string | null) {
  return PLAN_LIMITS[plan || 'STARTER'] || PLAN_LIMITS.STARTER;
}

function formatPlan(plan?: string | null) {
  if (!plan) return 'Starter';
  return plan.charAt(0) + plan.slice(1).toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = user.subscriptions;
    const planName = subscription?.subscription_plan || 'STARTER';
    const limits = planLimits(planName);

    let messagesSent = 0;
    try {
      const today = new Date();
      const monthStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
      const monthly = await prisma.usage_monthly.findFirst({
        where: {
          user_id: user.id,
          month: monthStart,
        },
      });
      if (monthly?.count != null) {
        messagesSent = monthly.count;
      } else {
        const daily = await prisma.usage.aggregate({
          where: {
            user_id: user.id,
            date: { gte: monthStart },
          },
          _sum: { count: true },
        });
        messagesSent = daily._sum.count || 0;
      }
    } catch (error) {
      console.error('Subscription usage lookup failed:', error);
    }

    return NextResponse.json({
      subscription: {
        status: subscription?.status || user.subscription_status || 'TRIAL',
        plan: formatPlan(planName),
        subscription_plan: planName,
        start_date: subscription?.created_at?.toISOString() || user.created_at?.toISOString() || null,
        end_date: subscription?.subscription_ends_at?.toISOString() || null,
        trial_ends_at: subscription?.trial_ends_at?.toISOString() || null,
        payment_status: subscription?.payment_status || null,
        stripe_customer_id: subscription?.stripe_customer_id || null,
        stripe_subscription_id: subscription?.stripe_subscription_id || null,
        usage: {
          messages_sent: messagesSent,
          messages_limit: limits.messages,
          ai_chats_used: 0,
          ai_chats_limit: limits.chats,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
