export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          action: string
          actor: string
          at: string
          created_at: string
          entity: Json | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string | null
          id: string
          meta: Json | null
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          actor: string
          at?: string
          created_at?: string
          entity?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          actor?: string
          at?: string
          created_at?: string
          entity?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          created_at: string
          deep_analysis: boolean
          enabled: boolean
          id: string
          max_context_items: number | null
          model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deep_analysis?: boolean
          enabled?: boolean
          id?: string
          max_context_items?: number | null
          model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deep_analysis?: boolean
          enabled?: boolean
          id?: string
          max_context_items?: number | null
          model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clockify_time_entries: {
        Row: {
          billable: boolean
          created_at: string
          description: string
          duration: number
          end_time: string | null
          hourly_rate: number | null
          id: string
          person_ids: Json | null
          project_id: string
          start_time: string
          status: string
          tags: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          description: string
          duration?: number
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          person_ids?: Json | null
          project_id: string
          start_time: string
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          description?: string
          duration?: number
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          person_ids?: Json | null
          project_id?: string
          start_time?: string
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clockify_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          member_ids: Json | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          member_ids?: Json | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          member_ids?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          attachments: Json | null
          avatar_url: string | null
          created_at: string
          email: string | null
          group_ids: Json | null
          id: string
          linkedin: string | null
          name: string
          notes: string | null
          phone: string | null
          project_ids: Json | null
          skills: Json | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          attachments?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          group_ids?: Json | null
          id?: string
          linkedin?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          project_ids?: Json | null
          skills?: Json | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          attachments?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          group_ids?: Json | null
          id?: string
          linkedin?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          project_ids?: Json | null
          skills?: Json | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      debts: {
        Row: {
          allocated_receivable_ids: Json | null
          created_at: string
          due_date: string
          id: string
          name: string
          remaining_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allocated_receivable_ids?: Json | null
          created_at?: string
          due_date: string
          id?: string
          name: string
          remaining_amount: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allocated_receivable_ids?: Json | null
          created_at?: string
          due_date?: string
          id?: string
          name?: string
          remaining_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plaky_boards: {
        Row: {
          color: string
          columns: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          columns?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          columns?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaky_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plaky_items: {
        Row: {
          board_id: string
          created_at: string
          id: string
          person_ids: Json | null
          tags: Json | null
          task_id: string | null
          updated_at: string
          user_id: string
          values: Json | null
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          person_ids?: Json | null
          tags?: Json | null
          task_id?: string | null
          updated_at?: string
          user_id: string
          values?: Json | null
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          person_ids?: Json | null
          tags?: Json | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
          values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "plaky_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "plaky_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaky_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          created_at: string
          duration: number
          id: string
          is_active: boolean
          is_paused: boolean
          project_id: string | null
          remaining_time: number
          start_time: string
          task_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          is_active?: boolean
          is_paused?: boolean
          project_id?: string | null
          remaining_time: number
          start_time: string
          task_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          is_active?: boolean
          is_paused?: boolean
          project_id?: string | null
          remaining_time?: number
          start_time?: string
          task_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_settings: {
        Row: {
          auto_start_breaks: boolean
          auto_start_work: boolean
          created_at: string
          id: string
          long_break_duration: number
          long_break_interval: number
          short_break_duration: number
          sound_enabled: boolean
          updated_at: string
          user_id: string
          work_duration: number
        }
        Insert: {
          auto_start_breaks?: boolean
          auto_start_work?: boolean
          created_at?: string
          id?: string
          long_break_duration?: number
          long_break_interval?: number
          short_break_duration?: number
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          work_duration?: number
        }
        Update: {
          auto_start_breaks?: boolean
          auto_start_work?: boolean
          created_at?: string
          id?: string
          long_break_duration?: number
          long_break_interval?: number
          short_break_duration?: number
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          work_duration?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          project_id: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_wallet_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          project_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_wallet_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          name: string
          project_id: string | null
          received_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          name: string
          project_id?: string | null
          received_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          name?: string
          project_id?: string | null
          received_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_completions: {
        Row: {
          count: number
          created_at: string
          date: string
          goal: number
          id: string
          paused: boolean
          routine_id: string
          skipped: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          date: string
          goal?: number
          id?: string
          paused?: boolean
          routine_id: string
          skipped?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          goal?: number
          id?: string
          paused?: boolean
          routine_id?: string
          skipped?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_completions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          active_from: string
          active_to: string | null
          color: string
          created_at: string
          deleted_at: string | null
          exceptions: Json | null
          id: string
          name: string
          paused_until: string | null
          schedule: Json
          times_per_day: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          exceptions?: Json | null
          id?: string
          name: string
          paused_until?: string | null
          schedule?: Json
          times_per_day?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          exceptions?: Json | null
          id?: string
          name?: string
          paused_until?: string | null
          schedule?: Json
          times_per_day?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          description: string | null
          end_time: string | null
          id: string
          is_overdue: boolean
          is_routine: boolean
          project_id: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_overdue?: boolean
          is_routine?: boolean
          project_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_overdue?: boolean
          is_routine?: boolean
          project_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_lists: {
        Row: {
          created_at: string
          id: string
          items: Json
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          project_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_lists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
