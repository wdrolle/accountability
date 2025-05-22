import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DEFAULT_USER_IMAGE } from "./constants";
import { Session } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// DO NOT CHANGE THIS CODE IN UPDATE. IT IS CORRECT AND WORKING TO GET THE IMAGE URL. ADD ANOTHER FUNCTION IF YOU NEED TO CHANGE IT AND USE THE NEW FUNCTION IN THE COMPONENT. KEEP THIS ONE FOR FUTURE REFERENCE.
export const getSupabaseImageUrl = (imagePath: string | null | undefined, session: Session | null): string => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const BUCKET_NAME = 'user_images';
  
  if (!imagePath) return DEFAULT_USER_IMAGE;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Construct the full URL - imagePath already includes user ID
  // DO NOT CHANGE THIS CODE IN UPDATE. IT IS CORRECT AND WORKING TO GET THE IMAGE URL
  const fullUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
  
  // Log the URL construction for debugging
  console.log('Constructed URL:', {
    supabaseUrl: SUPABASE_URL,
    bucketName: BUCKET_NAME,
    imagePath,
    fullUrl
  });
  
  return fullUrl;
}; 