import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Target, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

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
  { key: "lead", label: "Lead", color: "border-info/40" },
  { key: "qualified", label: "Qualificado", color: "border-gold/40" },
  { key: "proposal", label: "Proposta", color: "border-warning/40" },
  { key: "negotiation", label: "Negociação", color: "border-gold-light/40" },
  { key: "won", label: "Ganho", color: "border-success/40" },
  { key: "lost", label: "Perdido", color: "border-destructive/40" },
];

export default function Opportunities() {
  const { profile } = useAuth();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", client_account_id: "", expected_value: "", probability: "10", stage: "lead", close_date: "", description: "" });

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
      company_id: profile.company_id,
      title: form.title,
      client_account_id: form.client_account_id,
      expected_value: form.expected_value ? Number(form.expected_value) : 0,
      probability: Number(form.probability) || 10,
      stage: form.stage as any,
      close_date: form.close_date || null,
      description: form.description || null,
      owner_id: profile.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar oportunidade", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Oportunidade criada!" });
    setShowCreate(false);
    setForm({ title: "", client_account_id: "", expected_value: "", probability: "10", stage: "lead", close_date: "", description: "" });
    fetchData();
  };

  const handleDrop = async (oppId: string, newStage: string) => {
    setOpps(prev => prev.map(o => o.id === oppId ? { ...o, stage: newStage } : o));
    await supabase.from("opportunities").update({ stage: newStage as any }).eq("id", oppId);
  };

  const formatValue = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}K` : `R$ ${v}`;

  const stageTotal = (stageKey: string) => {
    return opps.filter(o => o.stage === stageKey).reduce((sum, o) => sum + (o.expected_value || 0), 0);
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Oportunidades</h1>
          <p className="text-muted-foreground mt-1">Pipeline de vendas</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Nova Oportunidade</Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map((stage) => {
            const stageOpps = opps.filter(o => o.stage === stage.key);
            return (
              <div
                key={stage.key}
                className="space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const oppId = e.dataTransfer.getData("oppId");
                  if (oppId) handleDrop(oppId, stage.key);
                }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-foreground">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">{stageOpps.length}</span>
                </div>
                <p className="text-xs text-muted-foreground px-1">{formatValue(stageTotal(stage.key))}</p>

                <div className="space-y-2 min-h-[100px]">
                  {stageOpps.map((opp) => (
                    <Link
                      key={opp.id}
                      to={`/opportunities/${opp.id}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("oppId", opp.id)}
                      className={`block bg-card rounded-lg p-3 border ${stage.color} hover:shadow-gold transition-all cursor-grab active:cursor-grabbing`}
                    >
                      <h4 className="text-xs font-semibold text-foreground leading-tight mb-1">{opp.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{(opp.client_account as any)?.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-medium text-foreground">{formatValue(opp.expected_value)}</span>
                        <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {opps.map((opp) => (
            <Link key={opp.id} to={`/opportunities/${opp.id}`} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between hover:border-gold-subtle transition-colors block">
              <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-gold" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{opp.title}</h4>
                  <p className="text-xs text-muted-foreground">{(opp.client_account as any)?.name} · {stages.find(s => s.key === opp.stage)?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-foreground font-medium">{formatValue(opp.expected_value)}</span>
                <span className="text-muted-foreground">{opp.probability}%</span>
                <span className="text-muted-foreground">{opp.close_date || "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Opportunity Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Oportunidade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Consultoria estratégica" className="bg-secondary border-border" />
            </div>
            <div>
              <Label>Cliente *</Label>
              <Select value={form.client_account_id} onValueChange={v => setForm(f => ({ ...f, client_account_id: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Esperado (R$)</Label>
                <Input type="number" value={form.expected_value} onChange={e => setForm(f => ({ ...f, expected_value: e.target.value }))} placeholder="0" className="bg-secondary border-border" />
              </div>
              <div>
                <Label>Probabilidade (%)</Label>
                <Input type="number" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} min="0" max="100" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estágio</Label>
                <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Fechamento</Label>
                <Input type="date" value={form.close_date} onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opcional" className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="gold" onClick={handleCreate} disabled={saving || !form.title || !form.client_account_id}>{saving ? "Salvando..." : "Criar Oportunidade"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
