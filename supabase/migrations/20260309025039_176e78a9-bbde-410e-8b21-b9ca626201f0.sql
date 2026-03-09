CREATE OR REPLACE FUNCTION public.decrement_ai_credits(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.company_subscriptions
  SET ai_credits_balance = GREATEST(ai_credits_balance - 1, 0)
  WHERE company_id = _company_id;
END;
$$;