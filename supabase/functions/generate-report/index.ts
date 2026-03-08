import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientId, companyId, projectId, reportType, periodStart, periodEnd } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Gather real data
    const { data: client } = await supabase.from("client_accounts").select("*").eq("id", clientId).single();
    
    let projectData: any[] = [];
    let tasksData: any[] = [];
    let timesheetData: any[] = [];
    let invoiceData: any[] = [];

    if (projectId) {
      const { data: p } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (p) projectData = [p];
      const { data: tasks } = await supabase.from("project_tasks").select("*").eq("project_id", projectId);
      tasksData = tasks || [];
    } else {
      const { data: projects } = await supabase.from("projects").select("*").eq("client_account_id", clientId).limit(10);
      projectData = projects || [];
      const pIds = projectData.map(p => p.id);
      if (pIds.length > 0) {
        const { data: tasks } = await supabase.from("project_tasks").select("*").in("project_id", pIds);
        tasksData = tasks || [];
      }
    }

    // Time entries for the period
    let timeQuery = supabase.from("time_entries").select("*");
    if (projectId) timeQuery = timeQuery.eq("project_id", projectId);
    if (periodStart) timeQuery = timeQuery.gte("date", periodStart);
    if (periodEnd) timeQuery = timeQuery.lte("date", periodEnd);
    const { data: time } = await timeQuery.limit(500);
    timesheetData = time || [];

    // Invoices
    const { data: invoices } = await supabase.from("invoices").select("*").eq("client_account_id", clientId);
    invoiceData = invoices || [];

    const totalHours = timesheetData.reduce((s, t) => s + Number(t.hours || 0), 0);
    const billableHours = timesheetData.filter(t => t.billable).reduce((s, t) => s + Number(t.hours || 0), 0);
    const tasksDone = tasksData.filter(t => t.status === "done").length;
    const tasksTotal = tasksData.length;

    const dataContext = `
Cliente: ${client?.name || "N/A"}
Período: ${periodStart || "N/A"} a ${periodEnd || "N/A"}
Projetos: ${projectData.map(p => `${p.name} (${p.status})`).join(", ")}
Tarefas concluídas: ${tasksDone}/${tasksTotal}
Horas totais: ${totalHours}h (Billable: ${billableHours}h)
Faturamento: ${invoiceData.map(i => `${i.number}: R$${i.amount} (${i.status})`).join(", ")}
Marcos atingidos: ${tasksData.filter(t => t.is_milestone && t.status === "done").map(t => t.title).join(", ") || "Nenhum"}
`;

    // Call AI to generate report
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um consultor sênior gerando um relatório ${reportType} profissional. 
Gere HTML rico e bem formatado com:
- Resumo executivo
- Métricas principais (use cards com números grandes)
- Timeline de entregas
- Análise de performance
- Recomendações e próximos passos
Use classes CSS inline para estilização. Cores: dourado (#D4A843), fundo escuro (#1a1d23), texto claro (#e8e0d0).
Retorne APENAS o HTML do corpo do relatório.`
          },
          { role: "user", content: `Gere o relatório ${reportType} com estes dados:\n${dataContext}` },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI error");
    }

    const aiData = await response.json();
    let contentHtml = aiData.choices?.[0]?.message?.content || "<p>Erro ao gerar relatório</p>";
    // Strip markdown code fences if present
    contentHtml = contentHtml.replace(/```html\s*/g, "").replace(/```\s*/g, "");

    const title = reportType === "weekly"
      ? `Relatório Semanal — ${client?.name || "Cliente"} — ${periodStart}`
      : reportType === "monthly"
      ? `Relatório Mensal — ${client?.name || "Cliente"} — ${periodStart}`
      : `Relatório — ${client?.name || "Cliente"}`;

    // Save to DB
    const { data: saved, error: saveErr } = await supabase.from("reports").insert({
      company_id: companyId,
      client_id: clientId,
      project_id: projectId || null,
      report_type: reportType,
      title,
      content_html: contentHtml,
      ai_generated: true,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      status: "draft",
    }).select().single();

    if (saveErr) console.error("Save error:", saveErr);

    return new Response(JSON.stringify({ success: true, report: saved, contentHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
