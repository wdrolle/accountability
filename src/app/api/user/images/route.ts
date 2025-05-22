import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { USER_IMAGES_BUCKET, SUPABASE_URL } from '@/lib/constants';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is not set');
}

// Initialize Supabase client with anon key
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});

export async function GET(request: Request) {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // List all files in the user's folder
    const { data: files, error } = await supabase.storage
      .from(USER_IMAGES_BUCKET)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json(
        { error: 'Error fetching images' },
        { status: 500 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // Get public URLs for all files
    const images = files
      .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      .map(file => ({
        url: supabase.storage
          .from(USER_IMAGES_BUCKET)
          .getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
        createdAt: file.created_at
      }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 