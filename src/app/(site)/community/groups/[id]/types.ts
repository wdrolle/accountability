// /src/app/(site)/community/groups/[id]/types.ts

export interface Note {
  id: string;
  title: string;
  content: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  created_at: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  meeting_schedule: string | null;
  location: string | null;
  current_topic: string | null;
  language: string;
  visibility: string;
  created_at: string;
  leader: {
    id: string;
    name: string;
    image: string;
  };
  member_count: number;
  members: Array<{
    user_id: string;
    role: string;
    name?: string;
    image?: string;
  }>;
}

export interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
} 