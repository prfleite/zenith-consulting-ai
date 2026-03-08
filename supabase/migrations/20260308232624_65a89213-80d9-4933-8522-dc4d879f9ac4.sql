
-- Portal shared items
CREATE TABLE public.portal_shared_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_access_id UUID REFERENCES public.client_portal_access(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'project',
  item_id UUID NOT NULL,
  permissions TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_shared_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage shared items" ON public.portal_shared_items FOR ALL USING (NOT is_client_user(auth.uid()));
CREATE POLICY "Client see own shared items" ON public.portal_shared_items FOR SELECT USING (EXISTS (SELECT 1 FROM client_portal_access cpa WHERE cpa.id = portal_shared_items.portal_access_id AND cpa.user_id = auth.uid()));

-- Portal comments
CREATE TABLE public.portal_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_account_id UUID REFERENCES public.client_accounts(id),
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  comment TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage comments" ON public.portal_comments FOR ALL USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Client see own comments" ON public.portal_comments FOR SELECT USING (is_client_user(auth.uid()) AND client_has_access(auth.uid(), client_account_id));
CREATE POLICY "Client insert comments" ON public.portal_comments FOR INSERT WITH CHECK (is_client_user(auth.uid()) AND client_has_access(auth.uid(), client_account_id));

-- Portal approvals
CREATE TABLE public.portal_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_account_id UUID REFERENCES public.client_accounts(id),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'proposal',
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage approvals" ON public.portal_approvals FOR ALL USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Client see own approvals" ON public.portal_approvals FOR SELECT USING (is_client_user(auth.uid()) AND client_has_access(auth.uid(), client_account_id));
CREATE POLICY "Client update approvals" ON public.portal_approvals FOR UPDATE USING (is_client_user(auth.uid()) AND client_has_access(auth.uid(), client_account_id));

-- Knowledge base
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Processos Internos',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see knowledge" ON public.knowledge_base FOR SELECT USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Staff insert knowledge" ON public.knowledge_base FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Staff update knowledge" ON public.knowledge_base FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete knowledge" ON public.knowledge_base FOR DELETE USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));

-- Reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.client_accounts(id),
  project_id UUID REFERENCES public.projects(id),
  report_type TEXT NOT NULL DEFAULT 'monthly',
  title TEXT NOT NULL,
  content_html TEXT DEFAULT '',
  ai_generated BOOLEAN DEFAULT false,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see reports" ON public.reports FOR SELECT USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Staff insert reports" ON public.reports FOR INSERT WITH CHECK ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Staff update reports" ON public.reports FOR UPDATE USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete reports" ON public.reports FOR DELETE USING ((NOT is_client_user(auth.uid())) AND company_id = get_user_company_id(auth.uid()));
