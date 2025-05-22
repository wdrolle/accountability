import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const timezones = await prisma.tz.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(timezones);
  } catch (error) {
    console.error('Error fetching timezones:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 