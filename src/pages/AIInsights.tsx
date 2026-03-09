import { useState, useEffect, useRef } from "react";
import { Brain, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/lib/ai/useAIChat";
import { supabase } from "@/integrations/supabase/client";

const AIInsights = () => {
  const { messages, isLoading, sendMessage } = useAIChat({ contextType: "global" });
  const [input, setInput] = useState("");
  const [kpis, setKpis] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContext = async () => {
      const [cRes, pRes, oRes] = await Promise.all([
        supabase.from("client_accounts").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("opportunities").select("expected_value, stage"),
      ]);
      const pipeline = (oRes.data || []).filter(o => !["won", "lost"].includes(o.stage)).reduce((s, o) => s + Number(o.expected_value || 0), 0);
      setKpis(`Clientes: ${cRes.count}, Projetos ativos: ${pRes.count}, Pipeline: R$ ${pipeline.toLocaleString("pt-BR")}`);
    };
    fetchContext();
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, `Dados da consultoria: ${kpis}`);
    setInput("");
  };

  const quickPrompts = [
    { icon: TrendingUp, label: "Oportunidades de Upsell", prompt: "Analise os clientes e sugira oportunidades de upsell e cross-sell.", color: "text-success" },
    { icon: AlertTriangle, label: "Riscos de Churn", prompt: "Identifique clientes com risco de churn baseado nos dados disponíveis.", color: "text-destructive" },
    { icon: Lightbulb, label: "Benchmark", prompt: "Faça uma análise comparativa dos KPIs com benchmarks do setor de consultoria.", color: "text-gold" },
    { icon: BarChart3, label: "Previsão de Receita", prompt: "Projete a receita para o próximo trimestre baseado na pipeline atual.", color: "text-info" },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">IA Insights</h1>
          <p className="text-muted-foreground mt-1">Inteligência artificial aplicada à sua consultoria</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-muted-foreground">IA ativa — Lovable AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Prompts */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" /> Análises Rápidas
          </h3>
          {quickPrompts.map((qp, i) => (
            <button key={i} onClick={() => { sendMessage(qp.prompt, `Dados: ${kpis}`); }}
              className="w-full rounded-xl p-5 border border-border bg-card hover:border-gold-subtle hover:shadow-gold transition-all duration-200 text-left animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start gap-3">
                <qp.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${qp.color}`} />
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{qp.label}</h4>
                  <p className="text-xs text-muted-foreground">{qp.prompt}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="bg-card rounded-xl border border-border shadow-card flex flex-col h-[520px]">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assistente IA</h3>
              <p className="text-xs text-muted-foreground">Pergunte sobre clientes, projetos e estratégia</p>
            </div>
            {isLoading && <div className="w-2 h-2 rounded-full bg-gold animate-pulse ml-auto" />}
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <Brain className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Faça uma pergunta ou escolha uma análise rápida</p>
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
              <Input placeholder="Pergunte algo à IA..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()} className="bg-secondary border-border" />
              <Button variant="gold" size="icon" onClick={handleSend} disabled={isLoading}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
