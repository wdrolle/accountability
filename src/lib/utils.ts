import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DEFAULT_USER_IMAGE } from "./constants";
import { Session } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shared HeroUI Select styles: light/dark text plus a translucent popover. */
export const heroSelectClassNames = {
  trigger:
    "bg-gray-100/80 text-black dark:bg-dark-7/70 dark:text-white backdrop-blur-sm border-gray-200 dark:border-white/15",
  value: "text-black dark:text-white",
  popoverContent:
    "bg-white/70 dark:bg-dark-6/70 backdrop-blur-md border border-gray-200 dark:border-white/15 text-black dark:text-white",
  listbox: "bg-transparent text-black dark:text-white",
  listboxWrapper: "bg-transparent",
};

export const heroSelectPopoverProps = {
  classNames: {
    content:
      "bg-white/70 dark:bg-dark-6/70 backdrop-blur-md border border-gray-200 dark:border-white/15 text-black dark:text-white",
  },
};

export function isValidIanaTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function listIanaTimezones() {
  const names =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? Intl.supportedValuesOf("timeZone")
      : ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "UTC"];

  return names.map((name) => ({
    value: name,
    label: name.replace(/_/g, " "),
    utc_offset: "",
  }));
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