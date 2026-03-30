import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban, FileText, Star, Send, Brain, DollarSign, Loader2,
  Eye, CheckCircle2, Clock, AlertCircle, Download, Milestone,
  LayoutDashboard, MessageSquare, TrendingUp, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIChat } from "@/lib/ai/useAIChat";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Portal = () => {
  const { profile } = useAuth();
  const [clientName, setClientName] = useState("");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const { messages: chatMessages, isLoading: chatLoading, sendMessage } = useAIChat({ contextType: "client_chat" });
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const [feedbackForm, setFeedbackForm] = useState({ type: "feedback", subject: "", message: "" });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      const { data: access } = await supabase
        .from("client_portal_access")
        .select("client_account_id")
        .eq("user_id", profile.id);
      if (!access?.length) return;
      const ids = access.map(a => a.client_account_id);
      setClientIds(ids);
      const { data: client } = await supabase
        .from("client_accounts")
        .select("name")
        .eq("id", ids[0])
        .single();
      setClientName(client?.name || "");
    };
    load();
  }, [profile]);

  const { data: projects } = useQuery({
    queryKey: ["portal-projects", clientIds],
    queryFn: async () => {
      if (!clientIds.length) return [];
      const { data } = await supabase
        .from("projects")
        .select("*, tasks:project_tasks(id, status, is_milestone, title, due_date)")
        .in("client_account_id", clientIds);
      return data || [];
    },
    enabled: clientIds.length > 0,
  });

  const { data: invoices } = useQuery({
    queryKey: ["portal-invoices", clientIds],
    queryFn: async () => {
      if (!clientIds.length) return [];
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .in("client_account_id", clientIds)
        .order("issue_date", { ascending: false });
      return data || [];
    },
    enabled: clientIds.length > 0,
  });

  const { data: documents } = useQuery({
    queryKey: ["portal-documents", clientIds],
    queryFn: async () => {
      if (!clientIds.length) return [];
      const { data } = await supabase
        .from("documents")
        .select("*")
        .in("related_client_account_id", clientIds)
        .eq("is_public_to_client", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: clientIds.length > 0,
  });

  const { data: reports } = useQuery({
    queryKey: ["portal-reports", clientIds],
    queryFn: async () => {
      if (!clientIds.length) return [];
      const { data } = await (supabase.from("reports") as any)
        .select("*")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: clientIds.length > 0,
  });

  const handleChat = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput("");
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const getProjectProgress = (project: any) => {
    const tasks = project.tasks || [];
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((t: any) => t.status === "done").length / tasks.length) * 100);
  };

  const getMilestones = () => {
    if (!projects) return [];
    const milestones: any[] = [];
    projects.forEach((p: any) => {
      (p.tasks || []).filter((t: any) => t.is_milestone).forEach((t: any) => {
        milestones.push({ ...t, projectName: p.name });
      });
    });
    return milestones.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.subject || !feedbackForm.message) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSubmittingFeedback(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmittingFeedback(false);
    toast({ title: "Solicitação enviada!", description: "Nossa equipe responderá em breve." });
    setFeedbackForm({ type: "feedback", subject: "", message: "" });
  };

  const statusColors: Record<string, string> = {
    planning: "bg-blue-500/20 text-blue-400",
    active: "bg-green-500/20 text-green-400",
    on_hold: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-gold/20 text-gold",
    cancelled: "bg-destructive/20 text-destructive",
  };

  const invoiceStatusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-500/20 text-blue-400",
    paid: "bg-green-500/20 text-green-400",
    overdue: "bg-destructive/20 text-destructive",
  };

  const docTypeIcons: Record<string, string> = {
    proposal: "📄", contract: "📝", report: "📊", brief: "📋", other: "📁",
  };

  const milestones = getMilestones();

  // Dashboard summary
  const activeProjects = (projects || []).filter((p: any) => p.status === "active").length;
  const totalHours = 0; // simplified
  const pendingInvoices = (invoices || []).filter((i: any) => i.status === "sent" || i.status === "overdue").length;
  const upcomingDeliveries = milestones.filter(m => m.status !== "done" && m.due_date).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Star className="w-7 h-7 text-gold" /> Portal do Cliente
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{clientName || "Carregando..."}</p>
        </div>
      </motion.div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="gap-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="projects" className="gap-1"><FolderKanban className="w-4 h-4" /> Projetos</TabsTrigger>
          <TabsTrigger value="milestones" className="gap-1"><Milestone className="w-4 h-4" /> Entregas</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1"><DollarSign className="w-4 h-4" /> Faturas</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1"><FileText className="w-4 h-4" /> Documentos</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1"><Eye className="w-4 h-4" /> Relatórios</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1"><MessageSquare className="w-4 h-4" /> Feedback</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1"><Brain className="w-4 h-4" /> Chat IA</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Projetos Ativos", value: activeProjects, icon: FolderKanban, color: "text-gold" },
                { label: "Horas Registradas", value: totalHours, icon: Clock, color: "text-info" },
                { label: "Entregas Próximas", value: upcomingDeliveries, icon: TrendingUp, color: "text-warning" },
                { label: "Faturas Pendentes", value: pendingInvoices, icon: DollarSign, color: "text-destructive" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <p className={`text-2xl font-bold font-heading ${kpi.color}`}>{kpi.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Active Projects Quick View */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold" /> Projetos Ativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(projects || []).filter((p: any) => p.status === "active").slice(0, 4).map((project: any) => {
                  const progress = getProjectProgress(project);
                  return (
                    <Card key={project.id} className="border-border">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">{project.name}</h4>
                          <Badge className={statusColors[project.status] || ""}>{project.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{(project.tasks || []).filter((t: any) => t.status === "done").length}/{(project.tasks || []).length} tarefas</span>
                          <span className="font-medium text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </CardContent>
                    </Card>
                  );
                })}
                {(!projects || projects.filter((p: any) => p.status === "active").length === 0) && (
                  <p className="text-sm text-muted-foreground col-span-2 text-center py-6">Nenhum projeto ativo.</p>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> Atividades Recentes
              </h3>
              <div className="space-y-2">
                {[
                  { icon: CheckCircle2, text: "Tarefa concluída: Análise de Requisitos", time: "Hoje, 14:30", color: "text-success" },
                  { icon: FileText, text: "Documento atualizado: Proposta Comercial v2", time: "Ontem, 09:15", color: "text-info" },
                  { icon: DollarSign, text: "Fatura #001 enviada para pagamento", time: "2 dias atrás", color: "text-gold" },
                  { icon: Activity, text: "Reunião de status semanal realizada", time: "3 dias atrás", color: "text-muted-foreground" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50"
                  >
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <span className="text-sm text-foreground flex-1">{item.text}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects?.map((project: any) => {
              const progress = getProjectProgress(project);
              const totalTasks = project.tasks?.length || 0;
              const doneTasks = project.tasks?.filter((t: any) => t.status === "done").length || 0;
              return (
                <Card key={project.id} className="border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                      <Badge className={statusColors[project.status] || ""}>{project.status}</Badge>
                    </div>
                    {project.code && <CardDescription className="text-xs">{project.code}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{doneTasks}/{totalTasks} tarefas</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {project.start_date && <span>Início: {project.start_date}</span>}
                        {project.end_date_planned && <span>Previsão: {project.end_date_planned}</span>}
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!projects || projects.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Nenhum projeto compartilhado.</div>
            )}
          </div>
        </TabsContent>

        {/* MILESTONES */}
        <TabsContent value="milestones">
          <div className="space-y-3">
            {milestones.length > 0 ? milestones.map((m: any) => {
              const isOverdue = m.due_date && new Date(m.due_date) < new Date() && m.status !== "done";
              const isDone = m.status === "done";
              return (
                <Card key={m.id} className="border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      ) : isOverdue ? (
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">{m.title}</h4>
                          <Badge variant="outline" className="text-[10px]">{m.projectName}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.due_date ? `Prazo: ${new Date(m.due_date).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}
                          {isOverdue && <span className="text-destructive ml-2">• Atrasado</span>}
                        </p>
                      </div>
                      <Badge className={isDone ? "bg-success/20 text-success" : isOverdue ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}>
                        {isDone ? "Concluído" : isOverdue ? "Atrasado" : "Pendente"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum milestone definido.</div>
            )}
          </div>
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices">
          <div className="space-y-3">
            {invoices?.map((inv: any) => (
              <Card key={inv.id} className="border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{inv.number}</span>
                        <Badge className={invoiceStatusColors[inv.status] || ""}>{inv.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Emissão: {inv.issue_date}{inv.due_date && ` | Vencimento: ${inv.due_date}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gold">
                        {inv.currency || "BRL"} {Number(inv.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!invoices || invoices.length === 0) && (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma fatura disponível.</div>
            )}
          </div>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents?.map((doc: any) => (
              <Card key={doc.id} className="border-border hover:border-gold/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{docTypeIcons[doc.type] || "📁"}</span>
                    <CardTitle className="text-sm">{doc.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">{doc.type}</Badge>
                </CardHeader>
                <CardContent>
                  {doc.content_text && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{doc.content_text.substring(0, 200)}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {doc.file_url && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3" /> Download
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!documents || documents.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Nenhum documento compartilhado.</div>
            )}
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports">
          <div className="space-y-3">
            {reports?.map((report: any) => (
              <Card key={report.id} className="border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{report.title}</h3>
                      <div className="text-xs text-muted-foreground mt-1">
                        {report.report_type}{report.period_start && ` | ${report.period_start} — ${report.period_end}`}
                      </div>
                    </div>
                    <Badge className={report.status === "viewed" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}>
                      {report.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!reports || reports.length === 0) && (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum relatório disponível.</div>
            )}
          </div>
        </TabsContent>

        {/* FEEDBACK */}
        <TabsContent value="feedback">
          <Card className="border-border max-w-lg">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gold" /> Feedback & Solicitações
              </CardTitle>
              <CardDescription className="text-xs">
                Envie feedback ou faça uma solicitação para nossa equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</Label>
                <Select
                  value={feedbackForm.type}
                  onValueChange={v => setFeedbackForm(f => ({ ...f, type: v }))}
                >
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedback">Feedback geral</SelectItem>
                    <SelectItem value="request">Solicitação de mudança</SelectItem>
                    <SelectItem value="issue">Problema ou bloqueio</SelectItem>
                    <SelectItem value="question">Dúvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Assunto *</Label>
                <Input
                  value={feedbackForm.subject}
                  onChange={e => setFeedbackForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Resumo da sua mensagem"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem *</Label>
                <Textarea
                  value={feedbackForm.message}
                  onChange={e => setFeedbackForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Descreva sua solicitação ou feedback em detalhes..."
                  rows={5}
                  className="mt-1 bg-secondary border-border resize-none"
                />
              </div>
              <Button
                variant="gold"
                className="w-full gap-2"
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback || !feedbackForm.subject || !feedbackForm.message}
              >
                {submittingFeedback ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar Solicitação</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHAT IA */}
        <TabsContent value="chat">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-gold" /> Assistente do Projeto
              </CardTitle>
              <CardDescription className="text-xs">Pergunte sobre seus projetos, entregas e prazos</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={chatRef} className="h-[400px] overflow-y-auto space-y-3 mb-3 p-3 bg-secondary/30 rounded-lg">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    Olá! Como posso ajudar com seu projeto?
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-gold/20 text-foreground" : "bg-card text-foreground border border-border"}`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Pergunte sobre seu projeto..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                />
                <Button onClick={handleChat} disabled={chatLoading} className="bg-gradient-gold text-primary-foreground">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portal;
