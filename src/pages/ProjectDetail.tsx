import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, GripVertical, Clock, CheckCircle2, AlertCircle, MoreHorizontal, Users, FileText, Star } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePresence } from "@/hooks/usePresence";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Tables } from "@/integrations/supabase/types";

const statusConfig: Record<string, { label: string; class: string }> = {
  planning: { label: "Planejamento", class: "bg-info/20 text-info" },
  active: { label: "Ativo", class: "bg-success/20 text-success" },
  on_hold: { label: "Pausado", class: "bg-warning/20 text-warning" },
  completed: { label: "Concluído", class: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", class: "bg-destructive/20 text-destructive" },
};

const taskCols = [
  { key: "backlog" as const, label: "Backlog", icon: AlertCircle, color: "text-muted-foreground" },
  { key: "in_progress" as const, label: "Em Andamento", icon: Clock, color: "text-warning" },
  { key: "review" as const, label: "Revisão", icon: AlertCircle, color: "text-info" },
  { key: "done" as const, label: "Concluído", icon: CheckCircle2, color: "text-success" },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const onlineUsers = usePresence(id ? `project-${id}` : "");
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Tables<"project_tasks">[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [nps, setNps] = useState<Tables<"nps_surveys">[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<{ id: string; name: string }[]>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [npsDialogOpen, setNpsDialogOpen] = useState(false);
  const [dragTask, setDragTask] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", assignee_id: "", due_date: "", effort_hours_estimated: "", is_milestone: false });
  const [memberForm, setMemberForm] = useState({ user_id: "", role: "consultant" });
  const [docForm, setDocForm] = useState({ title: "", type: "other", content_text: "" });
  const [npsForm, setNpsForm] = useState({ score: "8", comment: "", responded_by_name: "" });

  const fetchAll = async () => {
    if (!id) return;
    const [pRes, tRes, mRes, teRes, dRes, nRes, sRes] = await Promise.all([
      supabase.from("projects").select("*, client_accounts(name), manager:profiles!projects_project_manager_id_fkey(name)").eq("id", id).single(),
      supabase.from("project_tasks").select("*").eq("project_id", id).order("created_at"),
      supabase.from("project_members").select("*, profiles(name, email)").eq("project_id", id),
      supabase.from("time_entries").select("*, profiles(name)").eq("project_id", id).order("date", { ascending: false }),
      supabase.from("documents").select("*").eq("related_project_id", id).order("created_at", { ascending: false }),
      supabase.from("nps_surveys").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name").neq("role", "client_user").eq("active", true),
    ]);
    if (pRes.data) setProject(pRes.data);
    setTasks(tRes.data || []);
    setTeamMembers(mRes.data || []);
    setTimeEntries(teRes.data || []);
    setDocuments(dRes.data || []);
    setNps(nRes.data || []);
    setStaffProfiles(sRes.data || []);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const addTask = async () => {
    if (!taskForm.title || !id) return;
    await supabase.from("project_tasks").insert({
      project_id: id,
      title: taskForm.title,
      description: taskForm.description || null,
      priority: taskForm.priority as any,
      assignee_id: taskForm.assignee_id || null,
      due_date: taskForm.due_date || null,
      effort_hours_estimated: taskForm.effort_hours_estimated ? Number(taskForm.effort_hours_estimated) : null,
      is_milestone: taskForm.is_milestone,
    });
    setTaskDialogOpen(false);
    setTaskForm({ title: "", description: "", priority: "medium", assignee_id: "", due_date: "", effort_hours_estimated: "", is_milestone: false });
    fetchAll();
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await supabase.from("project_tasks").update({ status: newStatus as any }).eq("id", taskId);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus as any } : t));
  };

  const addMember = async () => {
    if (!memberForm.user_id || !id) return;
    await supabase.from("project_members").insert({ project_id: id, user_id: memberForm.user_id, role: memberForm.role as any });
    setMemberDialogOpen(false);
    fetchAll();
  };

  const addDoc = async () => {
    if (!docForm.title || !profile?.company_id || !id) return;
    await supabase.from("documents").insert({
      company_id: profile.company_id, title: docForm.title, type: docForm.type as any,
      content_text: docForm.content_text || null, related_project_id: id, created_by_id: profile.id,
    });
    setDocDialogOpen(false);
    setDocForm({ title: "", type: "other", content_text: "" });
    fetchAll();
  };

  const addNps = async () => {
    if (!profile?.company_id || !id || !project) return;
    await supabase.from("nps_surveys").insert({
      company_id: profile.company_id, client_account_id: project.client_account_id,
      project_id: id, score: Number(npsForm.score), comment: npsForm.comment || null,
      responded_by_name: npsForm.responded_by_name || null,
    });
    setNpsDialogOpen(false);
    setNpsForm({ score: "8", comment: "", responded_by_name: "" });
    fetchAll();
  };

  if (!project) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  const sc = statusConfig[project.status] || statusConfig.planning;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalHours = timeEntries.reduce((s: number, e: any) => s + Number(e.hours), 0);
  const billableHours = timeEntries.filter((e: any) => e.billable).reduce((s: number, e: any) => s + Number(e.hours), 0);
  const hoursUsedPct = project.budget_hours ? Math.round((totalHours / Number(project.budget_hours)) * 100) : 0;
  const avgNps = nps.length ? (nps.reduce((s, n) => s + n.score, 0) / nps.length).toFixed(1) : "—";

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <Breadcrumbs entityName={project.name} />
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Projetos
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-bold text-foreground">{project.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.class}`}>{sc.label}</span>
            </div>
            {project.code && <p className="text-sm text-muted-foreground">{project.code}</p>}
            <p className="text-sm text-muted-foreground mt-1">Cliente: {(project.client_accounts as any)?.name} · PM: {(project.manager as any)?.name || "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><span className="text-xs text-muted-foreground">Progresso</span><div className="text-lg font-bold text-foreground">{pct}%</div><div className="w-full h-1.5 bg-secondary rounded-full mt-1"><div className="h-full bg-gradient-gold rounded-full" style={{ width: `${pct}%` }} /></div></div>
          <div><span className="text-xs text-muted-foreground">Horas</span><div className="text-lg font-bold text-foreground">{totalHours}h / {project.budget_hours || "∞"}h</div><div className="text-xs text-muted-foreground">{hoursUsedPct}% utilizado</div></div>
          <div><span className="text-xs text-muted-foreground">Budget</span><div className="text-lg font-bold text-foreground">R$ {Number(project.budget_fee || 0).toLocaleString("pt-BR")}</div></div>
          <div><span className="text-xs text-muted-foreground">NPS Médio</span><div className="text-lg font-bold text-foreground">{avgNps}</div></div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="bg-secondary">
          <TabsTrigger value="tasks">Tarefas ({totalTasks})</TabsTrigger>
          <TabsTrigger value="team">Equipe ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="hours">Horas ({timeEntries.length})</TabsTrigger>
          <TabsTrigger value="docs">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="nps">NPS ({nps.length})</TabsTrigger>
        </TabsList>

        {/* Tasks Kanban */}
        <TabsContent value="tasks" className="space-y-4">
          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Nova Tarefa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título *</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prioridade</Label>
                    <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem><SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Responsável</Label>
                    <Select value={taskForm.assignee_id} onValueChange={(v) => setTaskForm({ ...taskForm, assignee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{staffProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prazo</Label><Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
                  <div><Label>Horas Estimadas</Label><Input type="number" value={taskForm.effort_hours_estimated} onChange={(e) => setTaskForm({ ...taskForm, effort_hours_estimated: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={taskForm.is_milestone} onCheckedChange={(v) => setTaskForm({ ...taskForm, is_milestone: v })} /><Label>Milestone</Label></div>
                <Button variant="gold" className="w-full" onClick={addTask}>Criar Tarefa</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {taskCols.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragTask) moveTask(dragTask, col.key); setDragTask(null); }}
                  className="space-y-3 min-h-[200px]">
                  <div className="flex items-center gap-2 px-1">
                    <col.icon className={`w-4 h-4 ${col.color}`} />
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full ml-auto">{colTasks.length}</span>
                  </div>
                  {colTasks.map((task) => {
                    const assignee = staffProfiles.find((p) => p.id === task.assignee_id);
                    return (
                      <div key={task.id} draggable onDragStart={() => setDragTask(task.id)}
                        className="bg-card rounded-lg p-3 border border-border hover:border-gold-subtle cursor-grab active:cursor-grabbing transition-all">
                        <div className="flex items-start justify-between">
                          <h5 className="text-sm font-medium text-foreground">{task.is_milestone ? "🏁 " : ""}{task.title}</h5>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                          {assignee && <span className="text-xs text-muted-foreground">{assignee.name}</span>}
                          {task.due_date && <span className="text-xs text-muted-foreground ml-auto">{task.due_date}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-4">
          <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Adicionar Membro</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Membro</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Membro</Label>
                  <Select value={memberForm.user_id} onValueChange={(v) => setMemberForm({ ...memberForm, user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{staffProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Papel</Label>
                  <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Gerente</SelectItem><SelectItem value="consultant">Consultor</SelectItem><SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="gold" className="w-full" onClick={addMember}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="space-y-2">
            {teamMembers.map((m: any) => (
              <div key={m.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.profiles?.name}</p>
                  <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{m.role}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Hours */}
        <TabsContent value="hours">
          <div className="bg-card rounded-xl p-4 border border-border mb-4 flex gap-6">
            <div><span className="text-xs text-muted-foreground">Total</span><p className="text-lg font-bold text-foreground">{totalHours}h</p></div>
            <div><span className="text-xs text-muted-foreground">Billable</span><p className="text-lg font-bold text-success">{billableHours}h</p></div>
            <div><span className="text-xs text-muted-foreground">Não-billable</span><p className="text-lg font-bold text-muted-foreground">{(totalHours - billableHours).toFixed(1)}h</p></div>
          </div>
          <div className="space-y-2">
            {timeEntries.map((e: any) => (
              <div key={e.id} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{e.profiles?.name} · {e.date}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{e.hours}h</p>
                  <span className={`text-xs ${e.billable ? "text-success" : "text-muted-foreground"}`}>{e.billable ? "Billable" : "Não-billable"}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="docs" className="space-y-4">
          <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Novo Documento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título *</Label><Input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={docForm.type} onValueChange={(v) => setDocForm({ ...docForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposal">Proposta</SelectItem><SelectItem value="contract">Contrato</SelectItem>
                      <SelectItem value="deck">Deck</SelectItem><SelectItem value="report">Relatório</SelectItem>
                      <SelectItem value="meeting_notes">Atas</SelectItem><SelectItem value="internal_playbook">Playbook</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Conteúdo</Label><Textarea rows={6} value={docForm.content_text} onChange={(e) => setDocForm({ ...docForm, content_text: e.target.value })} /></div>
                <Button variant="gold" className="w-full" onClick={addDoc}>Salvar Documento</Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto">{d.type}</span>
                </div>
                {d.content_text && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{d.content_text}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* NPS */}
        <TabsContent value="nps" className="space-y-4">
          <Dialog open={npsDialogOpen} onOpenChange={setNpsDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Novo Feedback</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar NPS</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Score (0-10)</Label><Input type="number" min="0" max="10" value={npsForm.score} onChange={(e) => setNpsForm({ ...npsForm, score: e.target.value })} /></div>
                <div><Label>Respondente</Label><Input value={npsForm.responded_by_name} onChange={(e) => setNpsForm({ ...npsForm, responded_by_name: e.target.value })} /></div>
                <div><Label>Comentário</Label><Textarea value={npsForm.comment} onChange={(e) => setNpsForm({ ...npsForm, comment: e.target.value })} /></div>
                <Button variant="gold" className="w-full" onClick={addNps}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="bg-card rounded-xl p-4 border border-border mb-4">
            <span className="text-xs text-muted-foreground">NPS Médio</span>
            <p className="text-2xl font-bold text-foreground">{avgNps}</p>
          </div>
          <div className="space-y-2">
            {nps.map((n) => (
              <div key={n.id} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><Star className="w-3 h-3 text-gold" /><span className="text-sm font-medium text-foreground">{n.score}/10</span></div>
                  {n.comment && <p className="text-xs text-muted-foreground mt-1">{n.comment}</p>}
                  {n.responded_by_name && <p className="text-xs text-muted-foreground">— {n.responded_by_name}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
