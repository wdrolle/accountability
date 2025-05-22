import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch agents versions from the database
    const agentsVersions = await prisma.agents_versions.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
        language: true,
        countries: true,
        info: true,
        copyright: true,
        created_at: true,
        updated_at: true
      }
    });

    // Format the response
    const formattedVersions = agentsVersions.map(version => ({
      id: version.id,
      name: version.name,
      abbreviation: version.abbreviation,
      language: version.language,
      countries: version.countries,
      description: version.info,
      copyright: version.copyright,
      created_at: version.created_at,
      updated_at: version.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedVersions
    });
  } catch (error) {
    console.error('Error fetching agents versions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agents versions'
    }, { status: 500 });
  }
} 