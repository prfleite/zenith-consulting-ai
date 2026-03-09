import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientPhone, data } = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN as secrets." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ error: "recipientPhone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message based on notification type
    let message = "";
    switch (type) {
      case "invoice_overdue":
        message = `⚠️ *Fatura Vencida*\n\nA fatura *${data?.invoiceNumber || ""}* no valor de *R$ ${data?.amount || "0"}* está vencida desde ${data?.dueDate || "N/A"}.\n\nPor favor, regularize o pagamento.`;
        break;
      case "proposal_accepted":
        message = `✅ *Proposta Aceita!*\n\nA proposta *"${data?.proposalTitle || ""}"* foi aceita pelo cliente *${data?.clientName || ""}*.\n\nValor: R$ ${data?.totalValue || "0"}`;
        break;
      case "project_status_change":
        message = `📋 *Projeto Atualizado*\n\nO projeto *"${data?.projectName || ""}"* mudou de status para *${data?.newStatus || ""}*.\n\nCliente: ${data?.clientName || ""}`;
        break;
      case "contract_signed":
        message = `📝 *Contrato Assinado!*\n\nO contrato *"${data?.contractTitle || ""}"* foi assinado por *${data?.signedBy || ""}*.`;
        break;
      case "weekly_report":
        message = `📊 *Relatório Semanal*\n\n${data?.summary || "Confira os KPIs da semana no painel."}`;
        break;
      default:
        message = data?.message || "Notificação do ApexConsult.";
    }

    const toPhone = recipientPhone.startsWith("whatsapp:") ? recipientPhone : `whatsapp:${recipientPhone}`;

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const body = new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: toPhone,
      Body: message,
    });

    const twilioResp = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const twilioData = await twilioResp.json();

    if (!twilioResp.ok) {
      return new Response(
        JSON.stringify({ error: "Twilio error", details: twilioData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification in activity_log
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (data?.companyId) {
      await supabase.from("activity_log").insert({
        company_id: data.companyId,
        entity_type: "notification",
        action: `WhatsApp enviado: ${type}`,
        details_json: { type, recipientPhone: toPhone, messageSid: twilioData.sid },
      });
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: twilioData.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
