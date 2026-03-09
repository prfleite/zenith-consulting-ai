import { useState, useEffect, useMemo, useRef } from "react";
import { TrendingUp, Users, FolderKanban, DollarSign, Clock, Sparkles, Brain, Bell, AlertTriangle, Info, ChevronRight, Zap, Target, Star, CreditCard } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIChat } from "@/lib/ai/useAIChat";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CHART_COLORS = ["hsl(43, 74%, 55%)", "hsl(220, 70%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)", "hsl(38, 92%, 50%)"];
const tooltipStyle = { background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(40, 10%, 92%)" };

const Dashboard = () => {
  const { profile } = useAuth();
  const [clientCount, setClientCount] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [pipelineDeals, setPipelineDeals] = useState(0);
  const [weekHours, setWeekHours] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [npsData, setNpsData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const { messages, isLoading: aiLoading, sendMessage } = useAIChat({ contextType: "executive_briefing" });
  const briefingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [cRes, pRes, pAllRes, oRes, iRes, aRes, tpRes, nRes, alRes, aiRes, teRes, prRes, mcRes] = await Promise.all([
        supabase.from("client_accounts").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("projects").select("id, name, status, budget_fee, budget_hours, start_date, end_date_planned, client_accounts(name)"),
        supabase.from("opportunities").select("*").in("stage", ["lead", "qualified", "proposal", "negotiation"]),
        supabase.from("invoices").select("amount, status, issue_date").order("issue_date", { ascending: false }),
        supabase.from("activity_log").select("action, entity_type, created_at, details_json").order("created_at", { ascending: false }).limit(8),
        supabase.from("projects").select("id, name, status, client_accounts(name)").eq("status", "active").limit(5),
        supabase.from("nps_surveys").select("score, comment, responded_by_name, created_at"),
        supabase.from("ai_alerts").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("ai_usage_logs").select("cost_usd, model_name, created_at"),
        supabase.from("time_entries").select("hours, billable, date, user_id"),
        supabase.from("profiles").select("id, name, role, billing_rate").neq("role", "client_user").eq("active", true),
        supabase.from("marketing_campaigns").select("type, roas, spent, status").eq("status", "active"),
      ]);
      setClientCount(cRes.count || 0);
      setActiveProjects(pRes.count || 0);
      setTotalProjects((pAllRes.data || []).length);
      const opps = oRes.data || [];
      setOpportunities(opps);
      setPipelineValue(opps.reduce((s, o) => s + Number(o.expected_value || 0), 0));
      setPipelineDeals(opps.length);
      setInvoices(iRes.data || []);
      setActivities(aRes.data || []);
      setTopProjects(tpRes.data || []);
      setNpsData(nRes.data || []);
      setAlerts(alRes.data || []);
      setAiUsage(aiRes.data || []);
      setTimeEntries(teRes.data || []);
      setProfiles(prRes.data || []);
      setCampaigns(mcRes.data || []);

      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const weekEntries = (teRes.data || []).filter((e: any) => e.date >= monday.toISOString().split("T")[0]);
      setWeekHours(weekEntries.reduce((s: number, e: any) => s + Number(e.hours), 0));
    };
    fetchAll();
  }, []);

  const totalReceived = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalBilled = invoices.filter(i => i.status === "sent").reduce((s, i) => s + Number(i.amount), 0);

  // Revenue chart 12 months
  const revenueChart = useMemo(() => {
    const months: Record<string, { month: string; received: number; billed: number }> = {};
    invoices.forEach(inv => {
      const m = inv.issue_date?.slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { month: m, received: 0, billed: 0 };
      if (inv.status === "paid") months[m].received += Number(inv.amount);
      if (inv.status === "sent") months[m].billed += Number(inv.amount);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [invoices]);

  // Pipeline funnel
  const funnelData = useMemo(() => {
    const stages = ["lead", "qualified", "proposal", "negotiation"];
    const labels: Record<string, string> = { lead: "Leads", qualified: "Qualificado", proposal: "Proposta", negotiation: "Negociação" };
    return stages.map(s => ({
      stage: labels[s],
      count: opportunities.filter(o => o.stage === s).length,
      value: opportunities.filter(o => o.stage === s).reduce((sum, o) => sum + Number(o.expected_value || 0), 0),
    }));
  }, [opportunities]);

  // Project status donut
  const projectStatusData = useMemo(() => {
    const statusMap: Record<string, string> = { active: "Ativo", planning: "Planejamento", on_hold: "Pausado", completed: "Concluído", cancelled: "Cancelado" };
    const counts: Record<string, number> = {};
    topProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ name: statusMap[status] || status, value: count }));
  }, [topProjects]);

  // Utilization
  const teamUtilization = useMemo(() => {
    const consultants = profiles.filter(p => p.role === "consultant" || p.role === "manager");
    const totalAvailableHours = consultants.length * 40; // 40h/week
    const billableHours = timeEntries.filter(t => t.billable).reduce((s, t) => s + Number(t.hours), 0);
    const totalHours = timeEntries.reduce((s, t) => s + Number(t.hours), 0);
    return { pct: totalAvailableHours > 0 ? Math.round((billableHours / totalAvailableHours) * 100) : 0, billable: billableHours, total: totalHours };
  }, [timeEntries, profiles]);

  // NPS
  const avgNps = npsData.length ? (npsData.reduce((s, n) => s + n.score, 0) / npsData.length).toFixed(1) : "—";

  // AI usage this month
  const monthAiCost = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return aiUsage.filter(a => a.created_at?.startsWith(thisMonth)).reduce((s, a) => s + Number(a.cost_usd || 0), 0);
  }, [aiUsage]);

  const topModel = useMemo(() => {
    const map: Record<string, number> = {};
    aiUsage.forEach(a => { map[a.model_name] = (map[a.model_name] || 0) + 1; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "—";
  }, [aiUsage]);

  // Marketing ROAS
  const marketingRoas = useMemo(() => {
    const map: Record<string, { type: string; roas: number; spent: number }> = {};
    campaigns.forEach(c => {
      if (!map[c.type]) map[c.type] = { type: c.type, roas: 0, spent: 0 };
      map[c.type].roas += Number(c.roas || 0);
      map[c.type].spent += Number(c.spent || 0);
    });
    return Object.values(map);
  }, [campaigns]);

  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  const generateBriefing = async () => {
    setShowBriefing(true);
    const context = `KPIs atuais:\n- Clientes: ${clientCount}\n- Projetos ativos: ${activeProjects}\n- Pipeline: R$ ${pipelineValue.toLocaleString()} (${pipelineDeals} deals)\n- Receita recebida: R$ ${totalReceived.toLocaleString()}\n- Horas esta semana: ${weekHours}h\n- Utilização: ${teamUtilization.pct}%\n- NPS médio: ${avgNps}\n- Custo IA este mês: $${monthAiCost.toFixed(2)}\n\nAlertas: ${alerts.slice(0, 3).map(a => a.title).join("; ")}`;
    await sendMessage("Gere um briefing executivo semanal completo com análise dos KPIs, riscos, oportunidades e recomendações estratégicas.", context);
  };

  const severityIcon = (s: string) => {
    if (s === "critical") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (s === "warning") return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <Info className="w-4 h-4 text-info" />;
  };

  const metrics = [
    { label: "Receita MRR", value: `R$ ${(totalReceived / 1000).toFixed(0)}k`, sub: `+R$ ${(totalBilled / 1000).toFixed(0)}k pendente`, icon: DollarSign, color: "text-gold" },
    { label: "Pipeline", value: `R$ ${(pipelineValue / 1000).toFixed(0)}k`, sub: `${pipelineDeals} deals ativos`, icon: Target, color: "text-info" },
    { label: "Projetos Ativos", value: String(activeProjects), sub: `de ${totalProjects} total`, icon: FolderKanban, color: "text-success" },
    { label: "Utilização Equipe", value: `${teamUtilization.pct}%`, sub: `${weekHours}h esta semana`, icon: Users, color: "text-gold" },
    { label: "NPS Clientes", value: avgNps, sub: `${npsData.length} avaliações`, icon: Star, color: "text-warning" },
    { label: "Créditos IA", value: `$${monthAiCost.toFixed(2)}`, sub: topModel !== "—" ? `Top: ${topModel.split("/").pop()}` : "Nenhum uso", icon: CreditCard, color: "text-accent" },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Visão estratégica da sua consultoria</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="gold-outline" size="sm" onClick={generateBriefing} disabled={aiLoading}>
            <Sparkles className="w-4 h-4" /> {aiLoading ? "Gerando..." : "Briefing IA"}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" /> {weekHours}h esta semana
          </div>
        </div>
      </div>

      {/* AI Briefing */}
      {showBriefing && messages.length > 0 && (
        <div className="bg-card rounded-xl border border-gold-subtle p-6 shadow-gold">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-gold" />
            <h3 className="font-heading font-semibold text-foreground">Briefing Executivo IA</h3>
            {aiLoading && <div className="w-2 h-2 rounded-full bg-gold animate-pulse ml-auto" />}
          </div>
          <div ref={briefingRef} className="max-h-[300px] overflow-y-auto">
            {messages.filter(m => m.role === "assistant").map((msg, i) => (
              <div key={i} className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metrics - 6 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-card rounded-xl p-4 border border-border hover:border-gold-subtle transition-all duration-300 shadow-card group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">{m.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={11} />
              <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="received" stroke="hsl(43, 74%, 55%)" fill="url(#goldGradient)" strokeWidth={2} name="Recebido" />
              <Area type="monotone" dataKey="billed" stroke="hsl(220, 70%, 50%)" fill="url(#blueGradient)" strokeWidth={1.5} name="Faturado" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Funil de Vendas</h3>
          <div className="space-y-3">
            {funnelData.map((f, i) => {
              const maxCount = Math.max(...funnelData.map(d => d.count), 1);
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">{f.count} · R$ {(f.value / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(f.count / maxCount) * 100}%`, background: CHART_COLORS[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Marketing ROAS */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">ROAS por Canal</h3>
          {marketingRoas.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marketingRoas}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="type" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="roas" fill="hsl(43, 74%, 55%)" radius={[4, 4, 0, 0]} name="ROAS" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma campanha ativa.</p>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-foreground">Alertas IA</h3>
            {unreadAlerts > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/20 text-destructive font-medium">{unreadAlerts}</span>
            )}
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {alerts.length > 0 ? alerts.slice(0, 5).map(a => (
              <div key={a.id} className={`flex items-start gap-3 p-2 rounded-lg ${!a.is_read ? "bg-secondary/50" : ""}`}>
                {severityIcon(a.severity)}
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum alerta.</p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Atividade Recente</h3>
          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {activities.length > 0 ? activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.entity_type} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Project Health - At Risk */}
      <ProjectHealthWidget />

      {/* Top Projects */}
      {topProjects.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-foreground">Projetos em Destaque</h3>
            <Link to="/projects" className="text-sm text-gold hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topProjects.map((p: any) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="bg-secondary rounded-lg p-4 hover:bg-secondary/80 transition-colors">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.client_accounts?.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success mt-2 inline-block capitalize">{p.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
