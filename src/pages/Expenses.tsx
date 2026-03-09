import { useState, useEffect } from "react";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TablePagination } from "@/components/TablePagination";

const categories = ["Transporte", "Hospedagem", "Alimentação", "Software", "Outros"];

const Expenses = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const isManager = profile?.role === "admin" || profile?.role === "manager";
  const [expenses, setExpenses] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: "", project_id: "", category: "Outros", amount: "", description: "", receipt_url: "" });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchExpenses = async () => {
    if (!user) return;
    const { data } = await supabase.from("expenses").select("*, projects(name)")
      .eq("user_id", user.id).order("date", { ascending: false });
    setExpenses(data || []);
  };

  const fetchPending = async () => {
    if (!isManager) return;
    const { data } = await supabase.from("expenses").select("*, profiles(name), projects(name)")
      .eq("approval_status", "pending").order("date", { ascending: false });
    setPendingExpenses(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("id, name").order("name");
    setProjects(data || []);
  };

  useEffect(() => { fetchExpenses(); fetchPending(); fetchProjects(); }, [user]);

  const handleCreate = async () => {
    if (!form.date || !form.project_id || !form.amount || !user) return;
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id, project_id: form.project_id, date: form.date,
      amount: Number(form.amount), category: form.category, description: form.description || null,
      receipt_url: form.receipt_url || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Despesa registrada!" });
    setDialogOpen(false);
    setForm({ date: "", project_id: "", category: "Outros", amount: "", description: "", receipt_url: "" });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
  };

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("expenses").update({ approval_status: status, approved_by: user?.id } as any).eq("id", id);
    toast({ title: status === "approved" ? "Aprovada!" : "Rejeitada!" });
    fetchPending();
  };

  const filteredExpenses = expenses.filter(e => {
    if (dateFrom && new Date(e.date) < dateFrom) return false;
    if (dateTo && new Date(e.date) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginatedExpenses = filteredExpenses.slice((page - 1) * pageSize, page * pageSize);
  const totalAmount = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground mt-1">Gestão de despesas de projeto</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Nova Despesa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Projeto *</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>URL do Recibo</Label><Input value={form.receipt_url} onChange={(e) => setForm({ ...form, receipt_url: e.target.value })} placeholder="https://..." /></div>
              <Button variant="gold" className="w-full" onClick={handleCreate}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my">
        <TabsList className="bg-secondary">
          <TabsTrigger value="my">Minhas Despesas</TabsTrigger>
          {isManager && <TabsTrigger value="approvals">Aprovações ({pendingExpenses.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              <span className="text-xs text-muted-foreground">Total</span>
              <p className="text-lg font-bold text-foreground">R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <DateRangeFilter startDate={dateFrom} endDate={dateTo} onChangeStart={(d) => { setDateFrom(d); setPage(1); }} onChangeEnd={(d) => { setDateTo(d); setPage(1); }} onClear={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }} />
          </div>
          <div className="space-y-2">
            {paginatedExpenses.map((e: any) => (
              <div key={e.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.projects?.name}</p>
                  <p className="text-xs text-muted-foreground">{e.date} · {e.category}{e.description ? ` · ${e.description}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">R$ {Number(e.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${e.approval_status === "approved" ? "bg-success/20 text-success" : e.approval_status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{e.approval_status}</span>
                  </div>
                  {e.approval_status === "pending" && (
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredExpenses.length > 0 && (
            <TablePagination totalItems={filteredExpenses.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </TabsContent>

        {isManager && (
          <TabsContent value="approvals" className="space-y-2">
            {pendingExpenses.map((e: any) => (
              <div key={e.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.profiles?.name}</p>
                  <p className="text-xs text-muted-foreground">{e.projects?.name} · {e.date} · {e.category}</p>
                  {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">R$ {Number(e.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <Button size="sm" variant="ghost" className="text-success hover:bg-success/10" onClick={() => handleApproval(e.id, "approved")}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleApproval(e.id, "rejected")}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {pendingExpenses.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma aprovação pendente.</p>}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Expenses;
