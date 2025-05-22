import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const theme = searchParams.get('theme');

    // Build the where clause based on the filters
    const where: Prisma.daily_devotionalsWhereInput = {
      user_id: session.user.id,
      message_type: 'AI Generated Prayer',
      ...(date && {
        created_at: {
          gte: startOfDay(new Date(date)),
          lte: endOfDay(new Date(date))
        }
      }),
      ...(theme && {
        message_content: {
          contains: theme,
          mode: Prisma.QueryMode.insensitive
        }
      })
    };

    const devotionals = await prisma.daily_devotionals.findMany({
      where,
      select: {
        id: true,
        message_content: true,
        created_at: true,
        message_type: true,
        delivery_status: true,
        sent_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return new NextResponse(JSON.stringify(devotionals), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching daily devotionals:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 