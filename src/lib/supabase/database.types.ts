export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      families: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          kid_limit: number
          name: string
          passcode_hash: string | null
          plan: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          kid_limit?: number
          name?: string
          passcode_hash?: string | null
          plan?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          kid_limit?: number
          name?: string
          passcode_hash?: string | null
          plan?: string
          status?: string
        }
        Relationships: []
      }
      kids: {
        Row: {
          age: number | null
          avatar: string
          created_at: string
          family_id: string
          id: string
          name: string
          points: number
        }
        Insert: {
          age?: number | null
          avatar?: string
          created_at?: string
          family_id: string
          id?: string
          name: string
          points?: number
        }
        Update: {
          age?: number | null
          avatar?: string
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "kids_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          family_id: string | null
          full_name: string | null
          id: string
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          family_id: string
          id: string
          invoice_id: number
          paid_at: string | null
          payment_id: string | null
          reference: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          family_id: string
          id?: string
          invoice_id: number
          paid_at?: string | null
          payment_id?: string | null
          reference: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          family_id?: string
          id?: string
          invoice_id?: number
          paid_at?: string | null
          payment_id?: string | null
          reference?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          id: string
          kid_id: string
          points_spent: number
          redeemed_at: string
          reward_id: string
        }
        Insert: {
          id?: string
          kid_id: string
          points_spent: number
          redeemed_at?: string
          reward_id: string
        }
        Update: {
          id?: string
          kid_id?: string
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          family_id: string
          icon: string
          id: string
          name: string
          points_cost: number
        }
        Insert: {
          created_at?: string
          family_id: string
          icon?: string
          id?: string
          name: string
          points_cost: number
        }
        Update: {
          created_at?: string
          family_id?: string
          icon?: string
          id?: string
          name?: string
          points_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          kid_id: string
          occurrence_date: string
          points_awarded: number
          returned_at: string | null
          returned_by: string | null
          status: string
          task_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          kid_id: string
          occurrence_date?: string
          points_awarded: number
          returned_at?: string | null
          returned_by?: string | null
          status?: string
          task_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          kid_id?: string
          occurrence_date?: string
          points_awarded?: number
          returned_at?: string | null
          returned_by?: string | null
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_kids: {
        Row: {
          kid_id: string
          task_id: string
        }
        Insert: {
          kid_id: string
          task_id: string
        }
        Update: {
          kid_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_kids_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_kids_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          family_id: string
          icon: string
          id: string
          name: string
          points: number
          recurrence: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          family_id: string
          icon?: string
          id?: string
          name: string
          points?: number
          recurrence?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          family_id?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          recurrence?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_task: {
        Args: {
          p_kid_id: string
          p_occurrence_date?: string
          p_task_id: string
        }
        Returns: undefined
      }
      create_family_and_join: {
        Args: { p_family_name: string; p_full_name: string }
        Returns: string
      }
      current_family_id: { Args: Record<PropertyKey, never>; Returns: string }
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      join_family_with_code: {
        Args: { p_full_name: string; p_invite_code: string }
        Returns: string
      }
      redeem_reward: {
        Args: { p_kid_id: string; p_reward_id: string }
        Returns: undefined
      }
      return_task_completion: {
        Args: { p_completion_id: string }
        Returns: undefined
      }
      set_family_passcode: { Args: { p_passcode: string }; Returns: undefined }
      verify_family_passcode: { Args: { p_passcode: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
