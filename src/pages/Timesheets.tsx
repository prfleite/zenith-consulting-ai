import { useState, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, X, Download, FileDown, Brain, Loader2 } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { useAIChat } from "@/lib/ai/useAIChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TablePagination } from "@/components/TablePagination";

function getWeekDays(offset: number) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const Timesheets = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const isManager = profile?.role === "admin" || profile?.role === "manager";
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const [entries, setEntries] = useState<any[]>([]);
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: "", project_id: "", task_id: "", hours: "", billable: true, notes: "" });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase.from("time_entries").select("*, profiles(name), projects(name)")
      .eq("user_id", user.id).gte("date", weekDays[0]).lte("date", weekDays[6]).order("date");
    setEntries(data || []);
  };

  const fetchPending = async () => {
    if (!isManager || !profile?.company_id) return;
    const { data } = await supabase.from("time_entries").select("*, profiles(name), projects(name)")
      .eq("approval_status", "pending").order("date", { ascending: false });
    setPendingEntries(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("id, name").order("name");
    setProjects(data || []);
  };

  const fetchTasks = async (projectId: string) => {
    const { data } = await supabase.from("project_tasks").select("id, title").eq("project_id", projectId);
    setTasks(data || []);
  };

  useEffect(() => { fetchEntries(); fetchPending(); fetchProjects(); }, [weekOffset, user]);
  useEffect(() => { if (form.project_id) fetchTasks(form.project_id); }, [form.project_id]);

  const handleCreate = async () => {
    if (!form.date || !form.project_id || !form.hours || !user) return;
    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id, project_id: form.project_id, task_id: form.task_id || null,
      date: form.date, hours: Number(form.hours), billable: form.billable, notes: form.notes || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Horas registradas!" });
    setDialogOpen(false);
    setForm({ date: "", project_id: "", task_id: "", hours: "", billable: true, notes: "" });
    fetchEntries();
  };

  const handleApproval = async (entryId: string, status: "approved" | "rejected") => {
    await supabase.from("time_entries").update({ approval_status: status, approved_by: user?.id } as any).eq("id", entryId);
    toast({ title: status === "approved" ? "Aprovado!" : "Rejeitado!" });
    fetchPending();
  };

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const weekTotal = entries.reduce((s, e) => s + Number(e.hours), 0);

  const filteredEntries = entries.filter(e => {
    if (dateFrom && new Date(e.date) < dateFrom) return false;
    if (dateTo && new Date(e.date) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginatedEntries = filteredEntries.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground mt-1">Registro e aprovação de horas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gold-outline" size="sm" onClick={() => exportToCSV(entries.map(e => ({ Data: e.date, Projeto: (e as any).projects?.name || "—", Horas: e.hours, Billable: e.billable ? "Sim" : "Não", Notas: e.notes || "" })), "timesheets")}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="gold-outline" size="sm" onClick={() => exportToPDF("Timesheets", entries.map(e => ({ Data: e.date, Horas: e.hours, Billable: e.billable ? "Sim" : "Não", Notas: e.notes || "—" })))}>
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Registrar Horas</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Horas</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Projeto *</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v, task_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {tasks.length > 0 && (
                <div><Label>Tarefa</Label>
                  <Select value={form.task_id} onValueChange={(v) => setForm({ ...form, task_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Horas *</Label><Input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.billable} onCheckedChange={(v) => setForm({ ...form, billable: v })} /><Label>Billable</Label></div>
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button variant="gold" className="w-full" onClick={handleCreate}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="my">
        <TabsList className="bg-secondary">
          <TabsTrigger value="my">Minhas Horas</TabsTrigger>
          {isManager && <TabsTrigger value="approvals">Aprovações ({pendingEntries.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {/* Week nav */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-foreground font-medium">{weekDays[0]} — {weekDays[6]}</span>
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}><ChevronRight className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground ml-auto">Total: <strong className="text-foreground">{weekTotal}h</strong></span>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const dayEntries = entries.filter((e) => e.date === day);
              const dayTotal = dayEntries.reduce((s: number, e: any) => s + Number(e.hours), 0);
              return (
                <div key={day} className="bg-card rounded-lg p-3 border border-border min-h-[120px]">
                  <div className="text-xs text-muted-foreground mb-1">{dayNames[i]}</div>
                  <div className="text-xs text-foreground font-medium mb-2">{day.slice(5)}</div>
                  {dayEntries.map((e: any) => (
                    <div key={e.id} className="text-xs bg-secondary rounded px-1.5 py-0.5 mb-1 truncate">
                      {e.hours}h · {e.projects?.name?.slice(0, 10)}
                    </div>
                  ))}
                  {dayTotal > 0 && <div className="text-xs font-bold text-gold mt-1">{dayTotal}h</div>}
                </div>
              );
            })}
          </div>

          {/* Date filter + entries list */}
          <div className="flex flex-wrap gap-3">
            <DateRangeFilter startDate={dateFrom} endDate={dateTo} onChangeStart={(d) => { setDateFrom(d); setPage(1); }} onChangeEnd={(d) => { setDateTo(d); setPage(1); }} onClear={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }} />
          </div>

          <div className="space-y-2">
            {paginatedEntries.map((e: any) => (
              <div key={e.id} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{e.projects?.name} · {e.date}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{e.hours}h</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${e.approval_status === "approved" ? "bg-success/20 text-success" : e.approval_status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{e.approval_status}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredEntries.length > 0 && (
            <TablePagination totalItems={filteredEntries.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </TabsContent>

        {isManager && (
          <TabsContent value="approvals" className="space-y-2">
            {pendingEntries.map((e: any) => (
              <div key={e.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.profiles?.name}</p>
                  <p className="text-xs text-muted-foreground">{e.projects?.name} · {e.date} · {e.hours}h{e.billable ? " (billable)" : ""}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-success hover:bg-success/10" onClick={() => handleApproval(e.id, "approved")}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleApproval(e.id, "rejected")}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {pendingEntries.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma aprovação pendente.</p>}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Timesheets;
