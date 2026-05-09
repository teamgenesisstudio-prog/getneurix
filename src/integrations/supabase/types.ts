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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      distillation_datasets: {
        Row: {
          auto_capture: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          pair_count: number
          source_model: string
          status: string
          target_model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_capture?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pair_count?: number
          source_model?: string
          status?: string
          target_model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_capture?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pair_count?: number
          source_model?: string
          status?: string
          target_model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      distillation_jobs: {
        Row: {
          base_model: string
          completed_at: string | null
          created_at: string
          dataset_id: string
          epochs: number | null
          error_message: string | null
          fine_tuned_endpoint: string | null
          fine_tuned_model_id: string | null
          id: string
          learning_rate_multiplier: number | null
          provider: string
          provider_job_id: string | null
          started_at: string | null
          status: string
          training_cost_usd: number | null
          user_id: string
        }
        Insert: {
          base_model: string
          completed_at?: string | null
          created_at?: string
          dataset_id: string
          epochs?: number | null
          error_message?: string | null
          fine_tuned_endpoint?: string | null
          fine_tuned_model_id?: string | null
          id?: string
          learning_rate_multiplier?: number | null
          provider: string
          provider_job_id?: string | null
          started_at?: string | null
          status?: string
          training_cost_usd?: number | null
          user_id: string
        }
        Update: {
          base_model?: string
          completed_at?: string | null
          created_at?: string
          dataset_id?: string
          epochs?: number | null
          error_message?: string | null
          fine_tuned_endpoint?: string | null
          fine_tuned_model_id?: string | null
          id?: string
          learning_rate_multiplier?: number | null
          provider?: string
          provider_job_id?: string | null
          started_at?: string | null
          status?: string
          training_cost_usd?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distillation_jobs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "distillation_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      distillation_pairs: {
        Row: {
          category: string | null
          created_at: string
          dataset_id: string
          id: string
          prompt: string
          quality_score: number | null
          response: string
          system_prompt: string | null
          token_count_input: number | null
          token_count_output: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          dataset_id: string
          id?: string
          prompt: string
          quality_score?: number | null
          response: string
          system_prompt?: string | null
          token_count_input?: number | null
          token_count_output?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          dataset_id?: string
          id?: string
          prompt?: string
          quality_score?: number | null
          response?: string
          system_prompt?: string | null
          token_count_input?: number | null
          token_count_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_pairs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "distillation_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      distillation_routes: {
        Row: {
          active: boolean
          confidence_threshold: number
          cost_saved_usd: number
          created_at: string
          distilled_endpoint: string | null
          distilled_model: string
          id: string
          provider: string
          requests_escalated: number
          requests_routed: number
          source_model: string
          user_id: string
        }
        Insert: {
          active?: boolean
          confidence_threshold?: number
          cost_saved_usd?: number
          created_at?: string
          distilled_endpoint?: string | null
          distilled_model: string
          id?: string
          provider: string
          requests_escalated?: number
          requests_routed?: number
          source_model: string
          user_id: string
        }
        Update: {
          active?: boolean
          confidence_threshold?: number
          cost_saved_usd?: number
          created_at?: string
          distilled_endpoint?: string | null
          distilled_model?: string
          id?: string
          provider?: string
          requests_escalated?: number
          requests_routed?: number
          source_model?: string
          user_id?: string
        }
        Relationships: []
      }
      forensic_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          model: string | null
          prompt_excerpt: string | null
          response_excerpt: string | null
          session_id: string
          severity: string
          tokens: number | null
          user_label: string | null
          violation_clause: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_excerpt?: string | null
          response_excerpt?: string | null
          session_id: string
          severity?: string
          tokens?: number | null
          user_label?: string | null
          violation_clause?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_excerpt?: string | null
          response_excerpt?: string | null
          session_id?: string
          severity?: string
          tokens?: number | null
          user_label?: string | null
          violation_clause?: string | null
        }
        Relationships: []
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
