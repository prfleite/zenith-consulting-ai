import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Create company
    const { data: company } = await supabase.from("companies").insert({
      name: "Zenith Consulting Demo",
      domain: "zenithconsulting.com.br",
      primary_color: "#D4A843",
    }).select().single();

    const companyId = company!.id;

    // 2. Create auth users
    const users = [
      { email: "admin@zenith.demo", name: "Ricardo Almeida", role: "admin", rate: 450 },
      { email: "manager@zenith.demo", name: "Fernanda Costa", role: "manager", rate: 350 },
      { email: "consultant1@zenith.demo", name: "Lucas Oliveira", role: "consultant", rate: 250 },
      { email: "consultant2@zenith.demo", name: "Mariana Santos", role: "consultant", rate: 250 },
      { email: "client1@zenith.demo", name: "João Silva (Portal)", role: "client_user", rate: null },
      { email: "client2@zenith.demo", name: "Ana Martins (Portal)", role: "client_user", rate: null },
    ];

    const profileIds: Record<string, string> = {};

    for (const u of users) {
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: u.email,
        password: "demo123",
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      });

      if (authUser?.user) {
        profileIds[u.email] = authUser.user.id;
        // Update profile with company_id and billing_rate
        await supabase.from("profiles").update({
          company_id: companyId,
          billing_rate: u.rate,
        }).eq("id", authUser.user.id);
      }
    }

    const adminId = profileIds["admin@zenith.demo"];
    const managerId = profileIds["manager@zenith.demo"];
    const c1Id = profileIds["consultant1@zenith.demo"];
    const c2Id = profileIds["consultant2@zenith.demo"];
    const clientUser1Id = profileIds["client1@zenith.demo"];
    const clientUser2Id = profileIds["client2@zenith.demo"];

    // 3. Client Accounts
    const clientsData = [
      { company_id: companyId, name: "TechCorp Brasil", segment: "Enterprise", industry: "Tecnologia", size: "Grande", country: "Brasil", website: "https://techcorp.com.br", annual_revenue: 50000000, owner_id: adminId, health_score: 92 },
      { company_id: companyId, name: "Banco Nova Era", segment: "Enterprise", industry: "Financeiro", size: "Grande", country: "Brasil", website: "https://banconovaera.com", annual_revenue: 120000000, owner_id: managerId, health_score: 85 },
      { company_id: companyId, name: "Varejo Express", segment: "Mid-Market", industry: "Varejo", size: "Média", country: "Brasil", website: "https://varejoexpress.com.br", annual_revenue: 15000000, owner_id: c1Id, health_score: 68 },
      { company_id: companyId, name: "Saúde Prime", segment: "Mid-Market", industry: "Saúde", size: "Média", country: "Brasil", website: "https://saudeprime.com", annual_revenue: 25000000, owner_id: c2Id, health_score: 78 },
      { company_id: companyId, name: "Energia Sustentável", segment: "Enterprise", industry: "Energia", size: "Grande", country: "Brasil", website: "https://energiasust.com", annual_revenue: 80000000, owner_id: adminId, health_score: 45 },
    ];

    const { data: clients } = await supabase.from("client_accounts").insert(clientsData).select();
    const clientIds = clients!.map((c: any) => c.id);

    // 4. Client Contacts (2 per client)
    const contactsData = clients!.flatMap((c: any) => [
      { client_account_id: c.id, name: `Diretor de ${c.name}`, email: `diretor@${c.name.toLowerCase().replace(/\s/g, '')}.com`, phone: "+55 11 9999-0001", role_title: "Diretor Executivo", is_primary: true },
      { client_account_id: c.id, name: `Gerente de ${c.name}`, email: `gerente@${c.name.toLowerCase().replace(/\s/g, '')}.com`, phone: "+55 11 9999-0002", role_title: "Gerente de Projetos", is_primary: false },
    ]);
    await supabase.from("client_contacts").insert(contactsData);

    // 5. Opportunities
    const oppsData = [
      { company_id: companyId, client_account_id: clientIds[0], owner_id: adminId, title: "Transformação Digital Fase 2", stage: "won" as const, expected_value: 450000, probability: 100, close_date: "2026-01-15", tags: ["digital", "estratégia"] },
      { company_id: companyId, client_account_id: clientIds[0], owner_id: managerId, title: "Assessment de Cibersegurança", stage: "proposal" as const, expected_value: 180000, probability: 60, close_date: "2026-04-01", tags: ["segurança", "TI"] },
      { company_id: companyId, client_account_id: clientIds[1], owner_id: adminId, title: "Reestruturação Operacional", stage: "won" as const, expected_value: 620000, probability: 100, close_date: "2025-11-20", tags: ["operações"] },
      { company_id: companyId, client_account_id: clientIds[1], owner_id: managerId, title: "Programa ESG", stage: "negotiation" as const, expected_value: 350000, probability: 70, close_date: "2026-05-01", tags: ["ESG", "sustentabilidade"] },
      { company_id: companyId, client_account_id: clientIds[2], owner_id: c1Id, title: "Otimização de Supply Chain", stage: "qualified" as const, expected_value: 95000, probability: 40, close_date: "2026-06-15", tags: ["logística"] },
      { company_id: companyId, client_account_id: clientIds[2], owner_id: c1Id, title: "Expansão E-commerce", stage: "lead" as const, expected_value: 120000, probability: 20, close_date: "2026-07-01", tags: ["digital", "varejo"] },
      { company_id: companyId, client_account_id: clientIds[3], owner_id: c2Id, title: "Planejamento Estratégico 2027", stage: "proposal" as const, expected_value: 200000, probability: 55, close_date: "2026-04-15", tags: ["estratégia"] },
      { company_id: companyId, client_account_id: clientIds[3], owner_id: c2Id, title: "Melhoria de Processos Clínicos", stage: "won" as const, expected_value: 280000, probability: 100, close_date: "2026-02-01", tags: ["processos", "saúde"] },
      { company_id: companyId, client_account_id: clientIds[4], owner_id: adminId, title: "Due Diligence M&A", stage: "lost" as const, expected_value: 500000, probability: 0, close_date: "2025-12-01", lost_reason: "Orçamento insuficiente", tags: ["M&A"] },
      { company_id: companyId, client_account_id: clientIds[4], owner_id: adminId, title: "Transição Energética", stage: "lead" as const, expected_value: 380000, probability: 15, close_date: "2026-08-01", tags: ["energia", "sustentabilidade"] },
    ];
    const { data: opps } = await supabase.from("opportunities").insert(oppsData).select();
    const oppIds = opps!.map((o: any) => o.id);

    // 6. Projects
    const projectsData = [
      { company_id: companyId, client_account_id: clientIds[0], opportunity_id: oppIds[0], name: "Transformação Digital TechCorp", code: "TC-001", status: "active" as const, start_date: "2026-01-20", end_date_planned: "2026-06-30", project_manager_id: managerId, budget_hours: 800, budget_fee: 450000, description: "Programa completo de transformação digital", objectives: "Digitalizar 80% dos processos core" },
      { company_id: companyId, client_account_id: clientIds[1], opportunity_id: oppIds[2], name: "Reestruturação Banco Nova Era", code: "BN-001", status: "active" as const, start_date: "2025-12-01", end_date_planned: "2026-05-31", project_manager_id: adminId, budget_hours: 1200, budget_fee: 620000, description: "Reestruturação operacional completa", objectives: "Reduzir custos operacionais em 25%" },
      { company_id: companyId, client_account_id: clientIds[2], owner_id: c1Id, name: "Assessment Varejo Express", code: "VE-001", status: "planning" as const, start_date: "2026-04-01", end_date_planned: "2026-05-15", project_manager_id: c1Id, budget_hours: 200, budget_fee: 95000 },
      { company_id: companyId, client_account_id: clientIds[3], opportunity_id: oppIds[7], name: "Processos Clínicos Saúde Prime", code: "SP-001", status: "completed" as const, start_date: "2025-09-01", end_date_planned: "2026-01-31", end_date_actual: "2026-01-28", project_manager_id: c2Id, budget_hours: 600, budget_fee: 280000 },
      { company_id: companyId, client_account_id: clientIds[4], name: "Análise Energética", code: "ES-001", status: "on_hold" as const, start_date: "2025-10-01", end_date_planned: "2026-03-31", project_manager_id: adminId, budget_hours: 400, budget_fee: 200000 },
    ];
    const { data: projects } = await supabase.from("projects").insert(projectsData).select();
    const projIds = projects!.map((p: any) => p.id);

    // 7. Project Members
    await supabase.from("project_members").insert([
      { project_id: projIds[0], user_id: managerId, role: "manager" },
      { project_id: projIds[0], user_id: c1Id, role: "consultant" },
      { project_id: projIds[0], user_id: c2Id, role: "consultant" },
      { project_id: projIds[1], user_id: adminId, role: "manager" },
      { project_id: projIds[1], user_id: managerId, role: "consultant" },
      { project_id: projIds[1], user_id: c1Id, role: "consultant" },
    ]);

    // 8. Project Tasks (20)
    const taskTitles = [
      "Levantamento de requisitos", "Mapeamento de processos AS-IS", "Design da arquitetura TO-BE",
      "Protótipo do sistema", "Testes de aceitação", "Workshop com stakeholders",
      "Análise de gaps", "Plano de implementação", "Migração de dados", "Treinamento da equipe",
      "Revisão de governança", "Benchmark de mercado", "Definição de KPIs",
      "Relatório de diagnóstico", "Plano de comunicação", "Gestão de mudanças",
      "Validação com diretoria", "Entrega parcial fase 1", "Revisão de sprint", "Retrospectiva final",
    ];
    const statuses: Array<"backlog" | "in_progress" | "review" | "done"> = ["backlog", "in_progress", "review", "done"];
    const priorities: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];
    const assignees = [adminId, managerId, c1Id, c2Id];

    const tasksData = taskTitles.map((title, i) => ({
      project_id: projIds[i % 2], // distribute between first 2 active projects
      title,
      status: statuses[i % 4],
      priority: priorities[i % 4],
      assignee_id: assignees[i % 4],
      effort_hours_estimated: 8 + (i * 2),
      effort_hours_actual: i < 10 ? 6 + (i * 1.5) : null,
      due_date: `2026-0${Math.min(3 + Math.floor(i / 5), 6)}-${String(1 + (i * 2) % 28).padStart(2, '0')}`,
      is_milestone: i % 5 === 4,
    }));
    const { data: tasks } = await supabase.from("project_tasks").insert(tasksData).select();
    const taskIds = tasks!.map((t: any) => t.id);

    // 9. Time Entries (50)
    const timeEntries = [];
    for (let i = 0; i < 50; i++) {
      timeEntries.push({
        user_id: assignees[i % 4],
        project_id: projIds[i % 2],
        task_id: taskIds[i % 20],
        date: `2026-0${1 + Math.floor(i / 20)}-${String(1 + (i % 28)).padStart(2, '0')}`,
        hours: 2 + (i % 8),
        billable: i % 5 !== 0,
        notes: `Trabalho no ${taskTitles[i % 20]}`,
        approval_status: i < 30 ? "approved" as const : "pending" as const,
        approved_by: i < 30 ? adminId : null,
      });
    }
    await supabase.from("time_entries").insert(timeEntries);

    // 10. Expenses (10)
    const categories = ["Viagem", "Alimentação", "Software", "Material", "Hospedagem"];
    const expensesData = [];
    for (let i = 0; i < 10; i++) {
      expensesData.push({
        project_id: projIds[i % 2],
        user_id: assignees[i % 4],
        date: `2026-0${1 + Math.floor(i / 5)}-${String(5 + i * 3).padStart(2, '0')}`,
        amount: 150 + (i * 120),
        category: categories[i % 5],
        description: `${categories[i % 5]} - Projeto ${i % 2 === 0 ? 'TechCorp' : 'Banco Nova Era'}`,
        approval_status: i < 6 ? "approved" as const : "pending" as const,
        approved_by: i < 6 ? adminId : null,
      });
    }
    await supabase.from("expenses").insert(expensesData);

    // 11. Invoices (5)
    const invoicesData = [
      { company_id: companyId, client_account_id: clientIds[0], project_id: projIds[0], number: "INV-2026-001", amount: 112500, issue_date: "2026-01-31", due_date: "2026-02-28", status: "paid" as const },
      { company_id: companyId, client_account_id: clientIds[0], project_id: projIds[0], number: "INV-2026-002", amount: 112500, issue_date: "2026-02-28", due_date: "2026-03-31", status: "sent" as const },
      { company_id: companyId, client_account_id: clientIds[1], project_id: projIds[1], number: "INV-2026-003", amount: 155000, issue_date: "2026-01-31", due_date: "2026-02-28", status: "paid" as const },
      { company_id: companyId, client_account_id: clientIds[1], project_id: projIds[1], number: "INV-2026-004", amount: 155000, issue_date: "2026-02-28", due_date: "2026-03-31", status: "overdue" as const },
      { company_id: companyId, client_account_id: clientIds[3], project_id: projIds[3], number: "INV-2026-005", amount: 280000, issue_date: "2026-02-01", due_date: "2026-03-01", status: "paid" as const },
    ];
    await supabase.from("invoices").insert(invoicesData);

    // 12. Documents (8)
    const docsData = [
      { company_id: companyId, title: "Proposta Transformação Digital TechCorp", type: "proposal" as const, related_project_id: projIds[0], related_client_account_id: clientIds[0], content_text: "Proposta técnica e comercial para o programa de transformação digital...", created_by_id: adminId, is_public_to_client: true },
      { company_id: companyId, title: "Proposta Reestruturação Banco Nova Era", type: "proposal" as const, related_project_id: projIds[1], related_client_account_id: clientIds[1], content_text: "Proposta de reestruturação operacional...", created_by_id: adminId, is_public_to_client: true },
      { company_id: companyId, title: "Playbook: Transformação Digital", type: "internal_playbook" as const, content_text: "Metodologia proprietária para projetos de transformação digital. Inclui frameworks, templates e checklists.", created_by_id: adminId },
      { company_id: companyId, title: "Playbook: Due Diligence", type: "internal_playbook" as const, content_text: "Guia completo para condução de due diligence em operações de M&A.", created_by_id: managerId },
      { company_id: companyId, title: "Ata: Kickoff TechCorp", type: "meeting_notes" as const, related_project_id: projIds[0], related_client_account_id: clientIds[0], content_text: "Reunião de kickoff realizada em 20/01/2026. Participantes: Ricardo, Fernanda, Lucas...", created_by_id: managerId, is_public_to_client: true },
      { company_id: companyId, title: "Ata: Sprint Review Banco Nova Era", type: "meeting_notes" as const, related_project_id: projIds[1], related_client_account_id: clientIds[1], content_text: "Sprint review da semana 8. Entregas concluídas: mapeamento de processos...", created_by_id: c1Id },
      { company_id: companyId, title: "Relatório Diagnóstico TechCorp", type: "report" as const, related_project_id: projIds[0], related_client_account_id: clientIds[0], content_text: "Diagnóstico detalhado da maturidade digital da TechCorp...", created_by_id: c1Id, is_public_to_client: true },
      { company_id: companyId, title: "Relatório de Progresso Banco Nova Era", type: "report" as const, related_project_id: projIds[1], related_client_account_id: clientIds[1], content_text: "Relatório mensal de progresso. Fevereiro 2026.", created_by_id: managerId, is_public_to_client: true },
    ];
    await supabase.from("documents").insert(docsData);

    // 13. NPS Surveys (3)
    await supabase.from("nps_surveys").insert([
      { company_id: companyId, client_account_id: clientIds[0], project_id: projIds[0], score: 9, comment: "Excelente trabalho da equipe. Muito profissionais.", responded_by_name: "Carlos Silva" },
      { company_id: companyId, client_account_id: clientIds[1], project_id: projIds[1], score: 8, comment: "Bom progresso, mas comunicação poderia ser melhor.", responded_by_name: "Roberto Santos" },
      { company_id: companyId, client_account_id: clientIds[3], project_id: projIds[3], score: 10, comment: "Superou todas as expectativas!", responded_by_name: "Dr. Paulo Mendes" },
    ]);

    // 14. Client Portal Access
    await supabase.from("client_portal_access").insert([
      { user_id: clientUser1Id, client_account_id: clientIds[0] },
      { user_id: clientUser2Id, client_account_id: clientIds[1] },
    ]);

    // 15. Activity Log
    await supabase.from("activity_log").insert([
      { company_id: companyId, user_id: adminId, action: "created", entity_type: "client_account", entity_id: clientIds[0], details_json: { name: "TechCorp Brasil" } },
      { company_id: companyId, user_id: adminId, action: "created", entity_type: "opportunity", entity_id: oppIds[0], details_json: { title: "Transformação Digital Fase 2" } },
      { company_id: companyId, user_id: managerId, action: "updated", entity_type: "project", entity_id: projIds[0], details_json: { field: "status", from: "planning", to: "active" } },
      { company_id: companyId, user_id: c1Id, action: "created", entity_type: "document", details_json: { title: "Relatório Diagnóstico TechCorp" } },
    ]);

    return new Response(JSON.stringify({ success: true, message: "Seed completed!", companyId, userCount: Object.keys(profileIds).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Seed error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
