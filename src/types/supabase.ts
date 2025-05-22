// types/supabase.ts
// This file is used to handle the supabase types
// It is used to handle the supabase types that are used to connect to the supabase database and the tables that are used to store the data

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  god: {
    Tables: {
      god_users: {
        Row: {
          id: string
          email: string
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          role: 'USER' | 'ADMIN' | 'STAKEHOLDER' | 'MEMBER'
          subscription_status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'TRIAL'
          bank_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          role?: 'USER' | 'ADMIN' | 'STAKEHOLDER' | 'MEMBER'
          subscription_status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'TRIAL'
          bank_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          role?: 'USER' | 'ADMIN' | 'STAKEHOLDER' | 'MEMBER'
          subscription_status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'TRIAL'
          bank_id?: string | null
          updated_at?: string | null
        }
      }
      god_invitations: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          bank_id: string | null
          bank_name: string | null
          responsibilities: Json | null
          token: string | null
          created_at: string | null
          sent_by_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          bank_id?: string | null
          bank_name?: string | null
          responsibilities?: Json | null
          token?: string | null
          created_at?: string | null
          sent_by_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          bank_id?: string | null
          bank_name?: string | null
          responsibilities?: Json | null
          token?: string | null
          created_at?: string | null
          sent_by_id?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      god_user_view: {
        Row: {
          id: string
          email: string
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          role: 'USER' | 'ADMIN' | 'STAKEHOLDER' | 'MEMBER'
          subscription_status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'TRIAL'
          bank_id: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
    }
    Functions: {
      get_god_users: {
        Args: Record<string, never>
        Returns: Database['god']['Tables']['god_users']['Row'][]
      }
      insert_god_user: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
        }
        Returns: Database['god']['Tables']['god_users']['Row']
      }
    }
    Enums: {
      user_role_enum: 'USER' | 'ADMIN' | 'STAKEHOLDER' | 'MEMBER'
      subscription_status_enum: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'TRIAL'
    }
  }
} 