import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, contextType, contextId, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user info from auth header
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let companyId: string | null = null;
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
        companyId = profile?.company_id || null;
      }
    }

    // Check credits if company exists
    if (companyId) {
      const { data: sub } = await supabase
        .from("company_subscriptions")
        .select("ai_credits_balance")
        .eq("company_id", companyId)
        .single();
      
      if (sub && sub.ai_credits_balance <= 0) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adquira mais créditos." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // System prompts by context type
    const systemPrompts: Record<string, string> = {
      proposal: `Você é um consultor sênior especialista em criar propostas comerciais profissionais. 
Crie propostas estruturadas com: Sumário Executivo, Contexto e Diagnóstico, Abordagem Metodológica, 
Escopo de Trabalho, Cronograma, Investimento, Equipe, Diferenciais. Use linguagem persuasiva e profissional.`,
      planning: `Você é um gerente de projetos sênior. Crie planos de projeto detalhados com:
tarefas, estimativas de horas, marcos, riscos e dependências. Seja específico e prático.`,
      meeting_notes: `Você é um assistente especialista em extrair informações de atas de reunião.
Extraia: decisões tomadas, ações/tarefas com responsáveis e prazos, riscos identificados, próximos passos.
Formate como JSON com campos: decisions[], tasks[{title, assignee, due_date, priority}], risks[]`,
      knowledge: `Você é um assistente de metodologia e conhecimento para consultorias. 
Responda perguntas sobre frameworks, melhores práticas, templates e casos de referência.
Use os documentos fornecidos como contexto.`,
      client_chat: `Você é um assistente do portal do cliente. Responda perguntas sobre o projeto do cliente,
prazos, entregas e documentos. Seja cordial e profissional. Nunca revele informações de outros clientes.`,
      executive_briefing: `Você é um analista executivo. Gere um briefing executivo semanal com:
1. Resumo de KPIs, 2. Projetos em risco, 3. Oportunidades de ação, 4. Recomendações estratégicas.
Use dados concretos e seja direto ao ponto.`,
      global: `Você é o assistente de IA da ApexConsult, uma plataforma de gestão para consultorias.
Ajude com análises de dados, insights sobre clientes, estratégias comerciais e operacionais.
Responda em português brasileiro.`,
    };

    const systemPrompt = systemPrompts[contextType] || systemPrompts.global;
    const selectedModel = model || "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log usage and deduct credits (approximate)
    if (companyId) {
      // Deduct 1 credit per request (simplified)
      await supabase
        .from("company_subscriptions")
        .update({ ai_credits_balance: supabase.rpc ? undefined : 0 })
        .eq("company_id", companyId);

      // Use raw SQL to decrement
      await supabase.rpc("decrement_ai_credits" as any, { _company_id: companyId }).catch(() => {});

      await supabase.from("ai_usage_logs").insert({
        company_id: companyId,
        user_id: userId,
        model_name: selectedModel,
        context_type: contextType || "global",
        context_id: contextId || null,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
      }).catch(() => {});
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
