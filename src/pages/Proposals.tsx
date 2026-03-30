import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles, Eye, FileSignature, DollarSign, Clock, CheckCircle2, XCircle, Send, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";

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

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  draft: { label: "Rascunho", class: "bg-muted/60 text-muted-foreground border-border", icon: Clock },
  sent: { label: "Enviada", class: "bg-info/15 text-info border-info/25", icon: Send },
  accepted: { label: "Aceita", class: "bg-success/15 text-success border-success/25", icon: CheckCircle2 },
  rejected: { label: "Rejeitada", class: "bg-destructive/15 text-destructive border-destructive/25", icon: XCircle },
  expired: { label: "Expirada", class: "bg-warning/15 text-warning border-warning/25", icon: TrendingUp },
};

const Proposals = () => {
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
      company_id: companyId, client_id: form.client_id, title: form.title,
      description: form.description || null, total_value: form.total_value ? Number(form.total_value) : null,
      valid_until: form.valid_until || null, items: parsedItems,
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
          messages: [{ role: "user", content: `Gere uma proposta comercial completa para o cliente "${client?.name}". Retorne APENAS um JSON com: {"title":"...","description":"...","items":[{"description":"...","quantity":1,"unit_price":1000}],"total_value":5000,"valid_until":"2026-06-30"}` }],
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
    } catch { toast({ title: "Erro ao gerar com IA", variant: "destructive" }); }
    setAiLoading(false);
  }

  function renderPreviewHTML(p: Proposal) {
    const items = Array.isArray(p.items) ? p.items : [];
    return `<div style="font-family:Georgia,serif;max-width:700px;margin:auto;padding:32px;color:#1a1a1a">
      <div style="border-bottom:3px solid #C9A84C;padding-bottom:20px;margin-bottom:24px">
        <h1 style="font-size:26px;margin:0;color:#1a1a1a;letter-spacing:-0.5px">${p.title}</h1>
        <p style="color:#888;margin:6px 0 0;font-size:14px">Cliente: <strong>${(p.client_accounts as any)?.name || "—"}</strong></p>
      </div>
      ${p.description ? `<p style="line-height:1.7;margin-bottom:20px;color:#444">${p.description}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px">
        <thead><tr style="background:#f9f5ea;border-bottom:2px solid #C9A84C">
          <th style="padding:10px 12px;text-align:left;color:#6b5e3c">Item</th>
          <th style="padding:10px 12px;text-align:center;color:#6b5e3c">Qtd</th>
          <th style="padding:10px 12px;text-align:right;color:#6b5e3c">Valor Unit.</th>
          <th style="padding:10px 12px;text-align:right;color:#6b5e3c">Subtotal</th>
        </tr></thead>
        <tbody>${items.map((it: any, i: number) => `<tr style="border-bottom:1px solid #f0e8d4;background:${i % 2 === 0 ? "#fff" : "#fefbf4"}">
          <td style="padding:10px 12px">${it.description || ""}</td>
          <td style="padding:10px 12px;text-align:center">${it.quantity || 1}</td>
          <td style="padding:10px 12px;text-align:right">R$ ${Number(it.unit_price || 0).toLocaleString("pt-BR")}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:600">R$ ${((it.quantity || 1) * (it.unit_price || 0)).toLocaleString("pt-BR")}</td>
        </tr>`).join("")}</tbody>
      </table>
      <div style="text-align:right;padding:12px;background:#f9f5ea;border-radius:8px;margin-top:8px">
        <p style="font-size:20px;font-weight:bold;color:#C9A84C;margin:0">Total: R$ ${Number(p.total_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        ${p.valid_until ? `<p style="color:#888;font-size:13px;margin:4px 0 0">Válida até: ${format(new Date(p.valid_until), "dd/MM/yyyy", { locale: ptBR })}</p>` : ""}
      </div>
    </div>`;
  }

  const totalValue = proposals.reduce((s, p) => s + Number(p.total_value || 0), 0);
  const acceptedValue = proposals.filter(p => p.status === "accepted").reduce((s, p) => s + Number(p.total_value || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">Propostas</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            <span className="text-gold font-semibold">{proposals.length}</span> propostas ·{" "}
            <span className="text-success font-semibold">R$ {(acceptedValue / 1000).toFixed(0)}k</span> aceitos de{" "}
            <span className="text-foreground font-semibold">R$ {(totalValue / 1000).toFixed(0)}k</span> total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIAssistantPanel
            contextType="proposal_generator"
            title="Gerar Proposta com IA"
            placeholder="Descreva o escopo da proposta..."
            initialPrompt="Gere uma proposta comercial completa com título, descrição, itens detalhados com valores e prazo de validade."
            extraContext={`Clientes: ${clients.map(c => c.name).join(", ")}`}
            onApplyResult={(content) => {
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const data = JSON.parse(jsonMatch[0]);
                  setForm(f => ({ ...f, title: data.title || f.title, description: data.description || "", total_value: String(data.total_value || ""), valid_until: data.valid_until || "", items: JSON.stringify(data.items || [], null, 2) }));
                  setShowCreate(true);
                  toast({ title: "Proposta gerada! Revise e salve." });
                }
              } catch { toast({ title: "Não foi possível extrair os dados", variant: "destructive" }); }
            }}
            applyLabel="Aplicar no Formulário"
          />
          <Button variant="gold" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Proposta
          </Button>
        </div>
      </motion.div>

      {/* Status summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = proposals.filter(p => p.status === key).length;
          if (count === 0) return null;
          const Icon = cfg.icon;
          return (
            <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${cfg.class}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{cfg.label}</span>
              <span className="bg-card/60 px-1.5 py-0.5 rounded-full">{count}</span>
            </div>
          );
        })}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : proposals.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma proposta ainda</p>
            <p className="text-sm mt-1">Crie sua primeira proposta comercial</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  {["Título", "Cliente", "Valor", "Status", "Validade", ""].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, i) => {
                  const sc = statusConfig[p.status || "draft"] || statusConfig.draft;
                  const StatusIcon = sc.icon;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-t border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-foreground">{p.title}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{(p.client_accounts as any)?.name || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-foreground">R$ {Number(p.total_value || 0).toLocaleString("pt-BR")}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${sc.class}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {p.valid_until ? format(new Date(p.valid_until), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-gold" onClick={() => setShowPreview(p)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-lg">Nova Proposta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cliente *</Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({...f, client_id: v}))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="mt-1 bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor Total</Label>
                <Input type="number" value={form.total_value} onChange={e => setForm(f => ({...f, total_value: e.target.value}))} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Válida até</Label>
                <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({...f, valid_until: e.target.value}))} className="mt-1 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Itens (JSON)</Label>
              <Textarea value={form.items} onChange={e => setForm(f => ({...f, items: e.target.value}))} rows={4} className="mt-1 font-mono text-xs bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="gold-outline" onClick={handleAIGenerate} disabled={aiLoading}>
              <Sparkles className="w-4 h-4 mr-1" />{aiLoading ? "Gerando..." : "Gerar com IA"}
            </Button>
            <Button variant="gold" onClick={handleCreate}>Criar Proposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-lg">Preview da Proposta</DialogTitle></DialogHeader>
          {showPreview && <div dangerouslySetInnerHTML={{ __html: renderPreviewHTML(showPreview) }} className="mt-2" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposals;
