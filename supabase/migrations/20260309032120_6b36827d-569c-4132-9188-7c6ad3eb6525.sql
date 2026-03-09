-- Fix 1: Prevent privilege escalation - users cannot change their own role
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Fix 2: Restrict subscription modifications to admins only
DROP POLICY IF EXISTS "System insert subscription" ON public.company_subscriptions;
DROP POLICY IF EXISTS "Users update own subscription" ON public.company_subscriptions;

CREATE POLICY "Admin insert subscription" ON public.company_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update subscription" ON public.company_subscriptions
  FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix 3: Add tenant isolation to portal_shared_items
DROP POLICY IF EXISTS "Staff manage shared items" ON public.portal_shared_items;
CREATE POLICY "Staff manage shared items" ON public.portal_shared_items
  FOR ALL TO authenticated
  USING (
    NOT is_client_user(auth.uid())
    AND EXISTS (
      SELECT 1 FROM client_portal_access cpa
      JOIN client_accounts ca ON ca.id = cpa.client_account_id
      WHERE cpa.id = portal_shared_items.portal_access_id
      AND ca.company_id = get_user_company_id(auth.uid())
    )
  );