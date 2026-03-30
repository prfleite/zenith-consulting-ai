import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb,
  BarChart3, Zap, Target, DollarSign, Users, ChevronRight,
  AlertCircle, CheckCircle2, Clock, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/lib/ai/useAIChat";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

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

// Mock insight data
const mockInsights = {
  churnRisk: [
    { client: "TechCorp Brasil", score: 72, reason: "3 projetos atrasados, sem engajamento em 14 dias", action: "Agendar reunião de alinhamento" },
    { client: "Grupo Santander", score: 58, reason: "NPS baixo (6/10) na última pesquisa", action: "Enviar plano de recuperação" },
    { client: "Varejo SA", score: 45, reason: "Fatura vencida há 30 dias", action: "Cobrança + oferta de parcelamento" },
  ],
  closingOpps: [
    { title: "Transformação Digital Corp X", value: 180000, probability: 85, daysLeft: 7, action: "Enviar proposta revisada com desconto 5%" },
    { title: "Consultoria Estratégica 2026", value: 95000, probability: 72, daysLeft: 14, action: "Reunião com decisor — marcar até sexta" },
    { title: "Implementação ERP Médio Porte", value: 220000, probability: 68, daysLeft: 21, action: "Apresentar ROI consolidado" },
  ],
  delayedProjects: [
    { project: "Mapeamento de Processos", daysLate: 12, cause: "Entregas pendentes do cliente", solution: "Reunião de alinhamento + ajuste de cronograma" },
    { project: "Auditoria Financeira Q1", daysLate: 5, cause: "Consultor sênior sobrealoc. (120%)", solution: "Realocar analista para apoio" },
  ],
  forecast: {
    month: "Abril 2026",
    scenarios: [
      { label: "Pessimista", value: 280000, color: "text-destructive" },
      { label: "Base", value: 420000, color: "text-warning" },
      { label: "Otimista", value: 580000, color: "text-success" },
    ],
    pipelineConverted: 165000,
    recurringRevenue: 115000,
  },
};

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
            IA Insights
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

      {/* Auto Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* Churn Risk */}
        <div className="bg-card rounded-2xl border border-destructive/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/25 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Clientes em Risco</h3>
              <p className="text-[10px] text-muted-foreground">{mockInsights.churnRisk.length} alertas</p>
            </div>
          </div>
          <div className="space-y-2">
            {mockInsights.churnRisk.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="p-2.5 bg-destructive/5 border border-destructive/15 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{item.client}</span>
                  <Badge className="bg-destructive/20 text-destructive text-[10px]">{item.score}% risco</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">{item.reason}</p>
                <p className="text-[10px] text-destructive font-medium flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> {item.action}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closing Opps */}
        <div className="bg-card rounded-2xl border border-success/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/25 flex items-center justify-center">
              <Target className="w-4 h-4 text-success" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Próximas de Fechar</h3>
              <p className="text-[10px] text-muted-foreground">{mockInsights.closingOpps.length} oportunidades</p>
            </div>
          </div>
          <div className="space-y-2">
            {mockInsights.closingOpps.map((opp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="p-2.5 bg-success/5 border border-success/15 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate flex-1 pr-2">{opp.title}</span>
                  <Badge className="bg-success/20 text-success text-[10px] flex-shrink-0">{opp.probability}%</Badge>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gold font-medium">
                    R$ {(opp.value / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {opp.daysLeft}d restantes
                  </span>
                </div>
                <p className="text-[10px] text-success font-medium flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> {opp.action}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Delayed Projects */}
        <div className="bg-card rounded-2xl border border-warning/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/25 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Projetos com Atraso</h3>
              <p className="text-[10px] text-muted-foreground">{mockInsights.delayedProjects.length} alertas</p>
            </div>
          </div>
          <div className="space-y-2">
            {mockInsights.delayedProjects.map((proj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="p-2.5 bg-warning/5 border border-warning/15 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{proj.project}</span>
                  <Badge className="bg-warning/20 text-warning text-[10px]">{proj.daysLate}d atraso</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Causa: {proj.cause}</p>
                <p className="text-[10px] text-warning font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {proj.solution}
                </p>
              </motion.div>
            ))}
            <div className="p-2.5 bg-success/5 border border-success/15 rounded-lg">
              <p className="text-xs font-medium text-success flex items-center gap-1 mb-0.5">
                <CheckCircle2 className="w-3 h-3" /> 4 projetos no prazo
              </p>
              <p className="text-[10px] text-muted-foreground">Transformação Digital, Auditoria LGPD...</p>
            </div>
          </div>
        </div>

        {/* Revenue Forecast */}
        <div className="bg-card rounded-2xl border border-gold/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Receita Prevista</h3>
              <p className="text-[10px] text-muted-foreground">{mockInsights.forecast.month}</p>
            </div>
          </div>
          <div className="space-y-2">
            {mockInsights.forecast.scenarios.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-lg"
              >
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>
                  R$ {(s.value / 1000).toFixed(0)}k
                </span>
              </motion.div>
            ))}
            <div className="pt-1 border-t border-border/50 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Pipeline convertida</span>
                <span className="text-foreground">R$ {(mockInsights.forecast.pipelineConverted / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Receita recorrente</span>
                <span className="text-foreground">R$ {(mockInsights.forecast.recurringRevenue / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
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
