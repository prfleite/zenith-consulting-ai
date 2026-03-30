import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Send, Brain, FileText, Search, Trash2, Edit2, Tag, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAIChat } from "@/lib/ai/useAIChat";

const CATEGORIES = ["Processos Internos", "Templates", "Playbooks", "Estudos de Caso", "Onboarding", "FAQs"];

const categoryConfig: Record<string, { class: string; dot: string }> = {
  "Processos Internos": { class: "bg-info/15 text-info border-info/25", dot: "bg-info" },
  "Templates": { class: "bg-success/15 text-success border-success/25", dot: "bg-success" },
  "Playbooks": { class: "bg-purple-500/15 text-purple-400 border-purple-500/25", dot: "bg-purple-500" },
  "Estudos de Caso": { class: "bg-warning/15 text-warning border-warning/25", dot: "bg-warning" },
  "Onboarding": { class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25", dot: "bg-cyan-500" },
  "FAQs": { class: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-500" },
};

const Knowledge = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id || "";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "Processos Internos", tags: "" });

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
        company_id: companyId, title: form.title, content: form.content,
        category: form.category, tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        created_by: profile?.id,
      };
      if (editingId) await (supabase.from("knowledge_base") as any).update(payload).eq("id", editingId);
      else await (supabase.from("knowledge_base") as any).insert(payload);
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
    mutationFn: async (id: string) => { await (supabase.from("knowledge_base") as any).delete().eq("id", id); },
    onSuccess: () => { toast({ title: "Artigo removido" }); queryClient.invalidateQueries({ queryKey: ["knowledge-base"] }); },
  });

  const editArticle = (article: any) => {
    setEditingId(article.id);
    setForm({ title: article.title, content: article.content, category: article.category, tags: (article.tags || []).join(", ") });
    setDialogOpen(true);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    try {
      const { data } = await supabase.functions.invoke("search-knowledge", { body: { query: chatInput, companyId } });
      const context = data?.context ? `\n\nContexto da Base de Conhecimento:\n${data.context}` : "";
      sendMessage(chatInput + context);
    } catch { sendMessage(chatInput); }
    setChatInput("");
  };

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chatMessages]);

  const stats = CATEGORIES.map(c => ({ label: c, count: (articles || []).filter((a: any) => a.category === c).length, ...categoryConfig[c] }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">
            Base de <span className="text-gradient-gold">Conhecimento</span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            <span className="text-gold font-semibold">{articles?.length || 0}</span> artigos · Documentação interna, playbooks e metodologias
          </p>
        </div>
        <Button
          onClick={() => { setEditingId(null); setForm({ title: "", content: "", category: "Processos Internos", tags: "" }); setDialogOpen(true); }}
          variant="gold"
        >
          <Plus className="w-4 h-4" /> Novo Artigo
        </Button>
      </motion.div>

      {/* Category stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {stats.filter(s => s.count > 0).map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => setCategoryFilter(categoryFilter === s.label ? "all" : s.label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${s.class} ${categoryFilter === s.label ? "ring-1 ring-gold/30" : ""}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
            <span className="bg-card/60 px-1.5 py-0.5 rounded-full">{s.count}</span>
          </motion.button>
        ))}
        {categoryFilter !== "all" && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setCategoryFilter("all")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground border border-border hover:border-[var(--border-gold)] transition-colors"
          >
            <X className="w-3 h-3" /> Limpar
          </motion.button>
        )}
      </motion.div>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList className="bg-secondary/60 border border-border">
          <TabsTrigger value="articles" className="gap-1.5 data-[state=active]:text-gold">
            <FileText className="w-3.5 h-3.5" /> Artigos
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 data-[state=active]:text-gold">
            <Brain className="w-3.5 h-3.5" /> Assistente IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          {/* Search */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar artigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {articles?.map((article: any) => {
                const cat = categoryConfig[article.category] || { class: "bg-muted/60 text-muted-foreground border-border", dot: "bg-muted-foreground" };
                return (
                  <motion.div
                    key={article.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } } }}
                    whileHover={{ y: -3 }}
                    className="bg-card rounded-2xl border border-border hover:border-[var(--border-gold)] transition-all duration-300 hover:shadow-gold p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">{article.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" onClick={() => editArticle(article)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(article.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <span className={`text-[11px] w-fit px-2 py-0.5 rounded-full border flex items-center gap-1 ${cat.class}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                      {article.category}
                    </span>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{article.content?.substring(0, 180)}</p>
                    {article.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {article.tags.map((tag: string, i: number) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary rounded-lg px-1.5 py-0.5 border border-border">
                            <Tag className="w-2 h-2" />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-auto">{new Date(article.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </motion.div>
                );
              })}
              {articles?.length === 0 && (
                <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mb-3 opacity-25" />
                  <p className="font-medium">Nenhum artigo encontrado</p>
                  <p className="text-sm mt-1">Crie o primeiro artigo para a base de conhecimento</p>
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-2xl border border-border shadow-card flex flex-col"
            style={{ height: "520px" }}
          >
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-sm">
                <Brain className="w-4 h-4 text-[hsl(220,22%,6%)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Assistente de Metodologia</p>
                <p className="text-[11px] text-muted-foreground">Consulta a base de conhecimento da sua empresa</p>
              </div>
              {chatLoading && (
                <div className="ml-auto flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gold" animate={{ scale: [1,1.4,1], opacity: [0.5,1,0.5] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }} />
                  ))}
                </div>
              )}
            </div>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-3">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-10 h-10 text-gold opacity-40 mb-3" />
                  <p className="text-sm text-muted-foreground">Pergunte sobre metodologias, frameworks ou consulte artigos</p>
                </div>
              )}
              <AnimatePresence>
                {chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-gold text-[hsl(220,22%,6%)]" : "bg-secondary text-foreground border border-border"}`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Pergunte sobre metodologias, processos ou templates..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChat()} className="bg-secondary border-border" />
                <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} variant="gold" size="icon">
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-lg">{editingId ? "Editar Artigo" : "Novo Artigo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título do artigo" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Conteúdo (suporta markdown)" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="font-mono text-sm bg-secondary border-border" />
            <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="bg-secondary border-border" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? "Atualizar" : "Criar Artigo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Knowledge;
