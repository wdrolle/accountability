import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check if user exists
    const user = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.image,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = ${userId}::uuid;
    `;

    if (!user || !Array.isArray(user) || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', id: userId },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: user[0] }, { status: 200 });
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
} 