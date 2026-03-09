import { useState } from "react";
import { Brain, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAIChat } from "@/lib/ai/useAIChat";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIAssistantPanelProps {
  contextType: string;
  contextId?: string;
  title?: string;
  placeholder?: string;
  initialPrompt?: string;
  extraContext?: string;
  onApplyResult?: (content: string) => void;
  applyLabel?: string;
}

export const AIAssistantPanel = ({
  contextType,
  contextId,
  title = "Assistente IA",
  placeholder = "Pergunte algo...",
  initialPrompt,
  extraContext,
  onApplyResult,
  applyLabel = "Aplicar",
}: AIAssistantPanelProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(initialPrompt || "");
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat({ contextType, contextId });

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input, extraContext);
    setInput("");
  };

  if (!open) {
    return (
      <Button variant="gold-outline" size="sm" onClick={() => setOpen(true)}>
        <Brain className="w-4 h-4" /> {title}
      </Button>
    );
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onApplyResult && lastAssistant && (
            <Button size="sm" variant="gold" onClick={() => onApplyResult(lastAssistant.content)}>
              {applyLabel}
            </Button>
          )}
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => { setOpen(false); clearMessages(); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[300px] p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Envie uma mensagem para começar.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Gerando...</span>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="min-h-[40px] max-h-[80px] resize-none text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button size="icon" variant="gold" onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
