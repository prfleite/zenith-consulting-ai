import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Send, Brain, FileText, Search, Trash2, Edit2, Tag, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAIChat } from "@/lib/ai/useAIChat";

const CATEGORIES = ["Processos Internos", "Templates", "Playbooks", "Estudos de Caso", "Onboarding", "FAQs"];

export default function Knowledge() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id || "";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "Processos Internos", tags: "" });

  // AI Chat
  const { messages: chatMessages, isLoading: chatLoading, sendMessage } = useAIChat({ contextType: "knowledge" });
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["knowledge-base", search, categoryFilter],
    queryFn: async () => {
      let q = (supabase.from("knowledge_base") as any).select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (categoryFilter !== "all") q = q.eq("category", categoryFilter);
      if (search) q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId,
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        created_by: profile?.id,
      };
      if (editingId) {
        await (supabase.from("knowledge_base") as any).update(payload).eq("id", editingId);
      } else {
        await (supabase.from("knowledge_base") as any).insert(payload);
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Artigo atualizado!" : "Artigo criado!" });
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm({ title: "", content: "", category: "Processos Internos", tags: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from("knowledge_base") as any).delete().eq("id", id);
    },
    onSuccess: () => {
      toast({ title: "Artigo removido" });
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
  });

  const editArticle = (article: any) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: (article.tags || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    // First search KB for context
    try {
      const { data } = await supabase.functions.invoke("search-knowledge", {
        body: { query: chatInput, companyId },
      });
      const context = data?.context ? `\n\nContexto da Base de Conhecimento:\n${data.context}` : "";
      sendMessage(chatInput + context);
    } catch {
      sendMessage(chatInput);
    }
    setChatInput("");
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      "Processos Internos": "bg-blue-500/20 text-blue-400",
      "Templates": "bg-green-500/20 text-green-400",
      "Playbooks": "bg-purple-500/20 text-purple-400",
      "Estudos de Caso": "bg-yellow-500/20 text-yellow-400",
      "Onboarding": "bg-cyan-500/20 text-cyan-400",
      "FAQs": "bg-orange-500/20 text-orange-400",
    };
    return map[cat] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-gold" /> Base de Conhecimento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Documentação interna, playbooks e assistente IA</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ title: "", content: "", category: "Processos Internos", tags: "" }); setDialogOpen(true); }} className="bg-gradient-gold text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Novo Artigo
        </Button>
      </div>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="articles" className="gap-1"><FileText className="w-4 h-4" /> Artigos</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1"><Brain className="w-4 h-4" /> Assistente IA</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar artigos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles?.map((article: any) => (
              <Card key={article.id} className="border-border hover:border-gold/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm leading-tight">{article.title}</CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editArticle(article)}><Edit2 className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(article.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <Badge className={`text-xs w-fit ${getCategoryColor(article.category)}`}>{article.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{article.content?.substring(0, 200)}</p>
                  {article.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-border"><Tag className="w-2 h-2 mr-0.5" />{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">{new Date(article.created_at).toLocaleDateString("pt-BR")}</p>
                </CardContent>
              </Card>
            ))}
            {articles?.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum artigo encontrado.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-gold" /> Assistente de Metodologia</CardTitle>
              <CardDescription className="text-xs">Pergunte sobre processos, templates e melhores práticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={chatRef} className="h-[400px] overflow-y-auto space-y-3 mb-3 p-3 bg-secondary/30 rounded-lg">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    Pergunte sobre metodologias, frameworks ou consulte a base de conhecimento.
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
                  <div className="flex justify-start"><div className="p-3 bg-card rounded-lg border border-border"><Loader2 className="w-4 h-4 animate-spin text-gold" /></div></div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Pergunte sobre metodologias..."
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Editar Artigo" : "Novo Artigo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Conteúdo (suporta markdown)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-sm" />
            <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-gradient-gold text-primary-foreground">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
