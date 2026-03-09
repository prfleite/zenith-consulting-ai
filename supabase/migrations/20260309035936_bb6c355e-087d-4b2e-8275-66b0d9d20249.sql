
-- Function to generate project code
CREATE OR REPLACE FUNCTION public.generate_project_code(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN code ~ '^PRJ-[0-9]+$' THEN CAST(SUBSTRING(code FROM 5) AS integer) ELSE 0 END
  ), 0) + 1 INTO next_num
  FROM public.projects WHERE company_id = _company_id;
  RETURN 'PRJ-' || LPAD(next_num::text, 3, '0');
END;
$$;

-- Trigger: opportunity won -> auto create project
CREATE OR REPLACE FUNCTION public.on_opportunity_won()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stage = 'won' AND (OLD.stage IS NULL OR OLD.stage <> 'won') THEN
    INSERT INTO public.projects (name, client_account_id, company_id, status, code, opportunity_id, budget_fee)
    VALUES (
      NEW.title,
      NEW.client_account_id,
      NEW.company_id,
      'planning',
      generate_project_code(NEW.company_id),
      NEW.id,
      NEW.expected_value
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_opportunity_won
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.on_opportunity_won();

-- Trigger: invoice overdue -> auto alert
CREATE OR REPLACE FUNCTION public.on_invoice_overdue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status <> 'overdue') THEN
    INSERT INTO public.ai_alerts (company_id, title, description, severity, alert_type, related_entity_id, related_entity_type)
    VALUES (
      NEW.company_id,
      'Fatura ' || NEW.number || ' vencida',
      'A fatura ' || NEW.number || ' no valor de R$ ' || NEW.amount || ' está vencida desde ' || COALESCE(NEW.due_date::text, 'N/A'),
      'warning',
      'billing',
      NEW.id,
      'invoice'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_overdue
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.on_invoice_overdue();
