import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient-gold">Recursos & Capacidade</h1>
          <p className="text-muted-foreground mt-1">Alocação e disponibilidade da equipe</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowAI(!showAI)} className="gap-2">
          <Sparkles className="w-4 h-4" /> Sugerir Alocação com IA
        </Button>
      </motion.div>

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
        {[
          { label: "Consultores", value: profiles.length, color: "text-gold" },
          { label: "Projetos Ativos", value: projects.length, color: "text-info" },
          { label: "Sobrealoc.", value: consultantData.filter(c => c.status === "over").length, color: "text-destructive" },
          { label: "Bench", value: consultantData.filter(c => c.status === "bench").length, color: "text-warning" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-card rounded-xl p-4 border border-border hover:border-[var(--border-gold-hover)] hover:shadow-gold-sm transition-all duration-300"
          >
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Consultant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {consultantData.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`rounded-2xl p-5 border transition-all duration-300 shadow-card ${statusColors[c.status]}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground font-medium border border-border">
                {statusLabels[c.status]}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilização</span>
                <span className="font-bold text-foreground">{c.utilization}%</span>
              </div>
              <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(c.utilization, 100)}%` }}
                  transition={{ delay: 0.3 + idx * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
                  className={`h-full rounded-full ${c.utilization > 90 ? "bg-destructive" : c.utilization > 60 ? "bg-success" : "bg-warning"}`}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{c.billable}h billable</span>
                <span>{c.available > 0 ? c.available : 0}h disponível</span>
              </div>
              {c.projects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.projects.map((p: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border">{p}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Capacity Heatmap */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <h3 className="text-lg font-heading font-semibold text-gradient-gold mb-4">Capacity Planner — Próximas 12 Semanas</h3>
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
    </motion.div>
  );
};

export default Resources;
