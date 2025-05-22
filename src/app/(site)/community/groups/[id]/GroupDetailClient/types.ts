export type User = {
  id: string;
  name: string;
  image: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  meeting_schedule: string | null;
  location: string | null;
  current_topic: string | null;
  language: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  leader: User;
  member_count: number;
  zoom_meetings?: ZoomMeeting[];
};

export type Member = {
  id: string;
  group_id: string;
  user_id: string;
  name: string;
  first_name: string;
  last_name: string;
  image: string | null;
  role: 'MEMBER' | 'LEADER' | 'ADMIN';
  status: 'ACCEPTED' | 'PENDING';
  last_active_at: string | null;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  joined_at: string | null;
  invited_by: string | null;
  invited_at: string | null;
  user: User;
};

export interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  note_id: string;
  is_private: boolean;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  user: {
    id: string;
    name: string;
    image: string;
  };
  replies: Reply[];
}

export type PrayerRequest = {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  content: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  prayer_count: number;
  created_at: Date;
  updated_at: Date;
  user: User;
};

export type Message = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  user: User;
};

export type TabType = 'info' | 'members' | 'notes' | 'prayers' | 'chat' | 'whiteboard';

export interface GroupFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
  };
}

export interface ChatSummary {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  messageCount: number;
  lastMessage?: {
    id: string;
    content: { text: string };
    created_at: string;
  };
}

export interface WhiteBoardContent {
  id: string;
  title: string;
  content: string;
  day: string;
  group_id: string;
  created_at: string;
  updated_at: string;
}

export interface ZoomMeetingDetails {
  id: string;
  name: string;
  start_time: string;
  duration: number;
  recurrence?: {
    type: 1 | 2 | 3;
    repeat_interval: number;
    end_date_time: string;
  };
}

export interface GroupDetailClientProps {
  id: string;
}

export interface ZoomMeeting {
  id: string;
  name: string;
  start_time: string;
  duration: string;
  password: string;
  meeting_url?: string;
  created_at: string;
  updated_at: string;
  recurrence?: {
    type: 1 | 2 | 3; // 1: Daily, 2: Weekly, 3: Yearly
    repeat_interval: number;
    end_date_time?: string;
  };
}
