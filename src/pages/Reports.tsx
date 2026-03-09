import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Loader2, Send, Eye, CheckCircle2, Clock, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id || "";

  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [genForm, setGenForm] = useState({ clientId: "", projectId: "", reportType: "monthly", periodStart: "", periodEnd: "" });
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reports } = useQuery({
    queryKey: ["reports", statusFilter],
    queryFn: async () => {
      let q = (supabase.from("reports") as any).select("*, client:client_accounts(name), project:projects(name)").eq("company_id", companyId).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-for-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("client_accounts").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-for-reports", genForm.clientId],
    queryFn: async () => {
      if (!genForm.clientId) return [];
      const { data } = await supabase.from("projects").select("id, name").eq("client_account_id", genForm.clientId);
      return data || [];
    },
    enabled: !!genForm.clientId,
  });

  const generateReport = async () => {
    if (!genForm.clientId || !genForm.periodStart) {
      toast({ title: "Preencha cliente e período", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: {
          clientId: genForm.clientId,
          companyId,
          projectId: genForm.projectId || null,
          reportType: genForm.reportType,
          periodStart: genForm.periodStart,
          periodEnd: genForm.periodEnd,
        },
      });
      if (error) throw error;
      toast({ title: "Relatório gerado!" });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setPreviewReport(data.report || data);
      setShowGenerator(false);
    } catch (e: any) {
      toast({ title: "Erro ao gerar", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("reports") as any).update({ status, ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}) }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    toast({ title: `Status atualizado para ${status}` });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-blue-500/20 text-blue-400",
      viewed: "bg-green-500/20 text-green-400",
    };
    const labels: Record<string, string> = { draft: "Rascunho", sent: "Enviado", viewed: "Visualizado" };
    return <Badge className={map[status] || ""}>{labels[status] || status}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { weekly: "Semanal", monthly: "Mensal", project_closure: "Fechamento", executive: "Executivo" };
    return map[type] || type;
  };

  const summaries = {
    total: reports?.length || 0,
    draft: reports?.filter((r: any) => r.status === "draft").length || 0,
    sent: reports?.filter((r: any) => r.status === "sent").length || 0,
    viewed: reports?.filter((r: any) => r.status === "viewed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-gold" /> Relatórios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Geração automática de relatórios com IA</p>
        </div>
        <Button onClick={() => setShowGenerator(true)} className="bg-gradient-gold text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Gerar Relatório com IA
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{summaries.total}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Total</div></CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{summaries.draft}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Rascunhos</div></CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{summaries.sent}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Send className="w-3 h-3" /> Enviados</div></CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{summaries.viewed}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> Visualizados</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "sent", "viewed"].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "ghost"} onClick={() => setStatusFilter(s)} className="text-xs">
            {s === "all" ? "Todos" : s === "draft" ? "Rascunhos" : s === "sent" ? "Enviados" : "Visualizados"}
          </Button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports?.map((report: any) => (
          <Card key={report.id} className="border-border hover:border-gold/20 transition-colors">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{report.title}</h3>
                    {getStatusBadge(report.status)}
                    {report.ai_generated && <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">IA</Badge>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{report.client?.name || "—"}</span>
                    <span>{getTypeLabel(report.report_type)}</span>
                    {report.period_start && <span><Calendar className="inline w-3 h-3 mr-0.5" />{report.period_start} — {report.period_end}</span>}
                    <span>{new Date(report.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setPreviewReport(report)}><Eye className="w-4 h-4" /></Button>
                  {report.status === "draft" && (
                    <Button size="sm" variant="outline" className="text-xs border-gold/30 text-gold" onClick={() => updateStatus(report.id, "sent")}>
                      <Send className="w-3 h-3 mr-1" /> Enviar
                    </Button>
                  )}
                  {report.status === "sent" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(report.id, "viewed")}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Marcar como Visto
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {reports?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum relatório gerado. Clique em "Gerar Relatório com IA" para começar.</div>
        )}
      </div>

      {/* Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerar Relatório com IA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={genForm.reportType} onValueChange={(v) => setGenForm({ ...genForm, reportType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="project_closure">Fechamento de Projeto</SelectItem>
                <SelectItem value="executive">Executivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genForm.clientId} onValueChange={(v) => setGenForm({ ...genForm, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar Cliente" /></SelectTrigger>
              <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {projects && projects.length > 0 && (
              <Select value={genForm.projectId} onValueChange={(v) => setGenForm({ ...genForm, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Projeto (opcional)" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Início do período</label>
                <Input type="date" value={genForm.periodStart} onChange={(e) => setGenForm({ ...genForm, periodStart: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim do período</label>
                <Input type="date" value={genForm.periodEnd} onChange={(e) => setGenForm({ ...genForm, periodEnd: e.target.value })} />
              </div>
            </div>
            <Button onClick={generateReport} disabled={generating} className="w-full bg-gradient-gold text-primary-foreground">
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando com IA...</> : <><BarChart3 className="w-4 h-4 mr-2" /> Gerar Relatório</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewReport?.title || "Preview do Relatório"}</DialogTitle></DialogHeader>
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewReport?.content_html || previewReport?.contentHtml || "<p>Sem conteúdo</p>" }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
