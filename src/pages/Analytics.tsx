import { useState, useEffect, useMemo } from "react";
import { BarChart3, DollarSign, Users, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(43, 74%, 55%)", "hsl(220, 70%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)"];

export default function Analytics() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [nps, setNps] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("invoices").select("*, client_accounts(name)").order("issue_date"),
      supabase.from("time_entries").select("*, profiles(name)").order("date"),
      supabase.from("nps_surveys").select("*").order("created_at"),
      supabase.from("projects").select("*, client_accounts(name), time_entries(hours, billable)"),
      supabase.from("profiles").select("id, name, role, billing_rate").neq("role", "client_user").eq("active", true),
    ]).then(([iRes, tRes, nRes, pRes, prRes]) => {
      setInvoices(iRes.data || []);
      setTimeEntries(tRes.data || []);
      setNps(nRes.data || []);
      setProjects(pRes.data || []);
      setProfiles(prRes.data || []);
    });
  }, []);

  // Financial
  const revenueByClient = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.status === "paid").forEach(i => {
      const name = i.client_accounts?.name || "Desconhecido";
      map[name] = (map[name] || 0) + Number(i.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name: name.slice(0, 15), value }));
  }, [invoices]);

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.status === "paid").forEach(i => {
      const m = i.issue_date?.slice(0, 7);
      if (m) map[m] = (map[m] || 0) + Number(i.amount);
    });
    return Object.entries(map).sort().slice(-12).map(([month, value]) => ({ month, value }));
  }, [invoices]);

  const projectMargins = useMemo(() => {
    return projects.filter(p => p.budget_fee).map(p => {
      const hours = (p.time_entries || []).reduce((s: number, t: any) => s + Number(t.hours), 0);
      const cost = hours * 150; // avg rate
      const revenue = Number(p.budget_fee);
      return { name: p.name?.slice(0, 12), revenue: revenue / 1000, margin: revenue > 0 ? ((revenue - cost) / revenue * 100) : 0 };
    });
  }, [projects]);

  // Utilization
  const utilizationByConsultant = useMemo(() => {
    const map: Record<string, { name: string; billable: number; nonBillable: number }> = {};
    timeEntries.forEach(te => {
      const name = te.profiles?.name || "?";
      if (!map[name]) map[name] = { name, billable: 0, nonBillable: 0 };
      if (te.billable) map[name].billable += Number(te.hours);
      else map[name].nonBillable += Number(te.hours);
    });
    return Object.values(map);
  }, [timeEntries]);

  // NPS
  const npsOverTime = useMemo(() => {
    const map: Record<string, { scores: number[]; month: string }> = {};
    nps.forEach(n => {
      const m = n.created_at?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, scores: [] };
      map[m].scores.push(n.score);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map(v => ({
      month: v.month, avg: Number((v.scores.reduce((s, n) => s + n, 0) / v.scores.length).toFixed(1)),
    }));
  }, [nps]);

  const avgNps = nps.length ? (nps.reduce((s, n) => s + n.score, 0) / nps.length).toFixed(1) : "—";

  const tooltipStyle = { background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(40, 10%, 92%)" };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Análises avançadas da sua consultoria</p>
      </div>

      <Tabs defaultValue="financial">
        <TabsList className="bg-secondary">
          <TabsTrigger value="financial"><DollarSign className="w-4 h-4 mr-1" />Financeiro</TabsTrigger>
          <TabsTrigger value="utilization"><Users className="w-4 h-4 mr-1" />Utilização</TabsTrigger>
          <TabsTrigger value="nps"><Star className="w-4 h-4 mr-1" />NPS</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita por Cliente (Top 10)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByClient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis type="number" stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
                  <Bar dataKey="value" fill="hsl(43, 74%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita Mensal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="hsl(43, 74%, 55%)" fill="url(#goldG)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Margem por Projeto</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectMargins}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="margin" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6 mt-4">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Horas por Consultor</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={utilizationByConsultant}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="billable" stackId="a" fill="hsl(43, 74%, 55%)" name="Billable" radius={[0, 0, 0, 0]} />
                <Bar dataKey="nonBillable" stackId="a" fill="hsl(220, 14%, 30%)" name="Não-billable" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profiles.filter(p => p.role === "consultant").map(p => {
              const myEntries = timeEntries.filter(te => te.profiles?.name === p.name);
              const billable = myEntries.filter(te => te.billable).reduce((s, te) => s + Number(te.hours), 0);
              const total = myEntries.reduce((s, te) => s + Number(te.hours), 0);
              const util = total > 0 ? Math.round((billable / total) * 100) : 0;
              return (
                <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <div className="flex items-center justify-between mt-2">
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

        <TabsContent value="nps" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <span className="text-xs text-muted-foreground">NPS Médio</span>
              <p className="text-4xl font-bold text-foreground mt-2">{avgNps}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <span className="text-xs text-muted-foreground">Total de Respostas</span>
              <p className="text-4xl font-bold text-foreground mt-2">{nps.length}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <span className="text-xs text-muted-foreground">Promotores (9-10)</span>
              <p className="text-4xl font-bold text-success mt-2">{nps.filter(n => n.score >= 9).length}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">NPS ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={npsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} domain={[0, 10]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="avg" stroke="hsl(43, 74%, 55%)" fill="url(#goldG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Comentários Recentes</h3>
            <div className="space-y-3">
              {nps.filter(n => n.comment).slice(0, 5).map(n => (
                <div key={n.id} className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{n.score}/10</span>
                      {n.responded_by_name && <span className="text-xs text-muted-foreground">— {n.responded_by_name}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
