
-- Create ai_alerts table
CREATE TABLE public.ai_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'insight',
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  auto_generated BOOLEAN NOT NULL DEFAULT true,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff see company alerts" ON public.ai_alerts
  FOR SELECT TO authenticated
  USING (NOT is_client_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Staff update alerts" ON public.ai_alerts
  FOR UPDATE TO authenticated
  USING (NOT is_client_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Staff insert alerts" ON public.ai_alerts
  FOR INSERT TO authenticated
  WITH CHECK (NOT is_client_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Staff delete alerts" ON public.ai_alerts
  FOR DELETE TO authenticated
  USING (NOT is_client_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_alerts;
