import { useState, useEffect, useRef } from "react";
import { BookOpen, Plus, Send, Brain, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAIChat } from "@/lib/ai/useAIChat";

export default function Knowledge() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "internal_playbook", content_text: "" });
  const chatRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage } = useAIChat({ contextType: "knowledge" });
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    supabase.from("documents").select("*").in("type", ["internal_playbook", "report", "other"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setDocs(data || []));
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const addDoc = async () => {
    if (!form.title || !profile?.company_id) return;
    await supabase.from("documents").insert({
      company_id: profile.company_id, title: form.title,
      type: form.type as any, content_text: form.content_text || null,
      created_by_id: profile.id,
    });
    setDialogOpen(false);
    setForm({ title: "", type: "internal_playbook", content_text: "" });
    const { data } = await supabase.from("documents").select("*").in("type", ["internal_playbook", "report", "other"]).order("created_at", { ascending: false });
    setDocs(data || []);
    toast({ title: "Documento adicionado" });
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const docsContext = docs.slice(0, 5).map(d => `[${d.title}]: ${(d.content_text || "").slice(0, 500)}`).join("\n\n");
    sendMessage(chatInput, `Documentos da base de conhecimento:\n${docsContext}`);
    setChatInput("");
  };

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-1">Playbooks, metodologias e assistente IA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Novo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal_playbook">Playbook</SelectItem>
                        <SelectItem value="report">Relatório</SelectItem>
                        <SelectItem value="meeting_notes">Ata de Reunião</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Conteúdo</Label><Textarea rows={8} value={form.content_text} onChange={(e) => setForm({ ...form, content_text: e.target.value })} /></div>
                  <Button variant="gold" className="w-full" onClick={addDoc}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.map((d) => (
              <div key={d.id} className="bg-card rounded-lg p-4 border border-border hover:border-gold-subtle transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold flex-shrink-0" />
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto">{d.type}</span>
                </div>
                {d.content_text && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{d.content_text}</p>}
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento encontrado.</p>}
          </div>
        </div>

        {/* AI Chat */}
        <div className="bg-card rounded-xl border border-border shadow-card flex flex-col h-[650px]">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assistente de Metodologia</h3>
              <p className="text-xs text-muted-foreground">Pergunte sobre frameworks, templates e cases</p>
            </div>
            {isLoading && <div className="ml-auto w-2 h-2 rounded-full bg-gold animate-pulse" />}
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Pergunte sobre metodologias, frameworks ou melhores práticas</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-gold text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input placeholder="Pergunte sobre metodologias..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && handleChat()} className="bg-secondary border-border" />
              <Button variant="gold" size="icon" onClick={handleChat} disabled={isLoading}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
