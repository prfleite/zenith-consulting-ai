import { useState } from "react";
import { Brain, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const insights = [
  {
    icon: TrendingUp,
    title: "Oportunidade de Upsell",
    description: "TechCorp Brasil está expandindo para novos mercados. Propor consultoria de internacionalização pode gerar +R$ 400K em receita.",
    type: "opportunity",
  },
  {
    icon: AlertTriangle,
    title: "Risco de Churn",
    description: "Energia Sustentável não tem projetos ativos há 45 dias. Recomenda-se contato imediato com Lucia Ferreira.",
    type: "risk",
  },
  {
    icon: Lightbulb,
    title: "Benchmark de Mercado",
    description: "Sua taxa de retenção (94.8%) está 12% acima da média do setor. Destaque isso em propostas comerciais.",
    type: "insight",
  },
  {
    icon: BarChart3,
    title: "Previsão de Receita",
    description: "Com base na pipeline atual, a receita projetada para Q2 é de R$ 234K, um aumento de 18% vs Q1.",
    type: "forecast",
  },
];

const typeColors = {
  opportunity: "border-success/30 bg-success/5",
  risk: "border-destructive/30 bg-destructive/5",
  insight: "border-gold/30 bg-gold/5",
  forecast: "border-info/30 bg-info/5",
};

const typeIconColors = {
  opportunity: "text-success",
  risk: "text-destructive",
  insight: "text-gold",
  forecast: "text-info",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const chatMessages: ChatMessage[] = [
  { role: "assistant", content: "Olá! Sou o assistente de IA da ApexConsult. Posso analisar seus dados, gerar insights sobre clientes, e ajudar com estratégias. Como posso ajudar?" },
];

export default function AIInsights() {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: input },
      {
        role: "assistant" as const,
        content: "Baseado na análise dos dados atuais, posso identificar que o setor financeiro representa 35% da sua receita total. Recomendo diversificar a carteira focando em tecnologia e saúde, que apresentam crescimento acelerado de 22% ao ano.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">IA Insights</h1>
          <p className="text-muted-foreground mt-1">Inteligência artificial aplicada à sua consultoria</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-muted-foreground">IA ativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" /> Insights Automáticos
          </h3>
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`rounded-xl p-5 border transition-all duration-200 hover:shadow-gold cursor-pointer animate-slide-up ${typeColors[insight.type]}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <insight.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${typeIconColors[insight.type]}`} />
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </div>
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
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-gold text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Pergunte algo à IA..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="bg-secondary border-border"
              />
              <Button variant="gold" size="icon" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
