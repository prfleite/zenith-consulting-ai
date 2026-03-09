import { useState, useEffect, useMemo } from "react";
import { Users, Calendar, AlertTriangle, TrendingUp, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAIChat } from "@/lib/ai/useAIChat";
import { Input } from "@/components/ui/input";

const Resources = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const { messages, isLoading, sendMessage } = useAIChat({ contextType: "global" });
  const [chatInput, setChatInput] = useState("");
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*").in("role", ["consultant", "manager"]).eq("active", true),
      supabase.from("time_entries").select("*").order("date", { ascending: false }),
      supabase.from("project_members").select("*, projects(name, status)"),
      supabase.from("projects").select("id, name, status, budget_hours").eq("status", "active"),
    ]).then(([prRes, teRes, pmRes, pjRes]) => {
      setProfiles(prRes.data || []);
      setTimeEntries(teRes.data || []);
      setProjectMembers(pmRes.data || []);
      setProjects(pjRes.data || []);
    });
  }, []);

  const consultantData = useMemo(() => {
    return profiles.map(p => {
      const myEntries = timeEntries.filter(te => te.user_id === p.id);
      const thisMonth = myEntries.filter(te => te.date?.startsWith(new Date().toISOString().slice(0, 7)));
      const billable = thisMonth.filter(te => te.billable).reduce((s, te) => s + Number(te.hours), 0);
      const total = thisMonth.reduce((s, te) => s + Number(te.hours), 0);
      const available = 160; // hours/month
      const utilization = available > 0 ? Math.round((billable / available) * 100) : 0;
      const myProjects = projectMembers.filter(pm => pm.user_id === p.id && pm.projects?.status === "active");
      
      return {
        ...p,
        billable,
        total,
        utilization,
        available: available - total,
        projectCount: myProjects.length,
        projects: myProjects.map(pm => pm.projects?.name).filter(Boolean),
        status: utilization > 90 ? "over" : utilization > 60 ? "optimal" : utilization > 30 ? "under" : "bench",
      };
    });
  }, [profiles, timeEntries, projectMembers]);

  // Capacity timeline (next 12 weeks)
  const weeks = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + i * 7 - now.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      const weekKey = weekStart.toISOString().split("T")[0];
      
      const demand = projects.length * 20; // simplified: 20h per project per week
      const capacity = profiles.length * 40;
      
      result.push({
        week: `S${i + 1}`,
        weekStart: weekKey,
        demand: Math.min(demand, capacity * 1.2),
        capacity,
        utilization: capacity > 0 ? Math.round((demand / capacity) * 100) : 0,
      });
    }
    return result;
  }, [projects, profiles]);

  const statusColors: Record<string, string> = {
    over: "bg-destructive/20 text-destructive border-destructive/30",
    optimal: "bg-success/20 text-success border-success/30",
    under: "bg-warning/20 text-warning border-warning/30",
    bench: "bg-muted text-muted-foreground border-border",
  };

  const statusLabels: Record<string, string> = {
    over: "Sobrealoc.", optimal: "Ótimo", under: "Sub-utilizado", bench: "Bench",
  };

  const handleAI = () => {
    if (!chatInput.trim()) return;
    const ctx = consultantData.map(c => `${c.name}: ${c.utilization}% util, ${c.projectCount} projetos (${c.projects.join(", ")})`).join("\n");
    sendMessage(chatInput, `Dados de capacidade da equipe:\n${ctx}\n\nProjetos ativos: ${projects.map(p => p.name).join(", ")}`);
    setChatInput("");
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Recursos & Capacidade</h1>
          <p className="text-muted-foreground mt-1">Alocação e disponibilidade da equipe</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowAI(!showAI)}>
          <Sparkles className="w-4 h-4" /> Sugerir Alocação com IA
        </Button>
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="bg-card rounded-xl border border-gold-subtle p-4 space-y-3">
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${msg.role === "user" ? "bg-gradient-gold text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Ex: Quem alocar no projeto X?" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAI()} className="bg-secondary border-border" />
            <Button variant="gold" size="icon" onClick={handleAI} disabled={isLoading}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <span className="text-xs text-muted-foreground">Consultores</span>
          <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <span className="text-xs text-muted-foreground">Projetos Ativos</span>
          <p className="text-2xl font-bold text-foreground">{projects.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <span className="text-xs text-muted-foreground">Sobrealoc.</span>
          <p className="text-2xl font-bold text-destructive">{consultantData.filter(c => c.status === "over").length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <span className="text-xs text-muted-foreground">Bench</span>
          <p className="text-2xl font-bold text-warning">{consultantData.filter(c => c.status === "bench").length}</p>
        </div>
      </div>

      {/* Consultant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {consultantData.map((c) => (
          <div key={c.id} className={`rounded-xl p-5 border ${statusColors[c.status]}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{statusLabels[c.status]}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilização</span>
                <span className="font-medium text-foreground">{c.utilization}%</span>
              </div>
              <div className="w-full h-2 bg-secondary/50 rounded-full">
                <div className={`h-full rounded-full ${c.utilization > 90 ? "bg-destructive" : c.utilization > 60 ? "bg-success" : "bg-warning"}`} style={{ width: `${Math.min(c.utilization, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{c.billable}h billable</span>
                <span>{c.available > 0 ? c.available : 0}h disponível</span>
              </div>
              {c.projects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.projects.map((p: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Heatmap */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Capacity Planner — Próximas 12 Semanas</h3>
        <div className="grid grid-cols-12 gap-2">
          {weeks.map((w) => (
            <div key={w.week} className="text-center">
              <span className="text-xs text-muted-foreground">{w.week}</span>
              <div className={`h-16 rounded-lg mt-1 flex items-center justify-center text-xs font-medium ${
                w.utilization > 100 ? "bg-destructive/30 text-destructive" :
                w.utilization > 80 ? "bg-warning/30 text-warning" :
                w.utilization > 50 ? "bg-success/30 text-success" :
                "bg-muted text-muted-foreground"
              }`}>
                {w.utilization}%
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/30" /> &gt;100% Over</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/30" /> 80-100%</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success/30" /> 50-80% Ótimo</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted" /> &lt;50% Bench</span>
        </div>
      </div>
    </div>
  );
};

export default Resources;
