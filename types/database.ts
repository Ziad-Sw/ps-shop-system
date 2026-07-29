export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "staff";

export type StationType = "playstation" | "billiard" | "pingpong";

export type PricingMode = "single" | "multi";

export type PricingUnit = "hour" | "game";

export type PlayType = "normal" | "combo";

export type PlaySubtype = "single" | "multi" | "triple" | "quad";

export type BillingMode = "time" | "games";

export type SessionStatus = "active" | "completed";

export type ShiftStatus = "open" | "closed";

export interface StaffPermissions {
  manage_sessions: boolean;
  manage_shifts: boolean;
  record_sales: boolean;
  manage_settings: boolean;
  manage_team: boolean;
}

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          name: string;
          owner_name: string | null;
          logo_url: string | null;
          ps_enabled: boolean;
          billiard_enabled: boolean;
          pingpong_enabled: boolean;
          shifts_per_day: number;
          ps_station_count: number;
          billiard_table_count: number;
          pingpong_table_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_name?: string | null;
          logo_url?: string | null;
          ps_enabled?: boolean;
          billiard_enabled?: boolean;
          pingpong_enabled?: boolean;
          shifts_per_day?: number;
          ps_station_count?: number;
          billiard_table_count?: number;
          pingpong_table_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_name?: string | null;
          logo_url?: string | null;
          ps_enabled?: boolean;
          billiard_enabled?: boolean;
          pingpong_enabled?: boolean;
          shifts_per_day?: number;
          ps_station_count?: number;
          billiard_table_count?: number;
          pingpong_table_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          shop_id: string;
          login_id: string;
          display_name: string;
          role: UserRole;
          permissions: StaffPermissions;
          email: string | null;
          is_active: boolean;
          deactivated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          login_id: string;
          display_name: string;
          role: UserRole;
          permissions?: StaffPermissions;
          email?: string | null;
          is_active?: boolean;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          login_id?: string;
          display_name?: string;
          role?: UserRole;
          permissions?: StaffPermissions;
          email?: string | null;
          is_active?: boolean;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      stations: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          station_type: StationType;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          station_type: StationType;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          station_type?: StationType;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stations_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_rules: {
        Row: {
          id: string;
          shop_id: string;
          station_type: StationType;
          mode: PricingMode;
          unit: PricingUnit;
          rate: number;
          play_type: PlayType;
          play_subtype: PlaySubtype;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          station_type: StationType;
          mode: PricingMode;
          unit: PricingUnit;
          rate: number;
          play_type: PlayType;
          play_subtype: PlaySubtype;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          station_type?: StationType;
          mode?: PricingMode;
          unit?: PricingUnit;
          rate?: number;
          play_type?: PlayType;
          play_subtype?: PlaySubtype;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_rules_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shifts: {
        Row: {
          id: string;
          shop_id: string;
          responsible_name: string;
          opened_by_user_id: string | null;
          shift_number: number;
          status: ShiftStatus;
          opened_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          responsible_name: string;
          opened_by_user_id?: string | null;
          shift_number: number;
          status?: ShiftStatus;
          opened_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          responsible_name?: string;
          opened_by_user_id?: string | null;
          shift_number?: number;
          status?: ShiftStatus;
          opened_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_opened_by_user_id_fkey";
            columns: ["opened_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          shop_id: string;
          shift_id: string;
          station_id: string;
          mode: PricingMode;
          billing_mode: BillingMode;
          status: SessionStatus;
          start_time: string;
          end_time: string | null;
          games_count: number | null;
          calculated_cost: number | null;
          duration_hours: number | null;
          play_type: PlayType | null;
          play_subtype: PlaySubtype | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          shift_id: string;
          station_id: string;
          mode: PricingMode;
          billing_mode: BillingMode;
          status?: SessionStatus;
          start_time?: string;
          end_time?: string | null;
          games_count?: number | null;
          calculated_cost?: number | null;
          duration_hours?: number | null;
          play_type?: PlayType | null;
          play_subtype?: PlaySubtype | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          shift_id?: string;
          station_id?: string;
          mode?: PricingMode;
          billing_mode?: BillingMode;
          status?: SessionStatus;
          start_time?: string;
          end_time?: string | null;
          games_count?: number | null;
          calculated_cost?: number | null;
          duration_hours?: number | null;
          play_type?: PlayType | null;
          play_subtype?: PlaySubtype | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
        ];
      };
      billiard_game_entries: {
        Row: {
          id: string;
          shop_id: string;
          session_id: string;
          play_type: PlayType;
          play_subtype: PlaySubtype;
          games_count: number;
          price_per_game: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          session_id: string;
          play_type: PlayType;
          play_subtype: PlaySubtype;
          games_count: number;
          price_per_game: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          session_id?: string;
          play_type?: PlayType;
          play_subtype?: PlaySubtype;
          games_count?: number;
          price_per_game?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billiard_game_entries_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billiard_game_entries_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      station_game_entries: {
        Row: {
          id: string;
          shop_id: string;
          session_id: string;
          mode: PricingMode;
          games_count: number;
          price_per_game: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          session_id: string;
          mode: PricingMode;
          games_count: number;
          price_per_game: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          session_id?: string;
          mode?: PricingMode;
          games_count?: number;
          price_per_game?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "station_game_entries_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "station_game_entries_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          id: string;
          shop_id: string;
          shift_id: string;
          session_id: string | null;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          shift_id: string;
          session_id?: string | null;
          product_id: string;
          quantity?: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          shift_id?: string;
          session_id?: string | null;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          shop_id: string;
          shift_id: string | null;
          description: string;
          amount: number;
          category: string | null;
          expense_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          shift_id?: string | null;
          description: string;
          amount: number;
          category?: string | null;
          expense_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          shift_id?: string | null;
          description?: string;
          amount?: number;
          category?: string | null;
          expense_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Shop = Database["public"]["Tables"]["shops"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Station = Database["public"]["Tables"]["stations"]["Row"];
export type PricingRule = Database["public"]["Tables"]["pricing_rules"]["Row"];
export type Shift = Database["public"]["Tables"]["shifts"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type BilliardGameEntry = Database["public"]["Tables"]["billiard_game_entries"]["Row"];
export type StationGameEntry = Database["public"]["Tables"]["station_game_entries"]["Row"];

export const OWNER_PERMISSIONS: StaffPermissions = {
  manage_sessions: true,
  manage_shifts: true,
  record_sales: true,
  manage_settings: true,
  manage_team: true,
};

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  manage_sessions: true,
  manage_shifts: true,
  record_sales: true,
  manage_settings: false,
  manage_team: false,
};
