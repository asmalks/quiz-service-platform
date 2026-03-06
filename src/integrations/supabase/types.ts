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
      admins: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      client_admins: {
        Row: {
          client_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          password_hash: string
          role: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          password_hash: string
          role?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_admins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "quiz_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_read: boolean | null
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          city: string | null
          created_at: string
          device_fingerprint: string | null
          end_time: string | null
          exam_target: string | null
          id: string
          name: string
          quiz_id: string
          server_calculated_time: number | null
          start_time: string
          total_score: number | null
          total_time_taken: number | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          device_fingerprint?: string | null
          end_time?: string | null
          exam_target?: string | null
          id?: string
          name: string
          quiz_id: string
          server_calculated_time?: number | null
          start_time?: string
          total_score?: number | null
          total_time_taken?: number | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          device_fingerprint?: string | null
          end_time?: string | null
          exam_target?: string | null
          id?: string
          name?: string
          quiz_id?: string
          server_calculated_time?: number | null
          start_time?: string
          total_score?: number | null
          total_time_taken?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_premium: boolean | null
          title: string
          topic: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          title: string
          topic: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          title?: string
          topic?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options: Json
          order_index: number
          question_text: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_clients: {
        Row: {
          background_color: string | null
          badge_text: string | null
          created_at: string
          created_by: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          subheadline: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          badge_text?: string | null
          created_at?: string
          created_by?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          subheadline?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          badge_text?: string | null
          created_at?: string
          created_by?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          subheadline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          access_code: string | null
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          id: string
          is_private: boolean | null
          randomize_options: boolean | null
          randomize_questions: boolean | null
          show_leaderboard: boolean | null
          sponsor_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["quiz_status"]
          timer_per_question: number
          title: string
          updated_at: string
        }
        Insert: {
          access_code?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          is_private?: boolean | null
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_leaderboard?: boolean | null
          sponsor_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["quiz_status"]
          timer_per_question?: number
          title: string
          updated_at?: string
        }
        Update: {
          access_code?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          is_private?: boolean | null
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_leaderboard?: boolean | null
          sponsor_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["quiz_status"]
          timer_per_question?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "quiz_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_correct: boolean
          participant_id: string
          question_id: string
          quiz_id: string
          time_taken: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_correct: boolean
          participant_id: string
          question_id: string
          quiz_id: string
          time_taken: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          participant_id?: string
          question_id?: string
          quiz_id?: string
          time_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          link: string | null
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          link?: string | null
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          link?: string | null
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          last_participation_date: string | null
          participant_id: string
          points: number | null
          streak_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_participation_date?: string | null
          participant_id: string
          points?: number | null
          streak_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_participation_date?: string | null
          participant_id?: string
          points?: number | null
          streak_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      questions_public: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          options: Json
          order_index: number
          created_at: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_client_admin: {
        Args: { p_client_id: string; p_email: string; p_password: string }
        Returns: string
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      reset_client_admin_password: {
        Args: { p_admin_id: string; p_new_password: string }
        Returns: boolean
      }
      save_client_quiz: {
        Args: {
          p_admin_id: string
          p_client_id: string
          p_quiz_id: string | null
          p_quiz_data: Json
          p_questions_data: Json
        }
        Returns: string
      }
      verify_client_admin_login: {
        Args: { p_email: string; p_password: string }
        Returns: {
          admin_id: string
          admin_client_id: string
          admin_email: string
          admin_role: string
          client_name: string
          client_slug: string
        }[]
      }
    }
    Enums: {
      admin_role: "super_admin" | "admin" | "moderator"
      quiz_status: "draft" | "published" | "expired"
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
      admin_role: ["super_admin", "admin", "moderator"],
      quiz_status: ["draft", "published", "expired"],
    },
  },
} as const
