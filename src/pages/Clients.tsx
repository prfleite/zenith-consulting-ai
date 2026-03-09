import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, emptyStates } from "@/components/EmptyState";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { Search, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type ClientAccount = {
  id: string;
  name: string;
  segment: string | null;
  industry: string | null;
  country: string | null;
  health_score: number | null;
  annual_revenue: number | null;
  owner_id: string | null;
  owner?: { name: string } | null;
};

const segments = ["Enterprise", "Mid-Market", "SMB", "Startup"];
const industries = ["Tecnologia", "Saúde", "Financeiro", "Varejo", "Educação", "Manufatura", "Serviços", "Energia", "Agro", "Outro"];

export default function Clients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", segment: "", industry: "", country: "Brasil", website: "", annual_revenue: "" });
  const navigate = useNavigate();

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
    if (error) {
      toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente criado com sucesso!" });
    setShowCreate(false);
    setForm({ name: "", segment: "", industry: "", country: "Brasil", website: "", annual_revenue: "" });
    fetchClients();
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.segment || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  const getHealthColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const formatRevenue = (v: number | null) => {
    if (!v) return "—";
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
    return `R$ ${v}`;
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">{clients.length} clientes registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gold-outline" size="sm" onClick={() => exportToCSV(clients.map(c => ({ Nome: c.name, Segmento: c.segment, Indústria: c.industry, País: c.country, "Health Score": c.health_score })), "clientes")}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="gold-outline" size="sm" onClick={() => exportToPDF("Clientes", clients.map(c => ({ Nome: c.name, Segmento: c.segment || "—", Indústria: c.industry || "—", País: c.country || "—", "Health Score": c.health_score ?? "—" })))}>
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Novo Cliente</Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, segmento ou indústria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="bg-card rounded-xl p-5 border border-border cursor-pointer transition-all duration-200 hover:border-gold-subtle hover:shadow-gold"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.industry || client.segment} · {client.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{formatRevenue(client.annual_revenue)}</p>
                    <p className="text-xs text-muted-foreground">receita anual</p>
                  </div>
                  <div className={`text-center ${getHealthColor(client.health_score)}`}>
                    <p className="text-lg font-bold">{client.health_score || "—"}</p>
                    <p className="text-xs">saúde</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{client.segment}</span>
                {client.owner && <span>Owner: {(client.owner as any).name}</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !search && <EmptyState {...emptyStates.clients} actionLabel="Novo Cliente" onAction={() => setShowCreate(true)} />}
          {filtered.length === 0 && search && <p className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</p>}
        </div>
      )}

      {/* Create Client Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da empresa" className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Segmento</Label>
                <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{segments.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Indústria</Label>
                <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>País</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <Label>Receita Anual (R$)</Label>
                <Input type="number" value={form.annual_revenue} onChange={e => setForm(f => ({ ...f, annual_revenue: e.target.value }))} placeholder="0" className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="gold" onClick={handleCreate} disabled={saving || !form.name}>{saving ? "Salvando..." : "Criar Cliente"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
