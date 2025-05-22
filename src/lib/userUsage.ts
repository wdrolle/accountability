import prisma from '@/lib/prisma';

interface UserMetadata {
  subscription_plan: string;
  [key: string]: any;
}

const DAILY_LIMITS: Record<string, number> = {
  starter: 20,
  medium: 50,
  business: Infinity
};

export async function checkUserUsage(user_id: string) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const usage = await prisma.usage.findFirst({
      where: {
        user_id: user_id,
        date: today
      }
    });

    // Get subscription plan from user metadata
    const user = await prisma.users.findUnique({
      where: { id: user_id }
    });

    const metadata = user?.raw_user_meta_data as UserMetadata | null;
    const plan = metadata?.subscription_plan || 'starter';
    const currentUsage = usage?.count || 0;
    const limit = DAILY_LIMITS[plan] || DAILY_LIMITS.starter;

    return {
      canUse: currentUsage < limit,
      remaining: limit - currentUsage,
      total: limit
    };
  } catch (error) {
    console.error('Error checking usage:', error);
    return { canUse: false, remaining: 0, total: 0 };
  }
}

export async function incrementUsage(user_id: string) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await prisma.usage.upsert({
      where: {
        user_id_date: {
          user_id: user_id,
          date: today
        }
      },
      update: {
        count: { increment: 1 }
      },
      create: {
        user_id: user_id,
        date: today,
        count: 1
      }
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
} 