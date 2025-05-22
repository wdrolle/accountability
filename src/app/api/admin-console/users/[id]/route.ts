import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status in agents.user table
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, first_name, last_name, role, subscription_status } = await req.json();

    // Start a transaction to update both tables
    await prisma.$transaction(async (tx) => {
      // Update auth.users table
      await tx.users.update({
        where: { id: params.id },
        data: {
          email,
          first_name,
          last_name,
          role,
          raw_app_meta_data: {
            subscription_status
          }
        }
      });

      // Update agents.user table
      await tx.user.update({
        where: { id: params.id },
        data: {
          email,
          first_name,
          last_name,
          role,
          subscription_status
        }
      });

      // If subscription status is updated, update related subscriptions
      if (subscription_status) {
        await tx.subscriptions.updateMany({
          where: { user_id: params.id },
          data: { status: subscription_status }
        });
      }
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
} 