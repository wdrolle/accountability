export interface agentsStudyGroup {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  owner_id: string;
  leader_id: string;
  is_private: boolean;
  isMember: boolean;
  members?: {
    id: string;
    name: string;
    image: string | null;
  }[];
} 