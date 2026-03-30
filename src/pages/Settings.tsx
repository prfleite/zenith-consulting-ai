import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Brain, CreditCard, Users, Plug, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  const { profile } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [aiUsageTotal, setAiUsageTotal] = useState(0);

  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Invite member
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile?.company_id) return;
      const [cRes, sRes, tRes, aRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", profile.company_id).single(),
        supabase.from("company_subscriptions").select("*, subscription_plans(*)").eq("company_id", profile.company_id).single(),
        supabase.from("profiles").select("*").eq("company_id", profile.company_id).eq("active", true),
        supabase.from("ai_usage_logs").select("cost_usd").eq("company_id", profile.company_id),
      ]);
      if (cRes.data) setCompany(cRes.data);
      if (sRes.data) setSubscription(sRes.data);
      setTeamMembers(tRes.data || []);
      setAiUsageTotal((aRes.data || []).reduce((s, a) => s + Number(a.cost_usd || 0), 0));
    };
    load();
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ name, email }).eq("id", profile.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil atualizado" });
  };

  const saveCompany = async () => {
    if (!company) return;
    const { error } = await supabase.from("companies").update({ name: company.name, domain: company.domain, primary_color: company.primary_color }).eq("id", company.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Workspace atualizado" });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setShowPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteName || !profile?.company_id) return;
    setInviting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: Math.random().toString(36).slice(-10) + "A1!",
        options: { data: { name: inviteName, role: "consultant" } },
      });
      if (error) throw error;
      // Update the new profile with company_id (will be created by trigger)
      // Note: the profile is created by the handle_new_user trigger
      toast({ title: "Convite enviado!", description: `${inviteName} receberá um email de confirmação.` });
      setShowInvite(false);
      setInviteEmail("");
      setInviteName("");
    } catch (e: any) {
      toast({ title: "Erro ao convidar", description: e.message, variant: "destructive" });
    }
    setInviting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-6 max-w-4xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-heading font-bold text-gradient-gold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu workspace e preferências</p>
      </motion.div>

      <Tabs defaultValue="general">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="general"><Building className="w-4 h-4 mr-1" />Geral</TabsTrigger>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" />Perfil</TabsTrigger>
          <TabsTrigger value="ai"><Brain className="w-4 h-4 mr-1" />IA</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Notificações</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="w-4 h-4 mr-1" />Integrações</TabsTrigger>
          <TabsTrigger value="plan"><CreditCard className="w-4 h-4 mr-1" />Plano</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-1" />Equipe</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="mt-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Workspace</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Nome da Empresa</label>
                <Input value={company?.name || ""} onChange={e => setCompany({ ...company, name: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Domínio</label>
                <Input value={company?.domain || ""} onChange={e => setCompany({ ...company, domain: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <Input value={company?.primary_color || "#D4A843"} onChange={e => setCompany({ ...company, primary_color: e.target.value })} className="bg-secondary border-border" />
                  <div className="w-10 h-10 rounded-lg border border-border flex-shrink-0" style={{ background: company?.primary_color || "#D4A843" }} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Moeda Padrão</label>
                <Input value="BRL" disabled className="bg-secondary border-border" />
              </div>
            </div>
            <Button variant="gold" size="sm" onClick={saveCompany}>Salvar Workspace</Button>
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile" className="mt-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Perfil</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Cargo</label>
                <Input value={profile?.role?.replace("_", " ") || ""} disabled className="bg-secondary border-border capitalize" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" size="sm" onClick={saveProfile}>Salvar Perfil</Button>
              <Button variant="outline" size="sm" onClick={() => setShowPassword(true)}>Alterar Senha</Button>
            </div>
          </div>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">IA & Provedores</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary rounded-lg p-4 text-center">
                <span className="text-xs text-muted-foreground">Créditos Restantes</span>
                <p className="text-2xl font-bold text-foreground mt-1">{subscription?.ai_credits_balance ?? 0}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <span className="text-xs text-muted-foreground">Custo Total IA</span>
                <p className="text-2xl font-bold text-foreground mt-1">${aiUsageTotal.toFixed(2)}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <span className="text-xs text-muted-foreground">Modelo Padrão</span>
                <p className="text-lg font-bold text-foreground mt-1">Gemini Flash</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">A IA utiliza Lovable AI nativamente. Modelos disponíveis: Gemini Pro, Gemini Flash, GPT-5.</p>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Notificações</h3>
            </div>
            {["Faturas vencidas", "Projetos em risco", "Alertas de IA", "Novos leads", "NPS baixo"].map(item => (
              <div key={item} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{item}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
          <div className="bg-card rounded-xl p-6 border border-border space-y-4 mt-4">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Relatório Semanal Automático</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Toda segunda-feira às 9h, um relatório com KPIs da semana (novos clientes, horas, faturamento, deals ganhos) é gerado automaticamente e aparece nos seus alertas.
            </p>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Relatório semanal ativo</span>
              <Switch defaultChecked />
            </div>
            <Button variant="gold-outline" size="sm" onClick={async () => {
              toast({ title: "Gerando relatório..." });
              try {
                const { data, error } = await supabase.functions.invoke("send-weekly-report");
                if (error) throw error;
                toast({ title: "Relatório gerado!", description: "Verifique seus alertas para ver o resumo semanal." });
              } catch (e: any) {
                toast({ title: "Erro", description: e.message, variant: "destructive" });
              }
            }}>
              Gerar Relatório Agora
            </Button>
          </div>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Plug className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Integrações</h3>
            </div>
            {[
              { name: "Facebook Ads", status: "Não conectado", color: "text-muted-foreground" },
              { name: "Google Ads", status: "Não conectado", color: "text-muted-foreground" },
              { name: "LinkedIn Ads", status: "Não conectado", color: "text-muted-foreground" },
              { name: "Stripe", status: "Não conectado", color: "text-muted-foreground" },
              { name: "Lovable AI", status: "Conectado", color: "text-success" },
            ].map(int => (
              <div key={int.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{int.name}</p>
                  <p className={`text-xs ${int.color}`}>{int.status}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: `${int.name}`, description: int.status === "Conectado" ? "Já conectado" : "Configuração disponível em breve." })}>{int.status === "Conectado" ? "Configurar" : "Conectar"}</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* PLAN */}
        <TabsContent value="plan" className="mt-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Plano & Faturamento</h3>
            </div>
            {subscription ? (
              <div className="space-y-4">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">{(subscription as any).subscription_plans?.name || "—"}</p>
                      <p className="text-sm text-muted-foreground capitalize">Status: {subscription.status}</p>
                    </div>
                    <Link to="/subscription">
                      <Button variant="gold" size="sm">Gerenciar Plano</Button>
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">Créditos IA</span>
                    <p className="text-xl font-bold text-foreground">{subscription.ai_credits_balance}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">Período</span>
                    <p className="text-sm text-foreground">{new Date(subscription.current_period_start).toLocaleDateString("pt-BR")} — {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">Membros</span>
                    <p className="text-xl font-bold text-foreground">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura encontrada.</p>
            )}
          </div>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="mt-4">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gold" />
                <h3 className="font-heading text-lg font-semibold text-foreground">Equipe ({teamMembers.length})</h3>
              </div>
              <Button variant="gold" size="sm" onClick={() => setShowInvite(true)}>Convidar Membro</Button>
            </div>
            <div className="space-y-2">
              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{m.role.replace("_", " ")}</span>
                    <span className={`w-2 h-2 rounded-full ${m.active ? "bg-success" : "bg-muted-foreground"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Alterar Senha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-secondary border-border" />
            </div>
            <div>
              <Label>Confirmar Senha</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPassword(false)}>Cancelar</Button>
            <Button variant="gold" onClick={handleChangePassword} disabled={savingPassword}>{savingPassword ? "Salvando..." : "Alterar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Convidar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Nome completo" className="bg-secondary border-border" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@empresa.com" className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button variant="gold" onClick={handleInviteMember} disabled={inviting || !inviteEmail || !inviteName}>{inviting ? "Enviando..." : "Convidar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SettingsPage;
