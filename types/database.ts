export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          description?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          description?: string | null
          date?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          period: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          period: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          amount?: number
          period?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      group_expenses: {
        Row: {
          id: string
          group_id: string
          payer_id: string
          description: string | null
          amount: number
          currency: string
          date: string
          split_type: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          payer_id: string
          description?: string | null
          amount: number
          currency?: string
          date?: string
          split_type?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          payer_id?: string
          description?: string | null
          amount?: number
          currency?: string
          date?: string
          split_type?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
      }
      group_expense_shares: {
        Row: {
          expense_id: string
          member_id: string
          share_amount: number
        }
        Insert: {
          expense_id: string
          member_id: string
          share_amount: number
        }
        Update: {
          expense_id?: string
          member_id?: string
          share_amount?: number
        }
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          note?: string | null
          created_at?: string
        }
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
}

export type Expense = Database['public']['Tables']['expenses']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type GroupExpense = Database['public']['Tables']['group_expenses']['Row']
export type GroupExpenseShare = Database['public']['Tables']['group_expense_shares']['Row']
export type Settlement = Database['public']['Tables']['settlements']['Row']