
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_annual numeric NOT NULL DEFAULT 0,
  ai_credits_included integer NOT NULL DEFAULT 100,
  max_users integer NOT NULL DEFAULT 1,
  features_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Company subscriptions
CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trial',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  stripe_subscription_id text,
  ai_credits_balance integer NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- AI usage logs
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid REFERENCES public.profiles(id),
  model_name text NOT NULL,
  context_type text NOT NULL,
  context_id uuid,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Plans are public read
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);

-- Company subscriptions
CREATE POLICY "Users see own subscription" ON public.company_subscriptions FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users update own subscription" ON public.company_subscriptions FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "System insert subscription" ON public.company_subscriptions FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- AI usage logs
CREATE POLICY "Users see company usage" ON public.ai_usage_logs FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users insert usage" ON public.ai_usage_logs FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Seed subscription plans
INSERT INTO public.subscription_plans (name, price_monthly, price_annual, ai_credits_included, max_users, features_json) VALUES
('free', 0, 0, 100, 1, '["crm","pipeline","projetos_basico"]'::jsonb),
('starter', 49, 470, 1000, 5, '["crm","pipeline","projetos","timesheets","despesas","ia_propostas"]'::jsonb),
('professional', 149, 1490, 5000, 20, '["tudo_starter","resource_planning","capacity_forecasting","portal_cliente","knowledge_base","analytics"]'::jsonb),
('enterprise', 499, 4990, 20000, 999, '["tudo","dedicated_support","custom_integrations","sla"]'::jsonb);

-- Add realtime for ai_usage_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage_logs;
