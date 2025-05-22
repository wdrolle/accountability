import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all agents versions
    const versions = await prisma.agents_versions.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
        language: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching agents versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents versions' },
      { status: 500 }
    );
  }
} 