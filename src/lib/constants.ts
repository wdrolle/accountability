export const DEFAULT_USER_IMAGE = '/images/logo/agents.png';

export const getUserImageUrl = (userId: string, imagePath?: string) => {
  if (!imagePath) return DEFAULT_USER_IMAGE;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user_images/${userId}/${imagePath}`;
};

export const getGroupFileUrl = (groupId: string, filename: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/group_files/${groupId}/${filename}`;
};

// Supabase Configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public`;
export const GROUP_FILES_BUCKET = 'group-files';

// Email Configuration
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// AWS S3 Bucket Names
export const USER_IMAGES_BUCKET = process.env.USER_IMAGES_BUCKET || 'user-images'
