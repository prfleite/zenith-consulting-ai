import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, FolderKanban, Users, Calendar, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TablePagination } from "@/components/TablePagination";

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

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
  planning: { label: "Planejamento", class: "bg-info/15 text-info border-info/25", dot: "bg-info" },
  active: { label: "Ativo", class: "bg-success/15 text-success border-success/25", dot: "bg-success" },
  on_hold: { label: "Pausado", class: "bg-warning/15 text-warning border-warning/25", dot: "bg-warning" },
  completed: { label: "Concluído", class: "bg-muted/60 text-muted-foreground border-border", dot: "bg-muted-foreground" },
  cancelled: { label: "Cancelado", class: "bg-destructive/15 text-destructive border-destructive/25", dot: "bg-destructive" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as any } },
};

const Projects = () => {
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
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, client_accounts(name), manager:profiles!projects_project_manager_id_fkey(name)")
      .order("created_at", { ascending: false });
    if (!data) return;
    const ids = data.map(p => p.id);
    const { data: tasks } = await supabase.from("project_tasks").select("project_id, status").in("project_id", ids);
    const enriched = data.map(p => {
      const pt = (tasks || []).filter(t => t.project_id === p.id);
      return { ...p, task_total: pt.length, task_done: pt.filter(t => t.status === "done").length } as ProjectRow;
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
      name: form.name, code: form.code || null, client_account_id: form.client_account_id,
      project_manager_id: form.project_manager_id || null, status: form.status as any,
      start_date: form.start_date || null, end_date_planned: form.end_date_planned || null,
      budget_hours: form.budget_hours ? Number(form.budget_hours) : null,
      budget_fee: form.budget_fee ? Number(form.budget_fee) : null,
      description: form.description || null, company_id: profile.company_id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Projeto criado!" });
    setDialogOpen(false);
    setForm({ name: "", code: "", client_account_id: "", project_manager_id: "", status: "planning", start_date: "", end_date_planned: "", budget_hours: "", budget_fee: "", description: "" });
    fetchProjects();
  };

  const filtered = projects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (clientFilter !== "all" && p.client_account_id !== clientFilter) return false;
    if (dateFrom && p.start_date && new Date(p.start_date) < dateFrom) return false;
    if (dateTo && p.start_date && new Date(p.start_date) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stats summary
  const activeCount = projects.filter(p => p.status === "active").length;
  const totalBudget = projects.reduce((s, p) => s + Number(p.budget_fee || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">Projetos</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            <span className="text-success font-semibold">{activeCount} ativos</span> · {projects.length} no total ·{" "}
            <span className="text-gold font-semibold">R$ {(totalBudget / 1000).toFixed(0)}k</span> em budget
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Novo Projeto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-lg">Novo Projeto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Código</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="PRJ-001" className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cliente *</Label>
                <Select value={form.client_account_id} onValueChange={v => setForm({ ...form, client_account_id: v })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Gerente</Label>
                <Select value={form.project_manager_id} onValueChange={v => setForm({ ...form, project_manager_id: v })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Início</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Término Previsto</Label>
                  <Input type="date" value={form.end_date_planned} onChange={e => setForm({ ...form, end_date_planned: e.target.value })} className="mt-1 bg-secondary border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Budget Horas</Label>
                  <Input type="number" value={form.budget_hours} onChange={e => setForm({ ...form, budget_hours: e.target.value })} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Budget Fee (R$)</Label>
                  <Input type="number" value={form.budget_fee} onChange={e => setForm({ ...form, budget_fee: e.target.value })} className="mt-1 bg-secondary border-border" />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 bg-secondary border-border" rows={3} />
              </div>
              <Button variant="gold" className="w-full" onClick={handleCreate}>Criar Projeto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-secondary/50 border-border" placeholder="Buscar projetos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[165px] bg-secondary/50 border-border">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={v => { setClientFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[185px] bg-secondary/50 border-border"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <DateRangeFilter startDate={dateFrom} endDate={dateTo} onChangeStart={d => { setDateFrom(d); setPage(1); }} onChangeEnd={d => { setDateTo(d); setPage(1); }} onClear={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }} />
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {paginated.map((project) => {
          const pct = project.task_total ? Math.round(((project.task_done || 0) / project.task_total) * 100) : 0;
          const sc = statusConfig[project.status] || statusConfig.planning;
          const daysLeft = project.end_date_planned ? Math.ceil((new Date(project.end_date_planned).getTime() - Date.now()) / 86400000) : null;
          return (
            <motion.div key={project.id} variants={cardVariants} whileHover={{ y: -3 }}>
              <Link
                to={`/projects/${project.id}`}
                className="block bg-card rounded-2xl p-5 border border-border hover:border-[var(--border-gold-hover)] transition-all duration-300 hover:shadow-gold group"
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-gold transition-colors">{project.name}</h4>
                    {project.code && <span className="text-[11px] text-muted-foreground font-mono">{project.code}</span>}
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 flex items-center gap-1 ${sc.class}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} flex-shrink-0`} />
                    {sc.label}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-3">{(project.client_accounts as any)?.name || "—"}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span className="font-medium text-foreground">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-gold rounded-full"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    <span>{(project.manager as any)?.name || "Sem gerente"}</span>
                  </div>
                  {daysLeft !== null && (
                    <div className={`flex items-center gap-1 ${daysLeft < 0 ? "text-destructive" : daysLeft < 7 ? "text-warning" : ""}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restantes`}</span>
                    </div>
                  )}
                </div>

                {project.budget_fee && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                    <BarChart3 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Budget: <span className="text-foreground font-medium">R$ {Number(project.budget_fee).toLocaleString("pt-BR")}</span></span>
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="text-base font-medium">Nenhum projeto encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou crie um novo projeto</p>
        </div>
      )}

      {filtered.length > 0 && (
        <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}
    </div>
  );
};

export default Projects;
