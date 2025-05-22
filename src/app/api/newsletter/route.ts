import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get the authenticated user if available
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    try {
      // First check if a subscription exists
      const existingSubscription = await prisma.newsletter_subscriptions.findUnique({
        where: { email }
      });

      let subscription;
      if (existingSubscription) {
        // Update existing subscription
        subscription = await prisma.newsletter_subscriptions.update({
          where: { email },
          data: {
            status: 'SUBSCRIBED',
            user_id: userId || " --Zoe",
            subscribed_at: new Date(),
            unsubscribed_at: null,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new subscription
        subscription = await prisma.newsletter_subscriptions.create({
          data: {
            email,
            user_id: userId,
            status: 'SUBSCRIBED',
            subscribed_at: new Date(),
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter' 
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to save subscription' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json({ 
      error: 'Invalid request format' 
    }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          status: 'UNSUBSCRIBED',
          unsubscribed_at: new Date(),
          updated_at: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully unsubscribed from newsletter' 
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to update subscription' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json({ 
      error: 'Invalid request format' 
    }, { status: 400 });
  }
} 