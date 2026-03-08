
-- Marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'facebook',
  status TEXT NOT NULL DEFAULT 'draft',
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see marketing campaigns" ON public.marketing_campaigns FOR SELECT USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff insert marketing campaigns" ON public.marketing_campaigns FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff update marketing campaigns" ON public.marketing_campaigns FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff delete marketing campaigns" ON public.marketing_campaigns FOR DELETE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));

-- Marketing flows table
CREATE TABLE public.marketing_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  name TEXT NOT NULL,
  niche TEXT,
  description TEXT,
  flow_data JSONB DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  ai_generated BOOLEAN DEFAULT false,
  performance_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see marketing flows" ON public.marketing_flows FOR SELECT USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff insert marketing flows" ON public.marketing_flows FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff update marketing flows" ON public.marketing_flows FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff delete marketing flows" ON public.marketing_flows FOR DELETE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));

-- Client website analyses table
CREATE TABLE public.client_website_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  url TEXT NOT NULL,
  analysis_data JSONB DEFAULT '{}'::jsonb,
  brand_analysis JSONB DEFAULT '{}'::jsonb,
  competitor_analysis JSONB DEFAULT '{}'::jsonb,
  seo_data JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '{}'::jsonb,
  ai_provider_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_website_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see website analyses" ON public.client_website_analyses FOR SELECT USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff insert website analyses" ON public.client_website_analyses FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff update website analyses" ON public.client_website_analyses FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));

-- Ad accounts table
CREATE TABLE public.ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  platform TEXT NOT NULL DEFAULT 'facebook',
  account_id TEXT,
  account_name TEXT,
  access_token_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see ad accounts" ON public.ad_accounts FOR SELECT USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff insert ad accounts" ON public.ad_accounts FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff update ad accounts" ON public.ad_accounts FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));

-- Unified inbox table
CREATE TABLE public.unified_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.client_accounts(id),
  platform TEXT NOT NULL DEFAULT 'email',
  sender_name TEXT NOT NULL,
  sender_id TEXT,
  message TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'inbound',
  read BOOLEAN DEFAULT false,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.unified_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see inbox" ON public.unified_inbox FOR SELECT USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff insert inbox" ON public.unified_inbox FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff update inbox" ON public.unified_inbox FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));

-- Enable realtime for unified inbox
ALTER PUBLICATION supabase_realtime ADD TABLE public.unified_inbox;

-- Marketing strategies table
CREATE TABLE public.marketing_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  niche TEXT,
  strategy_data JSONB DEFAULT '{}'::jsonb,
  branding_data JSONB DEFAULT '{}'::jsonb,
  content_calendar JSONB DEFAULT '[]'::jsonb,
  kpi_targets JSONB DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see strategies" ON public.marketing_strategies FOR SELECT USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff insert strategies" ON public.marketing_strategies FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff update strategies" ON public.marketing_strategies FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Staff delete strategies" ON public.marketing_strategies FOR DELETE USING ((NOT is_client_user(auth.uid())) AND (company_id = get_user_company_id(auth.uid())));
