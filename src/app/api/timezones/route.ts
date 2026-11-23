import { NextResponse } from 'next/server';
import { listIanaTimezones } from '@/lib/utils';

export async function GET() {
  try {
    return NextResponse.json({ timezones: listIanaTimezones() });
  } catch (error) {
    console.error('Error in timezones API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
