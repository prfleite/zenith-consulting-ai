import { useState, useEffect } from "react";
import { Plus, FileSignature, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, emptyStates } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonLoaders";

const statusConfig: Record<string, { label: string; icon: any; class: string }> = {
  draft: { label: "Rascunho", icon: Clock, class: "bg-secondary text-muted-foreground" },
  sent: { label: "Enviado", icon: Send, class: "bg-info/20 text-info" },
  signed: { label: "Assinado", icon: CheckCircle2, class: "bg-success/20 text-success" },
  expired: { label: "Expirado", icon: XCircle, class: "bg-destructive/20 text-destructive" },
};

const Contracts = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", client_id: "", content_html: "", status: "draft" });

  const fetchAll = async () => {
    setLoading(true);
    const [cRes, clRes] = await Promise.all([
      supabase.from("contracts").select("*, client_accounts(name)").order("created_at", { ascending: false }),
      supabase.from("client_accounts").select("id, name"),
    ]);
    setContracts(cRes.data || []);
    setClients(clRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const createContract = async () => {
    if (!form.title || !form.client_id || !profile?.company_id) return;
    const { error } = await supabase.from("contracts").insert({
      company_id: profile.company_id,
      title: form.title,
      client_id: form.client_id,
      content_html: form.content_html || null,
      status: form.status,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contrato criado" });
    setDialogOpen(false);
    setForm({ title: "", client_id: "", content_html: "", status: "draft" });
    fetchAll();
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground mt-1">Gerencie contratos e assinaturas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold"><Plus className="w-4 h-4 mr-1" /> Novo Contrato</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Conteúdo</Label><Textarea rows={4} value={form.content_html} onChange={(e) => setForm({ ...form, content_html: e.target.value })} placeholder="Termos do contrato..." /></div>
              <Button variant="gold" className="w-full" onClick={createContract}>Criar Contrato</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = contracts.filter((c) => c.status === key).length;
          const Icon = cfg.icon;
          return (
            <div key={key} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? <TableSkeleton /> : contracts.length === 0 ? (
        <EmptyState icon={<FileSignature className="w-8 h-8 text-muted-foreground" />} title="Nenhum contrato" description="Crie seu primeiro contrato para formalizar acordos com clientes." actionLabel="Novo Contrato" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Título</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Criado</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Assinado</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const sc = statusConfig[c.status] || statusConfig.draft;
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-3"><span className="text-sm font-medium text-foreground">{c.title}</span></td>
                    <td className="p-3 text-sm text-muted-foreground">{(c.client_accounts as any)?.name}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.class}`}>{sc.label}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-xs text-muted-foreground">{c.signed_at ? new Date(c.signed_at).toLocaleDateString("pt-BR") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
