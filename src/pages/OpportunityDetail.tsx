import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAIChat } from "@/lib/ai/useAIChat";
import { ArrowLeft, Target, Building2, DollarSign, Calendar, Percent, Sparkles, Send, FileText, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [opp, setOpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [projectName, setProjectName] = useState("");
  const { messages, isLoading: aiLoading, sendMessage, clearMessages } = useAIChat({ contextType: "proposal", contextId: id });
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("opportunities")
        .select("*, client_account:client_accounts(id, name), owner:profiles!opportunities_owner_id_fkey(name)")
        .eq("id", id).single(),
      supabase.from("documents").select("*").eq("related_opportunity_id", id).order("created_at", { ascending: false }),
    ]).then(([oRes, dRes]) => {
      setOpp(oRes.data);
      setDocuments(dRes.data || []);
      setLoading(false);
    });
  }, [id]);

  const generateProposal = async () => {
    const context = `Cliente: ${opp.client_account?.name}\nOportunidade: ${opp.title}\nValor: R$ ${opp.expected_value}\nDescrição: ${opp.description || "N/A"}\n\nBriefing adicional:\n${briefing}`;
    await sendMessage("Gere uma proposta comercial completa e profissional para esta oportunidade.", context);
  };

  // Watch for AI response to capture proposal
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") setGeneratedProposal(lastMsg.content);
  }, [messages]);

  const saveProposal = async () => {
    if (!generatedProposal || !profile?.company_id || !id) return;
    await supabase.from("documents").insert({
      company_id: profile.company_id,
      title: `Proposta — ${opp.title}`,
      type: "proposal" as any,
      content_text: generatedProposal,
      related_opportunity_id: id,
      created_by_id: profile.id,
    });
    toast({ title: "Proposta salva como documento" });
    setProposalOpen(false);
    clearMessages();
    setGeneratedProposal("");
    const { data } = await supabase.from("documents").select("*").eq("related_opportunity_id", id);
    setDocuments(data || []);
  };

  const convertToProject = async () => {
    if (!projectName || !profile?.company_id || !opp) return;
    const { error } = await supabase.from("projects").insert({
      company_id: profile.company_id,
      client_account_id: opp.client_account_id,
      opportunity_id: id,
      name: projectName,
      budget_fee: opp.expected_value,
      status: "planning" as any,
    });
    if (!error) {
      toast({ title: "Projeto criado com sucesso!" });
      setConvertOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!opp) return <div className="p-8 text-muted-foreground">Oportunidade não encontrada</div>;

  const stageLabels: Record<string, string> = { lead: "Lead", qualified: "Qualificado", proposal: "Proposta", negotiation: "Negociação", won: "Ganho", lost: "Perdido" };
  const stageColors: Record<string, string> = { lead: "bg-info/20 text-info", qualified: "bg-gold/20 text-gold", proposal: "bg-warning/20 text-warning", negotiation: "bg-gold-light/20 text-gold-light", won: "bg-success/20 text-success", lost: "bg-destructive/20 text-destructive" };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-5xl">
      <Breadcrumbs entityName={opp.title} />
      <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Oportunidades
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <Target className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{opp.title}</h1>
            <Link to={`/clients/${opp.client_account?.id}`} className="text-sm text-gold hover:underline flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {opp.client_account?.name}
            </Link>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${stageColors[opp.stage]}`}>{stageLabels[opp.stage]}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Detalhes</h3>
          {[
            [<DollarSign key="d" className="w-4 h-4" />, "Valor Esperado", `R$ ${Number(opp.expected_value || 0).toLocaleString("pt-BR")}`],
            [<Percent key="p" className="w-4 h-4" />, "Probabilidade", `${opp.probability}%`],
            [<Calendar key="c" className="w-4 h-4" />, "Close Date", opp.close_date || "—"],
            [null, "Moeda", opp.currency],
            [null, "Owner", opp.owner?.name || "—"],
          ].map(([icon, label, value], i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">{icon}{label as string}</span>
              <span className="text-foreground font-medium">{value as string}</span>
            </div>
          ))}
          {opp.tags && opp.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {opp.tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {opp.description && (
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground">{opp.description}</p>
            </div>
          )}
          {opp.lost_reason && (
            <div className="bg-destructive/10 rounded-xl p-6 border border-destructive/20">
              <h3 className="font-semibold text-destructive mb-1">Motivo da Perda</h3>
              <p className="text-sm text-muted-foreground">{opp.lost_reason}</p>
            </div>
          )}
          <div className="flex gap-2">
            {/* AI Proposal */}
            <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
              <DialogTrigger asChild>
                <Button variant="gold-outline" size="sm" className="flex-1"><Sparkles className="w-4 h-4" /> Gerar Proposta com IA</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Gerar Proposta com IA</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Briefing / Contexto adicional</Label>
                    <Textarea rows={4} value={briefing} onChange={(e) => setBriefing(e.target.value)} placeholder="Cole aqui informações da reunião, requisitos do cliente, etc." />
                  </div>
                  <Button variant="gold" onClick={generateProposal} disabled={aiLoading} className="w-full">
                    {aiLoading ? "Gerando..." : "Gerar Proposta"}
                  </Button>
                  {generatedProposal && (
                    <div className="space-y-3">
                      <div className="bg-secondary rounded-lg p-4 max-h-[400px] overflow-y-auto">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{generatedProposal}</pre>
                      </div>
                      <Button variant="gold" className="w-full" onClick={saveProposal}>
                        <FileText className="w-4 h-4" /> Salvar como Documento
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Convert to Project */}
            {opp.stage === "won" && (
              <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
                <DialogTrigger asChild>
                  <Button variant="gold" size="sm" className="flex-1"><FolderKanban className="w-4 h-4" /> Converter em Projeto</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Converter em Projeto</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome do Projeto</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={opp.title} /></div>
                    <p className="text-xs text-muted-foreground">Budget: R$ {Number(opp.expected_value || 0).toLocaleString("pt-BR")} · Cliente: {opp.client_account?.name}</p>
                    <Button variant="gold" className="w-full" onClick={convertToProject}>Criar Projeto</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-4">Documentos Relacionados</h3>
          <div className="space-y-2">
            {documents.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <FileText className="w-4 h-4 text-gold" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.type} · {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
