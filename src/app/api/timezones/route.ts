import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const timezones = await prisma.tz.findMany({
      select: {
        name: true,
        abbrev: true,
        utc_offset: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format the timezone data for the frontend
    const formattedTimezones = timezones.map(tz => ({
      value: tz.name,
      label: `${tz.name} (${tz.utc_offset})`,
      utc_offset: tz.utc_offset
    }));

    return NextResponse.json({ timezones: formattedTimezones });
  } catch (error) {
    console.error('Error in timezones API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 