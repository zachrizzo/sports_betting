export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          balance: number
          total_winnings: number
          total_losses: number
          total_bets: number
          won_bets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          balance?: number
          total_winnings?: number
          total_losses?: number
          total_bets?: number
          won_bets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          balance?: number
          total_winnings?: number
          total_losses?: number
          total_bets?: number
          won_bets?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_bets: {
        Row: {
          id: string
          user_id: string
          game_id: string
          player_id: string | null
          bet_type: string
          description: string
          amount: number
          odds: string
          potential_payout: number
          status: string
          settled_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          player_id?: string | null
          bet_type: string
          description: string
          amount: number
          odds: string
          potential_payout: number
          status?: string
          settled_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          player_id?: string | null
          bet_type?: string
          description?: string
          amount?: number
          odds?: string
          potential_payout?: number
          status?: string
          settled_amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
      user_simulations: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          parameters: Json
          results: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          parameters: Json
          results: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          parameters?: Json
          results?: Json
          created_at?: string
          updated_at?: string
        }
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
  }
}
