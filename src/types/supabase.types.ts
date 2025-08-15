import { Database as GeneratedDatabase } from '@/integrations/supabase/types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = GeneratedDatabase & {
  public: {
    Tables: Omit<GeneratedDatabase['public']['Tables'], 'tasks'> & {
      activities: {
        Row: {
          id: string;
          action: string;
          actor: string;
          entity_type: 'task' | 'transaction' | 'contact' | 'project' | 'routine' | null;
          entity_id: string | null;
          entity_label: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          action: string;
          actor: string;
          entity_type?: 'task' | 'transaction' | 'contact' | 'project' | 'routine' | null;
          entity_id?: string | null;
          entity_label?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          action?: string;
          actor?: string;
          entity_type?: 'task' | 'transaction' | 'contact' | 'project' | 'routine' | null;
          entity_id?: string | null;
          entity_label?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: Omit<GeneratedDatabase['public']['Tables']['tasks']['Row'], 'priority' | 'status' | 'labels'> & {
          priority?: 'low' | 'medium' | 'high';
          status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
          labels?: string[] | null;
        };
        Insert: Omit<GeneratedDatabase['public']['Tables']['tasks']['Insert'], 'priority' | 'status' | 'labels'> & {
          priority?: 'low' | 'medium' | 'high';
          status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
          labels?: string[] | null;
        };
        Update: Omit<GeneratedDatabase['public']['Tables']['tasks']['Update'], 'priority' | 'status' | 'labels'> & {
          priority?: 'low' | 'medium' | 'high';
          status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
          labels?: string[] | null;
        };
        Relationships: [];
      };
      routines: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          frequency: string;
          days_of_week: string[] | null;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          frequency: string;
          days_of_week?: string[] | null;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          frequency?: string;
          days_of_week?: string[] | null;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      routine_completions: {
        Row: {
          id: string;
          routine_id: string;
          completed_at: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          completed_at: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_completions_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          }
        ];
      };
      routine_skips: {
        Row: {
          id: string;
          routine_id: string;
          skip_date: string;
          reason: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          skip_date: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          skip_date?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_skips_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          }
        ];
      };
      // Add other custom tables here as needed
    };
  };
};

// Re-export all the types from the generated types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T] extends {
  Row: infer R;
}
  ? R
  : never;

export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T] extends {
  Insert: infer I;
}
  ? I
  : never;

export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T] extends {
  Update: infer U;
}
  ? U
  : never;
