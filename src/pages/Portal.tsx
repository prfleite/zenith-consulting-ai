import { useState, useEffect, useRef } from "react";
import { FolderKanban, FileText, Star, Send, Brain, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIChat } from "@/lib/ai/useAIChat";

export default function Portal() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [nps, setNps] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const { messages, isLoading, sendMessage } = useAIChat({ contextType: "client_chat" });
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!profile) return;
      // Get client access
      const { data: access } = await supabase.from("client_portal_access").select("client_account_id").eq("user_id", profile.id);
      if (!access?.length) return;
      const clientIds = access.map(a => a.client_account_id);

      const { data: client } = await supabase.from("client_accounts").select("name").eq("id", clientIds[0]).single();
      setClientName(client?.name || "");

      const [pRes, dRes, nRes] = await Promise.all([
        supabase.from("projects").select("*, project_tasks(status)").in("client_account_id", clientIds),
        supabase.from("documents").select("*").in("related_client_account_id", clientIds).eq("is_public_to_client", true),
        supabase.from("nps_surveys").select("*").in("client_account_id", clientIds).order("created_at", { ascending: false }),
      ]);
      setProjects(pRes.data || []);
      setDocuments(dRes.data || []);
      setNps(nRes.data || []);
    };
    fetch();
  }, [profile]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const ctx = projects.map(p => `Projeto: ${p.name} (${p.status})`).join("\n");
    sendMessage(chatInput, `Contexto do cliente ${clientName}:\n${ctx}`);
    setChatInput("");
  };

  const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
    planning: { label: "Planejamento", class: "text-info", icon: Clock },
    active: { label: "Ativo", class: "text-success", icon: CheckCircle2 },
    on_hold: { label: "Pausado", class: "text-warning", icon: Clock },
    completed: { label: "Concluído", class: "text-muted-foreground", icon: CheckCircle2 },
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Portal do Cliente</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo, {clientName || profile?.name}</p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="bg-secondary">
          <TabsTrigger value="projects">Projetos ({projects.length})</TabsTrigger>
          <TabsTrigger value="docs">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="nps">Feedback ({nps.length})</TabsTrigger>
          <TabsTrigger value="chat">Chat IA</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 mt-4">
          {projects.map((p) => {
            const tasks = p.project_tasks || [];
            const done = tasks.filter((t: any) => t.status === "done").length;
            const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
            const sc = statusConfig[p.status] || statusConfig.planning;
            return (
              <div key={p.id} className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="w-5 h-5 text-gold" />
                    <h3 className="font-medium text-foreground">{p.name}</h3>
                  </div>
                  <span className={`text-xs font-medium ${sc.class}`}>{sc.label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Progresso: {pct}%</span>
                  <span>{done}/{tasks.length} tarefas</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
                  <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto encontrado.</p>}
        </TabsContent>

        <TabsContent value="docs" className="space-y-3 mt-4">
          {documents.map((d) => (
            <div key={d.id} className="bg-card rounded-lg p-4 border border-border flex items-center gap-3">
              <FileText className="w-4 h-4 text-gold flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.type} · {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          ))}
          {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento disponível.</p>}
        </TabsContent>

        <TabsContent value="nps" className="space-y-3 mt-4">
          {nps.map((n) => (
            <div key={n.id} className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-foreground">{n.score}/10</span>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              {n.comment && <p className="text-xs text-muted-foreground mt-2">{n.comment}</p>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <div className="bg-card rounded-xl border border-border shadow-card flex flex-col h-[500px]">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Assistente do Projeto</h3>
                <p className="text-xs text-muted-foreground">Pergunte sobre seus projetos e entregas</p>
              </div>
            </div>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Pergunte sobre seus projetos, prazos ou documentos.</p>}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-gold text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <Input placeholder="Pergunte sobre seu projeto..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && handleChat()} className="bg-secondary border-border" />
              <Button variant="gold" size="icon" onClick={handleChat} disabled={isLoading}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
