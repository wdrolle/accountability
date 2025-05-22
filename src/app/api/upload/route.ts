// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { uploadProfileImage } from '@/lib/supabase-storage';

export async function POST(request: Request) {
  try {
    // Check session first using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('profileImage') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get user from database (using auth.users table)
    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate file ID
    const fileId = uuidv4();

    try {
      // Upload the image and get the public URL
      const publicUrl = await uploadProfileImage(file, user.id);

      // Extract the relative path from the URL
      const relativePath = `${user.id}/${file.name}`;

      // Create record in files_in_storage
      const fileRecord = await prisma.files_in_storage.create({
        data: {
          id: fileId,
          file_path: publicUrl,
          file_name: file.name,
          user_id: user.id,
          file_type: file.type,
          file_size: file.size,
          metadata: {
            embedded_till: 0
          },
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Update user's raw_app_meta_data with the image URL
      const currentMetaData = user.raw_app_meta_data as Record<string, any> || {};
      await prisma.users.update({
        where: { id: user.id },
        data: { 
          raw_app_meta_data: {
            ...currentMetaData,
            avatar_url: publicUrl
          }
        }
      });

      return NextResponse.json({ 
        success: true,
        url: publicUrl,
        file: fileRecord
      });
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}