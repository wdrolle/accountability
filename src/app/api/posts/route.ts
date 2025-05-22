import { NextResponse } from 'next/server';
import { getPosts } from '@/sanity/sanity-utils';
import { integrations } from '../../../../integrations.config';

export async function GET() {
  try {
    if (!integrations.isSanityEnabled) {
      return NextResponse.json([]);
    }

    const posts = await getPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 