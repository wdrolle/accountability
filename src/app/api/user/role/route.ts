import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    // Update role in auth.users table
    const updatedUser = await prisma.users.update({
      where: { email: session.user.email },
      data: { role },
    });

    // Also update role in agents.user table for consistency
    await prisma.user.update({
      where: { email: session.user.email },
      data: { role: role as any }, // Cast to any since the enum types might differ
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
} 