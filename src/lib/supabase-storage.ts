// src/lib/supabase-storage.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_BUCKET_URL,
  GROUP_FILES_BUCKET
} from './constants';

interface ExtendedError {
  message: string;
  name?: string;
  statusCode?: string | number;
  status?: number;
  error?: string;
  data?: any;
}

// Define Supabase error type
interface SupabaseError {
  message: string;
  statusCode?: string;
  error?: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables for Supabase');
}

// Create client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Remove S3 client as we're not using it

export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('user_images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user_images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `${userId}/${fileName}`;
  
  return uploadImage(file, filePath);
}

export async function getImageUrl(path: string): Promise<string> {
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('user_images')
      .getPublicUrl(path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw error;
  }
}

export async function deleteImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('user_images')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
} 

export async function uploadGroupFiles(file: File, path: string): Promise<{ publicUrl: string; path: string }> {
  // Remove any quotes and leading/trailing slashes from the path
  const cleanPath = path.replace(/['"]/g, '').replace(/^\/+|\/+$/g, '');
  
  // console.log('\n[DEBUG] uploadGroupFiles started:', { 
  //   fileName: file.name, 
  //   path: cleanPath,
  //   fileType: file.type, 
  //   fileSize: file.size,
  //   supabaseUrl,
  //   hasAnonKey: !!supabaseAnonKey
  // });
  
  try {
    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // console.log('[DEBUG] Attempting upload with buffer size:', buffer.length);
    
    // Add retries for large files
    const maxRetries = 3;
    let attempt = 0;
    let uploadResult;

    while (attempt < maxRetries) {
      try {
        // Upload using the anon client
        uploadResult = await supabase.storage
          .from('study-group-chat-messages')
          .upload(cleanPath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: true
          });
        
        // If upload succeeds, break the retry loop
        if (!uploadResult.error) break;
        
        const error = {
          message: uploadResult.error.message,
          name: 'StorageError',
          statusCode: 403,
          error: 'Unauthorized',
          data: uploadResult.error
        };
        
        // console.log(`[DEBUG] Upload attempt ${attempt + 1} failed:`, {
        //   error,
        //   path: cleanPath,
        //   contentType: file.type
        // });
      } catch (err: any) {
        const error = {
          message: err?.message || 'Unknown error',
          name: err?.name,
          statusCode: err?.statusCode || 500,
          error: err?.error,
          data: err
        };
        
        // console.log(`[DEBUG] Upload attempt ${attempt + 1} error:`, error);
      }
      
      attempt++;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    if (!uploadResult || uploadResult.error) {
      const error = uploadResult?.error ? {
        message: uploadResult.error.message,
        name: 'StorageError',
        statusCode: 403,
        error: 'Unauthorized',
        data: uploadResult.error
      } : { 
        message: 'No upload result',
        statusCode: 500
      };
      
      // console.error('[DEBUG] Upload error after all retries:', error);
      throw error;
    }

    if (!uploadResult.data) {
      throw { message: 'Upload succeeded but no data was returned', statusCode: 500 };
    }

    // console.log('[DEBUG] File uploaded successfully:', uploadResult.data);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('study-group-chat-messages')
      .getPublicUrl(cleanPath);

    // console.log('[DEBUG] Generated public URL:', publicUrl);

    return { publicUrl, path: cleanPath };
  } catch (error: any) {
    const formattedError = {
      message: error?.message || 'Unknown error',
      name: error?.name,
      statusCode: error?.statusCode || 500,
      error: error?.error,
      data: error
    };
    
    // console.error('[DEBUG] Error in uploadGroupFiles:', formattedError);
    throw formattedError;
  }
}

export async function uploadGroupFile(file: File, userId: string, groupId: string, type: string): Promise<{ publicUrl: string; path: string }> {
  // console.log('[DEBUG] uploadGroupFile started:', { 
  //   fileName: file.name, 
  //   userId, 
  //   groupId, 
  //   type,
  //   fileType: file.type,
  //   fileSize: file.size
  // });

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  // Sanitize the filename to remove special characters
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}-${randomString}.${ext}`;
  
  // Use only the relative path for the file
  const relativePath = `${groupId}/${userId}/${type}/${fileName}`;
  
  // console.log('[DEBUG] Generated file path:', relativePath);
  
  return uploadGroupFiles(file, relativePath);
}

export async function getGroupFileUrl(path: string): Promise<string> {
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('study-group-chat-messages')
      .getPublicUrl(path);
    
    return publicUrl;
  } catch (error) {
    // console.error('Error getting image URL:', error);
    throw error;
  }
}

export async function deleteGroupFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('study-group-chat-messages')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    // console.error('Error deleting image:', error);
    throw error;
  }
} 