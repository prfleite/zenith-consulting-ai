import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { AIAssistantPanel } from "@/components/AIAssistantPanel";

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
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", client_id: "", content_html: "", status: "draft" });

  const fetchAll = async () => {
    setLoading(true);
    const [cRes, clRes, pRes] = await Promise.all([
      supabase.from("contracts").select("*, client_accounts(name)").order("created_at", { ascending: false }),
      supabase.from("client_accounts").select("id, name"),
      supabase.from("proposals").select("id, title, client_id, total_value, description, items").eq("status", "approved"),
    ]);
    setContracts(cRes.data || []);
    setClients(clRes.data || []);
    setProposals(pRes.data || []);
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

  const handleApplyContract = async (content: string) => {
    if (!form.client_id || !profile?.company_id) {
      toast({ title: "Selecione um cliente primeiro", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("contracts").insert({
      company_id: profile.company_id,
      title: `Contrato - ${clients.find(c => c.id === form.client_id)?.name || "Cliente"}`,
      client_id: form.client_id,
      content_html: content,
      status: "draft",
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contrato gerado com IA e salvo como rascunho" });
    fetchAll();
  };

  const contractContext = proposals.length > 0
    ? `Propostas aprovadas disponíveis:\n${proposals.map(p => `- ${p.title}: R$ ${p.total_value || 0} (${p.description || ""})`).join("\n")}`
    : "Nenhuma proposta aprovada disponível.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient-gold">Contratos</h1>
          <p className="text-muted-foreground mt-1">Gerencie contratos e assinaturas</p>
        </div>
        <div className="flex items-center gap-2">
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
      </motion.div>

      {/* AI Contract Generator */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-[200px]">
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="Cliente para IA" /></SelectTrigger>
            <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <AIAssistantPanel
          contextType="global"
          title="Gerar Contrato com IA"
          placeholder="Descreva o tipo de contrato desejado..."
          initialPrompt="Gere um contrato de prestação de serviços de consultoria completo com cláusulas padrão (objeto, prazo, valor, confidencialidade, rescisão, foro)."
          extraContext={contractContext}
          onApplyResult={handleApplyContract}
          applyLabel="Salvar Contrato"
        />
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.07, delayChildren: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = contracts.filter((c) => c.status === key).length;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-card rounded-xl p-4 border border-border hover:border-[var(--border-gold-hover)] hover:shadow-gold-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-gold" />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold font-heading text-foreground">{count}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton /> : contracts.length === 0 ? (
        <EmptyState icon={<FileSignature className="w-8 h-8 text-muted-foreground" />} title="Nenhum contrato" description="Crie seu primeiro contrato para formalizar acordos com clientes." actionLabel="Novo Contrato" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Título</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Cliente</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Criado</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Assinado</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, i) => {
                const sc = statusConfig[c.status] || statusConfig.draft;
                const Icon = sc.icon;
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
                    className="border-t border-border hover:bg-gold/3 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                        <span className="text-sm font-medium text-foreground">{c.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{(c.client_accounts as any)?.name || "—"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${sc.class}`}>
                        <Icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-4 text-xs text-muted-foreground">{c.signed_at ? new Date(c.signed_at).toLocaleDateString("pt-BR") : <span className="text-muted-foreground/50">—</span>}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default Contracts;
