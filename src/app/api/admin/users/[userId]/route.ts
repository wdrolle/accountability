import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // console.log('----------------------------------------');
    // console.log('[DEBUG] Starting API update process');
    // console.log('[DEBUG] User ID:', params.userId);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // console.log('[DEBUG] No session or user ID found');
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // console.log('[DEBUG] Session user ID:', session.user.id);

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      // console.log('[DEBUG] User is not admin');
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.userId;
    const body = await request.json();
    // console.log('[DEBUG] Request body:', JSON.stringify(body, null, 2));

    try {
      // Update auth.users table directly
      if (body.raw_app_meta_data !== undefined) {
        // console.log('[DEBUG] Updating app metadata');
        await prisma.$executeRaw`
          UPDATE auth.users 
          SET raw_app_meta_data = ${body.raw_app_meta_data}::jsonb
          WHERE id = ${targetUserId}::uuid
        `;
      }
      
      if (body.raw_user_meta_data !== undefined) {
        // console.log('[DEBUG] Updating user metadata');
        await prisma.$executeRaw`
          UPDATE auth.users 
          SET raw_user_meta_data = ${body.raw_user_meta_data}::jsonb
          WHERE id = ${targetUserId}::uuid
        `;
      }

      // console.log('[DEBUG] Update successful');
      return Response.json({ 
        success: true, 
        message: 'User metadata updated successfully'
      });
    } catch (updateError) {
      // console.error('[DEBUG] Update error:', updateError);
      return Response.json({ 
        message: 'Failed to update user metadata',
        error: updateError,
        status: 'error'
      }, { status: 500 });
    }
  } catch (error) {
    // console.error('[DEBUG] Unexpected error:', error);
    return Response.json({ 
      message: 'Internal Server Error',
      error: error,
      status: 'error'
    }, { status: 500 });
  } finally {
    // console.log('----------------------------------------');
  }
} 