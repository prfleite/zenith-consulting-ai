import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Users, FolderKanban, DollarSign, Clock, Sparkles, Brain,
  AlertTriangle, Info, ChevronRight, Zap, Target, Star, CreditCard, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIChat } from "@/lib/ai/useAIChat";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { KPICard } from "@/components/KPICard";

const CHART_COLORS = [
  "hsl(43, 74%, 55%)",
  "hsl(210, 80%, 55%)",
  "hsl(152, 60%, 45%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(38, 92%, 50%)",
];

const tooltipStyle = {
  background: "hsl(220, 20%, 11%)",
  border: "1px solid hsl(43, 74%, 55%, 0.2)",
  borderRadius: "10px",
  color: "hsl(40, 12%, 93%)",
  boxShadow: "0 8px 32px hsl(0,0%,0%,0.4)",
  padding: "10px 14px",
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

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

  const funnelData = useMemo(() => {
    const stages = ["lead", "qualified", "proposal", "negotiation"];
    const labels: Record<string, string> = { lead: "Leads", qualified: "Qualificado", proposal: "Proposta", negotiation: "Negociação" };
    return stages.map(s => ({
      stage: labels[s],
      count: opportunities.filter(o => o.stage === s).length,
      value: opportunities.filter(o => o.stage === s).reduce((sum, o) => sum + Number(o.expected_value || 0), 0),
    }));
  }, [opportunities]);

  const teamUtilization = useMemo(() => {
    const consultants = profiles.filter(p => p.role === "consultant" || p.role === "manager");
    const totalAvailableHours = consultants.length * 40;
    const billableHours = timeEntries.filter(t => t.billable).reduce((s, t) => s + Number(t.hours), 0);
    const totalHours = timeEntries.reduce((s, t) => s + Number(t.hours), 0);
    return {
      pct: totalAvailableHours > 0 ? Math.round((billableHours / totalAvailableHours) * 100) : 0,
      billable: billableHours,
      total: totalHours,
    };
  }, [timeEntries, profiles]);

  const avgNps = npsData.length
    ? (npsData.reduce((s, n) => s + n.score, 0) / npsData.length).toFixed(1)
    : "—";

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
    const context = `KPIs:\n- Clientes: ${clientCount}\n- Projetos ativos: ${activeProjects}\n- Pipeline: R$ ${pipelineValue.toLocaleString()} (${pipelineDeals} deals)\n- Receita recebida: R$ ${totalReceived.toLocaleString()}\n- Horas esta semana: ${weekHours}h\n- Utilização: ${teamUtilization.pct}%\n- NPS médio: ${avgNps}\n- Custo IA este mês: $${monthAiCost.toFixed(2)}\n\nAlertas: ${alerts.slice(0, 3).map(a => a.title).join("; ")}`;
    await sendMessage("Gere um briefing executivo semanal completo com análise dos KPIs, riscos, oportunidades e recomendações estratégicas.", context);
  };

  const severityIcon = (s: string) => {
    if (s === "critical") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (s === "warning") return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <Info className="w-4 h-4 text-info" />;
  };

  const kpiCards = [
    {
      label: "Receita Recebida",
      value: `R$ ${(totalReceived / 1000).toFixed(0)}k`,
      numericValue: Math.round(totalReceived / 1000),
      sub: `+R$ ${(totalBilled / 1000).toFixed(0)}k pendente`,
      icon: DollarSign,
      iconColor: "text-gold",
    },
    {
      label: "Pipeline Total",
      value: `R$ ${(pipelineValue / 1000).toFixed(0)}k`,
      numericValue: Math.round(pipelineValue / 1000),
      sub: `${pipelineDeals} deals ativos`,
      icon: Target,
      iconColor: "text-info",
    },
    {
      label: "Projetos Ativos",
      value: String(activeProjects),
      numericValue: activeProjects,
      sub: `de ${totalProjects} no total`,
      icon: FolderKanban,
      iconColor: "text-success",
    },
    {
      label: "Utilização Equipe",
      value: `${teamUtilization.pct}%`,
      numericValue: teamUtilization.pct,
      sub: `${weekHours}h esta semana`,
      icon: Users,
      iconColor: "text-gold",
    },
    {
      label: "NPS Médio",
      value: String(avgNps),
      sub: `${npsData.length} avaliações`,
      icon: Star,
      iconColor: "text-warning",
    },
    {
      label: "Custo IA (mês)",
      value: `$${monthAiCost.toFixed(2)}`,
      sub: topModel !== "—" ? `Top: ${topModel.split("/").pop()}` : "Nenhum uso",
      icon: CreditCard,
      iconColor: "text-accent",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">
            Dashboard <span className="text-gradient-gold">Executivo</span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Bem-vindo, {profile?.name?.split(" ")[0] || "gestor"} — visão estratégica da sua consultoria
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="gold-outline" size="sm" onClick={generateBriefing} disabled={aiLoading} className="gap-2">
              <Sparkles className="w-4 h-4 animate-glow-pulse" />
              {aiLoading ? "Gerando..." : "Briefing IA"}
            </Button>
          </motion.div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
            <Clock className="w-4 h-4 text-gold" />
            <span className="font-medium text-foreground">{weekHours}h</span>
            <span>esta semana</span>
          </div>
        </div>
      </motion.div>

      {/* AI Briefing */}
      <AnimatePresence>
        {showBriefing && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-2xl border border-[var(--border-gold)] p-6 shadow-gold relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-gold-subtle pointer-events-none rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[hsl(220,22%,6%)]" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">Briefing Executivo IA</h3>
                {aiLoading && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gold"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div ref={briefingRef} className="max-h-[280px] overflow-y-auto">
                {messages.filter(m => m.role === "assistant").map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                  >
                    {msg.content}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} delay={i * 0.06} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Revenue Area Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card hover:border-[var(--border-gold)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">Receita Mensal</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Recebido vs Faturado — últimos 12 meses</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                <span className="text-muted-foreground">Recebido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-info" />
                <span className="text-muted-foreground">Faturado</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43,74%,55%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(43,74%,55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210,80%,55%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(210,80%,55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,16%)" />
              <XAxis dataKey="month" stroke="hsl(220,10%,45%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(220,10%,45%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(43,74%,55%,0.2)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="received" stroke="hsl(43,74%,55%)" fill="url(#goldGrad)" strokeWidth={2.5} name="Recebido" dot={false} />
              <Area type="monotone" dataKey="billed" stroke="hsl(210,80%,55%)" fill="url(#blueGrad)" strokeWidth={1.5} name="Faturado" strokeDasharray="5 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pipeline Funnel */}
        <motion.div variants={fadeUp} className="bg-card rounded-2xl p-6 border border-border shadow-card hover:border-[var(--border-gold)] transition-all duration-300">
          <div className="mb-5">
            <h3 className="text-base font-heading font-semibold text-foreground">Funil de Vendas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pipeline por estágio</p>
          </div>
          <div className="space-y-4">
            {funnelData.map((f, i) => {
              const maxCount = Math.max(...funnelData.map(d => d.count), 1);
              const pct = Math.round((f.count / maxCount) * 100);
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-foreground font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">{f.count} · R$ {(f.value / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: CHART_COLORS[i] }}
                    />
                  </div>
                </div>
              );
            })}
            {funnelData.every(f => f.count === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma oportunidade ativa</p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Marketing ROAS */}
        <motion.div variants={fadeUp} className="bg-card rounded-2xl p-6 border border-border shadow-card hover:border-[var(--border-gold)] transition-all duration-300">
          <div className="mb-5">
            <h3 className="text-base font-heading font-semibold text-foreground">ROAS por Canal</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Retorno sobre investimento em marketing</p>
          </div>
          {marketingRoas.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={marketingRoas} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,16%)" />
                <XAxis dataKey="type" stroke="hsl(220,10%,45%)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220,10%,45%)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="roas" fill="url(#goldBar)" radius={[5, 5, 0, 0]} name="ROAS">
                  <defs>
                    <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43,80%,68%)" />
                      <stop offset="100%" stopColor="hsl(43,74%,42%)" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhuma campanha ativa</p>
            </div>
          )}
        </motion.div>

        {/* AI Alerts */}
        <motion.div variants={fadeUp} className="bg-card rounded-2xl p-6 border border-border shadow-card hover:border-[var(--border-gold)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">Alertas IA</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monitoramento inteligente</p>
            </div>
            {unreadAlerts > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 text-xs rounded-full bg-destructive/15 text-destructive font-semibold border border-destructive/20"
              >
                {unreadAlerts}
              </motion.span>
            )}
          </div>
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
            {alerts.length > 0 ? alerts.slice(0, 5).map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`flex items-start gap-3 p-2.5 rounded-xl ${!a.is_read ? "bg-secondary/60" : "bg-secondary/20"}`}
              >
                {severityIcon(a.severity)}
                <div className="min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{a.description}</p>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Zap className="w-8 h-8 text-success mb-2 opacity-60" />
                <p className="text-sm text-muted-foreground">Tudo em ordem!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={fadeUp} className="bg-card rounded-2xl p-6 border border-border shadow-card hover:border-[var(--border-gold)] transition-all duration-300">
          <div className="mb-5">
            <h3 className="text-base font-heading font-semibold text-foreground">Atividade Recente</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Últimas ações no sistema</p>
          </div>
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {activities.length > 0 ? activities.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0 animate-glow-pulse" />
                <div className="min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">{a.action}</p>
                  <p className="text-[11px] text-muted-foreground">{a.entity_type} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Activity className="w-8 h-8 text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* At-Risk Projects */}
      <ProjectHealthWidget />

      {/* Featured Projects */}
      {topProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">Projetos em Destaque</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Projetos ativos na sua consultoria</p>
            </div>
            <Link to="/projects" className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1 font-medium">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topProjects.map((p: any, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  to={`/projects/${p.id}`}
                  className="block bg-secondary rounded-xl p-4 hover:bg-secondary/80 transition-all duration-200 hover:border-[var(--border-gold)] border border-transparent group"
                >
                  <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(p.client_accounts as any)?.name}</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success mt-2 inline-block capitalize border border-success/20">
                    {p.status}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Project Health Widget
const ProjectHealthWidget = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id, name, status, budget_fee, budget_hours, start_date, end_date_planned, client_accounts(name)")
        .in("status", ["active", "planning"]);

      if (!allProjects?.length) return;

      const projectIds = allProjects.map(p => p.id);
      const [{ data: tasks }, { data: timeEntries }] = await Promise.all([
        supabase.from("project_tasks").select("project_id, status").in("project_id", projectIds),
        supabase.from("time_entries" as any).select("project_id, hours").in("project_id", projectIds),
      ]);

      const scored = allProjects.map(p => {
        const pTasks = (tasks || []).filter((t: any) => t.project_id === p.id);
        const doneTasks = pTasks.filter((t: any) => t.status === "done").length;
        const taskPct = pTasks.length > 0 ? doneTasks / pTasks.length : 0;
        const hoursUsed = ((timeEntries || []) as any[]).filter(t => t.project_id === p.id).reduce((s: number, t: any) => s + Number(t.hours || 0), 0);
        const budgetPct = p.budget_hours ? hoursUsed / Number(p.budget_hours) : 0;
        const now = new Date();
        const end = p.end_date_planned ? new Date(p.end_date_planned) : null;
        const start = p.start_date ? new Date(p.start_date) : null;
        let timePct = 0;
        if (start && end) {
          const total = end.getTime() - start.getTime();
          const elapsed = now.getTime() - start.getTime();
          timePct = total > 0 ? elapsed / total : 0;
        }
        let risk = 0;
        if (budgetPct > 0.8 && taskPct < 0.5) risk += 40;
        if (budgetPct > taskPct + 0.3) risk += 30;
        if (timePct > 0.8 && taskPct < 0.6) risk += 30;
        if (end && now > end && taskPct < 1) risk += 25;
        return { ...p, risk, taskPct: Math.round(taskPct * 100), budgetPct: Math.round(budgetPct * 100), hoursUsed };
      });

      setProjects(scored.filter(p => p.risk > 20).sort((a, b) => b.risk - a.risk).slice(0, 3));
    };
    fetch();
  }, []);

  if (!projects.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="bg-card rounded-2xl p-6 border border-destructive/25 shadow-card"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-destructive/15 border border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-base font-heading font-semibold text-foreground">Projetos em Risco</h3>
          <p className="text-xs text-muted-foreground">{projects.length} projeto(s) requerem atenção</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((p: any, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.015 }}
          >
            <Link to={`/projects/${p.id}`} className="block bg-secondary rounded-xl p-4 hover:bg-secondary/70 transition-all duration-200 border border-destructive/15 hover:border-destructive/35">
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{(p.client_accounts as any)?.name}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasks concluídas</span>
                  <span className={p.taskPct < 50 ? "text-destructive font-medium" : "text-foreground"}>{p.taskPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget consumido</span>
                  <span className={p.budgetPct > 80 ? "text-destructive font-medium" : "text-foreground"}>{p.budgetPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(p.risk, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className="h-full rounded-full bg-destructive"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground text-right">Risco: {p.risk}%</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
