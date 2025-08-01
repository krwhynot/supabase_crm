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
      opportunities: {
        Row: {
          id: string
          name: string
          organization_id: string
          principal_id: string | null
          stage: "New Lead" | "Initial Outreach" | "Sample/Visit Offered" | "Awaiting Response" | "Feedback Logged" | "Demo Scheduled" | "Closed - Won"
          product_id: string | null
          context: "Site Visit" | "Food Show" | "New Product Interest" | "Follow-up" | "Demo Request" | "Sampling" | "Custom" | null
          probability_percent: number
          expected_close_date: string | null
          estimated_value: number | null
          actual_value: number | null
          currency_code: string
          deal_owner: string | null
          lead_source: string | null
          competitor_info: string | null
          is_won: boolean
          is_lost: boolean
          lost_reason: string | null
          won_date: string | null
          lost_date: string | null
          notes: string | null
          internal_notes: string | null
          tags: Json | null
          custom_fields: Json | null
          auto_generated_name: boolean
          name_template: string | null
          last_activity_date: string | null
          next_follow_up_date: string | null
          stage_changed_at: string | null
          stage_changed_by: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          principal_id?: string | null
          stage?: "New Lead" | "Initial Outreach" | "Sample/Visit Offered" | "Awaiting Response" | "Feedback Logged" | "Demo Scheduled" | "Closed - Won"
          product_id?: string | null
          context?: "Site Visit" | "Food Show" | "New Product Interest" | "Follow-up" | "Demo Request" | "Sampling" | "Custom" | null
          probability_percent?: number
          expected_close_date?: string | null
          estimated_value?: number | null
          actual_value?: number | null
          currency_code?: string
          deal_owner?: string | null
          lead_source?: string | null
          competitor_info?: string | null
          is_won?: boolean
          is_lost?: boolean
          lost_reason?: string | null
          won_date?: string | null
          lost_date?: string | null
          notes?: string | null
          internal_notes?: string | null
          tags?: Json | null
          custom_fields?: Json | null
          auto_generated_name?: boolean
          name_template?: string | null
          last_activity_date?: string | null
          next_follow_up_date?: string | null
          stage_changed_at?: string | null
          stage_changed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          principal_id?: string | null
          stage?: "New Lead" | "Initial Outreach" | "Sample/Visit Offered" | "Awaiting Response" | "Feedback Logged" | "Demo Scheduled" | "Closed - Won"
          product_id?: string | null
          context?: "Site Visit" | "Food Show" | "New Product Interest" | "Follow-up" | "Demo Request" | "Sampling" | "Custom" | null
          probability_percent?: number
          expected_close_date?: string | null
          estimated_value?: number | null
          actual_value?: number | null
          currency_code?: string
          deal_owner?: string | null
          lead_source?: string | null
          competitor_info?: string | null
          is_won?: boolean
          is_lost?: boolean
          lost_reason?: string | null
          won_date?: string | null
          lost_date?: string | null
          notes?: string | null
          internal_notes?: string | null
          tags?: Json | null
          custom_fields?: Json | null
          auto_generated_name?: boolean
          name_template?: string | null
          last_activity_date?: string | null
          next_follow_up_date?: string | null
          stage_changed_at?: string | null
          stage_changed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: "Protein" | "Sauce" | "Seasoning" | "Beverage" | "Snack" | "Frozen" | "Dairy" | "Bakery" | "Other" | null
          sku: string | null
          unit_size: string | null
          unit_cost: number | null
          suggested_retail_price: number | null
          currency_code: string
          is_active: boolean
          launch_date: string | null
          discontinue_date: string | null
          ingredients: string | null
          allergen_info: string | null
          nutritional_info: Json | null
          certifications: Json | null
          tags: Json | null
          custom_fields: Json | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: "Protein" | "Sauce" | "Seasoning" | "Beverage" | "Snack" | "Frozen" | "Dairy" | "Bakery" | "Other" | null
          sku?: string | null
          unit_size?: string | null
          unit_cost?: number | null
          suggested_retail_price?: number | null
          currency_code?: string
          is_active?: boolean
          launch_date?: string | null
          discontinue_date?: string | null
          ingredients?: string | null
          allergen_info?: string | null
          nutritional_info?: Json | null
          certifications?: Json | null
          tags?: Json | null
          custom_fields?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: "Protein" | "Sauce" | "Seasoning" | "Beverage" | "Snack" | "Frozen" | "Dairy" | "Bakery" | "Other" | null
          sku?: string | null
          unit_size?: string | null
          unit_cost?: number | null
          suggested_retail_price?: number | null
          currency_code?: string
          is_active?: boolean
          launch_date?: string | null
          discontinue_date?: string | null
          ingredients?: string | null
          allergen_info?: string | null
          nutritional_info?: Json | null
          certifications?: Json | null
          tags?: Json | null
          custom_fields?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      product_principals: {
        Row: {
          id: string
          product_id: string
          principal_id: string
          is_primary_principal: boolean
          exclusive_rights: boolean
          territory_restrictions: Json | null
          wholesale_price: number | null
          minimum_order_quantity: number | null
          lead_time_days: number | null
          contract_start_date: string | null
          contract_end_date: string | null
          auto_renewal: boolean
          is_active: boolean
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          principal_id: string
          is_primary_principal?: boolean
          exclusive_rights?: boolean
          territory_restrictions?: Json | null
          wholesale_price?: number | null
          minimum_order_quantity?: number | null
          lead_time_days?: number | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          auto_renewal?: boolean
          is_active?: boolean
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          principal_id?: string
          is_primary_principal?: boolean
          exclusive_rights?: boolean
          territory_restrictions?: Json | null
          wholesale_price?: number | null
          minimum_order_quantity?: number | null
          lead_time_days?: number | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          auto_renewal?: boolean
          is_active?: boolean
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_principals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      opportunity_principals: {
        Row: {
          id: string
          opportunity_id: string
          principal_id: string
          is_primary: boolean
          contribution_percent: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          principal_id: string
          is_primary?: boolean
          contribution_percent?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          principal_id?: string
          is_primary?: boolean
          contribution_percent?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_principals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
      opportunity_list_view: {
        Row: {
          id: string
          name: string
          stage: "New Lead" | "Initial Outreach" | "Sample/Visit Offered" | "Awaiting Response" | "Feedback Logged" | "Demo Scheduled" | "Closed - Won"
          context: "Site Visit" | "Food Show" | "New Product Interest" | "Follow-up" | "Demo Request" | "Sampling" | "Custom" | null
          probability_percent: number
          expected_close_date: string | null
          estimated_value: number | null
          actual_value: number | null
          currency_code: string
          is_won: boolean
          is_lost: boolean
          deal_owner: string | null
          auto_generated_name: boolean
          created_at: string | null
          updated_at: string | null
          stage_changed_at: string | null
          last_activity_date: string | null
          next_follow_up_date: string | null
          organization_id: string
          organization_name: string
          organization_type: string | null
          organization_status: string | null
          organization_city: string | null
          organization_state: string | null
          organization_country: string | null
          organization_lead_score: number | null
          principal_id: string | null
          principal_name: string | null
          principal_type: string | null
          product_id: string | null
          product_name: string | null
          product_category: string | null
          product_sku: string | null
          days_to_close: number | null
          days_to_followup: number | null
          notes_summary: string | null
          stage_order: number
          has_activity: boolean
          overdue_followup: boolean
          overdue_close: boolean
        }
        Relationships: []
      }
      opportunity_detail_view: {
        Row: {
          id: string
          name: string
          organization_id: string
          principal_id: string | null
          stage: "New Lead" | "Initial Outreach" | "Sample/Visit Offered" | "Awaiting Response" | "Feedback Logged" | "Demo Scheduled" | "Closed - Won"
          product_id: string | null
          context: "Site Visit" | "Food Show" | "New Product Interest" | "Follow-up" | "Demo Request" | "Sampling" | "Custom" | null
          probability_percent: number
          expected_close_date: string | null
          estimated_value: number | null
          actual_value: number | null
          currency_code: string
          deal_owner: string | null
          lead_source: string | null
          competitor_info: string | null
          is_won: boolean
          is_lost: boolean
          lost_reason: string | null
          won_date: string | null
          lost_date: string | null
          notes: string | null
          internal_notes: string | null
          tags: Json | null
          custom_fields: Json | null
          auto_generated_name: boolean
          name_template: string | null
          last_activity_date: string | null
          next_follow_up_date: string | null
          stage_changed_at: string | null
          stage_changed_by: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          organization_id_check: string | null
          organization_name: string | null
          organization_legal_name: string | null
          organization_type: string | null
          organization_size: string | null
          organization_status: string | null
          organization_industry: string | null
          organization_website: string | null
          organization_email: string | null
          organization_phone: string | null
          organization_address1: string | null
          organization_address2: string | null
          organization_city: string | null
          organization_state: string | null
          organization_postal_code: string | null
          organization_country: string | null
          organization_employees: number | null
          organization_revenue: number | null
          organization_lead_score: number | null
          organization_tags: Json | null
          principal_id_check: string | null
          principal_name: string | null
          principal_legal_name: string | null
          principal_type: string | null
          principal_size: string | null
          principal_industry: string | null
          principal_website: string | null
          principal_email: string | null
          principal_phone: string | null
          principal_is_principal_flag: boolean | null
          product_id_check: string | null
          product_name: string | null
          product_description: string | null
          product_category: string | null
          product_sku: string | null
          product_unit_size: string | null
          product_unit_cost: number | null
          product_suggested_price: number | null
          product_is_active: boolean | null
          product_launch_date: string | null
          product_ingredients: string | null
          product_allergen_info: string | null
          product_nutritional_info: Json | null
          product_certifications: Json | null
          product_tags: Json | null
          principal_wholesale_price: number | null
          principal_min_order_qty: number | null
          principal_lead_time: number | null
          is_primary_principal: boolean | null
          principal_exclusive_rights: boolean | null
          territory_restrictions: Json | null
          principal_contract_start: string | null
          principal_contract_end: string | null
          days_to_close: number | null
          days_to_followup: number | null
          stage_order: number
          has_activity: boolean
          overdue_followup: boolean
          overdue_close: boolean
          opportunity_age_days: number
          days_in_current_stage: number
          value_variance: number | null
        }
        Relationships: []
      }
      opportunity_kpi_view: {
        Row: {
          total_opportunities: number
          active_opportunities: number
          won_opportunities: number
          lost_opportunities: number
          won_this_month: number
          created_this_month: number
          total_pipeline_value: number
          avg_opportunity_value: number
          total_won_value: number
          won_value_this_month: number
          avg_probability: number
          weighted_pipeline_value: number
          new_lead_count: number
          initial_outreach_count: number
          sample_visit_count: number
          awaiting_response_count: number
          feedback_logged_count: number
          demo_scheduled_count: number
          closed_won_count: number
          overdue_opportunities: number
          overdue_followups: number
          win_rate_percent: number
          avg_days_to_close: number
        }
        Relationships: []
      }
      product_principal_availability_view: {
        Row: {
          product_id: string
          product_name: string
          product_category: "Protein" | "Sauce" | "Seasoning" | "Beverage" | "Snack" | "Frozen" | "Dairy" | "Bakery" | "Other" | null
          product_sku: string | null
          product_is_active: boolean
          principal_id: string
          principal_name: string
          wholesale_price: number | null
          minimum_order_quantity: number | null
          lead_time_days: number | null
          is_primary_principal: boolean
          exclusive_rights: boolean
          relationship_is_active: boolean
          is_available: boolean
          territory_restrictions: Json | null
          contract_start_date: string | null
          contract_end_date: string | null
          auto_renewal: boolean
          contract_is_active: boolean
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
export type AdvocacyLevel = 'High' | 'Medium' | 'Low'

// Organization enum types
export type OrganizationType = 'B2B' | 'B2C' | 'B2B2C' | 'Non-Profit' | 'Government' | 'Other'
export type OrganizationSize = 'Startup' | 'Small' | 'Medium' | 'Large' | 'Enterprise'
export type OrganizationStatus = 'Active' | 'Inactive' | 'Prospect' | 'Customer' | 'Partner' | 'Vendor'
export type InteractionType = 'Email' | 'Phone' | 'Meeting' | 'Demo' | 'Proposal' | 'Contract' | 'Note' | 'Task' | 'Event' | 'Social' | 'Website' | 'Other'
export type InteractionDirection = 'Inbound' | 'Outbound'

// Opportunity entity types
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
export type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']

// Opportunity principal types
export type OpportunityPrincipal = Database['public']['Tables']['opportunity_principals']['Row']
export type OpportunityPrincipalInsert = Database['public']['Tables']['opportunity_principals']['Insert']
export type OpportunityPrincipalUpdate = Database['public']['Tables']['opportunity_principals']['Update']

// Opportunity view types
export type OpportunityListView = Database['public']['Views']['opportunity_list_view']['Row']
export type OpportunityDetailView = Database['public']['Views']['opportunity_detail_view']['Row']
export type OpportunityKpiView = Database['public']['Views']['opportunity_kpi_view']['Row']

// Product entity types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

// Product-Principal relationship types
export type ProductPrincipal = Database['public']['Tables']['product_principals']['Row']
export type ProductPrincipalInsert = Database['public']['Tables']['product_principals']['Insert']
export type ProductPrincipalUpdate = Database['public']['Tables']['product_principals']['Update']

// Product view types
export type ProductPrincipalAvailabilityView = Database['public']['Views']['product_principal_availability_view']['Row']

// Opportunity enum types
export type OpportunityStage = 'New Lead' | 'Initial Outreach' | 'Sample/Visit Offered' | 'Awaiting Response' | 'Feedback Logged' | 'Demo Scheduled' | 'Closed - Won'
export type OpportunityContext = 'Site Visit' | 'Food Show' | 'New Product Interest' | 'Follow-up' | 'Demo Request' | 'Sampling' | 'Custom'

// Product enum types
export type ProductCategory = 'Protein' | 'Sauce' | 'Seasoning' | 'Beverage' | 'Snack' | 'Frozen' | 'Dairy' | 'Bakery' | 'Other'