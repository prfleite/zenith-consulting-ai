import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Target, Building2, DollarSign, Calendar, Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const [opp, setOpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("opportunities")
      .select("*, client_account:client_accounts(id, name), owner:profiles!opportunities_owner_id_fkey(name)")
      .eq("id", id).single()
      .then(({ data }) => { setOpp(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!opp) return <div className="p-8 text-muted-foreground">Oportunidade não encontrada</div>;

  const stageLabels: Record<string, string> = { lead: "Lead", qualified: "Qualificado", proposal: "Proposta", negotiation: "Negociação", won: "Ganho", lost: "Perdido" };
  const stageColors: Record<string, string> = { lead: "bg-info/20 text-info", qualified: "bg-gold/20 text-gold", proposal: "bg-warning/20 text-warning", negotiation: "bg-gold-light/20 text-gold-light", won: "bg-success/20 text-success", lost: "bg-destructive/20 text-destructive" };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-4xl">
      <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Oportunidades
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <Target className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{opp.title}</h1>
            <Link to={`/clients/${opp.client_account?.id}`} className="text-sm text-gold hover:underline flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {opp.client_account?.name}
            </Link>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${stageColors[opp.stage]}`}>{stageLabels[opp.stage]}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Detalhes</h3>
          {[
            [<DollarSign key="d" className="w-4 h-4" />, "Valor Esperado", `R$ ${((opp.expected_value || 0) / 1000).toFixed(0)}K`],
            [<Percent key="p" className="w-4 h-4" />, "Probabilidade", `${opp.probability}%`],
            [<Calendar key="c" className="w-4 h-4" />, "Close Date", opp.close_date || "—"],
            [null, "Moeda", opp.currency],
            [null, "Owner", opp.owner?.name || "—"],
          ].map(([icon, label, value], i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">{icon}{label as string}</span>
              <span className="text-foreground font-medium">{value as string}</span>
            </div>
          ))}
          {opp.tags && opp.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {opp.tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {opp.description && (
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground">{opp.description}</p>
            </div>
          )}
          {opp.lost_reason && (
            <div className="bg-destructive/10 rounded-xl p-6 border border-destructive/20">
              <h3 className="font-semibold text-destructive mb-1">Motivo da Perda</h3>
              <p className="text-sm text-muted-foreground">{opp.lost_reason}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="gold-outline" size="sm" className="flex-1"><Sparkles className="w-4 h-4" /> Gerar Proposta com IA</Button>
            {opp.stage === "won" && <Button variant="gold" size="sm" className="flex-1">Converter em Projeto</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
