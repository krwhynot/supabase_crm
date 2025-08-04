export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          }
        ]
      }
      opportunities: {
        Row: {
          actual_value: number | null
          auto_generated_name: boolean | null
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
            foreignKeyName: "opportunity_principals_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          address: string | null
          alias: string | null
          city: string | null
          client_company_profile: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_client: boolean | null
          is_principal: boolean | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          type: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          alias?: string | null
          city?: string | null
          client_company_profile?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_client?: boolean | null
          is_principal?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          alias?: string | null
          city?: string | null
          client_company_profile?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_client?: boolean | null
          is_principal?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_principals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
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
          address: string | null
          age: number | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      principal_activity_summary: {
        Row: {
          principal_id: string
          principal_name: string
          principal_status: Database["public"]["Enums"]["organization_status"] | null
          organization_type: Database["public"]["Enums"]["organization_type"] | null
          industry: string | null
          organization_size: Database["public"]["Enums"]["organization_size"] | null
          is_active: boolean | null
          lead_score: number | null
          contact_count: number
          active_contacts: number
          primary_contact_name: string | null
          primary_contact_email: string | null
          last_contact_update: string | null
          total_interactions: number
          interactions_last_30_days: number
          interactions_last_90_days: number
          last_interaction_date: string | null
          last_interaction_type: string | null
          next_follow_up_date: string | null
          avg_interaction_rating: number
          positive_interactions: number
          follow_ups_required: number
          total_opportunities: number
          active_opportunities: number
          won_opportunities: number
          opportunities_last_30_days: number
          latest_opportunity_stage: string | null
          latest_opportunity_date: string | null
          avg_probability_percent: number
          highest_value_opportunity: string | null
          product_count: number
          active_product_count: number
          product_categories: string[] | null
          primary_product_category: Database["public"]["Enums"]["product_category"] | null
          is_principal: boolean | null
          is_distributor: boolean | null
          distributor_id: string | null
          distributor_name: string | null
          last_activity_date: string | null
          activity_status: string
          engagement_score: number
          principal_created_at: string | null
          principal_updated_at: string | null
          summary_generated_at: string | null
        }
        Relationships: []
      }
      principal_distributor_relationships: {
        Row: {
          principal_id: string
          principal_name: string
          principal_status: Database["public"]["Enums"]["organization_status"] | null
          distributor_id: string | null
          distributor_name: string | null
          distributor_status: Database["public"]["Enums"]["organization_status"] | null
          relationship_type: string
          principal_city: string | null
          principal_state: string | null
          principal_country: string | null
          distributor_city: string | null
          distributor_state: string | null
          distributor_country: string | null
          principal_lead_score: number | null
          distributor_lead_score: number | null
          principal_created_at: string | null
          principal_last_contact: string | null
          distributor_last_contact: string | null
        }
        Relationships: []
      }
      principal_product_performance: {
        Row: {
          principal_id: string
          principal_name: string
          product_id: string
          product_name: string
          product_category: Database["public"]["Enums"]["product_category"] | null
          product_sku: string | null
          is_primary_principal: boolean | null
          exclusive_rights: boolean | null
          wholesale_price: number | null
          minimum_order_quantity: number | null
          lead_time_days: number | null
          contract_start_date: string | null
          contract_end_date: string | null
          territory_restrictions: Json | null
          opportunities_for_product: number
          won_opportunities_for_product: number
          active_opportunities_for_product: number
          latest_opportunity_date: string | null
          avg_opportunity_probability: number
          interactions_for_product: number
          recent_interactions_for_product: number
          last_interaction_date: string | null
          product_is_active: boolean | null
          launch_date: string | null
          discontinue_date: string | null
          unit_cost: number | null
          suggested_retail_price: number | null
          contract_status: string
          product_performance_score: number
          relationship_created_at: string | null
          relationship_updated_at: string | null
        }
        Relationships: []
      }
      principal_timeline_summary: {
        Row: {
          principal_id: string
          principal_name: string
          activity_date: string | null
          activity_type: string
          activity_subject: string
          activity_details: string
          source_id: string
          source_table: string
          opportunity_name: string | null
          contact_name: string | null
          product_name: string | null
          created_by: string | null
          activity_status: string
          follow_up_required: boolean | null
          follow_up_date: string | null
          timeline_rank: number
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
        Args: {
          interaction_uuid: string
        }
        Returns: boolean
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
      maintain_interactions_indexes: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_interaction_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          test_result: boolean
          details: string
        }[]
      }
      validate_interactions_index_coverage: {
        Args: Record<PropertyKey, never>
        Returns: {
          query_pattern: string
          index_used: string
          performance_note: string
        }[]
      }
      validate_interaction_security: {
        Args: {
          p_interaction_id?: string
          p_opportunity_id?: string
        }
        Returns: boolean
      }
      refresh_principal_activity_summary: {
        Args: Record<PropertyKey, never>
        Returns: void
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
      schedule_principal_activity_refresh: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      interaction_outcome: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "NEEDS_FOLLOW_UP"
      interaction_status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
      interaction_type:
        | "EMAIL"
        | "CALL"
        | "IN_PERSON"
        | "DEMO"
        | "FOLLOW_UP"
        | "SAMPLE_DELIVERY"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for database operations
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
  EMAIL: 'EMAIL' as const,
  CALL: 'CALL' as const,
  IN_PERSON: 'IN_PERSON' as const,
  DEMO: 'DEMO' as const,
  FOLLOW_UP: 'FOLLOW_UP' as const,
  SAMPLE_DELIVERY: 'SAMPLE_DELIVERY' as const
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