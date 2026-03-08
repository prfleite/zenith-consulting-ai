import { useState, useEffect, useMemo, useRef } from "react";
import { TrendingUp, Users, FolderKanban, DollarSign, ArrowUpRight, Clock, Sparkles, Send, Brain } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIChat } from "@/lib/ai/useAIChat";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();
  const [clientCount, setClientCount] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [weekHours, setWeekHours] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const { messages, isLoading: aiLoading, sendMessage } = useAIChat({ contextType: "executive_briefing" });
  const briefingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [cRes, pRes, oRes, iRes, aRes, tpRes] = await Promise.all([
        supabase.from("client_accounts").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("opportunities").select("expected_value").in("stage", ["lead", "qualified", "proposal", "negotiation"]),
        supabase.from("invoices").select("amount, status, issue_date").order("issue_date", { ascending: false }),
        supabase.from("activity_log").select("action, entity_type, created_at, details_json").order("created_at", { ascending: false }).limit(5),
        supabase.from("projects").select("id, name, status, client_accounts(name)").eq("status", "active").limit(3),
      ]);
      setClientCount(cRes.count || 0);
      setActiveProjects(pRes.count || 0);
      setPipelineValue((oRes.data || []).reduce((s, o) => s + Number(o.expected_value || 0), 0));
      setInvoices(iRes.data || []);
      setActivities(aRes.data || []);
      setTopProjects(tpRes.data || []);
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const { data: te } = await supabase.from("time_entries").select("hours").gte("date", monday.toISOString().split("T")[0]);
      setWeekHours((te || []).reduce((s, e) => s + Number(e.hours), 0));
    };
    fetchAll();
  }, []);

  const totalReceived = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  const revenueChart = useMemo(() => {
    const months: Record<string, { month: string; value: number }> = {};
    invoices.forEach((inv) => {
      if (inv.status !== "paid") return;
      const m = inv.issue_date?.slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { month: m, value: 0 };
      months[m].value += Number(inv.amount);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
  }, [invoices]);

  const generateBriefing = async () => {
    setShowBriefing(true);
    const context = `KPIs atuais:\n- Clientes: ${clientCount}\n- Projetos ativos: ${activeProjects}\n- Pipeline: R$ ${pipelineValue.toLocaleString()}\n- Receita recebida: R$ ${totalReceived.toLocaleString()}\n- Horas esta semana: ${weekHours}h\n\nProjetos em destaque: ${topProjects.map(p => p.name).join(", ")}`;
    await sendMessage("Gere um briefing executivo semanal completo com análise dos KPIs, riscos e recomendações.", context);
  };

  const metrics = [
    { label: "Receita Recebida", value: `R$ ${(totalReceived / 1000).toFixed(0)}k`, icon: DollarSign },
    { label: "Clientes Ativos", value: String(clientCount), icon: Users },
    { label: "Projetos Ativos", value: String(activeProjects), icon: FolderKanban },
    { label: "Pipeline", value: `R$ ${(pipelineValue / 1000).toFixed(0)}k`, icon: TrendingUp },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua consultoria</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="gold-outline" size="sm" onClick={generateBriefing} disabled={aiLoading}>
            <Sparkles className="w-4 h-4" /> {aiLoading ? "Gerando..." : "Briefing Executivo IA"}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" /> {weekHours}h esta semana
          </div>
        </div>
      </div>

      {/* Executive Briefing */}
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

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-xl p-5 border border-border hover:border-gold-subtle transition-all duration-300 shadow-card group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <m.icon className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(40, 10%, 92%)" }} />
              <Area type="monotone" dataKey="value" stroke="hsl(43, 74%, 55%)" fill="url(#goldGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.entity_type}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Projects */}
      {topProjects.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Projetos em Destaque</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
}
