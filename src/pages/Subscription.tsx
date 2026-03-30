import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const planIcons: Record<string, any> = { free: Zap, starter: Sparkles, professional: Crown, enterprise: Building2 };
const planLabels: Record<string, string> = { free: "Free", starter: "Starter", professional: "Professional", enterprise: "Enterprise" };
const planColors: Record<string, string> = {
  free: "border-border", starter: "border-gold-subtle", professional: "border-gold shadow-gold", enterprise: "border-gold-subtle",
};

const Subscription = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [annual, setAnnual] = useState(false);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [creditsBalance, setCreditsBalance] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const [pRes, sRes, uRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_monthly"),
        supabase.from("company_subscriptions").select("*").limit(1).single(),
        supabase.from("ai_usage_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setPlans(pRes.data || []);
      setSubscription(sRes.data);
      setCreditsBalance(sRes.data?.ai_credits_balance || 0);
      setUsageLogs(uRes.data || []);
    };
    fetch();
  }, []);

  const currentPlanId = subscription?.plan_id;

  const handleUpgrade = async (planId: string, planName: string) => {
    if (planId === currentPlanId) return;
    if (!subscription?.id) {
      toast({ title: "Nenhuma assinatura encontrada", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("company_subscriptions").update({ plan_id: planId, status: "active" }).eq("id", subscription.id);
    if (error) {
      toast({ title: "Erro ao atualizar plano", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Plano atualizado para ${planLabels[planName] || planName}!` });
      setSubscription({ ...subscription, plan_id: planId, status: "active" });
    }
  };

  const handleBuyCredits = async (credits: number, label: string) => {
    if (!subscription?.id) {
      toast({ title: "Nenhuma assinatura encontrada", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("company_subscriptions").update({
      ai_credits_balance: creditsBalance + credits,
    }).eq("id", subscription.id);
    if (error) {
      toast({ title: "Erro ao comprar créditos", description: error.message, variant: "destructive" });
    } else {
      setCreditsBalance(prev => prev + credits);
      toast({ title: `${label} adicionados com sucesso!` });
    }
  };

  const creditPacks = [
    { credits: 1000, price: 10, label: "1.000 créditos" },
    { credits: 5000, price: 45, label: "5.000 créditos", discount: "10% off" },
    { credits: 10000, price: 80, label: "10.000 créditos", discount: "20% off" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-8 max-w-6xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-heading font-bold text-gradient-gold">Planos & Assinatura</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu plano e créditos de IA</p>
      </motion.div>

      {/* Credits Balance */}
      <div className="bg-card rounded-xl p-6 border border-gold-subtle">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Créditos de IA Disponíveis</span>
            <p className="text-3xl font-bold text-foreground mt-1">{creditsBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{usageLogs.length} chamadas nos últimos 30 dias</p>
          </div>
          <Sparkles className="w-10 h-10 text-gold" />
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Label className={!annual ? "text-foreground" : "text-muted-foreground"}>Mensal</Label>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <Label className={annual ? "text-foreground" : "text-muted-foreground"}>Anual <span className="text-xs text-success">(~20% off)</span></Label>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const Icon = planIcons[plan.name] || Zap;
          const isCurrent = plan.id === currentPlanId;
          const price = annual ? plan.price_annual : plan.price_monthly;
          const period = annual ? "/ano" : "/mês";
          const isPro = plan.name === "professional";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`bg-card rounded-2xl p-6 border-2 transition-all relative shadow-card ${isPro ? planColors.professional : isCurrent ? "border-gold/30" : planColors[plan.name]}`}
            >
              {isPro && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full bg-gradient-gold text-primary-foreground font-medium">Popular</span>}
              <Icon className="w-8 h-8 text-gold mb-3" />
              <h3 className="text-lg font-heading font-bold text-foreground">{planLabels[plan.name]}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">${price}</span>
                <span className="text-sm text-muted-foreground">{period}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{plan.ai_credits_included.toLocaleString()} créditos/mês · {plan.max_users === 999 ? "∞" : plan.max_users} usuários</p>
              
              <ul className="mt-4 space-y-2">
                {(plan.features_json as string[]).map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-success flex-shrink-0" />
                    {f.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "outline" : isPro ? "gold" : "gold-outline"}
                className="w-full mt-4"
                disabled={isCurrent}
                onClick={() => handleUpgrade(plan.id, plan.name)}
              >
                {isCurrent ? "Plano Atual" : "Upgrade"}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Credit Packs */}
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">Comprar Créditos Avulsos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditPacks.map((pack) => (
            <div key={pack.credits} className="bg-card rounded-xl p-5 border border-border hover:border-gold-subtle transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">{pack.label}</h4>
                {pack.discount && <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">{pack.discount}</span>}
              </div>
              <p className="text-2xl font-bold text-foreground">${pack.price}</p>
              <p className="text-xs text-muted-foreground">${(pack.price / pack.credits * 1000).toFixed(2)} por 1.000 créditos</p>
              <Button variant="gold-outline" size="sm" className="w-full mt-3" onClick={() => handleBuyCredits(pack.credits, pack.label)}>Comprar</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Histórico de Uso de IA</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {usageLogs.length > 0 ? usageLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <div>
                <span className="text-foreground">{log.model_name}</span>
                <span className="text-xs text-muted-foreground ml-2">{log.context_type}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum uso registrado.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Subscription;
