
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'consultant', 'client_user');
CREATE TYPE public.opportunity_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE public.task_status AS ENUM ('backlog', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.document_type AS ENUM ('proposal', 'contract', 'deck', 'report', 'meeting_notes', 'internal_playbook', 'other');
CREATE TYPE public.ai_context_type AS ENUM ('global', 'opportunity', 'project', 'client_portal', 'knowledge');
CREATE TYPE public.ai_sender_type AS ENUM ('user', 'assistant');
CREATE TYPE public.project_member_role AS ENUM ('manager', 'consultant', 'viewer');

-- =============================================
-- TABLES
-- =============================================

-- Companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D4A843',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'consultant',
  active BOOLEAN NOT NULL DEFAULT true,
  billing_rate NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client Accounts
CREATE TABLE public.client_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  segment TEXT,
  industry TEXT,
  size TEXT,
  country TEXT DEFAULT 'Brasil',
  website TEXT,
  annual_revenue NUMERIC(15,2),
  notes TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  health_score INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client Contacts
CREATE TABLE public.client_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_title TEXT,
  linkedin_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  stage public.opportunity_stage NOT NULL DEFAULT 'lead',
  expected_value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  close_date DATE,
  probability INTEGER DEFAULT 10,
  lost_reason TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  status public.project_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date_planned DATE,
  end_date_actual DATE,
  project_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  budget_hours NUMERIC(10,2),
  budget_fee NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  description TEXT,
  objectives TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Tasks
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'backlog',
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  effort_hours_estimated NUMERIC(6,2),
  effort_hours_actual NUMERIC(6,2),
  category TEXT,
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time Entries
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  billable BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  approval_status public.approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  category TEXT,
  description TEXT,
  receipt_url TEXT,
  approval_status public.approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type public.document_type NOT NULL DEFAULT 'other',
  related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  related_client_account_id UUID REFERENCES public.client_accounts(id) ON DELETE SET NULL,
  related_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  content_text TEXT,
  file_url TEXT,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public_to_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NPS Surveys
CREATE TABLE public.nps_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  responded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Threads
CREATE TABLE public.ai_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  context_type public.ai_context_type NOT NULL DEFAULT 'global',
  context_id UUID,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Messages
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_thread_id UUID NOT NULL REFERENCES public.ai_threads(id) ON DELETE CASCADE,
  sender_type public.ai_sender_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client Portal Access
CREATE TABLE public.client_portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_account_id)
);

-- Project Members
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.project_member_role NOT NULL DEFAULT 'consultant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Activity Log
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles table (for security definer function)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- Check if user is client_user
CREATE OR REPLACE FUNCTION public.is_client_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'client_user'
  )
$$;

-- Check if client_user has access to client_account
CREATE OR REPLACE FUNCTION public.client_has_access(_user_id UUID, _client_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_portal_access
    WHERE user_id = _user_id AND client_account_id = _client_account_id
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'consultant')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_accounts_updated_at BEFORE UPDATE ON public.client_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON public.client_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- COMPANIES: users see their own company
CREATE POLICY "Users see own company" ON public.companies FOR SELECT TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admin can update company" ON public.companies FOR UPDATE TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));

-- PROFILES: users see profiles in their company
CREATE POLICY "Users see company profiles" ON public.profiles FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- CLIENT_ACCOUNTS: company scoped, client_user sees only their accounts
CREATE POLICY "Staff see company clients" ON public.client_accounts FOR SELECT TO authenticated
  USING (
    (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR
    (public.is_client_user(auth.uid()) AND public.client_has_access(auth.uid(), id))
  );
CREATE POLICY "Staff manage company clients" ON public.client_accounts FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff update company clients" ON public.client_accounts FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete company clients" ON public.client_accounts FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));

-- CLIENT_CONTACTS: follows client_accounts access
CREATE POLICY "Users see client contacts" ON public.client_contacts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_accounts ca
      WHERE ca.id = client_account_id
      AND (
        (NOT public.is_client_user(auth.uid()) AND ca.company_id = public.get_user_company_id(auth.uid()))
        OR (public.is_client_user(auth.uid()) AND public.client_has_access(auth.uid(), ca.id))
      )
    )
  );
CREATE POLICY "Staff manage contacts" ON public.client_contacts FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.client_accounts ca WHERE ca.id = client_account_id AND ca.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff update contacts" ON public.client_contacts FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.client_accounts ca WHERE ca.id = client_account_id AND ca.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff delete contacts" ON public.client_contacts FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.client_accounts ca WHERE ca.id = client_account_id AND ca.company_id = public.get_user_company_id(auth.uid())));

-- OPPORTUNITIES: company scoped
CREATE POLICY "Staff see opportunities" ON public.opportunities FOR SELECT TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff manage opportunities" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff update opportunities" ON public.opportunities FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete opportunities" ON public.opportunities FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));

-- PROJECTS: company scoped, client_user sees their projects
CREATE POLICY "Users see projects" ON public.projects FOR SELECT TO authenticated
  USING (
    (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR
    (public.is_client_user(auth.uid()) AND public.client_has_access(auth.uid(), client_account_id))
  );
CREATE POLICY "Staff manage projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff update projects" ON public.projects FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete projects" ON public.projects FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));

-- PROJECT_TASKS
CREATE POLICY "Users see tasks" ON public.project_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
    (NOT public.is_client_user(auth.uid()) AND p.company_id = public.get_user_company_id(auth.uid()))
    OR (public.is_client_user(auth.uid()) AND public.client_has_access(auth.uid(), p.client_account_id))
  )));
CREATE POLICY "Staff manage tasks" ON public.project_tasks FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff update tasks" ON public.project_tasks FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff delete tasks" ON public.project_tasks FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.company_id = public.get_user_company_id(auth.uid())));

-- TIME_ENTRIES
CREATE POLICY "Users see time entries" ON public.time_entries FOR SELECT TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff manage time entries" ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Staff update time entries" ON public.time_entries FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Staff delete time entries" ON public.time_entries FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND user_id = auth.uid());

-- EXPENSES
CREATE POLICY "Users see expenses" ON public.expenses FOR SELECT TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff manage expenses" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Staff update expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Staff delete expenses" ON public.expenses FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND user_id = auth.uid());

-- INVOICES
CREATE POLICY "Staff see invoices" ON public.invoices FOR SELECT TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff manage invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete invoices" ON public.invoices FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));

-- DOCUMENTS
CREATE POLICY "Users see documents" ON public.documents FOR SELECT TO authenticated
  USING (
    (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR
    (public.is_client_user(auth.uid()) AND is_public_to_client = true AND EXISTS (
      SELECT 1 FROM public.client_portal_access cpa
      WHERE cpa.user_id = auth.uid() AND cpa.client_account_id = related_client_account_id
    ))
  );
CREATE POLICY "Staff manage documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff update documents" ON public.documents FOR UPDATE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Staff delete documents" ON public.documents FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()));

-- NPS_SURVEYS
CREATE POLICY "Users see nps" ON public.nps_surveys FOR SELECT TO authenticated
  USING (
    (NOT public.is_client_user(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
    OR (public.is_client_user(auth.uid()) AND public.client_has_access(auth.uid(), client_account_id))
  );
CREATE POLICY "Staff manage nps" ON public.nps_surveys FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- AI_THREADS
CREATE POLICY "Users see ai threads" ON public.ai_threads FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users manage ai threads" ON public.ai_threads FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- AI_MESSAGES
CREATE POLICY "Users see ai messages" ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_threads t WHERE t.id = ai_thread_id AND t.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Users manage ai messages" ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_threads t WHERE t.id = ai_thread_id AND t.company_id = public.get_user_company_id(auth.uid())));

-- CLIENT_PORTAL_ACCESS
CREATE POLICY "Staff see portal access" ON public.client_portal_access FOR SELECT TO authenticated
  USING (
    NOT public.is_client_user(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.client_accounts ca WHERE ca.id = client_account_id AND ca.company_id = public.get_user_company_id(auth.uid())
    )
  );
CREATE POLICY "Own portal access" ON public.client_portal_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Staff manage portal access" ON public.client_portal_access FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()));
CREATE POLICY "Staff delete portal access" ON public.client_portal_access FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()));

-- PROJECT_MEMBERS
CREATE POLICY "Users see project members" ON public.project_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.company_id = public.get_user_company_id(auth.uid())));
CREATE POLICY "Staff manage project members" ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_client_user(auth.uid()));
CREATE POLICY "Staff delete project members" ON public.project_members FOR DELETE TO authenticated
  USING (NOT public.is_client_user(auth.uid()));

-- ACTIVITY_LOG
CREATE POLICY "Users see activity" ON public.activity_log FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users insert activity" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- USER_ROLES
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_client_accounts_company ON public.client_accounts(company_id);
CREATE INDEX idx_client_contacts_account ON public.client_contacts(client_account_id);
CREATE INDEX idx_opportunities_company ON public.opportunities(company_id);
CREATE INDEX idx_opportunities_client ON public.opportunities(client_account_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_projects_company ON public.projects(company_id);
CREATE INDEX idx_projects_client ON public.projects(client_account_id);
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_project ON public.time_entries(project_id);
CREATE INDEX idx_expenses_project ON public.expenses(project_id);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_documents_company ON public.documents(company_id);
CREATE INDEX idx_activity_log_company ON public.activity_log(company_id);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
