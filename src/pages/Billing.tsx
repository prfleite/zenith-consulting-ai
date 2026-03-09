import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Download, FileDown, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TablePagination } from "@/components/TablePagination";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";

const invoiceStatusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: "Rascunho", class: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", class: "bg-info/20 text-info" },
  paid: { label: "Paga", class: "bg-success/20 text-success" },
  overdue: { label: "Atrasada", class: "bg-destructive/20 text-destructive" },
  cancelled: { label: "Cancelada", class: "bg-muted text-muted-foreground" },
};

const Billing = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ number: "", client_account_id: "", project_id: "", amount: "", issue_date: "", due_date: "", notes: "" });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleBulkPaid = async () => {
    for (const id of selected) { await supabase.from("invoices").update({ status: "paid" as any }).eq("id", id); }
    toast({ title: `${selected.size} faturas marcadas como pagas` });
    setSelected(new Set());
    fetchInvoices();
  };

  const fetchInvoices = async () => {
    const { data } = await supabase.from("invoices").select("*, client_accounts(name), projects(name)")
      .order("issue_date", { ascending: false });
    setInvoices(data || []);
  };

  const fetchLookups = async () => {
    const [c, p] = await Promise.all([
      supabase.from("client_accounts").select("id, name").order("name"),
      supabase.from("projects").select("id, name").order("name"),
    ]);
    setClients(c.data || []);
    setProjects(p.data || []);
  };

  useEffect(() => { fetchInvoices(); fetchLookups(); }, []);

  const handleCreate = async () => {
    if (!form.number || !form.client_account_id || !form.amount || !profile?.company_id) return;
    const { error } = await supabase.from("invoices").insert({
      company_id: profile.company_id, number: form.number, client_account_id: form.client_account_id,
      project_id: form.project_id || null, amount: Number(form.amount),
      issue_date: form.issue_date || new Date().toISOString().split("T")[0],
      due_date: form.due_date || null, notes: form.notes || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fatura criada!" });
    setDialogOpen(false);
    setForm({ number: "", client_account_id: "", project_id: "", amount: "", issue_date: "", due_date: "", notes: "" });
    fetchInvoices();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("invoices").update({ status: status as any }).eq("id", id);
    toast({ title: `Status atualizado para ${invoiceStatusConfig[status]?.label}` });
    fetchInvoices();
  };

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (clientFilter !== "all" && inv.client_account_id !== clientFilter) return false;
    if (search && !inv.number.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(inv.issue_date) < dateFrom) return false;
    if (dateTo && new Date(inv.issue_date) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices.filter((i) => ["draft", "sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; faturado: number; recebido: number }> = {};
    invoices.forEach((inv) => {
      const m = inv.issue_date?.slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { month: m, faturado: 0, recebido: 0 };
      months[m].faturado += Number(inv.amount);
      if (inv.status === "paid") months[m].recebido += Number(inv.amount);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [invoices]);

  const nextStatus: Record<string, string> = { draft: "sent", sent: "paid" };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Faturamento</h1>
          <p className="text-muted-foreground mt-1">Gestão de faturas e receita</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gold-outline" size="sm" onClick={() => exportToCSV(invoices.map(i => ({ Número: i.number, Status: i.status, Valor: i.amount, Emissão: i.issue_date, Vencimento: i.due_date || "—" })), "faturas")}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="gold-outline" size="sm" onClick={() => exportToPDF("Faturas", invoices.map(i => ({ Número: i.number, Status: i.status, "Valor (R$)": Number(i.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), Emissão: i.issue_date, Vencimento: i.due_date || "—" })))}>
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Nova Fatura</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Número *</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="INV-001" /></div>
              <div><Label>Cliente *</Label>
                <Select value={form.client_account_id} onValueChange={(v) => setForm({ ...form, client_account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Projeto</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Emissão</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
                <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button variant="gold" className="w-full" onClick={handleCreate}>Criar Fatura</Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <span className="text-sm text-muted-foreground">Total Faturado</span>
          <p className="text-2xl font-bold text-foreground">R$ {totalInvoiced.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <span className="text-sm text-muted-foreground">Total Recebido</span>
          <p className="text-2xl font-bold text-success">R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <span className="text-sm text-muted-foreground">Pendente</span>
          <p className="text-2xl font-bold text-warning">R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", color: "hsl(40, 10%, 92%)" }} />
              <Bar dataKey="faturado" fill="hsl(43, 74%, 55%)" radius={[4, 4, 0, 0]} name="Faturado" />
              <Bar dataKey="recebido" fill="hsl(152, 60%, 45%)" radius={[4, 4, 0, 0]} name="Recebido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(invoiceStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <DateRangeFilter startDate={dateFrom} endDate={dateTo} onChangeStart={(d) => { setDateFrom(d); setPage(1); }} onChangeEnd={(d) => { setDateTo(d); setPage(1); }} onClear={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }} />
        {selected.size > 0 && (
          <Button variant="gold" size="sm" onClick={handleBulkPaid}><CheckCircle2 className="w-4 h-4 mr-1" /> Marcar Pagas ({selected.size})</Button>
        )}
      </div>

      {/* AI Cash Flow Prediction */}
      <AIAssistantPanel
        contextType="billing_forecast"
        title="Previsão de Fluxo de Caixa IA"
        placeholder="Ex: Qual a previsão de recebimento para os próximos 3 meses?"
        initialPrompt="Analise o histórico de faturas e gere uma previsão de fluxo de caixa para os próximos 3 meses com recomendações de cobrança."
        extraContext={`Resumo de faturas:\n- Total faturado: R$ ${totalInvoiced.toLocaleString("pt-BR")}\n- Total recebido: R$ ${totalPaid.toLocaleString("pt-BR")}\n- Pendente: R$ ${totalPending.toLocaleString("pt-BR")}\n- Faturas por status: ${Object.entries(invoiceStatusConfig).map(([k]) => `${k}: ${invoices.filter(i => i.status === k).length}`).join(", ")}\n- Últimas faturas: ${invoices.slice(0, 10).map(i => `${i.number} R$${i.amount} ${i.status} venc:${i.due_date || "N/A"}`).join("; ")}`}
      />

      {/* Invoice List */}
      <div className="space-y-2">
        {paginated.map((inv: any) => {
          const sc = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
          const next = nextStatus[inv.status];
          return (
            <div key={inv.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between hover:border-gold-subtle transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{inv.number}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sc.class}`}>{sc.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{inv.client_accounts?.name}{inv.projects?.name ? ` · ${inv.projects.name}` : ""}</p>
                <p className="text-xs text-muted-foreground">{inv.issue_date}{inv.due_date ? ` → ${inv.due_date}` : ""}</p>
              </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-foreground">R$ {Number(inv.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                {next && (
                  <Button size="sm" variant="gold-outline" onClick={() => updateStatus(inv.id, next)}>
                    {next === "sent" ? "Enviar" : "Marcar Paga"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma fatura encontrada.</p>}
      </div>

      {filtered.length > 0 && (
        <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}
    </div>
  );
};

export default Billing;
