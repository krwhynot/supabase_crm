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
      contact_principals: {
        Row: {
          advocacy_level: string | null
          contact_id: string
          created_at: string | null
          id: string
          notes: string | null
          principal_id: string
          updated_at: string | null
        }
        Insert: {
          advocacy_level?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          principal_id: string
          updated_at?: string | null
        }
        Update: {
          advocacy_level?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          principal_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_principals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_principals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_list_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_manager: string | null
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          position: string
          state: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          position: string
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position?: string
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      interactions: {
        Row: {
          attachments: Json | null
          contact_method: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          deleted_at: string | null
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          interaction_date: string
          location: string | null
          next_action: string | null
          notes: string | null
          opportunity_id: string
          outcome: Database["public"]["Enums"]["interaction_outcome"] | null
          participants: Json | null
          rating: number | null
          status: Database["public"]["Enums"]["interaction_status"] | null
          subject: string
          tags: Json | null
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          contact_method?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_date: string
          location?: string | null
          next_action?: string | null
          notes?: string | null
          opportunity_id: string
          outcome?: Database["public"]["Enums"]["interaction_outcome"] | null
          participants?: Json | null
          rating?: number | null
          status?: Database["public"]["Enums"]["interaction_status"] | null
          subject: string
          tags?: Json | null
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          contact_method?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_date?: string
          location?: string | null
          next_action?: string | null
          notes?: string | null
          opportunity_id?: string
          outcome?: Database["public"]["Enums"]["interaction_outcome"] | null
          participants?: Json | null
          rating?: number | null
          status?: Database["public"]["Enums"]["interaction_status"] | null
          subject?: string
          tags?: Json | null
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          actual_value: number | null
          auto_generated_name: boolean | null
          competitor_info: string | null
          context: Database["public"]["Enums"]["opportunity_context"] | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          custom_fields: Json | null
          deal_owner: string | null
          deleted_at: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          internal_notes: string | null
          is_lost: boolean | null
          is_won: boolean | null
          last_activity_date: string | null
          lead_source: string | null
          lost_date: string | null
          lost_reason: string | null
          name: string
          name_template: string | null
          next_follow_up_date: string | null
          notes: string | null
          organization_id: string
          principal_id: string | null
          probability_percent: number | null
          product_id: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          stage_changed_at: string | null
          stage_changed_by: string | null
          tags: Json | null
          updated_at: string | null
          won_date: string | null
        }
        Insert: {
          actual_value?: number | null
          auto_generated_name?: boolean | null
          competitor_info?: string | null
          context?: Database["public"]["Enums"]["opportunity_context"] | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          custom_fields?: Json | null
          deal_owner?: string | null
          deleted_at?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          internal_notes?: string | null
          is_lost?: boolean | null
          is_won?: boolean | null
          last_activity_date?: string | null
          lead_source?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          name: string
          name_template?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          organization_id: string
          principal_id?: string | null
          probability_percent?: number | null
          product_id?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_changed_at?: string | null
          stage_changed_by?: string | null
          tags?: Json | null
          updated_at?: string | null
          won_date?: string | null
        }
        Update: {
          actual_value?: number | null
          auto_generated_name?: boolean | null
          competitor_info?: string | null
          context?: Database["public"]["Enums"]["opportunity_context"] | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          custom_fields?: Json | null
          deal_owner?: string | null
          deleted_at?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          internal_notes?: string | null
          is_lost?: boolean | null
          is_won?: boolean | null
          last_activity_date?: string | null
          lead_source?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          name?: string
          name_template?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          organization_id?: string
          principal_id?: string | null
          probability_percent?: number | null
          product_id?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_changed_at?: string | null
          stage_changed_by?: string | null
          tags?: Json | null
          updated_at?: string | null
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
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
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_principals: {
        Row: {
          contribution_percent: number | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          opportunity_id: string
          principal_id: string
        }
        Insert: {
          contribution_percent?: number | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          opportunity_id: string
          principal_id: string
        }
        Update: {
          contribution_percent?: number | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          opportunity_id?: string
          principal_id?: string
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
            foreignKeyName: "opportunity_principals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      organization_analytics: {
        Row: {
          active_contacts: number | null
          conversion_events: number | null
          created_at: string | null
          custom_metrics: Json | null
          deals_closed: number | null
          deals_in_progress: number | null
          documents_accessed: number | null
          documents_added: number | null
          email_interactions: number | null
          id: string
          lead_score_change: number | null
          meeting_interactions: number | null
          new_contacts_added: number | null
          organization_id: string
          period_end: string
          period_start: string
          period_type: string
          phone_interactions: number | null
          revenue_generated: number | null
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          active_contacts?: number | null
          conversion_events?: number | null
          created_at?: string | null
          custom_metrics?: Json | null
          deals_closed?: number | null
          deals_in_progress?: number | null
          documents_accessed?: number | null
          documents_added?: number | null
          email_interactions?: number | null
          id?: string
          lead_score_change?: number | null
          meeting_interactions?: number | null
          new_contacts_added?: number | null
          organization_id: string
          period_end: string
          period_start: string
          period_type: string
          phone_interactions?: number | null
          revenue_generated?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          active_contacts?: number | null
          conversion_events?: number | null
          created_at?: string | null
          custom_metrics?: Json | null
          deals_closed?: number | null
          deals_in_progress?: number | null
          documents_accessed?: number | null
          documents_added?: number | null
          email_interactions?: number | null
          id?: string
          lead_score_change?: number | null
          meeting_interactions?: number | null
          new_contacts_added?: number | null
          organization_id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          phone_interactions?: number | null
          revenue_generated?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          access_level: string | null
          category: string | null
          created_at: string | null
          description: string | null
          external_url: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          name: string
          organization_id: string
          parent_document_id: string | null
          storage_path: string | null
          tags: Json | null
          updated_at: string | null
          uploaded_by_user_id: string | null
          version: string | null
        }
        Insert: {
          access_level?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          organization_id: string
          parent_document_id?: string | null
          storage_path?: string | null
          tags?: Json | null
          updated_at?: string | null
          uploaded_by_user_id?: string | null
          version?: string | null
        }
        Update: {
          access_level?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string
          parent_document_id?: string | null
          storage_path?: string | null
          tags?: Json | null
          updated_at?: string | null
          uploaded_by_user_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "organization_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_interactions: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          direction: Database["public"]["Enums"]["interaction_direction"] | null
          duration_minutes: number | null
          id: string
          interaction_date: string
          metadata: Json | null
          organization_id: string
          subject: string | null
          tags: Json | null
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          direction?:
            | Database["public"]["Enums"]["interaction_direction"]
            | null
          duration_minutes?: number | null
          id?: string
          interaction_date?: string
          metadata?: Json | null
          organization_id: string
          subject?: string | null
          tags?: Json | null
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          direction?:
            | Database["public"]["Enums"]["interaction_direction"]
            | null
          duration_minutes?: number | null
          id?: string
          interaction_date?: string
          metadata?: Json | null
          organization_id?: string
          subject?: string | null
          tags?: Json | null
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          annual_revenue: number | null
          assigned_user_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency_code: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          email: string | null
          employees_count: number | null
          founded_year: number | null
          id: string
          industry: string | null
          is_distributor: boolean
          is_principal: boolean
          last_contact_date: string | null
          lead_score: number | null
          lead_source: string | null
          legal_name: string | null
          name: string
          next_follow_up_date: string | null
          parent_org_id: string | null
          postal_code: string | null
          primary_phone: string | null
          secondary_phone: string | null
          size: Database["public"]["Enums"]["organization_size"] | null
          state_province: string | null
          status: Database["public"]["Enums"]["organization_status"] | null
          tags: Json | null
          type: Database["public"]["Enums"]["organization_type"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          annual_revenue?: number | null
          assigned_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency_code?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_distributor?: boolean
          is_principal?: boolean
          last_contact_date?: string | null
          lead_score?: number | null
          lead_source?: string | null
          legal_name?: string | null
          name: string
          next_follow_up_date?: string | null
          parent_org_id?: string | null
          postal_code?: string | null
          primary_phone?: string | null
          secondary_phone?: string | null
          size?: Database["public"]["Enums"]["organization_size"] | null
          state_province?: string | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          tags?: Json | null
          type?: Database["public"]["Enums"]["organization_type"] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          annual_revenue?: number | null
          assigned_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency_code?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          employees_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_distributor?: boolean
          is_principal?: boolean
          last_contact_date?: string | null
          lead_score?: number | null
          lead_source?: string | null
          legal_name?: string | null
          name?: string
          next_follow_up_date?: string | null
          parent_org_id?: string | null
          postal_code?: string | null
          primary_phone?: string | null
          secondary_phone?: string | null
          size?: Database["public"]["Enums"]["organization_size"] | null
          state_province?: string | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          tags?: Json | null
          type?: Database["public"]["Enums"]["organization_type"] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      product_principals: {
        Row: {
          auto_renewal: boolean | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          exclusive_rights: boolean | null
          id: string
          is_active: boolean | null
          is_primary_principal: boolean | null
          lead_time_days: number | null
          minimum_order_quantity: number | null
          notes: string | null
          principal_id: string
          product_id: string
          territory_restrictions: Json | null
          updated_at: string | null
          wholesale_price: number | null
        }
        Insert: {
          auto_renewal?: boolean | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          exclusive_rights?: boolean | null
          id?: string
          is_active?: boolean | null
          is_primary_principal?: boolean | null
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          notes?: string | null
          principal_id: string
          product_id: string
          territory_restrictions?: Json | null
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Update: {
          auto_renewal?: boolean | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          exclusive_rights?: boolean | null
          id?: string
          is_active?: boolean | null
          is_primary_principal?: boolean | null
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          notes?: string | null
          principal_id?: string
          product_id?: string
          territory_restrictions?: Json | null
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "product_principals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_principals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergen_info: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          certifications: Json | null
          created_at: string | null
          currency_code: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          discontinue_date: string | null
          id: string
          ingredients: string | null
          is_active: boolean | null
          launch_date: string | null
          name: string
          nutritional_info: Json | null
          sku: string | null
          suggested_retail_price: number | null
          tags: Json | null
          unit_cost: number | null
          unit_size: string | null
          updated_at: string | null
        }
        Insert: {
          allergen_info?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          certifications?: Json | null
          created_at?: string | null
          currency_code?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          discontinue_date?: string | null
          id?: string
          ingredients?: string | null
          is_active?: boolean | null
          launch_date?: string | null
          name: string
          nutritional_info?: Json | null
          sku?: string | null
          suggested_retail_price?: number | null
          tags?: Json | null
          unit_cost?: number | null
          unit_size?: string | null
          updated_at?: string | null
        }
        Update: {
          allergen_info?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          certifications?: Json | null
          created_at?: string | null
          currency_code?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          discontinue_date?: string | null
          id?: string
          ingredients?: string | null
          is_active?: boolean | null
          launch_date?: string | null
          name?: string
          nutritional_info?: Json | null
          sku?: string | null
          suggested_retail_price?: number | null
          tags?: Json | null
          unit_cost?: number | null
          unit_size?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      contact_detail_view: {
        Row: {
          account_manager: string | null
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_primary: boolean | null
          last_name: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          state: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      contact_list_view: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_primary: boolean | null
          last_name: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      monthly_organization_performance: {
        Row: {
          avg_duration_minutes: number | null
          calls: number | null
          emails: number | null
          interaction_count: number | null
          interaction_types: number | null
          meetings: number | null
          month: string | null
          organization_id: string | null
          organization_name: string | null
        }
        Relationships: []
      }
      opportunity_kpi_view: {
        Row: {
          active_opportunities: number | null
          avg_days_to_close: number | null
          avg_opportunity_value: number | null
          avg_probability: number | null
          awaiting_response_count: number | null
          closed_won_count: number | null
          created_this_month: number | null
          demo_scheduled_count: number | null
          feedback_logged_count: number | null
          initial_outreach_count: number | null
          lost_opportunities: number | null
          new_lead_count: number | null
          overdue_followups: number | null
          overdue_opportunities: number | null
          sample_visit_count: number | null
          total_opportunities: number | null
          total_pipeline_value: number | null
          total_won_value: number | null
          weighted_pipeline_value: number | null
          win_rate_percent: number | null
          won_opportunities: number | null
          won_this_month: number | null
          won_value_this_month: number | null
        }
        Relationships: []
      }
      opportunity_list_view: {
        Row: {
          actual_value: number | null
          auto_generated_name: boolean | null
          context: Database["public"]["Enums"]["opportunity_context"] | null
          created_at: string | null
          currency_code: string | null
          days_to_close: number | null
          days_to_followup: unknown | null
          deal_owner: string | null
          estimated_value: number | null
          expected_close_date: string | null
          has_activity: boolean | null
          id: string | null
          is_lost: boolean | null
          is_won: boolean | null
          last_activity_date: string | null
          name: string | null
          next_follow_up_date: string | null
          notes_summary: string | null
          organization_city: string | null
          organization_country: string | null
          organization_id: string | null
          organization_lead_score: number | null
          organization_name: string | null
          organization_state: string | null
          organization_status:
            | Database["public"]["Enums"]["organization_status"]
            | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          overdue_close: boolean | null
          overdue_followup: boolean | null
          principal_id: string | null
          principal_name: string | null
          principal_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          probability_percent: number | null
          product_category:
            | Database["public"]["Enums"]["product_category"]
            | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"] | null
          stage_changed_at: string | null
          stage_order: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      organization_lead_scoring: {
        Row: {
          document_count: number | null
          id: string | null
          industry: string | null
          last_interaction: string | null
          lead_score: number | null
          lead_temperature: string | null
          name: string | null
          recent_interactions: number | null
          size: Database["public"]["Enums"]["organization_size"] | null
          status: Database["public"]["Enums"]["organization_status"] | null
          total_interactions: number | null
        }
        Relationships: []
      }
      organizations_with_contact_counts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          annual_revenue: number | null
          assigned_user_id: string | null
          city: string | null
          contact_count: number | null
          country: string | null
          created_at: string | null
          currency_code: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          email: string | null
          employees_count: number | null
          founded_year: number | null
          has_zero_contacts: boolean | null
          id: string | null
          industry: string | null
          is_distributor: boolean | null
          is_principal: boolean | null
          last_contact_date: string | null
          lead_score: number | null
          lead_source: string | null
          legal_name: string | null
          name: string | null
          next_follow_up_date: string | null
          parent_org_id: string | null
          postal_code: string | null
          primary_phone: string | null
          secondary_phone: string | null
          size: Database["public"]["Enums"]["organization_size"] | null
          state_province: string | null
          status: Database["public"]["Enums"]["organization_status"] | null
          tags: Json | null
          type: Database["public"]["Enums"]["organization_type"] | null
          updated_at: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "monthly_organization_performance"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "opportunity_list_view"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_lead_scoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_contact_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "principal_activity_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      principal_activity_summary: {
        Row: {
          active_contacts: number | null
          active_opportunities: number | null
          active_product_count: number | null
          activity_status: string | null
          avg_interaction_rating: number | null
          avg_probability_percent: number | null
          contact_count: number | null
          engagement_score: number | null
          follow_ups_required: number | null
          highest_value_opportunity: string | null
          industry: string | null
          interactions_last_30_days: number | null
          interactions_last_90_days: number | null
          is_active: boolean | null
          is_distributor: boolean | null
          is_principal: boolean | null
          last_activity_date: string | null
          last_contact_update: string | null
          last_interaction_date: string | null
          last_interaction_type: string | null
          latest_opportunity_date: string | null
          latest_opportunity_stage: string | null
          lead_score: number | null
          next_follow_up_date: string | null
          opportunities_last_30_days: number | null
          organization_size:
            | Database["public"]["Enums"]["organization_size"]
            | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          positive_interactions: number | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_product_category:
            | Database["public"]["Enums"]["product_category"]
            | null
          principal_created_at: string | null
          principal_id: string | null
          principal_name: string | null
          principal_status:
            | Database["public"]["Enums"]["organization_status"]
            | null
          principal_updated_at: string | null
          product_categories:
            | Database["public"]["Enums"]["product_category"][]
            | null
          product_count: number | null
          summary_generated_at: string | null
          total_interactions: number | null
          total_opportunities: number | null
          won_opportunities: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_interactions_index_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_name: string
          index_size: string
          index_scans: number
          rows_read: number
          rows_fetched: number
        }[]
      }
      can_access_interaction: {
        Args: { interaction_uuid: string }
        Returns: boolean
      }
      get_organization_contact_count: {
        Args: { org_id: string }
        Returns: number
      }
      get_principal_activity_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_principals: number
          active_principals: number
          principals_with_products: number
          principals_with_opportunities: number
          average_products_per_principal: number
          average_engagement_score: number
          top_performers: Json
        }[]
      }
      get_user_accessible_interactions: {
        Args: Record<PropertyKey, never>
        Returns: {
          interaction_id: string
          opportunity_id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          subject: string
          interaction_date: string
          status: Database["public"]["Enums"]["interaction_status"]
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      refresh_principal_activity_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      validate_interaction_security: {
        Args: { p_interaction_id?: string; p_opportunity_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      interaction_direction: "Inbound" | "Outbound"
      interaction_outcome:
        | "POSITIVE"
        | "NEUTRAL"
        | "NEGATIVE"
        | "NEEDS_FOLLOW_UP"
      interaction_status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
      interaction_type:
        | "Email"
        | "Phone"
        | "Meeting"
        | "Demo"
        | "Proposal"
        | "Contract"
        | "Note"
        | "Task"
        | "Event"
        | "Social"
        | "Website"
        | "Other"
      opportunity_context:
        | "Site Visit"
        | "Food Show"
        | "New Product Interest"
        | "Follow-up"
        | "Demo Request"
        | "Sampling"
        | "Custom"
      opportunity_stage:
        | "New Lead"
        | "Initial Outreach"
        | "Sample/Visit Offered"
        | "Awaiting Response"
        | "Feedback Logged"
        | "Demo Scheduled"
        | "Closed - Won"
      organization_size: "Startup" | "Small" | "Medium" | "Large" | "Enterprise"
      organization_status:
        | "Active"
        | "Inactive"
        | "Prospect"
        | "Customer"
        | "Partner"
        | "Vendor"
      organization_type:
        | "B2B"
        | "B2C"
        | "B2B2C"
        | "Non-Profit"
        | "Government"
        | "Other"
      product_category:
        | "Protein"
        | "Sauce"
        | "Seasoning"
        | "Beverage"
        | "Snack"
        | "Frozen"
        | "Dairy"
        | "Bakery"
        | "Other"
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
      interaction_direction: ["Inbound", "Outbound"],
      interaction_outcome: [
        "POSITIVE",
        "NEUTRAL",
        "NEGATIVE",
        "NEEDS_FOLLOW_UP",
      ],
      interaction_status: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      interaction_type: [
        "Email",
        "Phone",
        "Meeting",
        "Demo",
        "Proposal",
        "Contract",
        "Note",
        "Task",
        "Event",
        "Social",
        "Website",
        "Other",
      ],
      opportunity_context: [
        "Site Visit",
        "Food Show",
        "New Product Interest",
        "Follow-up",
        "Demo Request",
        "Sampling",
        "Custom",
      ],
      opportunity_stage: [
        "New Lead",
        "Initial Outreach",
        "Sample/Visit Offered",
        "Awaiting Response",
        "Feedback Logged",
        "Demo Scheduled",
        "Closed - Won",
      ],
      organization_size: ["Startup", "Small", "Medium", "Large", "Enterprise"],
      organization_status: [
        "Active",
        "Inactive",
        "Prospect",
        "Customer",
        "Partner",
        "Vendor",
      ],
      organization_type: [
        "B2B",
        "B2C",
        "B2B2C",
        "Non-Profit",
        "Government",
        "Other",
      ],
      product_category: [
        "Protein",
        "Sauce",
        "Seasoning",
        "Beverage",
        "Snack",
        "Frozen",
        "Dairy",
        "Bakery",
        "Other",
      ],
    },
  },
} as const

// Helper types for principal activity summary - NEW TYPES FOR STAGE 1
export type PrincipalActivitySummary = Tables<'principal_activity_summary'>
export type PrincipalActivityStats = Database['public']['Functions']['get_principal_activity_stats']['Returns'][0]

// Legacy compatibility types - keeping existing types intact
export type UserSubmission = Tables<'user_submissions'>
export type UserSubmissionInsert = TablesInsert<'user_submissions'>
export type UserSubmissionUpdate = TablesUpdate<'user_submissions'>

export type Organization = Tables<'organizations'>
export type OrganizationInsert = TablesInsert<'organizations'>
export type OrganizationUpdate = TablesUpdate<'organizations'>

export type Opportunity = Tables<'opportunities'>
export type OpportunityInsert = TablesInsert<'opportunities'>
export type OpportunityUpdate = TablesUpdate<'opportunities'>

export type Product = Tables<'products'>
export type ProductInsert = TablesInsert<'products'>
export type ProductUpdate = TablesUpdate<'products'>

export type ProductPrincipal = Tables<'product_principals'>
export type ProductPrincipalInsert = TablesInsert<'product_principals'>
export type ProductPrincipalUpdate = TablesUpdate<'product_principals'>

export type OpportunityPrincipal = Tables<'opportunity_principals'>
export type OpportunityPrincipalInsert = TablesInsert<'opportunity_principals'>
export type OpportunityPrincipalUpdate = TablesUpdate<'opportunity_principals'>

// New interaction types
export type Interaction = Tables<'interactions'>
export type InteractionInsert = TablesInsert<'interactions'>
export type InteractionUpdate = TablesUpdate<'interactions'>

// Enum types for interactions
export type InteractionType = Database['public']['Enums']['interaction_type']
export type InteractionStatus = Database['public']['Enums']['interaction_status']  
export type InteractionOutcome = Database['public']['Enums']['interaction_outcome']

// Existing enum types
export type OpportunityStage = Database['public']['Enums']['opportunity_stage']
export type OpportunityContext = Database['public']['Enums']['opportunity_context']
export type ProductCategory = Database['public']['Enums']['product_category']

// Enum constants for type safety and convenience
export const INTERACTION_TYPES = {
  EMAIL: 'Email' as const,
  PHONE: 'Phone' as const,
  MEETING: 'Meeting' as const,
  DEMO: 'Demo' as const,
  PROPOSAL: 'Proposal' as const,
  CONTRACT: 'Contract' as const,
  NOTE: 'Note' as const,
  TASK: 'Task' as const,
  EVENT: 'Event' as const,
  SOCIAL: 'Social' as const,
  WEBSITE: 'Website' as const,
  OTHER: 'Other' as const
} as const

export const INTERACTION_STATUSES = {
  SCHEDULED: 'SCHEDULED' as const,
  COMPLETED: 'COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const,
  NO_SHOW: 'NO_SHOW' as const
} as const

export const INTERACTION_OUTCOMES = {
  POSITIVE: 'POSITIVE' as const,
  NEUTRAL: 'NEUTRAL' as const,
  NEGATIVE: 'NEGATIVE' as const,
  NEEDS_FOLLOW_UP: 'NEEDS_FOLLOW_UP' as const
} as const

export const OPPORTUNITY_STAGES = {
  NEW_LEAD: 'New Lead' as const,
  INITIAL_OUTREACH: 'Initial Outreach' as const,
  SAMPLE_VISIT_OFFERED: 'Sample/Visit Offered' as const,
  AWAITING_RESPONSE: 'Awaiting Response' as const,
  FEEDBACK_LOGGED: 'Feedback Logged' as const,
  DEMO_SCHEDULED: 'Demo Scheduled' as const,
  CLOSED_WON: 'Closed - Won' as const
} as const

export const OPPORTUNITY_CONTEXTS = {
  SITE_VISIT: 'Site Visit' as const,
  FOOD_SHOW: 'Food Show' as const,
  NEW_PRODUCT_INTEREST: 'New Product Interest' as const,
  FOLLOW_UP: 'Follow-up' as const,
  DEMO_REQUEST: 'Demo Request' as const,
  SAMPLING: 'Sampling' as const,
  CUSTOM: 'Custom' as const
} as const

export const PRODUCT_CATEGORIES = {
  PROTEIN: 'Protein' as const,
  SAUCE: 'Sauce' as const,
  SEASONING: 'Seasoning' as const,
  BEVERAGE: 'Beverage' as const,
  SNACK: 'Snack' as const,
  FROZEN: 'Frozen' as const,
  DAIRY: 'Dairy' as const,
  BAKERY: 'Bakery' as const,
  OTHER: 'Other' as const
} as const