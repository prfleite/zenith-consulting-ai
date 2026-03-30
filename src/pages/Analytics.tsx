import { useState, useEffect, useMemo } from "react";
import { BarChart3, DollarSign, Users, Star, FolderKanban, Megaphone, Brain, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAIChat } from "@/lib/ai/useAIChat";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(43, 74%, 55%)", "hsl(220, 70%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)", "hsl(38, 92%, 50%)"];
const tooltipStyle = { background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(40, 10%, 92%)" };

const Analytics = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [nps, setNps] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("invoices").select("*, client_accounts(name)").order("issue_date"),
      supabase.from("time_entries").select("*, profiles(name), projects(name)").order("date"),
      supabase.from("nps_surveys").select("*").order("created_at"),
      supabase.from("projects").select("*, client_accounts(name)"),
      supabase.from("profiles").select("id, name, role, billing_rate").neq("role", "client_user").eq("active", true),
      supabase.from("opportunities").select("*, client_accounts(name)"),
      supabase.from("marketing_campaigns").select("*"),
      supabase.from("ai_usage_logs").select("*").order("created_at"),
      supabase.from("project_tasks").select("*, projects(name)"),
    ]).then(([iR, tR, nR, pR, prR, oR, cR, aR, tkR]) => {
      setInvoices(iR.data || []);
      setTimeEntries(tR.data || []);
      setNps(nR.data || []);
      setProjects(pR.data || []);
      setProfiles(prR.data || []);
      setOpportunities(oR.data || []);
      setCampaigns(cR.data || []);
      setAiUsage(aR.data || []);
      setTasks(tkR.data || []);
    });
  }, []);

  // === FINANCIAL ===
  const revenueByClient = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.status === "paid").forEach(i => {
      const n = i.client_accounts?.name || "?";
      map[n] = (map[n] || 0) + Number(i.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name: name.slice(0, 15), value }));
  }, [invoices]);

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, { month: string; received: number; billed: number }> = {};
    invoices.forEach(i => {
      const m = i.issue_date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, received: 0, billed: 0 };
      if (i.status === "paid") map[m].received += Number(i.amount);
      else map[m].billed += Number(i.amount);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [invoices]);

  const projectMargins = useMemo(() => {
    return projects.filter(p => p.budget_fee).map(p => {
      const te = timeEntries.filter(t => t.project_id === p.id);
      const hours = te.reduce((s, t) => s + Number(t.hours), 0);
      const cost = hours * 150;
      const revenue = Number(p.budget_fee);
      return { name: (p.name || "").slice(0, 12), revenue: revenue / 1000, margin: revenue > 0 ? Math.round((revenue - cost) / revenue * 100) : 0 };
    });
  }, [projects, timeEntries]);

  const avgPaymentDays = useMemo(() => {
    const map: Record<string, number[]> = {};
    invoices.filter(i => i.status === "paid" && i.due_date).forEach(i => {
      const n = i.client_accounts?.name || "?";
      const due = new Date(i.due_date);
      const issue = new Date(i.issue_date);
      const days = Math.round((due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
      if (!map[n]) map[n] = [];
      map[n].push(days);
    });
    return Object.entries(map).map(([name, days]) => ({ name: name.slice(0, 12), days: Math.round(days.reduce((s, d) => s + d, 0) / days.length) })).slice(0, 8);
  }, [invoices]);

  // === PROJECTS ===
  const hoursEstVsReal = useMemo(() => {
    return projects.filter(p => p.budget_hours).map(p => {
      const actual = timeEntries.filter(t => t.project_id === p.id).reduce((s, t) => s + Number(t.hours), 0);
      return { name: (p.name || "").slice(0, 12), estimated: Number(p.budget_hours), actual };
    });
  }, [projects, timeEntries]);

  const projectsByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    const labels: Record<string, string> = { active: "Ativo", planning: "Planejamento", on_hold: "Pausado", completed: "Concluído", cancelled: "Cancelado" };
    projects.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ name: labels[status] || status, value: count }));
  }, [projects]);

  const consultantProductivity = useMemo(() => {
    return profiles.filter(p => p.role === "consultant").map(p => {
      const entries = timeEntries.filter(t => t.user_id === p.id);
      const billable = entries.filter(t => t.billable).reduce((s, t) => s + Number(t.hours), 0);
      const total = entries.reduce((s, t) => s + Number(t.hours), 0);
      return { name: p.name.split(" ")[0], billable, total, productivity: total > 0 ? Math.round(billable / total * 100) : 0 };
    });
  }, [profiles, timeEntries]);

  // === CRM ===
  const conversionByStage = useMemo(() => {
    const stages = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
    const labels: Record<string, string> = { lead: "Lead", qualified: "Qualificado", proposal: "Proposta", negotiation: "Negociação", won: "Ganho", lost: "Perdido" };
    return stages.map(s => ({ stage: labels[s], count: opportunities.filter(o => o.stage === s).length }));
  }, [opportunities]);

  const dealsByConsultant = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number }> = {};
    opportunities.forEach(o => {
      const owner = profiles.find(p => p.id === o.owner_id);
      const name = owner?.name?.split(" ")[0] || "?";
      if (!map[name]) map[name] = { name, value: 0, count: 0 };
      map[name].value += Number(o.expected_value || 0);
      map[name].count += 1;
    });
    return Object.values(map);
  }, [opportunities, profiles]);

  // === TEAM ===
  const utilizationByConsultant = useMemo(() => {
    return profiles.filter(p => ["consultant", "manager"].includes(p.role)).map(p => {
      const entries = timeEntries.filter(t => t.user_id === p.id);
      const billable = entries.filter(t => t.billable).reduce((s, t) => s + Number(t.hours), 0);
      const nonBillable = entries.filter(t => !t.billable).reduce((s, t) => s + Number(t.hours), 0);
      return { name: p.name.split(" ")[0], billable, nonBillable };
    });
  }, [profiles, timeEntries]);

  // === MARKETING ===
  const roiByChannel = useMemo(() => {
    const map: Record<string, { type: string; roas: number; spent: number; conversions: number }> = {};
    campaigns.forEach(c => {
      if (!map[c.type]) map[c.type] = { type: c.type, roas: 0, spent: 0, conversions: 0 };
      map[c.type].roas += Number(c.roas || 0);
      map[c.type].spent += Number(c.spent || 0);
      map[c.type].conversions += Number(c.conversions || 0);
    });
    return Object.values(map);
  }, [campaigns]);

  // === AI ===
  const aiByMonth = useMemo(() => {
    const map: Record<string, { month: string; cost: number; count: number }> = {};
    aiUsage.forEach(a => {
      const m = a.created_at?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, cost: 0, count: 0 };
      map[m].cost += Number(a.cost_usd || 0);
      map[m].count += 1;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [aiUsage]);

  const aiByModel = useMemo(() => {
    const map: Record<string, { model: string; count: number; cost: number }> = {};
    aiUsage.forEach(a => {
      const model = a.model_name || "?";
      if (!map[model]) map[model] = { model, count: 0, cost: 0 };
      map[model].count += 1;
      map[model].cost += Number(a.cost_usd || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [aiUsage]);

  const aiByContext = useMemo(() => {
    const map: Record<string, number> = {};
    aiUsage.forEach(a => { map[a.context_type] = (map[a.context_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [aiUsage]);

  const avgNps = nps.length ? (nps.reduce((s, n) => s + n.score, 0) / nps.length).toFixed(1) : "—";

  // AI Insights
  const { messages: aiMessages, isLoading: aiLoading, sendMessage: aiSend } = useAIChat({ contextType: "global" });
  const [insightsGenerated, setInsightsGenerated] = useState(false);

  useEffect(() => {
    if (invoices.length > 0 && !insightsGenerated && aiMessages.length === 0) {
      const totalRev = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
      const totalPending = invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
      const activeProj = projects.filter(p => p.status === "active").length;
      const wonOps = opportunities.filter(o => o.stage === "won").length;
      const convRate = opportunities.length > 0 ? Math.round(wonOps / opportunities.length * 100) : 0;
      const kpiContext = `KPIs atuais:\n- Receita recebida: R$ ${totalRev.toLocaleString("pt-BR")}\n- Pendente: R$ ${totalPending.toLocaleString("pt-BR")}\n- Projetos ativos: ${activeProj}\n- NPS médio: ${avgNps}\n- Taxa conversão: ${convRate}%\n- Oportunidades: ${opportunities.length}\n- Campanhas ativas: ${campaigns.filter(c => c.status === "active").length}`;
      aiSend("Analise os KPIs e gere 3-5 insights concisos (tendências, anomalias, recomendações). Seja direto e prático. Use bullets.", kpiContext);
      setInsightsGenerated(true);
    }
  }, [invoices, projects, opportunities, campaigns, nps]);

  const npsOverTime = useMemo(() => {
    const map: Record<string, number[]> = {};
    nps.forEach(n => {
      const m = n.created_at?.slice(0, 7);
      if (m) { if (!map[m]) map[m] = []; map[m].push(n.score); }
    });
    return Object.entries(map).sort().map(([month, scores]) => ({ month, avg: Number((scores.reduce((s, n) => s + n, 0) / scores.length).toFixed(1)) }));
  }, [nps]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gradient-gold">Analytics Avançado</h1>
        <p className="text-muted-foreground mt-1">Análises detalhadas por área</p>
      </div>

      {/* AI Insights Panel */}
      {(aiLoading || aiMessages.length > 0) && (
        <div className="bg-card rounded-xl p-5 border border-gold/20 shadow-gold">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-heading font-semibold text-foreground">Insights IA</h3>
            {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-gold ml-2" />}
          </div>
          {aiMessages.filter(m => m.role === "assistant").map((m, i) => (
            <pre key={i} className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{m.content}</pre>
          ))}
        </div>
      )}

      <Tabs defaultValue="financial">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="financial"><DollarSign className="w-4 h-4 mr-1" />Financeiro</TabsTrigger>
          <TabsTrigger value="projects"><FolderKanban className="w-4 h-4 mr-1" />Projetos</TabsTrigger>
          <TabsTrigger value="crm"><BarChart3 className="w-4 h-4 mr-1" />CRM</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-1" />Equipe</TabsTrigger>
          <TabsTrigger value="marketing"><Megaphone className="w-4 h-4 mr-1" />Marketing</TabsTrigger>
          <TabsTrigger value="ai"><Brain className="w-4 h-4 mr-1" />IA & Uso</TabsTrigger>
        </TabsList>

        {/* FINANCIAL */}
        <TabsContent value="financial" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita por Cliente (Top 10)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByClient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis type="number" stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
                  <Bar dataKey="value" fill="hsl(43, 74%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">MRR Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="goldGA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="received" stroke="hsl(43, 74%, 55%)" fill="url(#goldGA)" strokeWidth={2} name="Recebido" />
                  <Area type="monotone" dataKey="billed" stroke="hsl(220, 70%, 50%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Faturado" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Margem por Projeto (%)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectMargins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="margin" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Dias Médios de Pagamento</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={avgPaymentDays} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis type="number" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="days" fill="hsl(220, 70%, 50%)" radius={[0, 4, 4, 0]} name="Dias" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Horas Estimadas vs Reais</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hoursEstVsReal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="estimated" fill="hsl(220, 70%, 50%)" name="Estimado" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="hsl(43, 74%, 55%)" name="Real" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Projetos por Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={projectsByStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {projectsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Produtividade por Consultor</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={consultantProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="productivity" fill="hsl(43, 74%, 55%)" radius={[4, 4, 0, 0]} name="Produtividade %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* CRM */}
        <TabsContent value="crm" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Funil de Conversão</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="stage" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="hsl(43, 74%, 55%)" radius={[4, 4, 0, 0]} name="Deals" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Deals por Consultor</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dealsByConsultant}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Valor Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Oportunidades", value: opportunities.length },
              { label: "Ganhas", value: opportunities.filter(o => o.stage === "won").length },
              { label: "Taxa Conversão", value: `${opportunities.length > 0 ? Math.round(opportunities.filter(o => o.stage === "won").length / opportunities.length * 100) : 0}%` },
            ].map(m => (
              <div key={m.label} className="bg-card rounded-xl p-5 border border-border text-center">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <p className="text-3xl font-bold text-foreground mt-2">{m.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-6 mt-4">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Horas por Consultor (Billable vs Não)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={utilizationByConsultant}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="billable" stackId="a" fill="hsl(43, 74%, 55%)" name="Billable" />
                <Bar dataKey="nonBillable" stackId="a" fill="hsl(220, 14%, 30%)" name="Não-billable" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {profiles.filter(p => ["consultant", "manager"].includes(p.role)).map(p => {
              const entries = timeEntries.filter(t => t.user_id === p.id);
              const billable = entries.filter(t => t.billable).reduce((s, t) => s + Number(t.hours), 0);
              const total = entries.reduce((s, t) => s + Number(t.hours), 0);
              const util = total > 0 ? Math.round((billable / total) * 100) : 0;
              return (
                <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.role}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-2xl font-bold text-foreground">{util}%</span>
                    <span className="text-xs text-muted-foreground">{billable}h / {total}h</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
                    <div className={`h-full rounded-full ${util > 80 ? "bg-success" : util > 50 ? "bg-gold" : "bg-warning"}`} style={{ width: `${Math.min(util, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* MARKETING */}
        <TabsContent value="marketing" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">ROI por Canal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiByChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="type" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="roas" fill="hsl(43, 74%, 55%)" radius={[4, 4, 0, 0]} name="ROAS" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Conversões por Canal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={roiByChannel} cx="50%" cy="50%" outerRadius={100} dataKey="conversions" label={({ type, conversions }) => `${type}: ${conversions}`} nameKey="type">
                    {roiByChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Campanhas Ativas", value: campaigns.filter(c => c.status === "active").length },
              { label: "Total Investido", value: `R$ ${(campaigns.reduce((s, c) => s + Number(c.spent || 0), 0) / 1000).toFixed(0)}k` },
              { label: "Total Conversões", value: campaigns.reduce((s, c) => s + Number(c.conversions || 0), 0) },
            ].map(m => (
              <div key={m.label} className="bg-card rounded-xl p-5 border border-border text-center">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <p className="text-3xl font-bold text-foreground mt-2">{m.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* AI & USAGE */}
        <TabsContent value="ai" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-5 border border-border text-center">
              <span className="text-xs text-muted-foreground">Total Operações IA</span>
              <p className="text-3xl font-bold text-foreground mt-2">{aiUsage.length}</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border text-center">
              <span className="text-xs text-muted-foreground">Custo Total</span>
              <p className="text-3xl font-bold text-foreground mt-2">${aiUsage.reduce((s, a) => s + Number(a.cost_usd || 0), 0).toFixed(2)}</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border text-center">
              <span className="text-xs text-muted-foreground">Tokens Consumidos</span>
              <p className="text-3xl font-bold text-foreground mt-2">{((aiUsage.reduce((s, a) => s + Number(a.input_tokens || 0) + Number(a.output_tokens || 0), 0)) / 1000).toFixed(0)}k</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Custo IA por Mês</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={aiByMonth}>
                  <defs>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="cost" stroke="hsl(262, 83%, 58%)" fill="url(#aiGrad)" strokeWidth={2} name="Custo USD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Operações por Contexto</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={aiByContext} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {aiByContext.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Uso por Modelo</h3>
            <div className="space-y-3">
              {aiByModel.map(m => (
                <div key={m.model} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">{m.model}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{m.count} usos</span>
                    <span className="text-sm font-medium text-gold">${m.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
              {aiByModel.length === 0 && <p className="text-sm text-muted-foreground">Nenhum uso de IA registrado.</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
