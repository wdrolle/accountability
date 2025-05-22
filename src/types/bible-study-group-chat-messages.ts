export type ReactionType = 'SMILE' | 'HEART' | 'BLUE_HEART' | 'CLAP' | 'CRY' | 'TEARS' | 'MONOCLE' | 'JOY' | 'ASTONISHED';

interface MessageContent {
  text: string;
  type: string;
  files: any[];
  edited: boolean;
  mentions: any[];
  edited_at: string | null;
  reactions: Record<string, any>;
}

export interface Message {
  id: string;
  content: {
    text: string;
  };
  created_at: string;
  user_id: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    image: string | null;
  };
  reply_to_message_id?: string;
  reply_to_message?: Message;
  reactions_count: Record<string, number>;
  user_reactions?: string[];
} 