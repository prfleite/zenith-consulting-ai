import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, FolderKanban, Users, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ProjectRow = {
  id: string;
  name: string;
  code: string | null;
  status: string;
  start_date: string | null;
  end_date_planned: string | null;
  budget_hours: number | null;
  budget_fee: number | null;
  client_account_id: string;
  project_manager_id: string | null;
  company_id: string;
  description: string | null;
  client_accounts?: { name: string } | null;
  manager?: { name: string } | null;
  task_total?: number;
  task_done?: number;
};

const statusConfig: Record<string, { label: string; class: string }> = {
  planning: { label: "Planejamento", class: "bg-info/20 text-info" },
  active: { label: "Ativo", class: "bg-success/20 text-success" },
  on_hold: { label: "Pausado", class: "bg-warning/20 text-warning" },
  completed: { label: "Concluído", class: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", class: "bg-destructive/20 text-destructive" },
};

export default function Projects() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", client_account_id: "", project_manager_id: "", status: "planning", start_date: "", end_date_planned: "", budget_hours: "", budget_fee: "", description: "" });

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, client_accounts(name), manager:profiles!projects_project_manager_id_fkey(name)")
      .order("created_at", { ascending: false });
    if (!data) return;

    // get task counts
    const ids = data.map((p) => p.id);
    const { data: tasks } = await supabase
      .from("project_tasks")
      .select("project_id, status")
      .in("project_id", ids);

    const enriched = data.map((p) => {
      const pt = (tasks || []).filter((t) => t.project_id === p.id);
      return { ...p, task_total: pt.length, task_done: pt.filter((t) => t.status === "done").length } as ProjectRow;
    });
    setProjects(enriched);
  };

  const fetchLookups = async () => {
    const [c, m] = await Promise.all([
      supabase.from("client_accounts").select("id, name").order("name"),
      supabase.from("profiles").select("id, name").neq("role", "client_user").eq("active", true),
    ]);
    setClients(c.data || []);
    setMembers(m.data || []);
  };

  useEffect(() => { fetchProjects(); fetchLookups(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.client_account_id || !profile?.company_id) return;
    const { error } = await supabase.from("projects").insert({
      name: form.name,
      code: form.code || null,
      client_account_id: form.client_account_id,
      project_manager_id: form.project_manager_id || null,
      status: form.status as any,
      start_date: form.start_date || null,
      end_date_planned: form.end_date_planned || null,
      budget_hours: form.budget_hours ? Number(form.budget_hours) : null,
      budget_fee: form.budget_fee ? Number(form.budget_fee) : null,
      description: form.description || null,
      company_id: profile.company_id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Projeto criado!" });
    setDialogOpen(false);
    setForm({ name: "", code: "", client_account_id: "", project_manager_id: "", status: "planning", start_date: "", end_date_planned: "", budget_hours: "", budget_fee: "", description: "" });
    fetchProjects();
  };

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (clientFilter !== "all" && p.client_account_id !== clientFilter) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground mt-1">Pipeline de consultoria</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Novo Projeto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PRJ-001" /></div>
              <div><Label>Cliente *</Label>
                <Select value={form.client_account_id} onValueChange={(v) => setForm({ ...form, client_account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Gerente</Label>
                <Select value={form.project_manager_id} onValueChange={(v) => setForm({ ...form, project_manager_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Término Previsto</Label><Input type="date" value={form.end_date_planned} onChange={(e) => setForm({ ...form, end_date_planned: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Budget Horas</Label><Input type="number" value={form.budget_hours} onChange={(e) => setForm({ ...form, budget_hours: e.target.value })} /></div>
                <div><Label>Budget Fee (R$)</Label><Input type="number" value={form.budget_fee} onChange={(e) => setForm({ ...form, budget_fee: e.target.value })} /></div>
              </div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button variant="gold" className="w-full" onClick={handleCreate}>Criar Projeto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((project, i) => {
          const pct = project.task_total ? Math.round((project.task_done! / project.task_total) * 100) : 0;
          const sc = statusConfig[project.status] || statusConfig.planning;
          return (
            <Link to={`/projects/${project.id}`} key={project.id}
              className="bg-card rounded-xl p-5 border border-border hover:border-gold-subtle transition-all duration-200 shadow-card animate-slide-up block"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{project.name}</h4>
                  {project.code && <span className="text-xs text-muted-foreground">{project.code}</span>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.class}`}>{sc.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{(project.client_accounts as any)?.name || "—"}</p>
              <div className="w-full h-1.5 bg-secondary rounded-full mb-3">
                <div className="h-full bg-gradient-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(project.manager as any)?.name || "—"}</span>
                <span>{pct}% concluído</span>
              </div>
              {project.start_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3" /> {project.start_date} → {project.end_date_planned || "—"}
                </div>
              )}
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">Nenhum projeto encontrado.</p>}
    </div>
  );
}
