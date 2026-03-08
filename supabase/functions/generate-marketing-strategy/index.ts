import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientId, companyId, analysisId, niche, objectives, budget } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get analysis if available
    let analysisContext = "";
    if (analysisId) {
      const { data: analysis } = await supabase.from("client_website_analyses").select("*").eq("id", analysisId).single();
      if (analysis) {
        analysisContext = `\n\nAnálise do site do cliente:\n${JSON.stringify(analysis.analysis_data)}`;
      }
    }

    // Get client info
    const { data: client } = await supabase.from("client_accounts").select("*").eq("id", clientId).single();
    const clientContext = client ? `Cliente: ${client.name}, Segmento: ${client.segment}, Indústria: ${client.industry}` : "";

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
            content: `Você é um estrategista de marketing digital sênior. Gere uma estratégia de marketing completa em JSON. Retorne APENAS JSON válido.`
          },
          {
            role: "user",
            content: `Crie uma estratégia de marketing completa para:
${clientContext}
Nicho: ${niche}
Objetivos: ${objectives}
Budget mensal: R$ ${budget}
${analysisContext}

Retorne JSON com esta estrutura:
{
  "branding_strategy": { "positioning": "", "tone_of_voice": "", "visual_identity": "", "key_messages": [] },
  "channel_strategy": {
    "facebook": { "objective": "", "audience": "", "budget_pct": 0, "ad_formats": [], "copy_examples": [] },
    "google": { "objective": "", "keywords": [], "budget_pct": 0, "ad_types": [], "copy_examples": [] },
    "linkedin": { "objective": "", "audience": "", "budget_pct": 0, "content_types": [], "copy_examples": [] },
    "email": { "objective": "", "frequency": "", "sequences": [], "subject_lines": [] },
    "whatsapp": { "objective": "", "message_templates": [], "automation_flows": [] }
  },
  "content_calendar": [{"day": 1, "channel": "", "content_type": "", "topic": "", "copy": ""}],
  "conversion_funnels": [{"name": "", "stages": [], "conversion_rates": []}],
  "kpi_targets": { "impressions": 0, "clicks": 0, "leads": 0, "conversions": 0, "roas": 0, "cpl": 0 },
  "budget_allocation": { "facebook": 0, "google": 0, "linkedin": 0, "email": 0, "whatsapp": 0 }
}`
          },
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
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    let strategy: any = {};
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      strategy = JSON.parse(jsonMatch?.[1] || jsonMatch?.[0] || content);
    } catch {
      strategy = { error: "Could not parse strategy", raw: content };
    }

    // Save to DB
    const { data: saved } = await supabase.from("marketing_strategies").insert({
      client_id: clientId,
      company_id: companyId,
      niche,
      strategy_data: strategy.channel_strategy || strategy,
      branding_data: strategy.branding_strategy || {},
      content_calendar: strategy.content_calendar || [],
      kpi_targets: strategy.kpi_targets || {},
      ai_generated: true,
    }).select().single();

    return new Response(JSON.stringify({ success: true, strategy, id: saved?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
