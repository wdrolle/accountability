// /api/user/subscription

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { subscription_status_enum } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1) Directly find the user in `agents.user` by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            status: true,
            subscription_plan: true,
            created_at: true,
            subscription_ends_at: true,
            trial_ends_at: true,
            payment_status: true,
            stripe_customer_id: true,
            stripe_subscription_id: true,
            congregation: true,
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2) Grab the latest subscription
    const subscription = user.subscriptions[0] || null;

    // 3) Check newsletter subscription status
    const newsletterSubscription = await prisma.newsletter_subscriptions.findUnique({
      where: { email: session.user.email },
      select: {
        status: true,
        created_at: true
      }
    });

    // 4) Family members
    const familyMembers = await prisma.family_members.findMany({
      where: { family_id: user.id },
      include: {
        user: { select: { id: true, name: true, first_name: true, last_name: true, email: true } }
      },
    });
    const formattedFamilyMembers = familyMembers.map((member) => ({
      id: member.user.id,
      name: member.user.name
        || `${member.user.first_name ?? ''} ${member.user.last_name ?? ''}`.trim()
        || member.user.email,
    }));

    // 5) Monthly usage
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyUsage = await prisma.usage.findFirst({
      where: {
        user_id: user.id,
        date: { gte: firstDayOfMonth, lte: today },
      },
    });

    // 6) Subscription plan details
    const subscriptionPlanName = subscription?.subscription_plan || 'STARTER';
    const subscriptionPlan = await prisma.subscription_plans.findFirst({
      where: { name: subscriptionPlanName },
      include: { subscription_limits: true },
    });

    // Extract subscription limits
    const msgLimit = subscriptionPlan?.subscription_limits.find((l) => l.feature_id === 'messages_per_month');
    const aiLimit = subscriptionPlan?.subscription_limits.find((l) => l.feature_id === 'ai_chats_per_month');
    const familyLimit = subscriptionPlan?.subscription_limits.find((l) => l.feature_id === 'max_family_members');

    // Count study group roles
    const [groupsAsLeader, groupMemberRoles, discussionsCreated, prayersCreated, prayersReplied] = await Promise.all([
      // Count groups where user is leader
      prisma.agents_group.count({
        where: {
          leader_id: user.id
        }
      }),
      // Count groups by role in agents_group_member
      prisma.agents_group_member.groupBy({
        by: ['role'],
        where: {
          user_id: user.id,
          NOT: {
            role: 'LEADER' // Exclude LEADER as it's counted from agents_group
          }
        },
        _count: {
          role: true
        }
      }),
      // Count discussions created by user
      prisma.discussion.count({
        where: {
          user_id: user.id
        }
      }),
      // Count prayer requests created by user
      prisma.daily_messages.count({
        where: {
          author_id: user.id,
          message_type: 'PRAYER_REQUEST'
        }
      }),
      // Count prayers replied by user
      prisma.daily_messages.count({
        where: {
          author_id: user.id,
          message_type: 'PRAYER'
        }
      })
    ]);

    // Calculate role counts
    const adminCount = groupMemberRoles.find(r => r.role?.toString() === 'ADMIN')?._count.role || 0;
    const memberCount = groupMemberRoles.find(r => r.role?.toString() === 'MEMBER')?._count.role || 0;

    // Build the JSON
    const subscriptionData = {
      status: subscription?.status || 'TRIAL',
      subscription_plan: subscriptionPlanName,
      start_date: subscription?.created_at?.toISOString() || null,
      end_date: subscription?.subscription_ends_at?.toISOString() || null,
      trial_ends_at: subscription?.trial_ends_at?.toISOString() || null,
      payment_status: subscription?.payment_status || null,
      stripe_customer_id: subscription?.stripe_customer_id || null,
      stripe_subscription_id: subscription?.stripe_subscription_id || null,
      usage: {
        messages_sent: monthlyUsage?.count || 0,
        messages_limit: msgLimit?.max_count || 0,
        ai_chats_used: 0, // TODO: track if needed
        ai_chats_limit: aiLimit?.max_count || 0,
        family_members: formattedFamilyMembers.length,
        family_members_limit: familyLimit?.max_count || 1,
      },
      family_members: formattedFamilyMembers,
      family_count: formattedFamilyMembers.length,
      congregation: subscription?.congregation ?? [],
      study_groups_leader: groupsAsLeader,
      study_groups_admin: adminCount,
      study_groups_member: memberCount,
      discussions_created: discussionsCreated,
      prayers_created: prayersCreated,
      prayers_replied: prayersReplied,
      newsletter_subscribed: newsletterSubscription?.status === subscription_status_enum.ACTIVE,
      newsletter_subscribed_at: newsletterSubscription?.created_at || null
    };

    return NextResponse.json({ subscription: subscriptionData });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
