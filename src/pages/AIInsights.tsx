import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Zap, Target, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/lib/ai/useAIChat";
import { supabase } from "@/integrations/supabase/client";

const quickPrompts = [
  {
    icon: TrendingUp,
    label: "Oportunidades de Upsell",
    prompt: "Analise os clientes e sugira oportunidades de upsell e cross-sell baseadas no histórico de projetos e faturamento.",
    color: "text-success",
    bg: "bg-success/10 border-success/25",
    description: "Identifique receita adicional com clientes existentes",
  },
  {
    icon: AlertTriangle,
    label: "Riscos de Churn",
    prompt: "Identifique clientes com risco de churn baseado nos dados disponíveis, health score e engajamento recente.",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/25",
    description: "Detecte sinais de perda de clientes com antecedência",
  },
  {
    icon: Lightbulb,
    label: "Benchmark do Setor",
    prompt: "Faça uma análise comparativa dos KPIs com benchmarks do setor de consultoria (utilização, margem, NPS, ticket médio).",
    color: "text-gold",
    bg: "bg-gold/10 border-gold/25",
    description: "Compare performance com o mercado de consultoria",
  },
  {
    icon: BarChart3,
    label: "Previsão de Receita",
    prompt: "Projete a receita para o próximo trimestre baseado na pipeline atual, histórico de conversões e sazonalidade.",
    color: "text-info",
    bg: "bg-info/10 border-info/25",
    description: "Forecast baseado em dados reais do seu pipeline",
  },
  {
    icon: Target,
    label: "Priorização de Pipeline",
    prompt: "Analise o pipeline de oportunidades e priorize quais devem receber mais atenção baseado em valor, probabilidade e urgência.",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/25",
    description: "Foque esforços nas oportunidades certas",
  },
  {
    icon: Users,
    label: "Alocação de Equipe",
    prompt: "Analise a utilização da equipe e sugira uma alocação ideal nos projetos para maximizar produtividade e receita billable.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/25",
    description: "Otimize a distribuição de consultores por projeto",
  },
];

const AIInsights = () => {
  const { messages, isLoading, sendMessage } = useAIChat({ contextType: "global" });
  const [input, setInput] = useState("");
  const [kpis, setKpis] = useState("");
  const [activePrompt, setActivePrompt] = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContext = async () => {
      const [cRes, pRes, oRes, iRes, teRes] = await Promise.all([
        supabase.from("client_accounts").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("opportunities").select("expected_value, stage"),
        supabase.from("invoices").select("amount, status"),
        supabase.from("time_entries").select("hours, billable"),
      ]);
      const pipeline = (oRes.data || []).filter(o => !["won", "lost"].includes(o.stage)).reduce((s, o) => s + Number(o.expected_value || 0), 0);
      const received = (iRes.data || []).filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
      const totalHours = (teRes.data || []).reduce((s, t) => s + Number(t.hours), 0);
      const billableHours = (teRes.data || []).filter(t => t.billable).reduce((s, t) => s + Number(t.hours), 0);
      const utilization = totalHours > 0 ? Math.round(billableHours / totalHours * 100) : 0;
      setKpis(`Clientes: ${cRes.count}, Projetos ativos: ${pRes.count}, Pipeline: R$ ${pipeline.toLocaleString("pt-BR")}, Receita recebida: R$ ${received.toLocaleString("pt-BR")}, Utilização: ${utilization}%`);
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
    setActivePrompt(null);
  };

  const handleQuickPrompt = (idx: number, prompt: string) => {
    setActivePrompt(idx);
    sendMessage(prompt, `Dados da consultoria: ${kpis}`);
  };

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
            IA <span className="text-gradient-gold">Insights</span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Inteligência artificial aplicada à sua consultoria
          </p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 border border-success/25 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-success font-medium">IA Ativa</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Prompts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold animate-glow-pulse" />
            <h3 className="text-sm font-semibold text-foreground">Análises Rápidas</h3>
          </div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-2.5"
          >
            {quickPrompts.map((qp, i) => (
              <motion.button
                key={i}
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } } }}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickPrompt(i, qp.prompt)}
                disabled={isLoading}
                className={`w-full rounded-2xl p-4 border ${qp.bg} text-left transition-all duration-200 hover:shadow-gold disabled:opacity-50 relative overflow-hidden group ${activePrompt === i ? "ring-1 ring-gold/40" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${qp.bg} border flex items-center justify-center flex-shrink-0`}>
                    <qp.icon className={`w-4 h-4 ${qp.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-0.5">{qp.label}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">{qp.description}</p>
                  </div>
                </div>
                {activePrompt === i && isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gold/5 pointer-events-none"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-card flex flex-col"
          style={{ height: "600px" }}
        >
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-sm">
              <Brain className="w-4 h-4 text-[hsl(220,22%,6%)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assistente Estratégico</h3>
              <p className="text-[11px] text-muted-foreground">Analisa seus dados em tempo real</p>
            </div>
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto flex gap-1"
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gold"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-gold-subtle border border-[var(--border-gold)] flex items-center justify-center">
                  <Brain className="w-8 h-8 text-gold opacity-70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Assistente Pronto</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">Escolha uma análise rápida ou faça uma pergunta personalizada</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                  {[
                    { icon: DollarSign, text: "Análise financeira" },
                    { icon: Target, text: "Pipeline" },
                    { icon: Users, text: "Equipe" },
                    { icon: Zap, text: "Alertas" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2.5 py-1.5">
                      <s.icon className="w-3 h-3 text-gold" />
                      <span>{s.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-gold text-[hsl(220,22%,6%)] font-medium"
                      : "bg-secondary/80 text-foreground border border-border"
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Pergunte sobre clientes, projetos, receita, estratégia..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isLoading && handleSend()}
                className="bg-secondary border-border text-sm"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="gold" size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              IA com acesso aos dados da sua consultoria · Enter para enviar
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIInsights;
