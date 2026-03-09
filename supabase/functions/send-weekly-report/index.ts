import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all companies with active subscriptions
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name");

    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No companies found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reports = [];

    for (const company of companies) {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoISO = weekAgo.toISOString();

      // Fetch weekly KPIs in parallel
      const [
        { count: newClients },
        { count: newOpportunities },
        { data: timeEntries },
        { data: invoices },
        { data: closedOpps },
      ] = await Promise.all([
        supabase.from("client_accounts").select("*", { count: "exact", head: true })
          .eq("company_id", company.id).gte("created_at", weekAgoISO),
        supabase.from("opportunities").select("*", { count: "exact", head: true })
          .eq("company_id", company.id).gte("created_at", weekAgoISO),
        supabase.from("time_entries").select("hours, billable, projects!inner(company_id)")
          .eq("projects.company_id", company.id).gte("date", weekAgoISO.split("T")[0]),
        supabase.from("invoices").select("amount, status")
          .eq("company_id", company.id).gte("created_at", weekAgoISO),
        supabase.from("opportunities").select("expected_value, stage")
          .eq("company_id", company.id).eq("stage", "won").gte("updated_at", weekAgoISO),
      ]);

      const totalHours = (timeEntries || []).reduce((s: number, e: any) => s + Number(e.hours), 0);
      const billableHours = (timeEntries || []).filter((e: any) => e.billable).reduce((s: number, e: any) => s + Number(e.hours), 0);
      const totalInvoiced = (invoices || []).reduce((s: number, i: any) => s + Number(i.amount), 0);
      const totalWon = (closedOpps || []).reduce((s: number, o: any) => s + Number(o.expected_value), 0);

      const report = {
        company_id: company.id,
        company_name: company.name,
        period: `${weekAgo.toLocaleDateString("pt-BR")} - ${now.toLocaleDateString("pt-BR")}`,
        kpis: {
          new_clients: newClients || 0,
          new_opportunities: newOpportunities || 0,
          total_hours: Math.round(totalHours * 10) / 10,
          billable_hours: Math.round(billableHours * 10) / 10,
          utilization_rate: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
          total_invoiced: totalInvoiced,
          total_won: totalWon,
          invoices_count: (invoices || []).length,
        },
      };

      // Save as AI alert for the company
      await supabase.from("ai_alerts").insert({
        company_id: company.id,
        title: `📊 Relatório Semanal — ${report.period}`,
        description: `Novos clientes: ${report.kpis.new_clients} | Oportunidades: ${report.kpis.new_opportunities} | Horas: ${report.kpis.total_hours}h (${report.kpis.utilization_rate}% billable) | Faturado: R$ ${report.kpis.total_invoiced.toLocaleString("pt-BR")} | Deals ganhos: R$ ${report.kpis.total_won.toLocaleString("pt-BR")}`,
        severity: "info",
        alert_type: "weekly_report",
        data: report.kpis,
      });

      reports.push(report);
    }

    return new Response(JSON.stringify({ success: true, reports_generated: reports.length, reports }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
