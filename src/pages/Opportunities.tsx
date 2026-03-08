import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Target, List, LayoutGrid, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

type Opportunity = {
  id: string;
  title: string;
  stage: string;
  expected_value: number;
  probability: number;
  close_date: string | null;
  client_account?: { name: string } | null;
  owner?: { name: string } | null;
};

const stages = [
  { key: "lead", label: "Lead", color: "border-info/40" },
  { key: "qualified", label: "Qualificado", color: "border-gold/40" },
  { key: "proposal", label: "Proposta", color: "border-warning/40" },
  { key: "negotiation", label: "Negociação", color: "border-gold-light/40" },
  { key: "won", label: "Ganho", color: "border-success/40" },
  { key: "lost", label: "Perdido", color: "border-destructive/40" },
];

export default function Opportunities() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*, client_account:client_accounts(name), owner:profiles!opportunities_owner_id_fkey(name)")
        .order("created_at", { ascending: false });
      if (data) setOpps(data as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleDrop = async (oppId: string, newStage: string) => {
    setOpps(prev => prev.map(o => o.id === oppId ? { ...o, stage: newStage } : o));
    await supabase.from("opportunities").update({ stage: newStage as any }).eq("id", oppId);
  };

  const formatValue = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}K` : `R$ ${v}`;

  const stageTotal = (stageKey: string) => {
    return opps.filter(o => o.stage === stageKey).reduce((sum, o) => sum + (o.expected_value || 0), 0);
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Oportunidades</h1>
          <p className="text-muted-foreground mt-1">Pipeline de vendas</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Nova Oportunidade</Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map((stage) => {
            const stageOpps = opps.filter(o => o.stage === stage.key);
            return (
              <div
                key={stage.key}
                className="space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const oppId = e.dataTransfer.getData("oppId");
                  if (oppId) handleDrop(oppId, stage.key);
                }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-foreground">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">{stageOpps.length}</span>
                </div>
                <p className="text-xs text-muted-foreground px-1">{formatValue(stageTotal(stage.key))}</p>

                <div className="space-y-2 min-h-[100px]">
                  {stageOpps.map((opp) => (
                    <Link
                      key={opp.id}
                      to={`/opportunities/${opp.id}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("oppId", opp.id)}
                      className={`block bg-card rounded-lg p-3 border ${stage.color} hover:shadow-gold transition-all cursor-grab active:cursor-grabbing`}
                    >
                      <h4 className="text-xs font-semibold text-foreground leading-tight mb-1">{opp.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{(opp.client_account as any)?.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-medium text-foreground">{formatValue(opp.expected_value)}</span>
                        <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {opps.map((opp) => (
            <Link key={opp.id} to={`/opportunities/${opp.id}`} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between hover:border-gold-subtle transition-colors block">
              <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-gold" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{opp.title}</h4>
                  <p className="text-xs text-muted-foreground">{(opp.client_account as any)?.name} · {stages.find(s => s.key === opp.stage)?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-foreground font-medium">{formatValue(opp.expected_value)}</span>
                <span className="text-muted-foreground">{opp.probability}%</span>
                <span className="text-muted-foreground">{opp.close_date || "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
