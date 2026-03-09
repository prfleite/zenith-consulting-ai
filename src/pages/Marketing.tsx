import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Megaphone, Globe, Sparkles, Target, Mail, MessageSquare, Send,
  TrendingUp, Eye, MousePointer, DollarSign, Loader2, Plus, Zap,
  Facebook, Linkedin, Search, Filter, ArrowRight, BarChart3, Brain, Bot
} from "lucide-react";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ===== STRATEGY TAB =====
function StrategyTab({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [objectives, setObjectives] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [strategyResult, setStrategyResult] = useState<any>(null);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ["clients-for-marketing"],
    queryFn: async () => {
      const { data } = await supabase.from("client_accounts").select("id, name").order("name");
      return data || [];
    },
  });

  const analyzeWebsite = async () => {
    if (!url || !selectedClient) {
      toast({ title: "Preencha a URL e selecione um cliente", variant: "destructive" });
      return;
    }
    setAnalyzingWebsite(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-website", {
        body: { url, clientId: selectedClient, companyId },
      });
      if (error) throw error;
      setAnalysisResult(data.analysis);
      toast({ title: "Análise concluída!" });
    } catch (e: any) {
      toast({ title: "Erro na análise", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzingWebsite(false);
    }
  };

  const generateStrategy = async () => {
    if (!selectedClient || !niche) {
      toast({ title: "Preencha o nicho e selecione um cliente", variant: "destructive" });
      return;
    }
    setGeneratingStrategy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-strategy", {
        body: { clientId: selectedClient, companyId, niche, objectives, budget: budget || "5000" },
      });
      if (error) throw error;
      setStrategyResult(data.strategy);
      toast({ title: "Estratégia gerada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar estratégia", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingStrategy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-gold" /> Análise de Site + Estratégia</CardTitle>
            <CardDescription>Insira a URL do cliente para uma análise completa com IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="https://site-do-cliente.com.br" value={url} onChange={(e) => setUrl(e.target.value)} />
            <Input placeholder="Nicho de mercado (ex: Consultoria Empresarial)" value={niche} onChange={(e) => setNiche(e.target.value)} />
            <Textarea placeholder="Objetivos de marketing..." value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={3} />
            <Input placeholder="Budget mensal (R$)" value={budget} onChange={(e) => setBudget(e.target.value)} type="number" />
            <div className="flex gap-3">
              <Button onClick={analyzeWebsite} disabled={analyzingWebsite} className="flex-1 bg-gradient-gold text-primary-foreground">
                {analyzingWebsite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando...</> : <><Search className="w-4 h-4 mr-2" /> Analisar Site com IA</>}
              </Button>
              <Button onClick={generateStrategy} disabled={generatingStrategy} variant="outline" className="flex-1 border-gold/30 text-gold hover:bg-gold/10">
                {generatingStrategy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : <><Brain className="w-4 h-4 mr-2" /> Gerar Estratégia</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Result */}
        {analysisResult && (
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-gold" /> Análise do Site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Marca:</span> <span className="font-medium">{analysisResult.brand_name}</span></div>
              <div><span className="text-muted-foreground">Voz da marca:</span> <span>{analysisResult.brand_voice}</span></div>
              <div><span className="text-muted-foreground">Público-alvo:</span> <span>{analysisResult.target_audience}</span></div>
              <div><span className="text-muted-foreground">USP:</span> <span>{analysisResult.usp}</span></div>
              {analysisResult.brand_colors?.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Cores:</span>
                  {analysisResult.brand_colors.map((c: string, i: number) => (
                    <div key={i} className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              )}
              {analysisResult.strengths?.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Pontos fortes:</span>
                  <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
                    {analysisResult.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {analysisResult.weaknesses?.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Pontos fracos:</span>
                  <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
                    {analysisResult.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {analysisResult.seo_score != null && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">SEO Score:</span>
                  <Badge variant={analysisResult.seo_score > 70 ? "default" : "destructive"}>{analysisResult.seo_score}/100</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Strategy Result */}
      {strategyResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /> Estratégia Completa Gerada</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyResult.branding_strategy && (
              <StrategyCard title="Branding" icon={<Target className="w-4 h-4" />} data={strategyResult.branding_strategy} />
            )}
            {strategyResult.channel_strategy && Object.entries(strategyResult.channel_strategy).map(([channel, data]: [string, any]) => (
              <StrategyCard key={channel} title={channel.charAt(0).toUpperCase() + channel.slice(1)} icon={getChannelIcon(channel)} data={data} />
            ))}
            {strategyResult.kpi_targets && (
              <StrategyCard title="KPIs & Metas" icon={<BarChart3 className="w-4 h-4" />} data={strategyResult.kpi_targets} />
            )}
            {strategyResult.budget_allocation && (
              <StrategyCard title="Alocação de Budget" icon={<DollarSign className="w-4 h-4" />} data={strategyResult.budget_allocation} />
            )}
          </div>
          {strategyResult.content_calendar?.length > 0 && (
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Calendário de Conteúdo (30 dias)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {strategyResult.content_calendar.slice(0, 30).map((item: any, i: number) => (
                    <div key={i} className="p-2 bg-secondary/50 rounded text-xs">
                      <div className="font-medium">Dia {item.day || i + 1} — {item.channel}</div>
                      <div className="text-muted-foreground">{item.topic || item.content_type}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function StrategyCard({ title, icon, data }: { title: string; icon: React.ReactNode; data: any }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        {typeof data === "object" && !Array.isArray(data) ? (
          Object.entries(data).slice(0, 8).map(([k, v]) => (
            <div key={k}>
              <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>{" "}
              <span>{Array.isArray(v) ? (v as string[]).join(", ") : String(v)}</span>
            </div>
          ))
        ) : (
          <span>{JSON.stringify(data)}</span>
        )}
      </CardContent>
    </Card>
  );
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "facebook": return <Facebook className="w-4 h-4 text-blue-500" />;
    case "google": return <Search className="w-4 h-4 text-red-400" />;
    case "linkedin": return <Linkedin className="w-4 h-4 text-blue-400" />;
    case "email": return <Mail className="w-4 h-4 text-green-400" />;
    case "whatsapp": return <MessageSquare className="w-4 h-4 text-green-500" />;
    default: return <Megaphone className="w-4 h-4" />;
  }
}

// ===== FLOW BUILDER TAB =====
function FlowBuilderTab({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flowName, setFlowName] = useState("");
  const [flowObjective, setFlowObjective] = useState("");
  const [flowNiche, setFlowNiche] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showNewFlow, setShowNewFlow] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ["clients-for-flows"],
    queryFn: async () => {
      const { data } = await supabase.from("client_accounts").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: flows } = useQuery({
    queryKey: ["marketing-flows"],
    queryFn: async () => {
      const { data } = await (supabase.from("marketing_flows") as any).select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const nodeTypes = useMemo(() => ({
    trigger: FlowNodeComponent,
    action: FlowNodeComponent,
    condition: FlowNodeComponent,
    ai: FlowNodeComponent,
  }), []);

  const generateFlow = async () => {
    if (!flowObjective) {
      toast({ title: "Informe o objetivo do flow", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flow-ai", {
        body: { objective: flowObjective, niche: flowNiche },
      });
      if (error) throw error;
      if (data?.flowData) {
        setNodes(data.flowData.nodes || []);
        setEdges(data.flowData.edges || []);
        toast({ title: "Flow gerado com IA!" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveFlow = async () => {
    if (!flowName || !selectedClient) {
      toast({ title: "Preencha nome e cliente", variant: "destructive" });
      return;
    }
    try {
      await (supabase.from("marketing_flows") as any).insert({
        client_id: selectedClient,
        company_id: companyId,
        name: flowName,
        niche: flowNiche,
        description: flowObjective,
        flow_data: { nodes, edges },
        ai_generated: true,
      });
      toast({ title: "Flow salvo!" });
      queryClient.invalidateQueries({ queryKey: ["marketing-flows"] });
      setShowNewFlow(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const loadFlow = (flow: any) => {
    const flowData = flow.flow_data as any;
    setNodes(flowData?.nodes || []);
    setEdges(flowData?.edges || []);
    setFlowName(flow.name);
    setShowNewFlow(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold">Flows de Automação</h3>
        <Button onClick={() => setShowNewFlow(true)} className="bg-gradient-gold text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Novo Flow
        </Button>
      </div>

      {showNewFlow ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Nome do flow" value={flowName} onChange={(e) => setFlowName(e.target.value)} />
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Objetivo" value={flowObjective} onChange={(e) => setFlowObjective(e.target.value)} />
            <Input placeholder="Nicho" value={flowNiche} onChange={(e) => setFlowNiche(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={generateFlow} disabled={generating} variant="outline" className="border-gold/30 text-gold">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
              Gerar Flow com IA
            </Button>
            <Button onClick={saveFlow} className="bg-gradient-gold text-primary-foreground">Salvar Flow</Button>
            <Button onClick={() => setShowNewFlow(false)} variant="ghost">Cancelar</Button>
          </div>
          <div className="h-[500px] border border-border rounded-lg overflow-hidden bg-card">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => {
                setNodes((nds) => {
                  const updated = [...nds];
                  changes.forEach((c: any) => {
                    if (c.type === "position" && c.position) {
                      const idx = updated.findIndex((n) => n.id === c.id);
                      if (idx >= 0) updated[idx] = { ...updated[idx], position: c.position };
                    }
                  });
                  return updated;
                });
              }}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background"
            >
              <Background color="hsl(var(--border))" gap={20} />
              <Controls />
              <MiniMap style={{ background: "hsl(220,18%,10%)" }} />
            </ReactFlow>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows?.map((flow) => (
            <Card key={flow.id} className="border-border cursor-pointer hover:border-gold/30 transition-colors" onClick={() => loadFlow(flow)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gold" /> {flow.name}
                </CardTitle>
                <CardDescription className="text-xs">{flow.description || flow.niche}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={flow.status === "active" ? "default" : "secondary"}>{flow.status}</Badge>
                  {flow.ai_generated && <Badge variant="outline" className="border-gold/30 text-gold text-xs">IA</Badge>}
                  <span className="text-xs text-muted-foreground">{((flow.flow_data as any)?.nodes?.length || 0)} nodes</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!flows || flows.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum flow criado. Clique em "Novo Flow" para começar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlowNodeComponent({ data }: { data: any }) {
  const colors: Record<string, string> = {
    trigger: "border-green-500/50 bg-green-500/10",
    action: "border-blue-500/50 bg-blue-500/10",
    condition: "border-yellow-500/50 bg-yellow-500/10",
    ai: "border-purple-500/50 bg-purple-500/10",
  };
  const icons: Record<string, React.ReactNode> = {
    trigger: <Zap className="w-3 h-3 text-green-400" />,
    action: <ArrowRight className="w-3 h-3 text-blue-400" />,
    condition: <Filter className="w-3 h-3 text-yellow-400" />,
    ai: <Brain className="w-3 h-3 text-purple-400" />,
  };
  const nodeType = data.nodeType || "action";

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-lg ${colors[nodeType] || colors.action}`}>
      <div className="flex items-center gap-2 text-xs font-medium">
        {icons[nodeType]}
        <span>{data.label}</span>
      </div>
    </div>
  );
}

// ===== CAMPAIGNS TAB =====
function CampaignsTab({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", type: "facebook", client_id: "", budget: "" });
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [adCopies, setAdCopies] = useState<any[]>([]);

  const { data: campaigns } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: async () => {
      const { data } = await (supabase.from("marketing_campaigns") as any).select("*, client:client_accounts(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-for-campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("client_accounts").select("id, name").order("name");
      return data || [];
    },
  });

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.client_id) return;
    await (supabase.from("marketing_campaigns") as any).insert({
      name: newCampaign.name,
      type: newCampaign.type,
      client_id: newCampaign.client_id,
      company_id: companyId,
      budget: Number(newCampaign.budget) || 0,
      status: "draft",
    });
    queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    setShowNew(false);
    toast({ title: "Campanha criada!" });
  };

  const generateAdCopy = async (campaign: any) => {
    setGeneratingCopy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-copy", {
        body: {
          platform: campaign.type,
          objective: "Lead Generation",
          targetAudience: "Executivos C-Level",
          product: campaign.name,
          tone: "Professional",
        },
      });
      if (error) throw error;
      setAdCopies(data.copies || []);
      toast({ title: "Copies gerados!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingCopy(false);
    }
  };

  const getPlatformColor = (type: string) => {
    switch (type) {
      case "facebook": return "text-blue-400";
      case "google": return "text-red-400";
      case "linkedin": return "text-blue-300";
      case "email": return "text-green-400";
      case "whatsapp": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const totals = useMemo(() => {
    if (!campaigns) return { impressions: 0, clicks: 0, conversions: 0, spent: 0 };
    return campaigns.reduce((acc, c) => ({
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      conversions: acc.conversions + (c.conversions || 0),
      spent: acc.spent + Number(c.spent || 0),
    }), { impressions: 0, clicks: 0, conversions: 0, spent: 0 });
  }, [campaigns]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> Impressões</div></CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><MousePointer className="w-3 h-3" /> Cliques</div></CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">{totals.conversions}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Conversões</div></CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4"><div className="text-2xl font-bold">R$ {totals.spent.toLocaleString()}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Investido</div></CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold">Campanhas</h3>
        <div className="flex gap-2">
          <Button onClick={() => setShowNew(true)} className="bg-gradient-gold text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Nova Campanha
          </Button>
        </div>
      </div>

      {showNew && (
        <Card className="border-gold/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Nome da campanha" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              <Select value={newCampaign.type} onValueChange={(v) => setNewCampaign({ ...newCampaign, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newCampaign.client_id} onValueChange={(v) => setNewCampaign({ ...newCampaign, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Budget (R$)" type="number" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={createCampaign} className="bg-gradient-gold text-primary-foreground">Criar</Button>
              <Button onClick={() => setShowNew(false)} variant="ghost">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Megaphone className={`w-4 h-4 ${getPlatformColor(campaign.type)}`} />
                  {campaign.name}
                </CardTitle>
                <Badge variant={campaign.status === "active" ? "default" : campaign.status === "paused" ? "secondary" : "outline"}>
                  {campaign.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">{(campaign as any).client?.name} • {campaign.type.toUpperCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div><span className="text-muted-foreground">Impressões</span><div className="font-medium">{(campaign.impressions || 0).toLocaleString()}</div></div>
                <div><span className="text-muted-foreground">Cliques</span><div className="font-medium">{campaign.clicks || 0}</div></div>
                <div><span className="text-muted-foreground">Conv.</span><div className="font-medium">{campaign.conversions || 0}</div></div>
                <div><span className="text-muted-foreground">ROAS</span><div className="font-medium">{Number(campaign.roas || 0).toFixed(1)}x</div></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Budget: R$ {Number(campaign.budget || 0).toLocaleString()} | Gasto: R$ {Number(campaign.spent || 0).toLocaleString()}</span>
                <Button size="sm" variant="ghost" className="text-gold text-xs" onClick={() => generateAdCopy(campaign)} disabled={generatingCopy}>
                  {generatingCopy ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" /> Gerar Copy</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generated Copies */}
      {adCopies.length > 0 && (
        <Card className="border-gold/20">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /> Copies Gerados por IA</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {adCopies.map((copy, i) => (
              <div key={i} className="p-3 bg-secondary/50 rounded-lg space-y-1 text-sm">
                <div className="font-medium">{copy.headline}</div>
                <div className="text-muted-foreground text-xs">{copy.description}</div>
                <Badge variant="outline" className="text-xs">{copy.cta}</Badge>
                <Badge variant="secondary" className="ml-2 text-xs">Variante {copy.variant}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== INBOX TAB =====
function InboxTab({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [generatingReply, setGeneratingReply] = useState(false);

  const { data: messages } = useQuery({
    queryKey: ["unified-inbox", platformFilter],
    queryFn: async () => {
      let q = (supabase.from("unified_inbox") as any).select("*, client:client_accounts(name)").order("created_at", { ascending: false });
      if (platformFilter !== "all") q = q.eq("platform", platformFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const unreadCounts = useMemo(() => {
    if (!messages) return {};
    return messages.reduce((acc: Record<string, number>, m) => {
      if (!m.read) acc[m.platform] = (acc[m.platform] || 0) + 1;
      return acc;
    }, {});
  }, [messages]);

  const generateAIReply = async () => {
    if (!selectedMsg) return;
    setGeneratingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{ role: "user", content: `Responda profissionalmente esta mensagem de um lead/cliente via ${selectedMsg.platform}: "${selectedMsg.message}". Seja conciso e cordial.` }],
          contextType: "client_chat",
        },
      });
      if (error) throw error;
      // For streaming response, read the text
      if (data) {
        const text = typeof data === "string" ? data : JSON.stringify(data);
        setReplyText(text);
      }
      toast({ title: "Resposta gerada!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingReply(false);
    }
  };

  const markAsRead = async (id: string) => {
    await (supabase.from("unified_inbox") as any).update({ read: true }).eq("id", id);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook": case "instagram": return <Facebook className="w-4 h-4 text-blue-400" />;
      case "linkedin": return <Linkedin className="w-4 h-4 text-blue-300" />;
      case "whatsapp": return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "email": return <Mail className="w-4 h-4 text-yellow-400" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const platforms = ["all", "facebook", "instagram", "linkedin", "whatsapp", "email"];

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Message List */}
      <div className="w-1/2 flex flex-col">
        <div className="flex gap-1 mb-3 flex-wrap">
          {platforms.map((p) => (
            <Button key={p} size="sm" variant={platformFilter === p ? "default" : "ghost"} className="text-xs relative" onClick={() => setPlatformFilter(p)}>
              {p === "all" ? "Todos" : p.charAt(0).toUpperCase() + p.slice(1)}
              {p !== "all" && unreadCounts[p] ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] flex items-center justify-center text-destructive-foreground">{unreadCounts[p]}</span>
              ) : null}
            </Button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedMsg?.id === msg.id ? "border-gold/50 bg-secondary" : "border-border hover:border-border/80"
              } ${!msg.read ? "bg-secondary/50" : ""}`}
              onClick={() => { setSelectedMsg(msg); markAsRead(msg.id); }}
            >
              <div className="flex items-center gap-2">
                {getPlatformIcon(msg.platform)}
                <span className="text-sm font-medium flex-1 truncate">{msg.sender_name}</span>
                {!msg.read && <div className="w-2 h-2 rounded-full bg-gold" />}
                <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{msg.message}</p>
              {(msg as any).client?.name && <span className="text-xs text-gold">{(msg as any).client.name}</span>}
            </div>
          ))}
          {(!messages || messages.length === 0) && (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma mensagem.</div>
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className="w-1/2 flex flex-col">
        {selectedMsg ? (
          <Card className="flex-1 flex flex-col border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {getPlatformIcon(selectedMsg.platform)}
                <div>
                  <CardTitle className="text-sm">{selectedMsg.sender_name}</CardTitle>
                  <CardDescription className="text-xs">{selectedMsg.platform} • {new Date(selectedMsg.created_at).toLocaleString("pt-BR")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 p-3 bg-secondary/30 rounded-lg mb-3">
                <p className="text-sm">{selectedMsg.message}</p>
              </div>
              <Textarea placeholder="Responder..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} />
              <div className="flex gap-2 mt-2">
                <Button onClick={generateAIReply} disabled={generatingReply} variant="outline" className="border-gold/30 text-gold">
                  {generatingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                  Responder com IA
                </Button>
                <Button className="bg-gradient-gold text-primary-foreground">
                  <Send className="w-4 h-4 mr-2" /> Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Selecione uma mensagem para visualizar
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
const Marketing = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-gold" /> Marketing Automation
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Estratégias com IA, automação de flows e campanhas multi-canal</p>
      </div>

      <Tabs defaultValue="strategy" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="strategy" className="gap-1"><Brain className="w-4 h-4" /> Estratégia IA</TabsTrigger>
          <TabsTrigger value="flows" className="gap-1"><Zap className="w-4 h-4" /> Flow Builder</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1"><TrendingUp className="w-4 h-4" /> Campanhas</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1"><MessageSquare className="w-4 h-4" /> Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy">
          <StrategyTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="flows">
          <FlowBuilderTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="inbox">
          <InboxTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketing;
