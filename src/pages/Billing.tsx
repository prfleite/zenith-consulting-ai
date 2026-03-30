import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Download, FileDown, CheckCircle2, DollarSign, TrendingUp, Clock, AlertCircle } from "lucide-react";
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
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/hooks/useCurrency";
import { KPICard } from "@/components/KPICard";

const invoiceStatusConfig: Record<string, { label: string; class: string; icon: any }> = {
  draft: { label: "Rascunho", class: "bg-muted/60 text-muted-foreground border-border", icon: Clock },
  sent: { label: "Enviada", class: "bg-info/15 text-info border-info/25", icon: TrendingUp },
  paid: { label: "Paga", class: "bg-success/15 text-success border-success/25", icon: CheckCircle2 },
  overdue: { label: "Atrasada", class: "bg-destructive/15 text-destructive border-destructive/25", icon: AlertCircle },
  cancelled: { label: "Cancelada", class: "bg-muted/60 text-muted-foreground border-border", icon: AlertCircle },
};

const tooltipStyle = {
  background: "hsl(220,20%,11%)",
  border: "1px solid hsl(43,74%,55%,0.2)",
  borderRadius: "10px",
  color: "hsl(40,12%,93%)",
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
  const { displayCurrency, setDisplayCurrency, convertAndFormat } = useCurrency("BRL");

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });

  const handleBulkPaid = async () => {
    for (const id of selected) await supabase.from("invoices").update({ status: "paid" as any }).eq("id", id);
    toast({ title: `${selected.size} faturas marcadas como pagas` });
    setSelected(new Set());
    fetchInvoices();
  };

  const fetchInvoices = async () => {
    const { data } = await supabase.from("invoices").select("*, client_accounts(name), projects(name)").order("issue_date", { ascending: false });
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

  const filtered = invoices.filter(inv => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (clientFilter !== "all" && inv.client_account_id !== clientFilter) return false;
    if (search && !inv.number.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(inv.issue_date) < dateFrom) return false;
    if (dateTo && new Date(inv.issue_date) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices.filter(i => ["draft", "sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; faturado: number; recebido: number }> = {};
    invoices.forEach(inv => {
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
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">Faturamento</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Gestão de faturas e receita —{" "}
            {overdueCount > 0 && <span className="text-destructive font-semibold">{overdueCount} fatura(s) atrasada(s)</span>}
            {overdueCount === 0 && <span className="text-success">sem atrasos</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="gold-outline" size="sm" onClick={() => exportToCSV(invoices.map(i => ({ Número: i.number, Status: i.status, Valor: i.amount, Emissão: i.issue_date })), "faturas")}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="gold-outline" size="sm" onClick={() => exportToPDF("Faturas", invoices.map(i => ({ Número: i.number, Status: i.status, "Valor (R$)": Number(i.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), Emissão: i.issue_date })))}>
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Nova Fatura</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading text-lg">Nova Fatura</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Número *</Label><Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="INV-001" className="mt-1 bg-secondary border-border" /></div>
                <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Cliente *</Label>
                  <Select value={form.client_account_id} onValueChange={v => setForm({ ...form, client_account_id: v })}>
                    <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Projeto</Label>
                  <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                    <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Emissão</Label><Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
                  <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Vencimento</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
                </div>
                <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
                <Button variant="gold" className="w-full" onClick={handleCreate}>Criar Fatura</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Faturado" value={convertAndFormat(totalInvoiced)} numericValue={Math.round(totalInvoiced)} sub={`${invoices.length} faturas`} icon={DollarSign} iconColor="text-foreground" delay={0} />
        <KPICard label="Total Recebido" value={convertAndFormat(totalPaid)} numericValue={Math.round(totalPaid)} sub={`${invoices.filter(i => i.status === "paid").length} pagas`} icon={CheckCircle2} iconColor="text-success" delay={0.06} />
        <KPICard label="Pendente" value={convertAndFormat(totalPending)} numericValue={Math.round(totalPending)} sub={`${invoices.filter(i => ["draft","sent","overdue"].includes(i.status)).length} em aberto`} icon={Clock} iconColor="text-warning" delay={0.12} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-card rounded-2xl p-5 border border-border flex flex-col items-center justify-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Moeda de Exibição</span>
          <CurrencySelector value={displayCurrency} onChange={setDisplayCurrency} />
        </motion.div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card hover:border-[var(--border-gold)] transition-all duration-300"
        >
          <h3 className="text-base font-heading font-semibold text-foreground mb-1">Receita Mensal</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses — Faturado vs Recebido</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,16%)" />
              <XAxis dataKey="month" stroke="hsl(220,10%,45%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(220,10%,45%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="faturado" fill="hsl(43,74%,55%)" radius={[5, 5, 0, 0]} name="Faturado" opacity={0.7} />
              <Bar dataKey="recebido" fill="hsl(152,60%,45%)" radius={[5, 5, 0, 0]} name="Recebido" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* AI Panel */}
      <AIAssistantPanel
        contextType="billing_forecast"
        title="Previsão de Fluxo de Caixa IA"
        placeholder="Ex: Qual a previsão de recebimento para os próximos 3 meses?"
        initialPrompt="Analise o histórico de faturas e gere uma previsão de fluxo de caixa para os próximos 3 meses com recomendações de cobrança."
        extraContext={`Total faturado: R$ ${totalInvoiced.toLocaleString("pt-BR")}\nRecebido: R$ ${totalPaid.toLocaleString("pt-BR")}\nPendente: R$ ${totalPending.toLocaleString("pt-BR")}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-secondary/50 border-border" placeholder="Buscar por número..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[165px] bg-secondary/50 border-border"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(invoiceStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
        {selected.size > 0 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Button variant="gold" size="sm" onClick={handleBulkPaid}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar Pagas ({selected.size})
            </Button>
          </motion.div>
        )}
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {paginated.map((inv: any, i) => {
          const sc = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
          const next = nextStatus[inv.status];
          const StatusIcon = sc.icon;
          return (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between hover:border-[var(--border-gold)] transition-all duration-200 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} />
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.class} border`}>
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{inv.number}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${sc.class}`}>{sc.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {inv.client_accounts?.name}{inv.projects?.name ? ` · ${inv.projects.name}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{inv.issue_date}{inv.due_date ? ` → ${inv.due_date}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-sm font-bold text-foreground">R$ {Number(inv.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                {next && (
                  <Button size="sm" variant="gold-outline" onClick={() => updateStatus(inv.id, next)} className="text-xs">
                    {next === "sent" ? "Enviar" : "Marcar Paga"}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p>Nenhuma fatura encontrada</p>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}
    </div>
  );
};

export default Billing;
