import { useEffect, useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, emptyStates } from "@/components/EmptyState";
import { Plus, Target, List, LayoutGrid, DollarSign, TrendingUp, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TablePagination } from "@/components/TablePagination";

type Opportunity = {
  id: string;
  title: string;
  stage: string;
  expected_value: number;
  probability: number;
  close_date: string | null;
  client_account?: { name: string } | null;
  owner?: { name: string } | null;
};

const stages = [
  { key: "lead", label: "Lead", color: "border-info/35 bg-info/5", accent: "bg-info", text: "text-info", header: "bg-info/10" },
  { key: "qualified", label: "Qualificado", color: "border-gold/35 bg-gold/5", accent: "bg-gold", text: "text-gold", header: "bg-gold/10" },
  { key: "proposal", label: "Proposta", color: "border-warning/35 bg-warning/5", accent: "bg-warning", text: "text-warning", header: "bg-warning/10" },
  { key: "negotiation", label: "Negociação", color: "border-purple-500/35 bg-purple-500/5", accent: "bg-purple-500", text: "text-purple-400", header: "bg-purple-500/10" },
  { key: "won", label: "Ganho", color: "border-success/35 bg-success/5", accent: "bg-success", text: "text-success", header: "bg-success/10" },
  { key: "lost", label: "Perdido", color: "border-destructive/35 bg-destructive/5", accent: "bg-destructive", text: "text-destructive", header: "bg-destructive/10" },
];

// 3D Tilt Kanban Card
function TiltCard({ opp, stage, formatValue }: { opp: Opportunity; stage: typeof stages[0]; formatValue: (v: number) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 400, damping: 35 });
  const springY = useSpring(rotateY, { stiffness: 400, damping: 35 });
  const shadow = useTransform([springX, springY], ([rx, ry]) => {
    const x = (ry as number) * 0.5;
    const y = -(rx as number) * 0.5;
    return `${x}px ${y}px 20px hsl(43,74%,55%,0.15)`;
  });

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * 10);
    rotateY.set(x * 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: springX, rotateY: springY, boxShadow: shadow, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl border ${stage.color} transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden`}
      draggable
      onDragStart={(e) => (e as any).dataTransfer?.setData("oppId", opp.id)}
    >
      <Link to={`/opportunities/${opp.id}`} className="block p-3.5" onClick={e => e.preventDefault()}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-xs font-semibold text-foreground leading-snug flex-1">{opp.title}</h4>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-card border ${stage.color} ${stage.text} flex-shrink-0`}>
            {opp.probability}%
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mb-2.5">
          {(opp.client_account as any)?.name || "—"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{formatValue(opp.expected_value)}</span>
          {opp.close_date && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(opp.close_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}
        </div>
        <div className="mt-2 w-full h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${opp.probability}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full rounded-full ${stage.accent}`}
          />
        </div>
      </Link>
      <Link
        to={`/opportunities/${opp.id}`}
        className="block text-center text-[10px] text-muted-foreground hover:text-gold py-1.5 bg-secondary/30 border-t border-border/50 transition-colors"
      >
        Ver detalhes →
      </Link>
    </motion.div>
  );
}

const Opportunities = () => {
  const { profile } = useAuth();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", client_account_id: "", expected_value: "", probability: "10", stage: "lead", close_date: "", description: "" });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: oppsData }, { data: clientsData }] = await Promise.all([
      supabase.from("opportunities").select("*, client_account:client_accounts(name), owner:profiles!opportunities_owner_id_fkey(name)").order("created_at", { ascending: false }),
      supabase.from("client_accounts").select("id, name").order("name"),
    ]);
    if (oppsData) setOpps(oppsData as any);
    if (clientsData) setClients(clientsData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.client_account_id || !profile?.company_id) return;
    setSaving(true);
    const { error } = await supabase.from("opportunities").insert({
      company_id: profile.company_id, title: form.title, client_account_id: form.client_account_id,
      expected_value: form.expected_value ? Number(form.expected_value) : 0,
      probability: Number(form.probability) || 10, stage: form.stage as any,
      close_date: form.close_date || null, description: form.description || null, owner_id: profile.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro ao criar oportunidade", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Oportunidade criada!" });
    setShowCreate(false);
    setForm({ title: "", client_account_id: "", expected_value: "", probability: "10", stage: "lead", close_date: "", description: "" });
    fetchData();
  };

  const handleDrop = async (oppId: string, newStage: string) => {
    setOpps(prev => prev.map(o => o.id === oppId ? { ...o, stage: newStage } : o));
    await supabase.from("opportunities").update({ stage: newStage as any }).eq("id", oppId);
    setDragOver(null);
  };

  const formatValue = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`;

  const stageTotal = (stageKey: string) => opps.filter(o => o.stage === stageKey).reduce((sum, o) => sum + (o.expected_value || 0), 0);

  const filteredOpps = opps.filter(o => {
    if (dateFrom && o.close_date && new Date(o.close_date) < dateFrom) return false;
    if (dateTo && o.close_date && new Date(o.close_date) > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  });

  const paginatedList = filteredOpps.slice((page - 1) * pageSize, page * pageSize);
  const totalPipelineValue = opps.filter(o => !["won", "lost"].includes(o.stage)).reduce((s, o) => s + o.expected_value, 0);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full"
      />
    </div>
  );

  if (!loading && opps.length === 0) return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient-gold">Oportunidades</h1>
          <p className="text-muted-foreground mt-1">Pipeline de vendas</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Nova Oportunidade</Button>
      </div>
      <EmptyState {...emptyStates.opportunities} actionLabel="Nova Oportunidade" onAction={() => setShowCreate(true)} />
      <CreateDialog open={showCreate} onOpenChange={setShowCreate} form={form} setForm={setForm} clients={clients} onSubmit={handleCreate} saving={saving} />
    </div>
  );

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
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">Oportunidades</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Pipeline com <span className="text-gold font-semibold">{formatValue(totalPipelineValue)}</span> em negociação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-xl p-0.5 border border-border">
            {(["kanban", "list"] as const).map(v => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v === "kanban" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </motion.button>
            ))}
          </div>
          <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Nova Oportunidade
          </Button>
        </div>
      </motion.div>

      {view === "list" && (
        <div className="flex flex-wrap gap-3">
          <DateRangeFilter startDate={dateFrom} endDate={dateTo} onChangeStart={(d) => { setDateFrom(d); setPage(1); }} onChangeEnd={(d) => { setDateTo(d); setPage(1); }} onClear={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }} />
        </div>
      )}

      {/* Kanban Board */}
      {view === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[400px]">
          {stages.map((stage, si) => {
            const stageOpps = filteredOpps.filter(o => o.stage === stage.key);
            const isOver = dragOver === stage.key;
            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.06 }}
                className="flex flex-col gap-2"
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => { const oppId = e.dataTransfer.getData("oppId"); if (oppId) handleDrop(oppId, stage.key); }}
              >
                {/* Column Header */}
                <div className={`rounded-xl px-3 py-2 ${stage.header} border ${stage.color} transition-all duration-200 ${isOver ? "scale-[1.02] shadow-md" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${stage.text}`}>{stage.label}</span>
                    <span className="text-xs text-muted-foreground bg-card/60 px-1.5 py-0.5 rounded-full font-medium">{stageOpps.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">{formatValue(stageTotal(stage.key))}</p>
                </div>

                {/* Cards */}
                <AnimatePresence>
                  {stageOpps.map((opp) => (
                    <motion.div
                      key={opp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                    >
                      <TiltCard opp={opp} stage={stage} formatValue={formatValue} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Drop zone indicator */}
                <AnimatePresence>
                  {isOver && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`h-16 rounded-xl border-2 border-dashed ${stage.color} flex items-center justify-center`}
                    >
                      <span className={`text-xs ${stage.text}`}>Soltar aqui</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {paginatedList.map((opp, i) => {
              const stage = stages.find(s => s.key === opp.stage);
              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 2 }}
                >
                  <Link to={`/opportunities/${opp.id}`} className={`block bg-card rounded-2xl p-4 border ${stage?.color || "border-border"} flex items-center justify-between hover:shadow-gold transition-all duration-200`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${stage?.header} border ${stage?.color} flex items-center justify-center flex-shrink-0`}>
                        <Target className={`w-4 h-4 ${stage?.text}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground text-sm truncate">{opp.title}</h4>
                        <p className="text-xs text-muted-foreground">{(opp.client_account as any)?.name} · {stages.find(s => s.key === opp.stage)?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground font-semibold">{formatValue(opp.expected_value)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{opp.probability}%</span>
                      </div>
                      <span className="text-muted-foreground text-xs hidden md:block">{opp.close_date || "—"}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
          {filteredOpps.length > 0 && (
            <TablePagination totalItems={filteredOpps.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </>
      )}

      <CreateDialog open={showCreate} onOpenChange={setShowCreate} form={form} setForm={setForm} clients={clients} onSubmit={handleCreate} saving={saving} />
    </div>
  );
};

function CreateDialog({ open, onOpenChange, form, setForm, clients, onSubmit, saving }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-heading text-lg">Nova Oportunidade</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título *</Label>
            <Input value={form.title} onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="Ex: Consultoria estratégica" className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cliente *</Label>
            <Select value={form.client_account_id} onValueChange={(v: any) => setForm((f: any) => ({ ...f, client_account_id: v }))}>
              <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor Esperado (R$)</Label>
              <Input type="number" value={form.expected_value} onChange={(e: any) => setForm((f: any) => ({ ...f, expected_value: e.target.value }))} placeholder="0" className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Probabilidade (%)</Label>
              <Input type="number" value={form.probability} onChange={(e: any) => setForm((f: any) => ({ ...f, probability: e.target.value }))} min="0" max="100" className="bg-secondary border-border mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Estágio</Label>
              <Select value={form.stage} onValueChange={(v: any) => setForm((f: any) => ({ ...f, stage: v }))}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data de Fechamento</Label>
              <Input type="date" value={form.close_date} onChange={(e: any) => setForm((f: any) => ({ ...f, close_date: e.target.value }))} className="bg-secondary border-border mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="gold" onClick={onSubmit} disabled={saving || !form.title || !form.client_account_id}>
            {saving ? "Criando..." : "Criar Oportunidade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Opportunities;
