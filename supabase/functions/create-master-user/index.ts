import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create master user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: "Pedro@skalle.com.br",
    password: "086521",
    email_confirm: true,
    user_metadata: { name: "Pedro", role: "admin" },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get or create a company for this user
  const { data: existingCompanies } = await supabase.from("companies").select("id").limit(1);
  let companyId: string;

  if (existingCompanies && existingCompanies.length > 0) {
    companyId = existingCompanies[0].id;
  } else {
    const { data: newCompany } = await supabase.from("companies").insert({
      name: "Skalle Consulting",
      domain: "skalle.com.br",
      primary_color: "#D4A843",
    }).select().single();
    companyId = newCompany!.id;
  }

  // Update profile with company and admin role
  await supabase.from("profiles").update({
    company_id: companyId,
    role: "admin",
    name: "Pedro",
  }).eq("id", authUser.user!.id);

  return new Response(JSON.stringify({ success: true, userId: authUser.user!.id, companyId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
