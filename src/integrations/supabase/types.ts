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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      killswitch: {
        Row: {
          created_at: string
          id: string
          is_killed: boolean
          killed_at: string | null
          site_name: string
          site_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_killed?: boolean
          killed_at?: string | null
          site_name: string
          site_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_killed?: boolean
          killed_at?: string | null
          site_name?: string
          site_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyc_requests: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          address: string | null
          annual_income: string | null
          annual_turnover: string | null
          board_resolution_url: string | null
          business_address: string | null
          business_nature: string | null
          cac_certificate_url: string | null
          chn: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          employment_status: string | null
          full_name: string | null
          id: string
          id_document_url: string | null
          incorporation_date: string | null
          phone: string | null
          registration_number: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          selfie_url: string | null
          signatory_name: string | null
          state: string | null
          status: Database["public"]["Enums"]["kyc_status"] | null
          submitted_at: string | null
          tax_clearance_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          address?: string | null
          annual_income?: string | null
          annual_turnover?: string | null
          board_resolution_url?: string | null
          business_address?: string | null
          business_nature?: string | null
          cac_certificate_url?: string | null
          chn?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          employment_status?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          incorporation_date?: string | null
          phone?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          signatory_name?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          submitted_at?: string | null
          tax_clearance_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          address?: string | null
          annual_income?: string | null
          annual_turnover?: string | null
          board_resolution_url?: string | null
          business_address?: string | null
          business_nature?: string | null
          cac_certificate_url?: string | null
          chn?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          employment_status?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          incorporation_date?: string | null
          phone?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          signatory_name?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          submitted_at?: string | null
          tax_clearance_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          average_price: number
          company_name: string
          created_at: string | null
          id: string
          shares: number
          symbol: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_price: number
          company_name: string
          created_at?: string | null
          id?: string
          shares?: number
          symbol: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_price?: number
          company_name?: string
          created_at?: string | null
          id?: string
          shares?: number
          symbol?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_tutorial_completed: boolean | null
          balance: number | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_routing_number: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          tutorial_completed: boolean | null
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          admin_tutorial_completed?: boolean | null
          balance?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          tutorial_completed?: boolean | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          admin_tutorial_completed?: boolean | null
          balance?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          tutorial_completed?: boolean | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: []
      }
      tamg_holdings: {
        Row: {
          average_price: number
          created_at: string
          id: string
          shares: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_price?: number
          created_at?: string
          id?: string
          shares?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_price?: number
          created_at?: string
          id?: string
          shares?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          company_name: string
          created_at: string | null
          fee: number | null
          id: string
          price_per_share: number
          shares: number
          symbol: string
          total_amount: number
          trade_type: Database["public"]["Enums"]["trade_type"]
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          fee?: number | null
          id?: string
          price_per_share: number
          shares: number
          symbol: string
          total_amount: number
          trade_type: Database["public"]["Enums"]["trade_type"]
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          fee?: number | null
          id?: string
          price_per_share?: number
          shares?: number
          symbol?: string
          total_amount?: number
          trade_type?: Database["public"]["Enums"]["trade_type"]
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          notes: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          notes?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          address: string
          balance: number | null
          created_at: string
          currency: string
          id: string
          user_id: string
        }
        Insert: {
          address: string
          balance?: number | null
          created_at?: string
          currency: string
          id?: string
          user_id: string
        }
        Update: {
          address?: string
          balance?: number | null
          created_at?: string
          currency?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          crypto_type: string | null
          from_tamic_wallet: boolean | null
          id: string
          method: string
          status: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          crypto_type?: string | null
          from_tamic_wallet?: boolean | null
          id?: string
          method: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          crypto_type?: string | null
          from_tamic_wallet?: boolean | null
          id?: string
          method?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "individual" | "corporate"
      app_role: "admin" | "user"
      kyc_status: "not_started" | "pending" | "approved" | "rejected"
      trade_type: "buy" | "sell"
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
      account_type: ["individual", "corporate"],
      app_role: ["admin", "user"],
      kyc_status: ["not_started", "pending", "approved", "rejected"],
      trade_type: ["buy", "sell"],
    },
  },
} as const
