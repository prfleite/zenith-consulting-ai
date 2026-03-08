import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { objective, niche } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are a marketing automation expert. Generate a marketing automation flow as JSON compatible with React Flow.
Each node must have: id (string), type ("trigger"|"action"|"condition"|"ai"), position ({x, y}), data ({label, nodeType, config}).
Edges connect nodes: {id, source, target, animated: true}.
Position nodes in a vertical flow layout, 250px apart vertically, centered at x=400.
Return ONLY valid JSON with {nodes: [...], edges: [...]}.`
          },
          {
            role: "user",
            content: `Create a marketing automation flow for:\nObjective: ${objective}\nNiche: ${niche}\n\nGenerate 5-8 nodes with appropriate triggers, conditions, actions, and AI nodes.`
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

    let flowData: any = { nodes: [], edges: [] };
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      flowData = JSON.parse(jsonMatch?.[1] || jsonMatch?.[0] || content);
    } catch {
      // Fallback flow
      flowData = {
        nodes: [
          { id: "1", type: "trigger", position: { x: 400, y: 50 }, data: { label: "Novo Lead", nodeType: "trigger", config: {} } },
          { id: "2", type: "action", position: { x: 400, y: 300 }, data: { label: "Enviar Email Boas-vindas", nodeType: "action", config: {} } },
          { id: "3", type: "condition", position: { x: 400, y: 550 }, data: { label: "Abriu Email?", nodeType: "condition", config: {} } },
          { id: "4", type: "ai", position: { x: 400, y: 800 }, data: { label: "Classificar Lead com IA", nodeType: "ai", config: {} } },
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", animated: true },
          { id: "e2-3", source: "2", target: "3", animated: true },
          { id: "e3-4", source: "3", target: "4", animated: true },
        ],
      };
    }

    return new Response(JSON.stringify({ success: true, flowData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
