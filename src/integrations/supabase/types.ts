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
      activity_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          details_json: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          details_json?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          details_json?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_name: string | null
          company_id: string
          created_at: string
          id: string
          platform: string
          status: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          company_id: string
          created_at?: string
          id?: string
          platform?: string
          status?: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          company_id?: string
          created_at?: string
          id?: string
          platform?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          ai_thread_id: string
          content: string
          created_at: string
          id: string
          sender_type: Database["public"]["Enums"]["ai_sender_type"]
        }
        Insert: {
          ai_thread_id: string
          content: string
          created_at?: string
          id?: string
          sender_type: Database["public"]["Enums"]["ai_sender_type"]
        }
        Update: {
          ai_thread_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_type?: Database["public"]["Enums"]["ai_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_ai_thread_id_fkey"
            columns: ["ai_thread_id"]
            isOneToOne: false
            referencedRelation: "ai_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_threads: {
        Row: {
          company_id: string
          context_id: string | null
          context_type: Database["public"]["Enums"]["ai_context_type"]
          created_at: string
          created_by_user_id: string | null
          id: string
        }
        Insert: {
          company_id: string
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          created_by_user_id?: string | null
          id?: string
        }
        Update: {
          company_id?: string
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          created_by_user_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_threads_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          company_id: string
          context_id: string | null
          context_type: string
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number
          model_name: string
          output_tokens: number
          user_id: string | null
        }
        Insert: {
          company_id: string
          context_id?: string | null
          context_type: string
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model_name: string
          output_tokens?: number
          user_id?: string | null
        }
        Update: {
          company_id?: string
          context_id?: string | null
          context_type?: string
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model_name?: string
          output_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          annual_revenue: number | null
          company_id: string
          country: string | null
          created_at: string
          health_score: number | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          owner_id: string | null
          segment: string | null
          size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          company_id: string
          country?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          segment?: string | null
          size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          company_id?: string
          country?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          segment?: string | null
          size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_account_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          role_title: string | null
          updated_at: string
        }
        Insert: {
          client_account_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          updated_at?: string
        }
        Update: {
          client_account_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_access: {
        Row: {
          client_account_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_account_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_account_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_website_analyses: {
        Row: {
          ai_provider_used: string | null
          analysis_data: Json | null
          brand_analysis: Json | null
          client_id: string
          company_id: string
          competitor_analysis: Json | null
          created_at: string
          id: string
          recommendations: Json | null
          seo_data: Json | null
          url: string
        }
        Insert: {
          ai_provider_used?: string | null
          analysis_data?: Json | null
          brand_analysis?: Json | null
          client_id: string
          company_id: string
          competitor_analysis?: Json | null
          created_at?: string
          id?: string
          recommendations?: Json | null
          seo_data?: Json | null
          url: string
        }
        Update: {
          ai_provider_used?: string | null
          analysis_data?: Json | null
          brand_analysis?: Json | null
          client_id?: string
          company_id?: string
          competitor_analysis?: Json | null
          created_at?: string
          id?: string
          recommendations?: Json | null
          seo_data?: Json | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_website_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_website_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_subscriptions: {
        Row: {
          ai_credits_balance: number
          company_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
        }
        Insert: {
          ai_credits_balance?: number
          company_id: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
        }
        Update: {
          ai_credits_balance?: number
          company_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          content_text: string | null
          created_at: string
          created_by_id: string | null
          file_url: string | null
          id: string
          is_public_to_client: boolean
          related_client_account_id: string | null
          related_opportunity_id: string | null
          related_project_id: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          content_text?: string | null
          created_at?: string
          created_by_id?: string | null
          file_url?: string | null
          id?: string
          is_public_to_client?: boolean
          related_client_account_id?: string | null
          related_opportunity_id?: string | null
          related_project_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_text?: string | null
          created_at?: string
          created_by_id?: string | null
          file_url?: string | null
          id?: string
          is_public_to_client?: boolean
          related_client_account_id?: string | null
          related_opportunity_id?: string | null
          related_project_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_related_client_account_id_fkey"
            columns: ["related_client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_by: string | null
          category: string | null
          created_at: string
          currency: string | null
          date: string
          description: string | null
          id: string
          project_id: string
          receipt_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          project_id: string
          receipt_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          project_id?: string
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_account_id: string
          company_id: string
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          client_account_id: string
          company_id: string
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_account_id?: string
          company_id?: string
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          ai_generated: boolean | null
          budget: number | null
          clicks: number | null
          client_id: string
          company_id: string
          conversions: number | null
          created_at: string
          end_date: string | null
          id: string
          impressions: number | null
          name: string
          roas: number | null
          spent: number | null
          start_date: string | null
          status: string
          type: string
        }
        Insert: {
          ai_generated?: boolean | null
          budget?: number | null
          clicks?: number | null
          client_id: string
          company_id: string
          conversions?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number | null
          name: string
          roas?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string
          type?: string
        }
        Update: {
          ai_generated?: boolean | null
          budget?: number | null
          clicks?: number | null
          client_id?: string
          company_id?: string
          conversions?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number | null
          name?: string
          roas?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_flows: {
        Row: {
          ai_generated: boolean | null
          client_id: string
          company_id: string
          created_at: string
          description: string | null
          flow_data: Json | null
          id: string
          name: string
          niche: string | null
          performance_data: Json | null
          status: string
        }
        Insert: {
          ai_generated?: boolean | null
          client_id: string
          company_id: string
          created_at?: string
          description?: string | null
          flow_data?: Json | null
          id?: string
          name: string
          niche?: string | null
          performance_data?: Json | null
          status?: string
        }
        Update: {
          ai_generated?: boolean | null
          client_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          flow_data?: Json | null
          id?: string
          name?: string
          niche?: string | null
          performance_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_strategies: {
        Row: {
          ai_generated: boolean | null
          branding_data: Json | null
          client_id: string
          company_id: string
          content_calendar: Json | null
          created_at: string
          id: string
          kpi_targets: Json | null
          niche: string | null
          strategy_data: Json | null
        }
        Insert: {
          ai_generated?: boolean | null
          branding_data?: Json | null
          client_id: string
          company_id: string
          content_calendar?: Json | null
          created_at?: string
          id?: string
          kpi_targets?: Json | null
          niche?: string | null
          strategy_data?: Json | null
        }
        Update: {
          ai_generated?: boolean | null
          branding_data?: Json | null
          client_id?: string
          company_id?: string
          content_calendar?: Json | null
          created_at?: string
          id?: string
          kpi_targets?: Json | null
          niche?: string | null
          strategy_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_strategies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_strategies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_surveys: {
        Row: {
          client_account_id: string
          comment: string | null
          company_id: string
          created_at: string
          id: string
          project_id: string | null
          responded_by_name: string | null
          score: number
        }
        Insert: {
          client_account_id: string
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          project_id?: string | null
          responded_by_name?: string | null
          score: number
        }
        Update: {
          client_account_id?: string
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          project_id?: string | null
          responded_by_name?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "nps_surveys_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          client_account_id: string
          close_date: string | null
          company_id: string
          created_at: string
          currency: string | null
          description: string | null
          expected_value: number | null
          id: string
          lost_reason: string | null
          owner_id: string | null
          probability: number | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          client_account_id: string
          close_date?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          expected_value?: number | null
          id?: string
          lost_reason?: string | null
          owner_id?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          client_account_id?: string
          close_date?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          expected_value?: number | null
          id?: string
          lost_reason?: string | null
          owner_id?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          billing_rate: number | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_rate?: number | null
          company_id?: string | null
          created_at?: string
          email?: string
          id: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_rate?: number | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee_id: string | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          effort_hours_actual: number | null
          effort_hours_estimated: number | null
          id: string
          is_milestone: boolean
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          effort_hours_actual?: number | null
          effort_hours_estimated?: number | null
          id?: string
          is_milestone?: boolean
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          effort_hours_actual?: number | null
          effort_hours_estimated?: number | null
          id?: string
          is_milestone?: boolean
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_fee: number | null
          budget_hours: number | null
          client_account_id: string
          code: string | null
          company_id: string
          created_at: string
          currency: string | null
          description: string | null
          end_date_actual: string | null
          end_date_planned: string | null
          id: string
          name: string
          objectives: string | null
          opportunity_id: string | null
          project_manager_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget_fee?: number | null
          budget_hours?: number | null
          client_account_id: string
          code?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date_actual?: string | null
          end_date_planned?: string | null
          id?: string
          name: string
          objectives?: string | null
          opportunity_id?: string | null
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget_fee?: number | null
          budget_hours?: number | null
          client_account_id?: string
          code?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date_actual?: string | null
          end_date_planned?: string | null
          id?: string
          name?: string
          objectives?: string | null
          opportunity_id?: string | null
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_credits_included: number
          created_at: string
          features_json: Json
          id: string
          is_active: boolean
          max_users: number
          name: string
          price_annual: number
          price_monthly: number
        }
        Insert: {
          ai_credits_included?: number
          created_at?: string
          features_json?: Json
          id?: string
          is_active?: boolean
          max_users?: number
          name: string
          price_annual?: number
          price_monthly?: number
        }
        Update: {
          ai_credits_included?: number
          created_at?: string
          features_json?: Json
          id?: string
          is_active?: boolean
          max_users?: number
          name?: string
          price_annual?: number
          price_monthly?: number
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_by: string | null
          billable: boolean
          created_at: string
          date: string
          hours: number
          id: string
          notes: string | null
          project_id: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          billable?: boolean
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          project_id: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          billable?: boolean
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          project_id?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_inbox: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          direction: string
          id: string
          message: string
          platform: string
          read: boolean | null
          sender_id: string | null
          sender_name: string
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          direction?: string
          id?: string
          message: string
          platform?: string
          read?: boolean | null
          sender_id?: string | null
          sender_name: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          direction?: string
          id?: string
          message?: string
          platform?: string
          read?: boolean | null
          sender_id?: string | null
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_inbox_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_inbox_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_inbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_has_access: {
        Args: { _client_account_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      is_client_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      ai_context_type:
        | "global"
        | "opportunity"
        | "project"
        | "client_portal"
        | "knowledge"
      ai_sender_type: "user" | "assistant"
      app_role: "admin" | "manager" | "consultant" | "client_user"
      approval_status: "pending" | "approved" | "rejected"
      document_type:
        | "proposal"
        | "contract"
        | "deck"
        | "report"
        | "meeting_notes"
        | "internal_playbook"
        | "other"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      opportunity_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      project_member_role: "manager" | "consultant" | "viewer"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "backlog" | "in_progress" | "review" | "done"
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
      ai_context_type: [
        "global",
        "opportunity",
        "project",
        "client_portal",
        "knowledge",
      ],
      ai_sender_type: ["user", "assistant"],
      app_role: ["admin", "manager", "consultant", "client_user"],
      approval_status: ["pending", "approved", "rejected"],
      document_type: [
        "proposal",
        "contract",
        "deck",
        "report",
        "meeting_notes",
        "internal_playbook",
        "other",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      opportunity_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      project_member_role: ["manager", "consultant", "viewer"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["backlog", "in_progress", "review", "done"],
    },
  },
} as const
