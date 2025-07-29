export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          organization_id: string
          position: string
          purchase_influence: "High" | "Medium" | "Low" | "Unknown"
          decision_authority: "Decision Maker" | "Influencer" | "End User" | "Gatekeeper"
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          website: string | null
          account_manager: string | null
          notes: string | null
          is_primary: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          organization_id: string
          position: string
          purchase_influence: "High" | "Medium" | "Low" | "Unknown"
          decision_authority: "Decision Maker" | "Influencer" | "End User" | "Gatekeeper"
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          website?: string | null
          account_manager?: string | null
          notes?: string | null
          is_primary?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          organization_id?: string
          position?: string
          purchase_influence?: "High" | "Medium" | "Low" | "Unknown"
          decision_authority?: "Decision Maker" | "Influencer" | "End User" | "Gatekeeper"
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          website?: string | null
          account_manager?: string | null
          notes?: string | null
          is_primary?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_principals: {
        Row: {
          id: string
          contact_id: string
          principal_id: string
          advocacy_level: "High" | "Medium" | "Low"
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contact_id: string
          principal_id: string
          advocacy_level?: "High" | "Medium" | "Low"
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contact_id?: string
          principal_id?: string
          advocacy_level?: "High" | "Medium" | "Low"
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_principals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          legal_name: string | null
          description: string | null
          industry: string | null
          type: "B2B" | "B2C" | "B2B2C" | "Non-Profit" | "Government" | "Other" | null
          size: "Startup" | "Small" | "Medium" | "Large" | "Enterprise" | null
          status: "Active" | "Inactive" | "Prospect" | "Customer" | "Partner" | "Vendor" | null
          website: string | null
          email: string | null
          primary_phone: string | null
          secondary_phone: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state_province: string | null
          postal_code: string | null
          country: string | null
          founded_year: number | null
          employees_count: number | null
          annual_revenue: number | null
          currency_code: string | null
          lead_source: string | null
          lead_score: number | null
          tags: Json | null
          custom_fields: Json | null
          parent_org_id: string | null
          assigned_user_id: string | null
          last_contact_date: string | null
          next_follow_up_date: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          legal_name?: string | null
          description?: string | null
          industry?: string | null
          type?: "B2B" | "B2C" | "B2B2C" | "Non-Profit" | "Government" | "Other" | null
          size?: "Startup" | "Small" | "Medium" | "Large" | "Enterprise" | null
          status?: "Active" | "Inactive" | "Prospect" | "Customer" | "Partner" | "Vendor" | null
          website?: string | null
          email?: string | null
          primary_phone?: string | null
          secondary_phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state_province?: string | null
          postal_code?: string | null
          country?: string | null
          founded_year?: number | null
          employees_count?: number | null
          annual_revenue?: number | null
          currency_code?: string | null
          lead_source?: string | null
          lead_score?: number | null
          tags?: Json | null
          custom_fields?: Json | null
          parent_org_id?: string | null
          assigned_user_id?: string | null
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          legal_name?: string | null
          description?: string | null
          industry?: string | null
          type?: "B2B" | "B2C" | "B2B2C" | "Non-Profit" | "Government" | "Other" | null
          size?: "Startup" | "Small" | "Medium" | "Large" | "Enterprise" | null
          status?: "Active" | "Inactive" | "Prospect" | "Customer" | "Partner" | "Vendor" | null
          website?: string | null
          email?: string | null
          primary_phone?: string | null
          secondary_phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state_province?: string | null
          postal_code?: string | null
          country?: string | null
          founded_year?: number | null
          employees_count?: number | null
          annual_revenue?: number | null
          currency_code?: string | null
          lead_source?: string | null
          lead_score?: number | null
          tags?: Json | null
          custom_fields?: Json | null
          parent_org_id?: string | null
          assigned_user_id?: string | null
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_interactions: {
        Row: {
          id: string
          organization_id: string
          contact_id: string | null
          type: "Email" | "Phone" | "Meeting" | "Demo" | "Proposal" | "Contract" | "Note" | "Task" | "Event" | "Social" | "Website" | "Other" | null
          direction: "Inbound" | "Outbound" | null
          subject: string | null
          description: string | null
          interaction_date: string | null
          duration_minutes: number | null
          tags: Json | null
          metadata: Json | null
          created_by_user_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id?: string | null
          type?: "Email" | "Phone" | "Meeting" | "Demo" | "Proposal" | "Contract" | "Note" | "Task" | "Event" | "Social" | "Website" | "Other" | null
          direction?: "Inbound" | "Outbound" | null
          subject?: string | null
          description?: string | null
          interaction_date?: string | null
          duration_minutes?: number | null
          tags?: Json | null
          metadata?: Json | null
          created_by_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string | null
          type?: "Email" | "Phone" | "Meeting" | "Demo" | "Proposal" | "Contract" | "Note" | "Task" | "Event" | "Social" | "Website" | "Other" | null
          direction?: "Inbound" | "Outbound" | null
          subject?: string | null
          description?: string | null
          interaction_date?: string | null
          duration_minutes?: number | null
          tags?: Json | null
          metadata?: Json | null
          created_by_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_documents: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          file_type: string | null
          file_size_bytes: number | null
          storage_path: string | null
          external_url: string | null
          category: string | null
          tags: Json | null
          is_public: boolean | null
          access_level: string | null
          version: string | null
          parent_document_id: string | null
          uploaded_by_user_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          file_type?: string | null
          file_size_bytes?: number | null
          storage_path?: string | null
          external_url?: string | null
          category?: string | null
          tags?: Json | null
          is_public?: boolean | null
          access_level?: string | null
          version?: string | null
          parent_document_id?: string | null
          uploaded_by_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          file_type?: string | null
          file_size_bytes?: number | null
          storage_path?: string | null
          external_url?: string | null
          category?: string | null
          tags?: Json | null
          is_public?: boolean | null
          access_level?: string | null
          version?: string | null
          parent_document_id?: string | null
          uploaded_by_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "organization_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_analytics: {
        Row: {
          id: string
          organization_id: string
          period_start: string | null
          period_end: string | null
          period_type: string | null
          total_interactions: number | null
          email_interactions: number | null
          phone_interactions: number | null
          meeting_interactions: number | null
          revenue_generated: number | null
          deals_closed: number | null
          deals_in_progress: number | null
          lead_score_change: number | null
          conversion_events: number | null
          documents_added: number | null
          documents_accessed: number | null
          new_contacts_added: number | null
          active_contacts: number | null
          custom_metrics: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          period_start: string | null
          period_end: string | null
          period_type: string | null
          total_interactions?: number | null
          email_interactions?: number | null
          phone_interactions?: number | null
          meeting_interactions?: number | null
          revenue_generated?: number | null
          deals_closed?: number | null
          deals_in_progress?: number | null
          lead_score_change?: number | null
          conversion_events?: number | null
          documents_added?: number | null
          documents_accessed?: number | null
          new_contacts_added?: number | null
          active_contacts?: number | null
          custom_metrics?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          period_start?: string | null
          period_end?: string | null
          period_type?: string | null
          total_interactions?: number | null
          email_interactions?: number | null
          phone_interactions?: number | null
          meeting_interactions?: number | null
          revenue_generated?: number | null
          deals_closed?: number | null
          deals_in_progress?: number | null
          lead_score_change?: number | null
          conversion_events?: number | null
          documents_added?: number | null
          documents_accessed?: number | null
          new_contacts_added?: number | null
          active_contacts?: number | null
          custom_metrics?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      user_submissions: {
        Row: {
          age: number
          created_at: string | null
          favorite_color: string
          first_name: string
          id: number
          last_name: string
          updated_at: string | null
        }
        Insert: {
          age: number
          created_at?: string | null
          favorite_color: string
          first_name: string
          id?: number
          last_name: string
          updated_at?: string | null
        }
        Update: {
          age?: number
          created_at?: string | null
          favorite_color?: string
          first_name?: string
          id?: number
          last_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          id: number
          user_id: string
          widget_layout: Json
          visible_widgets: Json
          dashboard_theme: string
          refresh_interval: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          widget_layout?: Json
          visible_widgets?: Json
          dashboard_theme?: string
          refresh_interval?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          widget_layout?: Json
          visible_widgets?: Json
          dashboard_theme?: string
          refresh_interval?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_contact_analytics: {
        Row: {
          total_contacts: number | null
          contacts_this_week: number | null
          contacts_this_month: number | null
          unique_organizations: number | null
          day_of_week: number | null
          contact_date: string | null
          daily_contact_count: number | null
        }
        Relationships: []
      }
      dashboard_organization_analytics: {
        Row: {
          organization: string | null
          contact_count: number | null
          first_contact_date: string | null
          latest_contact_date: string | null
          avg_days_since_contact: number | null
        }
        Relationships: []
      }
      organization_summary_analytics: {
        Row: {
          id: string | null
          name: string | null
          status: "Active" | "Inactive" | "Prospect" | "Customer" | "Partner" | "Vendor" | null
          industry: string | null
          lead_score: number | null
          total_interactions: number | null
          contact_count: number | null
          document_count: number | null
          last_interaction_date: string | null
          next_follow_up_date: string | null
          engagement_status: string | null
        }
        Relationships: []
      }
      monthly_organization_performance: {
        Row: {
          organization_id: string | null
          organization_name: string | null
          month: string | null
          interaction_count: number | null
          interaction_types: number | null
          meetings: number | null
          emails: number | null
          calls: number | null
          avg_duration_minutes: number | null
        }
        Relationships: []
      }
      organization_lead_scoring: {
        Row: {
          id: string | null
          name: string | null
          lead_score: number | null
          status: "Active" | "Inactive" | "Prospect" | "Customer" | "Partner" | "Vendor" | null
          industry: string | null
          size: "Startup" | "Small" | "Medium" | "Large" | "Enterprise" | null
          total_interactions: number | null
          recent_interactions: number | null
          lead_temperature: string | null
          last_interaction: string | null
          document_count: number | null
        }
        Relationships: []
      }
      dashboard_weekly_interactions: {
        Row: {
          week_start: string | null
          interaction_count: number | null
          organizations_contacted: number | null
          unique_emails: number | null
          organizations_list: string[] | null
        }
        Relationships: []
      }
      contact_list_view: {
        Row: {
          id: string
          first_name: string
          last_name: string
          full_name: string
          organization_id: string
          organization_name: string
          organization_industry: string | null
          position: string
          purchase_influence: "High" | "Medium" | "Low" | "Unknown"
          decision_authority: "Decision Maker" | "Influencer" | "End User" | "Gatekeeper"
          phone: string | null
          email: string | null
          is_primary: boolean | null
          created_at: string | null
          updated_at: string | null
          principal_advocacy_count: number | null
          organization_contact_count: number | null
        }
        Relationships: []
      }
      contact_detail_view: {
        Row: {
          id: string
          first_name: string
          last_name: string
          full_name: string
          organization_id: string
          position: string
          purchase_influence: "High" | "Medium" | "Low" | "Unknown"
          decision_authority: "Decision Maker" | "Influencer" | "End User" | "Gatekeeper"
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          website: string | null
          account_manager: string | null
          notes: string | null
          is_primary: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          organization_name: string
          organization_industry: string | null
          organization_type: "B2B" | "B2C" | "B2B2C" | "Non-Profit" | "Government" | "Other" | null
          organization_website: string | null
          principal_advocacies: Json | null
        }
        Relationships: []
      }
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

// Helper types for the application
export type UserSubmission = Database['public']['Tables']['user_submissions']['Row']
export type UserSubmissionInsert = Database['public']['Tables']['user_submissions']['Insert']
export type UserSubmissionUpdate = Database['public']['Tables']['user_submissions']['Update']

// Contact entity types
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

// Organization entity types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

// Organization interaction types
export type OrganizationInteraction = Database['public']['Tables']['organization_interactions']['Row']
export type OrganizationInteractionInsert = Database['public']['Tables']['organization_interactions']['Insert']
export type OrganizationInteractionUpdate = Database['public']['Tables']['organization_interactions']['Update']

// Organization document types
export type OrganizationDocument = Database['public']['Tables']['organization_documents']['Row']
export type OrganizationDocumentInsert = Database['public']['Tables']['organization_documents']['Insert']
export type OrganizationDocumentUpdate = Database['public']['Tables']['organization_documents']['Update']

// Organization analytics types
export type OrganizationAnalytics = Database['public']['Tables']['organization_analytics']['Row']
export type OrganizationAnalyticsInsert = Database['public']['Tables']['organization_analytics']['Insert']
export type OrganizationAnalyticsUpdate = Database['public']['Tables']['organization_analytics']['Update']

// Organization view types
export type OrganizationSummaryAnalytics = Database['public']['Views']['organization_summary_analytics']['Row']
export type MonthlyOrganizationPerformance = Database['public']['Views']['monthly_organization_performance']['Row']
export type OrganizationLeadScoring = Database['public']['Views']['organization_lead_scoring']['Row']

// Contact Principal types
export type ContactPrincipal = Database['public']['Tables']['contact_principals']['Row']
export type ContactPrincipalInsert = Database['public']['Tables']['contact_principals']['Insert']
export type ContactPrincipalUpdate = Database['public']['Tables']['contact_principals']['Update']

// Contact view types
export type ContactListView = Database['public']['Views']['contact_list_view']['Row']
export type ContactDetailView = Database['public']['Views']['contact_detail_view']['Row']

// Contact enum types
export type PurchaseInfluence = 'High' | 'Medium' | 'Low' | 'Unknown'
export type DecisionAuthority = 'Decision Maker' | 'Influencer' | 'End User' | 'Gatekeeper'
export type AdvocacyLevel = 'High' | 'Medium' | 'Low'

// Organization enum types
export type OrganizationType = 'B2B' | 'B2C' | 'B2B2C' | 'Non-Profit' | 'Government' | 'Other'
export type OrganizationSize = 'Startup' | 'Small' | 'Medium' | 'Large' | 'Enterprise'
export type OrganizationStatus = 'Active' | 'Inactive' | 'Prospect' | 'Customer' | 'Partner' | 'Vendor'
export type InteractionType = 'Email' | 'Phone' | 'Meeting' | 'Demo' | 'Proposal' | 'Contract' | 'Note' | 'Task' | 'Event' | 'Social' | 'Website' | 'Other'
export type InteractionDirection = 'Inbound' | 'Outbound'