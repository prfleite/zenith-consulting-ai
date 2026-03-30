import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Sparkles, Send, Plus, Star, Clock,
  TrendingUp, DollarSign, UserCheck, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAIChat } from "@/lib/ai/useAIChat";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const specialties = [
  "Estratégia", "Operações", "Tecnologia", "Financeiro", "RH", "Marketing",
  "Gestão de Projetos", "Dados & Analytics", "Jurídico", "Supply Chain",
];

const seniorities = ["Júnior", "Pleno", "Sênior", "Especialista", "Principal", "Diretor"];

type ConsultantData = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  billable: number;
  total: number;
  utilization: number;
  available: number;
  projectCount: number;
  projects: string[];
  status: string;
  specialty?: string;
  seniority?: string;
  hourly_rate?: number;
  availability_pct?: number;
};

const statusColors: Record<string, string> = {
  over: "bg-destructive/20 text-destructive border-destructive/30",
  optimal: "bg-success/20 text-success border-success/30",
  under: "bg-warning/20 text-warning border-warning/30",
  bench: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  over: "Sobrealoc.", optimal: "Ótimo", under: "Sub-utilizado", bench: "Bench",
};

const Resources = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const { messages, isLoading, sendMessage } = useAIChat({ contextType: "global" });
  const [chatInput, setChatInput] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantData | null>(null);
  const [allocateProjectId, setAllocateProjectId] = useState("");
  const [allocateRole, setAllocateRole] = useState("consultant");
  const [savingAlloc, setSavingAlloc] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*").in("role", ["consultant", "manager"]).eq("active", true),
      supabase.from("time_entries").select("*").order("date", { ascending: false }),
      supabase.from("project_members").select("*, projects(name, status)"),
      supabase.from("projects").select("id, name, status, budget_hours").eq("status", "active"),
      supabase.from("projects").select("id, name, status").order("name"),
    ]).then(([prRes, teRes, pmRes, pjRes, allPjRes]) => {
      setProfiles(prRes.data || []);
      setTimeEntries(teRes.data || []);
      setProjectMembers(pmRes.data || []);
      setProjects(pjRes.data || []);
      setAllProjects(allPjRes.data || []);
    });
  }, []);

  const consultantData = useMemo((): ConsultantData[] => {
    return profiles.map(p => {
      const myEntries = timeEntries.filter(te => te.user_id === p.id);
      const thisMonth = myEntries.filter(te => te.date?.startsWith(new Date().toISOString().slice(0, 7)));
      const billable = thisMonth.filter(te => te.billable).reduce((s: number, te: any) => s + Number(te.hours), 0);
      const total = thisMonth.reduce((s: number, te: any) => s + Number(te.hours), 0);
      const available = 160;
      const utilization = available > 0 ? Math.round((billable / available) * 100) : 0;
      const myProjects = projectMembers.filter(pm => pm.user_id === p.id && pm.projects?.status === "active");
      return {
        ...p,
        billable,
        total,
        utilization,
        available: available - total,
        projectCount: myProjects.length,
        projects: myProjects.map((pm: any) => pm.projects?.name).filter(Boolean),
        status: utilization > 90 ? "over" : utilization > 60 ? "optimal" : utilization > 30 ? "under" : "bench",
      };
    });
  }, [profiles, timeEntries, projectMembers]);

  const chartData = useMemo(() => {
    return consultantData.map(c => ({
      name: c.name?.split(" ")[0] || "?",
      "Horas Billable": c.billable,
      "Horas Totais": c.total,
      "Disponível": Math.max(0, c.available),
    }));
  }, [consultantData]);

  const handleAI = () => {
    if (!chatInput.trim()) return;
    const ctx = consultantData.map(c =>
      `${c.name}: ${c.utilization}% util, ${c.projectCount} projetos (${c.projects.join(", ")})`
    ).join("\n");
    sendMessage(chatInput, `Dados de capacidade da equipe:\n${ctx}\n\nProjetos ativos: ${projects.map(p => p.name).join(", ")}`);
    setChatInput("");
  };

  const openAllocate = (c: ConsultantData) => {
    setSelectedConsultant(c);
    setAllocateProjectId("");
    setAllocateRole("consultant");
    setShowAllocate(true);
  };

  const handleAllocate = async () => {
    if (!selectedConsultant || !allocateProjectId) return;
    setSavingAlloc(true);
    const { error } = await supabase.from("project_members").insert({
      project_id: allocateProjectId,
      user_id: selectedConsultant.id,
      role: allocateRole,
    });
    setSavingAlloc(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Consultor já está neste projeto", variant: "destructive" });
      } else {
        toast({ title: "Erro ao alocar", description: error.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: `${selectedConsultant.name} alocado com sucesso!` });
    setShowAllocate(false);
    // refresh
    const pmRes = await supabase.from("project_members").select("*, projects(name, status)");
    setProjectMembers(pmRes.data || []);
  };

  const getInitials = (name: string) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between flex-wrap gap-4"
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
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl border border-gold-subtle p-4 space-y-3 overflow-hidden"
          >
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
              <Input
                placeholder="Ex: Quem alocar no projeto X?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAI()}
                className="bg-secondary border-border"
              />
              <Button variant="gold" size="icon" onClick={handleAI} disabled={isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Consultores", value: profiles.length, icon: Users, color: "text-gold" },
          { label: "Projetos Ativos", value: projects.length, icon: Activity, color: "text-info" },
          { label: "Sobrealoc.", value: consultantData.filter(c => c.status === "over").length, icon: TrendingUp, color: "text-destructive" },
          { label: "Bench", value: consultantData.filter(c => c.status === "bench").length, icon: Clock, color: "text-warning" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-card rounded-xl p-4 border border-border hover:border-[var(--border-gold-hover)] hover:shadow-gold-sm transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Utilization Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card"
        >
          <h3 className="text-base font-heading font-semibold text-gradient-gold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            Utilização por Consultor — Mês Atual
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
              <Bar dataKey="Horas Billable" fill="hsl(43,74%,55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Horas Totais" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="Disponível" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Consultant Cards */}
      {consultantData.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="Nenhum consultor cadastrado"
          description="Adicione consultores ao sistema para visualizar capacidade e alocação."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {consultantData.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
              whileHover={{ scale: 1.01, y: -2 }}
              className={`rounded-2xl p-5 border transition-all duration-300 shadow-card bg-card`}
            >
              {/* Avatar + Name */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-gold-subtle border border-[var(--border-gold)] flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[c.status]}`}>
                  {statusLabels[c.status]}
                </span>
              </div>

              {/* Capability Tags (mock based on role) */}
              <div className="flex flex-wrap gap-1 mb-3">
                {[c.specialty || "Estratégia", c.seniority || "Sênior"].map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 border-border text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
                {c.hourly_rate && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-gold/30 text-gold">
                    <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                    R${c.hourly_rate}/h
                  </Badge>
                )}
              </div>

              {/* Utilization Bar */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Utilização</span>
                  <span className="font-bold text-foreground text-xs">{c.utilization}%</span>
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
                  <span>{Math.max(0, c.available)}h disponível</span>
                </div>
              </div>

              {/* Availability % */}
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Disponibilidade: <span className="text-foreground font-medium">{c.availability_pct ?? (100 - Math.min(c.utilization, 100))}%</span></span>
                <span className="ml-auto">{c.projectCount} projeto{c.projectCount !== 1 ? "s" : ""}</span>
              </div>

              {/* Project tags */}
              {c.projects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.projects.slice(0, 3).map((p: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border">{p}</span>
                  ))}
                  {c.projects.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border">+{c.projects.length - 3}</span>
                  )}
                </div>
              )}

              {/* Allocate Button */}
              <Button
                variant="gold-outline"
                size="sm"
                className="w-full gap-2 mt-1"
                onClick={() => openAllocate(c)}
              >
                <Plus className="w-3.5 h-3.5" /> Alocar em Projeto
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Capacity Heatmap */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <h3 className="text-lg font-heading font-semibold text-gradient-gold mb-4">Capacity Planner — Próximas 12 Semanas</h3>
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const demand = projects.length * 20;
            const capacity = profiles.length * 40;
            const utilization = capacity > 0 ? Math.round((demand / capacity) * 100) : 0;
            return (
              <div key={i} className="text-center">
                <span className="text-xs text-muted-foreground">S{i + 1}</span>
                <div className={`h-16 rounded-lg mt-1 flex items-center justify-center text-xs font-medium ${
                  utilization > 100 ? "bg-destructive/30 text-destructive" :
                  utilization > 80 ? "bg-warning/30 text-warning" :
                  utilization > 50 ? "bg-success/30 text-success" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {utilization}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/30" /> &gt;100% Over</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/30" /> 80-100%</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success/30" /> 50-80% Ótimo</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted" /> &lt;50% Bench</span>
        </div>
      </div>

      {/* Allocate Dialog */}
      <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" />
              Alocar {selectedConsultant?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Projeto</Label>
              <Select value={allocateProjectId} onValueChange={setAllocateProjectId}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {allProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Papel no Projeto</Label>
              <Select value={allocateRole} onValueChange={setAllocateRole}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant">Consultor</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="analyst">Analista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocate(false)}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={handleAllocate}
              disabled={savingAlloc || !allocateProjectId}
            >
              {savingAlloc ? "Alocando..." : "Confirmar Alocação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Resources;
