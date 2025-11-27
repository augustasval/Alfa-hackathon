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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      custom_exercises: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          question: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          question: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          question?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_plans: {
        Row: {
          created_at: string
          grade: string
          id: string
          session_id: string | null
          test_date: string
          topic_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          session_id?: string | null
          test_date: string
          topic_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          session_id?: string | null
          test_date?: string
          topic_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          day_number: number
          description: string
          id: string
          is_completed: boolean | null
          plan_id: string
          scheduled_date: string
          task_type: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_number: number
          description: string
          id?: string
          is_completed?: boolean | null
          plan_id: string
          scheduled_date: string
          task_type: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_number?: number
          description?: string
          id?: string
          is_completed?: boolean | null
          plan_id?: string
          scheduled_date?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "learning_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mistakes: {
        Row: {
          attempts: number | null
          correct_answer: string | null
          created_at: string
          id: string
          problem: string
          topic: string
          type: string
          user_answer: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          problem: string
          topic: string
          type: string
          user_answer?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          problem?: string
          topic?: string
          type?: string
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mistakes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_oauth_registrations: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          invite_code: string | null
          invite_code_expires_at: string | null
          name: string | null
          role: string
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          invite_code?: string | null
          invite_code_expires_at?: string | null
          name?: string | null
          role: string
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invite_code?: string | null
          invite_code_expires_at?: string | null
          name?: string | null
          role?: string
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          parent_id: string
          scheduled_date: string
          scheduled_time: string
          status: string | null
          student_id: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          parent_id: string
          scheduled_date: string
          scheduled_time: string
          status?: string | null
          student_id: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          parent_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string | null
          student_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      session_reports: {
        Row: {
          accuracy_percentage: number | null
          created_at: string
          id: string
          key_insights: string[] | null
          parent_id: string
          recommendations: string[] | null
          report_content: string
          session_id: string
          student_id: string
          summary: string | null
        }
        Insert: {
          accuracy_percentage?: number | null
          created_at?: string
          id?: string
          key_insights?: string[] | null
          parent_id: string
          recommendations?: string[] | null
          report_content: string
          session_id: string
          student_id: string
          summary?: string | null
        }
        Update: {
          accuracy_percentage?: number | null
          created_at?: string
          id?: string
          key_insights?: string[] | null
          parent_id?: string
          recommendations?: string[] | null
          report_content?: string
          session_id?: string
          student_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_reports_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          grade_level: number | null
          id: string
          linked_profile_id: string | null
          name: string
          parent_id: string
        }
        Insert: {
          created_at?: string
          grade_level?: number | null
          id?: string
          linked_profile_id?: string | null
          name: string
          parent_id: string
        }
        Update: {
          created_at?: string
          grade_level?: number | null
          id?: string
          linked_profile_id?: string | null
          name?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_progress: {
        Row: {
          created_at: string | null
          current_phase: string | null
          exercises_completed: number | null
          id: string
          quiz_passed: boolean | null
          session_id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_phase?: string | null
          exercises_completed?: number | null
          id?: string
          quiz_passed?: boolean | null
          session_id: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_phase?: string | null
          exercises_completed?: number | null
          id?: string
          quiz_passed?: boolean | null
          session_id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "learning_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tutoring_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          duration_minutes: number | null
          id: string
          topic: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          topic: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutoring_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_fresh_invite_code: {
        Args: { user_id: string }
        Returns: {
          expires_at: string
          invite_code: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "parent" | "student"
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
    Enums: {
      app_role: ["parent", "student"],
    },
  },
} as const
