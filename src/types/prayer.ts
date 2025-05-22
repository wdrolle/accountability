export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  fulfilled_at: string | null;
  status: string;
  visibility: string;
  isGroupOnly?: boolean;
  visibilityNote?: string;
  tags: string[];
  is_anonymous: boolean;
  prayer_count: number;
  reactions: {
    hearts: number;
    thumbsUp: number;
  };
  group_id: string | null;
  creator: {
    id: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  group?: {
    name: string;
  };
  prayers: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      name: string | null;
      first_name: string | null;
      last_name: string | null;
      isAnonymous: boolean;
    };
  }>;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_website?: string | null;
}

export interface PrayerResponse {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    isAnonymous: boolean;
  };
} 