import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, emptyStates } from "@/components/EmptyState";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { Search, Plus, Building2, Download, FileDown, Trash2, ChevronRight, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TablePagination } from "@/components/TablePagination";

type ClientAccount = {
  id: string;
  name: string;
  segment: string | null;
  industry: string | null;
  country: string | null;
  health_score: number | null;
  annual_revenue: number | null;
  owner_id: string | null;
  created_at: string;
  owner?: { name: string } | null;
};

const segments = ["Enterprise", "Mid-Market", "SMB", "Startup"];
const industries = ["Tecnologia", "Saúde", "Financeiro", "Varejo", "Educação", "Manufatura", "Serviços", "Energia", "Agro", "Outro"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as any } },
};

const Clients = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", segment: "", industry: "", country: "Brasil", website: "", annual_revenue: "" });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(prev => prev.size === paginated.length ? new Set() : new Set(paginated.map(c => c.id)));

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    for (const id of selected) await supabase.from("client_accounts").delete().eq("id", id);
    toast({ title: `${selected.size} clientes excluídos` });
    setSelected(new Set());
    fetchClients();
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("client_accounts")
      .select("*, owner:profiles!client_accounts_owner_id_fkey(name)")
      .order("name");
    if (data) setClients(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreate = async () => {
    if (!form.name || !profile?.company_id) return;
    setSaving(true);
    const { error } = await supabase.from("client_accounts").insert({
      company_id: profile.company_id,
      name: form.name,
      segment: form.segment || null,
      industry: form.industry || null,
      country: form.country || "Brasil",
      website: form.website || null,
      annual_revenue: form.annual_revenue ? Number(form.annual_revenue) : null,
      owner_id: profile.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cliente criado com sucesso!" });
    setShowCreate(false);
    setForm({ name: "", segment: "", industry: "", country: "Brasil", website: "", annual_revenue: "" });
    fetchClients();
  };

  const filtered = clients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.segment || "").toLowerCase().includes(search.toLowerCase()) && !(c.industry || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(c.created_at) < dateFrom) return false;
    if (dateTo && new Date(c.created_at) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getHealthColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getHealthBg = (score: number | null) => {
    if (!score) return "bg-muted/20 border-border";
    if (score >= 80) return "bg-success/10 border-success/20";
    if (score >= 60) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const formatRevenue = (v: number | null) => {
    if (!v) return "—";
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
    return `R$ ${v}`;
  };

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
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">
            Clientes
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            <span className="text-gold font-semibold">{clients.length}</span> clientes registrados na plataforma
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="gold-outline" size="sm" onClick={() => exportToCSV(clients.map(c => ({ Nome: c.name, Segmento: c.segment, Indústria: c.industry, País: c.country, "Health Score": c.health_score })), "clientes")}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="gold-outline" size="sm" onClick={() => exportToPDF("Clientes", clients.map(c => ({ Nome: c.name, Segmento: c.segment || "—", Indústria: c.industry || "—", País: c.country || "—", "Health Score": c.health_score ?? "—" })))}>
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, segmento ou indústria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border focus:border-gold/40"
          />
        </div>
        <DateRangeFilter
          startDate={dateFrom} endDate={dateTo}
          onChangeStart={(d) => { setDateFrom(d); setPage(1); }}
          onChangeEnd={(d) => { setDateTo(d); setPage(1); }}
          onClear={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }}
        />
        {selected.size > 0 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir ({selected.size})
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Checkbox checked={selected.size === paginated.length && paginated.length > 0} onCheckedChange={toggleAll} />
            <span className="text-xs text-muted-foreground">Selecionar página ({paginated.length})</span>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
            {paginated.map((client) => (
              <motion.div
                key={client.id}
                variants={itemVariants}
                whileHover={{ y: -1 }}
                className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:border-[var(--border-gold-hover)] hover:shadow-gold group"
              >
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <Checkbox
                      checked={selected.has(client.id)}
                      onCheckedChange={() => toggleSelect(client.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="w-11 h-11 rounded-xl bg-gradient-gold-subtle border border-[var(--border-gold)] flex items-center justify-center flex-shrink-0"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                    <div className="min-w-0" onClick={() => navigate(`/clients/${client.id}`)}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors">{client.name}</h3>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {[client.industry, client.segment, client.country].filter(Boolean).join(" · ")}
                      </p>
                      {client.owner && (
                        <p className="text-xs text-muted-foreground mt-0.5">Owner: {(client.owner as any).name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground">{formatRevenue(client.annual_revenue)}</p>
                      <p className="text-xs text-muted-foreground">receita anual</p>
                    </div>
                    <div className={`text-center px-3 py-1.5 rounded-xl border ${getHealthBg(client.health_score)}`}>
                      <p className={`text-lg font-bold leading-tight ${getHealthColor(client.health_score)}`}>{client.health_score || "—"}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">saúde</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && !search && !dateFrom && !dateTo && (
            <EmptyState {...emptyStates.clients} actionLabel="Novo Cliente" onAction={() => setShowCreate(true)} />
          )}
          {filtered.length === 0 && (search || dateFrom || dateTo) && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum cliente encontrado para os filtros aplicados</p>
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <TablePagination
          totalItems={filtered.length} page={page} pageSize={pageSize}
          onPageChange={setPage} onPageSizeChange={setPageSize}
        />
      )}

      {/* Create Dialog */}
      <AnimatePresence>
        {showCreate && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading text-lg">Novo Cliente</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da empresa" className="bg-secondary border-border mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Segmento</Label>
                    <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                      <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{segments.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Indústria</Label>
                    <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                      <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">País</Label>
                    <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Receita Anual (R$)</Label>
                    <Input type="number" value={form.annual_revenue} onChange={e => setForm(f => ({ ...f, annual_revenue: e.target.value }))} placeholder="0" className="bg-secondary border-border mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Website</Label>
                  <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className="bg-secondary border-border mt-1" />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button variant="gold" onClick={handleCreate} disabled={saving || !form.name}>
                  {saving ? "Salvando..." : "Criar Cliente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
