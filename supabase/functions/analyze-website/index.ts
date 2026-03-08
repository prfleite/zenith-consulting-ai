import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, clientId, companyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch website HTML
    let htmlContent = "";
    try {
      const siteResponse = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ApexConsult/1.0)" },
      });
      htmlContent = await siteResponse.text();
      // Truncate to avoid token limits
      htmlContent = htmlContent.substring(0, 15000);
    } catch (e) {
      htmlContent = `Could not fetch site: ${e instanceof Error ? e.message : "Unknown error"}`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a senior marketing analyst. Analyze the provided website HTML and return a detailed JSON analysis. Return ONLY valid JSON with this structure:
{
  "brand_name": "string",
  "brand_colors": ["#hex1", "#hex2"],
  "brand_voice": "string description of tone and voice",
  "products_services": ["service1", "service2"],
  "target_audience": "string description",
  "usp": "unique selling proposition",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "opportunities": ["opp1", "opp2"],
  "seo_score": 0-100,
  "mobile_friendly": true/false,
  "content_quality": "high/medium/low",
  "recommendations": ["rec1", "rec2", "rec3"]
}`
          },
          {
            role: "user",
            content: `Analyze this website (${url}):\n\n${htmlContent}`
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_analysis",
            description: "Save the website analysis results",
            parameters: {
              type: "object",
              properties: {
                brand_name: { type: "string" },
                brand_colors: { type: "array", items: { type: "string" } },
                brand_voice: { type: "string" },
                products_services: { type: "array", items: { type: "string" } },
                target_audience: { type: "string" },
                usp: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                seo_score: { type: "number" },
                mobile_friendly: { type: "boolean" },
                content_quality: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["brand_name", "brand_voice", "target_audience", "recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let analysis: any = {};
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        const content = aiData.choices?.[0]?.message?.content || "{}";
        analysis = JSON.parse(content);
      }
    } catch {
      analysis = { brand_name: "Unknown", recommendations: ["Could not parse analysis"] };
    }

    // Save to DB
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: saved, error: saveError } = await supabase.from("client_website_analyses").insert({
      client_id: clientId,
      company_id: companyId,
      url,
      analysis_data: analysis,
      brand_analysis: { brand_name: analysis.brand_name, brand_colors: analysis.brand_colors, brand_voice: analysis.brand_voice },
      seo_data: { seo_score: analysis.seo_score, mobile_friendly: analysis.mobile_friendly, content_quality: analysis.content_quality },
      recommendations: analysis.recommendations,
      ai_provider_used: "lovable-gemini",
    }).select().single();

    if (saveError) console.error("Save error:", saveError);

    return new Response(JSON.stringify({ success: true, analysis, id: saved?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
