export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string
          primary_calendar_id: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by: string
          primary_calendar_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string
          primary_calendar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          email?: string
          role: "parent" | "child" | "other"
          created_at: string
          color: string | null
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role: "parent" | "child" | "other"
          created_at?: string
          color?: string | null
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          role?: "parent" | "child" | "other"
          created_at?: string
          color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      todos: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: "low" | "medium" | "high"
          status: "pending" | "in_progress" | "completed"
          assigned_to: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: "low" | "medium" | "high"
          status?: "pending" | "in_progress" | "completed"
          assigned_to?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: "low" | "medium" | "high"
          status?: "pending" | "in_progress" | "completed"
          assigned_to?: string | null
          created_at?: string
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_family_id_fkey"
            columns: ["family_id"]
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      chores: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          frequency: "daily" | "weekly" | "monthly"
          assigned_to: string | null
          rotation: boolean
          rotation_members: string[] | null
          current_assignee_index: number | null
          created_at: string
          created_by: string
          next_due: string | null
          last_completed: string | null
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string | null
          frequency: "daily" | "weekly" | "monthly"
          assigned_to?: string | null
          rotation?: boolean
          rotation_members?: string[] | null
          current_assignee_index?: number | null
          created_at?: string
          created_by: string
          next_due?: string | null
          last_completed?: string | null
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          description?: string | null
          frequency?: "daily" | "weekly" | "monthly"
          assigned_to?: string | null
          rotation?: boolean
          rotation_members?: string[] | null
          current_assignee_index?: number | null
          created_at?: string
          created_by?: string
          next_due?: string | null
          last_completed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_family_id_fkey"
            columns: ["family_id"]
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          family_id: string
          email: string
          role: "parent" | "child" | "other"
          created_at: string
          expires_at: string
          accepted: boolean
        }
        Insert: {
          id?: string
          family_id: string
          email: string
          role: "parent" | "child" | "other"
          created_at?: string
          expires_at?: string
          accepted?: boolean
        }
        Update: {
          id?: string
          family_id?: string
          email?: string
          role?: "parent" | "child" | "other"
          created_at?: string
          expires_at?: string
          accepted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invitations_family_id_fkey"
            columns: ["family_id"]
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_history: {
        Row: {
          id: string
          family_id: string
          user_id: string
          message: string
          response: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          message: string
          response: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          message?: string
          response?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_family_id_fkey"
            columns: ["family_id"]
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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