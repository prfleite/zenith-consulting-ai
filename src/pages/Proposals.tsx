import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles, Eye, FileSignature } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Proposal = {
  id: string;
  title: string;
  status: string | null;
  total_value: number | null;
  currency: string | null;
  valid_until: string | null;
  created_at: string;
  client_id: string;
  opportunity_id: string | null;
  company_id: string;
  description: string | null;
  items: any;
  signed_at: string | null;
  signed_by: string | null;
  updated_at: string;
  client_accounts?: { name: string } | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviada", variant: "outline" },
  accepted: { label: "Aceita", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
  expired: { label: "Expirada", variant: "secondary" },
};

export default function Proposals() {
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState<Proposal | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ title: "", client_id: "", description: "", total_value: "", valid_until: "", items: "[]" });

  const companyId = profile?.company_id;

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("proposals").select("*, client_accounts:client_id(name)").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("client_accounts").select("id, name").eq("company_id", companyId).order("name"),
    ]);
    setProposals((p as Proposal[]) || []);
    setClients(c || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [companyId]);

  async function handleCreate() {
    if (!companyId || !form.client_id || !form.title) return;
    let parsedItems: any = [];
    try { parsedItems = JSON.parse(form.items); } catch { parsedItems = []; }
    const { error } = await supabase.from("proposals").insert({
      company_id: companyId,
      client_id: form.client_id,
      title: form.title,
      description: form.description || null,
      total_value: form.total_value ? Number(form.total_value) : null,
      valid_until: form.valid_until || null,
      items: parsedItems,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Proposta criada!" });
    setShowCreate(false);
    setForm({ title: "", client_id: "", description: "", total_value: "", valid_until: "", items: "[]" });
    load();
  }

  async function handleAIGenerate() {
    if (!form.client_id) { toast({ title: "Selecione um cliente primeiro", variant: "destructive" }); return; }
    const client = clients.find(c => c.id === form.client_id);
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Gere uma proposta comercial completa para o cliente "${client?.name}". Retorne APENAS um JSON com: {"title":"...","description":"...","items":[{"description":"...","quantity":1,"unit_price":1000}],"total_value":5000,"valid_until":"2026-04-30"}` }],
          contextType: "global",
        }),
      });
      const text = await resp.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setForm(f => ({ ...f, title: data.title || f.title, description: data.description || "", total_value: String(data.total_value || ""), valid_until: data.valid_until || "", items: JSON.stringify(data.items || [], null, 2) }));
        toast({ title: "Proposta gerada pela IA!" });
      }
    } catch (e) { toast({ title: "Erro ao gerar com IA", variant: "destructive" }); }
    setAiLoading(false);
  }

  function renderPreviewHTML(p: Proposal) {
    const items = Array.isArray(p.items) ? p.items : [];
    return `<div style="font-family:system-ui;max-width:700px;margin:auto;padding:24px">
      <h1 style="font-size:24px;margin-bottom:4px">${p.title}</h1>
      <p style="color:#888;margin-bottom:16px">Cliente: ${(p.client_accounts as any)?.name || "—"}</p>
      ${p.description ? `<p>${p.description}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="border-bottom:2px solid #ddd;text-align:left"><th style="padding:8px">Item</th><th style="padding:8px">Qtd</th><th style="padding:8px">Valor Unit.</th><th style="padding:8px">Subtotal</th></tr></thead>
        <tbody>${items.map((it: any) => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${it.description || ""}</td><td style="padding:8px">${it.quantity || 1}</td><td style="padding:8px">R$ ${Number(it.unit_price || 0).toLocaleString("pt-BR")}</td><td style="padding:8px">R$ ${((it.quantity || 1) * (it.unit_price || 0)).toLocaleString("pt-BR")}</td></tr>`).join("")}</tbody>
      </table>
      <p style="font-size:18px;font-weight:bold;text-align:right">Total: R$ ${Number(p.total_value || 0).toLocaleString("pt-BR")}</p>
      ${p.valid_until ? `<p style="color:#888;text-align:right">Válida até: ${format(new Date(p.valid_until), "dd/MM/yyyy")}</p>` : ""}
    </div>`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Propostas</h1>
          <p className="text-muted-foreground text-sm">Gerencie propostas comerciais</p>
        </div>
        <Button variant="gold" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" />Nova Proposta</Button>
      </div>

      <Card className="border-border">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma proposta ainda</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Título</TableHead><TableHead>Cliente</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Validade</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map(p => {
                const sc = statusConfig[p.status || "draft"] || statusConfig.draft;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{(p.client_accounts as any)?.name || "—"}</TableCell>
                    <TableCell>R$ {Number(p.total_value || 0).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell>{p.valid_until ? format(new Date(p.valid_until), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => setShowPreview(p)}><Eye className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente *</Label><Select value={form.client_id} onValueChange={v => setForm(f => ({...f, client_id: v}))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Total</Label><Input type="number" value={form.total_value} onChange={e => setForm(f => ({...f, total_value: e.target.value}))} /></div>
              <div><Label>Válida até</Label><Input type="date" value={form.valid_until} onChange={e => setForm(f => ({...f, valid_until: e.target.value}))} /></div>
            </div>
            <div><Label>Itens (JSON)</Label><Textarea value={form.items} onChange={e => setForm(f => ({...f, items: e.target.value}))} rows={4} className="font-mono text-xs" /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="gold-outline" onClick={handleAIGenerate} disabled={aiLoading}><Sparkles className="w-4 h-4 mr-1" />{aiLoading ? "Gerando..." : "IA Gerar"}</Button>
            <Button variant="gold" onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview da Proposta</DialogTitle></DialogHeader>
          {showPreview && <div dangerouslySetInnerHTML={{ __html: renderPreviewHTML(showPreview) }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
